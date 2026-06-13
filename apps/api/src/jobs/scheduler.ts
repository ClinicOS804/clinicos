import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { send24hReminder, send2hReminder, sendReviewRequest } from '../services/reminder.service';
import { sendWhatsApp } from '../services/twilio.service';
import { sendDailySummaryEmail, sendTrialExpiryEmail } from '../services/email.service';
import { logger } from '../lib/logger';
import { addHours, subHours, subDays, isAfter, isBefore, addMinutes, startOfDay, endOfDay } from 'date-fns';

/**
 * Run a job safely — catch and log any error so the scheduler keeps running.
 */
async function safeRun(jobName: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    logger.error(`Cron job failed: ${jobName}`, { err });
  }
}

export function startScheduler(): void {
  logger.info('Starting background job scheduler...');

  // ─── 24h Appointment Reminders — runs every hour ──────────────────────────
  cron.schedule('0 * * * *', () =>
    safeRun('24h-reminders', async () => {
      const now = new Date();
      const in24h = addHours(now, 24);
      const window = addMinutes(in24h, 5); // ±5 min window

      const appointments = await prisma.appointment.findMany({
        where: {
          dateTime: { gte: subHours(in24h, 0), lte: window },
          status: { in: ['CONFIRMED', 'PENDING'] },
          reminder24hSent: false,
          clinic: { aiEnabled: true, planStatus: 'ACTIVE' },
        },
        select: { id: true },
      });

      logger.info(`24h reminder job: found ${appointments.length} appointments`);
      for (const appt of appointments) {
        await send24hReminder(appt.id);
      }
    })
  );

  // ─── 2h Appointment Reminders — runs every 15 minutes ────────────────────
  cron.schedule('*/15 * * * *', () =>
    safeRun('2h-reminders', async () => {
      const now = new Date();
      const in2h = addHours(now, 2);
      const window = addMinutes(in2h, 15);

      const appointments = await prisma.appointment.findMany({
        where: {
          dateTime: { gte: in2h, lte: window },
          status: { in: ['CONFIRMED', 'PENDING'] },
          reminder2hSent: false,
          clinic: { aiEnabled: true, planStatus: 'ACTIVE' },
        },
        select: { id: true },
      });

      for (const appt of appointments) {
        await send2hReminder(appt.id);
      }
    })
  );

  // ─── Review Requests — runs every hour ───────────────────────────────────
  cron.schedule('0 * * * *', () =>
    safeRun('review-requests', async () => {
      const oneHourAgo = subHours(new Date(), 1);
      const twoHoursAgo = subHours(new Date(), 2);

      const appointments = await prisma.appointment.findMany({
        where: {
          dateTime: { gte: twoHoursAgo, lte: oneHourAgo },
          status: 'COMPLETED',
          reviewSent: false,
          clinic: { googlePlaceId: { not: null }, aiEnabled: true, planStatus: 'ACTIVE' },
        },
        select: { id: true },
      });

      for (const appt of appointments) {
        await sendReviewRequest(appt.id);
      }
    })
  );

  // ─── Lapsed Patient Reactivation — every Monday at 10am ──────────────────
  cron.schedule('0 10 * * 1', () =>
    safeRun('lapsed-patients', async () => {
      const ninetyDaysAgo = subDays(new Date(), 90);

      // Find patients who had appointments but none in the last 90 days
      const lapsedPatients = await prisma.patient.findMany({
        where: {
          isActive: true,
          clinic: { aiEnabled: true, planStatus: 'ACTIVE' },
          appointments: {
            some: { dateTime: { lt: ninetyDaysAgo } },
            none: { dateTime: { gte: ninetyDaysAgo } },
          },
        },
        include: { clinic: { select: { name: true } } },
        take: 50, // Process in batches
      });

      for (const patient of lapsedPatients) {
        const msg = `Hi ${patient.fullName.split(' ')[0]}! 👋 It's been a while since your last visit to ${patient.clinic.name}. We'd love to see you again! Reply to book an appointment.`;
        await sendWhatsApp(patient.phone, msg).catch(() => null);
      }

      logger.info(`Lapsed patient job: sent ${lapsedPatients.length} reactivation messages`);
    })
  );

  // ─── Daily Summary Email — every day at 7am ───────────────────────────────
  cron.schedule('0 7 * * *', () =>
    safeRun('daily-summary', async () => {
      const yesterday = subDays(new Date(), 1);
      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());

      const activeClinics = await prisma.clinic.findMany({
        where: { isActive: true, planStatus: 'ACTIVE' },
        select: { id: true, email: true, ownerName: true },
      });

      for (const clinic of activeClinics) {
        const [todayCount, aiHandled] = await Promise.all([
          prisma.appointment.count({
            where: { clinicId: clinic.id, dateTime: { gte: todayStart, lte: todayEnd } },
          }),
          prisma.message.count({
            where: {
              clinicId: clinic.id,
              isHandledByAI: true,
              createdAt: { gte: startOfDay(yesterday), lte: endOfDay(yesterday) },
            },
          }),
        ]);

        await sendDailySummaryEmail(clinic.email, clinic.ownerName, {
          todayCount,
          yesterdayMessages: aiHandled,
          aiHandled,
        }).catch(() => null);
      }
    })
  );

  // ─── Trial Expiry Check — every day at midnight ──────────────────────────
  cron.schedule('0 0 * * *', () =>
    safeRun('trial-expiry', async () => {
      const now = new Date();

      // Expire trials that ended
      await prisma.clinic.updateMany({
        where: {
          plan: 'TRIAL',
          planStatus: 'TRIALING',
          trialEndsAt: { lt: now },
        },
        data: { planStatus: 'CANCELLED', isActive: false },
      });

      // Warn clinics with 3 days left
      const threeDaysFromNow = addHours(now, 72);
      const trialEndingSoon = await prisma.clinic.findMany({
        where: {
          plan: 'TRIAL',
          planStatus: 'TRIALING',
          trialEndsAt: { gte: now, lte: threeDaysFromNow },
        },
        select: { email: true, ownerName: true, trialEndsAt: true },
      });

      for (const clinic of trialEndingSoon) {
        const daysLeft = Math.ceil(
          (clinic.trialEndsAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        await sendTrialExpiryEmail(clinic.email, clinic.ownerName, daysLeft).catch(() => null);
      }
    })
  );

  // ─── Failed Payment Reminder — every day at 9am ──────────────────────────
  cron.schedule('0 9 * * *', () =>
    safeRun('payment-reminder', async () => {
      const pastDueClinics = await prisma.clinic.findMany({
        where: { planStatus: 'PAST_DUE', isActive: true },
        select: { email: true, ownerName: true },
      });

      for (const clinic of pastDueClinics) {
        const { sendPaymentFailedEmail } = await import('../services/email.service');
        await sendPaymentFailedEmail(clinic.email, clinic.ownerName).catch(() => null);
      }
    })
  );

  logger.info('All cron jobs scheduled successfully');
}
