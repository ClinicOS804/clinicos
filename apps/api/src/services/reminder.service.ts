import { prisma } from '../lib/prisma';
import { sendWhatsApp, sendSMS } from './twilio.service';
import { logger } from '../lib/logger';
import { format } from 'date-fns';

/**
 * Send appointment confirmation message to patient.
 */
export async function sendAppointmentConfirmation(appointmentId: string): Promise<void> {
  try {
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, clinic: true },
    });

    if (!appt || appt.confirmationSent) return;

    const dateStr = format(appt.dateTime, 'EEEE, MMMM d');
    const timeStr = format(appt.dateTime, 'h:mm a');
    const msg = `✅ Hi ${appt.patient.fullName}, your appointment at ${appt.clinic.name} has been confirmed for ${dateStr} at ${timeStr} (${appt.treatment}). See you then! 🏥`;

    let sent = false;
    if (appt.channel === 'WHATSAPP' || appt.clinic.aiEnabled) {
      const sid = await sendWhatsApp(appt.patient.phone, msg);
      sent = !!sid;
    } else {
      const sid = await sendSMS(appt.patient.phone, msg);
      sent = !!sid;
    }

    if (sent) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { confirmationSent: true },
      });
    }
  } catch (err) {
    logger.error('Failed to send appointment confirmation', { appointmentId, err });
  }
}

/**
 * Send 24-hour reminder.
 */
export async function send24hReminder(appointmentId: string): Promise<void> {
  try {
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, clinic: true },
    });

    if (!appt || appt.reminder24hSent) return;

    const timeStr = format(appt.dateTime, 'h:mm a');
    const msg = `⏰ Reminder: You have an appointment at ${appt.clinic.name} tomorrow at ${timeStr} for ${appt.treatment}. Reply CANCEL to cancel or RESCHEDULE to change the time.`;

    const sid = await sendWhatsApp(appt.patient.phone, msg);
    if (sid) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { reminder24hSent: true },
      });
      // Log to AI
      await prisma.aILog.create({
        data: {
          clinicId: appt.clinicId,
          action: 'sent_reminder',
          details: `24h reminder sent to ${appt.patient.fullName} for ${format(appt.dateTime, 'PPp')}`,
          patientId: appt.patientId,
          success: true,
        },
      });
    }
  } catch (err) {
    logger.error('Failed to send 24h reminder', { appointmentId, err });
  }
}

/**
 * Send 2-hour reminder.
 */
export async function send2hReminder(appointmentId: string): Promise<void> {
  try {
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, clinic: true },
    });

    if (!appt || appt.reminder2hSent) return;

    const timeStr = format(appt.dateTime, 'h:mm a');
    const msg = `🏥 Don't forget! Your appointment at ${appt.clinic.name} is in 2 hours at ${timeStr}. See you soon!`;

    const sid = await sendWhatsApp(appt.patient.phone, msg);
    if (sid) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { reminder2hSent: true },
      });
    }
  } catch (err) {
    logger.error('Failed to send 2h reminder', { appointmentId, err });
  }
}

/**
 * Send Google Review request.
 */
export async function sendReviewRequest(appointmentId: string): Promise<void> {
  try {
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, clinic: true },
    });

    if (!appt || appt.reviewSent || !appt.clinic.googlePlaceId) return;

    const reviewUrl = `https://search.google.com/local/writereview?placeid=${appt.clinic.googlePlaceId}`;
    const msg = `⭐ Hi ${appt.patient.fullName}, thank you for visiting ${appt.clinic.name}! We hope your experience was great. We'd love to hear your feedback: ${reviewUrl}`;

    const sid = await sendWhatsApp(appt.patient.phone, msg);
    if (sid) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { reviewSent: true },
      });
      await prisma.aILog.create({
        data: {
          clinicId: appt.clinicId,
          action: 'sent_review_request',
          details: `Review request sent to ${appt.patient.fullName}`,
          patientId: appt.patientId,
          success: true,
        },
      });
    }
  } catch (err) {
    logger.error('Failed to send review request', { appointmentId, err });
  }
}
