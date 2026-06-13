import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { validateTwilioSignature, generateVoiceTwiML, sendReply } from '../services/twilio.service';
import { processInboundMessage } from '../services/ai.service';
import { createNotification } from '../services/notification.service';
import { logger } from '../lib/logger';
import { format } from 'date-fns';
import { parseISO, addMinutes } from 'date-fns';

const router = Router();

/**
 * POST /api/webhooks/twilio
 * Handles inbound WhatsApp and SMS messages.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate Twilio signature in production
    if (process.env.NODE_ENV === 'production') {
      const signature = req.headers['x-twilio-signature'] as string;
      const url = `${process.env.APP_URL}/api/webhooks/twilio`;
      const isValid = validateTwilioSignature(url, req.body, signature);
      if (!isValid) {
        logger.warn('Invalid Twilio signature — possible spoofed request');
        res.status(401).send('Unauthorized');
        return;
      }
    }

    const { From, Body, To } = req.body as {
      From: string;
      Body: string;
      To: string;
      MessageSid?: string;
    };

    const channel = From.startsWith('whatsapp:') ? 'WHATSAPP' : 'SMS';
    const fromPhone = From.replace('whatsapp:', '');
    const toPhone = To.replace('whatsapp:', '');

    // Find which clinic this Twilio number belongs to
    // (In a multi-clinic setup, map Twilio numbers to clinics in DB)
    const clinic = await prisma.clinic.findFirst({
      where: { phone: toPhone },
      select: {
        id: true, name: true, specialty: true, workingHours: true,
        address: true, phone: true, treatments: true, aiEnabled: true,
        aiLanguage: true, aiPersonality: true, autoConfirm: true,
        planStatus: true, customIntroMsg: true,
      },
    });

    if (!clinic) {
      logger.warn(`Twilio webhook: no clinic found for number ${toPhone}`);
      res.status(200).send();
      return;
    }

    // Find or create patient
    let patient = await prisma.patient.findFirst({
      where: { clinicId: clinic.id, phone: fromPhone },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: { clinicId: clinic.id, fullName: fromPhone, phone: fromPhone },
      });
    }

    // Save inbound message
    const inboundMsg = await prisma.message.create({
      data: {
        clinicId: clinic.id,
        patientId: patient.id,
        channel,
        direction: 'INBOUND',
        fromNumber: fromPhone,
        toNumber: toPhone,
        body: Body,
        twilioSid: req.body.MessageSid,
      },
    });

    // Check if AI is enabled and plan is active
    if (!clinic.aiEnabled || clinic.planStatus === 'CANCELLED' || clinic.planStatus === 'PAST_DUE') {
      await sendReply(fromPhone, `Thank you for contacting ${clinic.name}. Our team will get back to you shortly.`, channel);
      res.status(200).send();
      return;
    }

    // Get conversation history
    const recentMessages = await prisma.message.findMany({
      where: { clinicId: clinic.id, patientId: patient.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const conversationHistory = recentMessages
      .reverse()
      .map((m) => `${m.direction === 'INBOUND' ? 'Patient' : 'AI'}: ${m.body}`)
      .join('\n');

    // Get patient appointment history
    const recentAppts = await prisma.appointment.findMany({
      where: { clinicId: clinic.id, patientId: patient.id },
      orderBy: { dateTime: 'desc' },
      take: 5,
      select: { treatment: true, dateTime: true, status: true },
    });

    const patientHistory = recentAppts.length > 0
      ? recentAppts.map((a) =>
          `${format(a.dateTime, 'MMM d, yyyy')} - ${a.treatment} (${a.status})`
        ).join('\n')
      : 'First-time patient';

    const startTime = Date.now();

    // Process with AI
    const aiResponse = await processInboundMessage(
      {
        clinicId: clinic.id,
        clinicName: clinic.name,
        specialty: clinic.specialty ?? 'medical',
        workingHours: clinic.workingHours ?? '{}',
        address: clinic.address ?? '',
        phone: clinic.phone,
        treatments: clinic.treatments ?? '',
        patientPhone: fromPhone,
        patientHistory,
        conversationHistory,
        aiLanguage: clinic.aiLanguage,
        aiPersonality: clinic.aiPersonality,
        customIntroMsg: clinic.customIntroMsg ?? undefined,
      },
      Body
    );

    const durationMs = Date.now() - startTime;

    // Handle AI action
    if (aiResponse.action === 'book_appointment' && aiResponse.appointmentData?.requestedDateTime) {
      try {
        const apptDateTime = parseISO(aiResponse.appointmentData.requestedDateTime);
        await prisma.appointment.create({
          data: {
            clinicId: clinic.id,
            patientId: patient.id,
            treatment: aiResponse.appointmentData.treatment ?? 'Consultation',
            dateTime: apptDateTime,
            durationMin: 30,
            channel,
            notes: aiResponse.appointmentData.notes ?? null,
            bookedByAI: true,
            status: clinic.autoConfirm ? 'CONFIRMED' : 'PENDING',
            confirmationSent: true, // AI reply IS the confirmation
          },
        });

        await prisma.aILog.create({
          data: {
            clinicId: clinic.id,
            action: 'booked_appointment',
            details: `Booked ${aiResponse.appointmentData.treatment} for ${format(apptDateTime, 'PPp')}`,
            patientId: patient.id,
            durationMs,
            success: true,
          },
        });

        await createNotification({
          clinicId: clinic.id,
          title: 'AI Booked Appointment',
          body: `AI booked ${patient.fullName} for ${format(apptDateTime, 'MMM d h:mm a')}`,
          type: 'ai_action',
          link: '/dashboard/appointments',
        });
      } catch (err) {
        logger.error('Failed to create AI-booked appointment', { err });
      }
    } else if (aiResponse.action === 'escalate') {
      await prisma.message.update({
        where: { id: inboundMsg.id },
        data: { needsReview: true },
      });

      await createNotification({
        clinicId: clinic.id,
        title: 'AI Needs Your Help',
        body: `AI could not handle ${patient.fullName}'s message — please review`,
        type: 'ai_escalate',
        link: '/dashboard/messages',
      });
    }

    // Save outbound AI reply
    await prisma.message.create({
      data: {
        clinicId: clinic.id,
        patientId: patient.id,
        channel,
        direction: 'OUTBOUND',
        fromNumber: toPhone,
        toNumber: fromPhone,
        body: aiResponse.reply,
        isHandledByAI: true,
        aiConfidence: aiResponse.confidence,
        isRead: true,
      },
    });

    // Log AI action
    await prisma.aILog.create({
      data: {
        clinicId: clinic.id,
        action: aiResponse.action === 'none' ? 'answered_faq' : aiResponse.action,
        details: `Patient message: "${Body.slice(0, 100)}" — AI reply: "${aiResponse.reply.slice(0, 100)}"`,
        patientId: patient.id,
        durationMs,
        success: true,
      },
    });

    // Send the reply
    await sendReply(fromPhone, aiResponse.reply, channel);

    res.status(200).send();
  } catch (err) {
    logger.error('Twilio webhook error', { err });
    res.status(200).send(); // Always 200 to Twilio to prevent retries
  }
});

/**
 * POST /api/webhooks/twilio/voice
 * Handles inbound voice calls.
 */
router.post('/voice', async (req: Request, res: Response): Promise<void> => {
  const { To } = req.body as { To: string; From: string };
  const toPhone = To?.replace('whatsapp:', '');

  const clinic = await prisma.clinic.findFirst({
    where: { phone: toPhone },
    select: { name: true },
  }).catch(() => null);

  const clinicName = clinic?.name ?? 'our clinic';
  const greeting = `Thank you for calling ${clinicName}. Your call is important to us.`;

  res.setHeader('Content-Type', 'text/xml');
  res.send(generateVoiceTwiML(clinicName, greeting));
});

export default router;
