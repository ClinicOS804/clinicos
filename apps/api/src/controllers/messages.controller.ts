import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { createError } from '../middleware/error.middleware';
import { sendReply } from '../services/twilio.service';
import { generateReplySuggestion } from '../services/ai.service';

// GET /api/messages
export const listMessages = asyncHandler(async (req: Request, res: Response) => {
  const { channel, unread, page = '1', limit = '30' } = req.query as Record<string, string>;
  const clinicId = req.clinicId!;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const where = {
    clinicId,
    ...(channel && channel !== 'ALL' ? { channel: channel as never } : {}),
    ...(unread === 'true' ? { isRead: false, direction: 'INBOUND' as never } : {}),
  };

  // Get unique threads (latest message per patient)
  const threads = await prisma.message.findMany({
    where,
    include: {
      patient: { select: { id: true, fullName: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: (pageNum - 1) * limitNum,
    take: limitNum,
  });

  res.json(threads);
});

// GET /api/messages/stats
export const getMessageStats = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [aiHandledToday, needsManualReply, totalToday] = await Promise.all([
    prisma.message.count({
      where: { clinicId, isHandledByAI: true, createdAt: { gte: today } },
    }),
    prisma.message.count({
      where: { clinicId, needsReview: true, isRead: false },
    }),
    prisma.message.count({
      where: { clinicId, createdAt: { gte: today } },
    }),
  ]);

  const responseRate = totalToday > 0 ? Math.round((aiHandledToday / totalToday) * 100) : 0;

  res.json({ aiHandledToday, needsManualReply, responseRate });
});

// POST /api/messages/send
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { patientId, body, channel } = req.body as {
    patientId: string;
    body: string;
    channel: 'WHATSAPP' | 'SMS';
  };
  const clinicId = req.clinicId!;

  const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId } });
  if (!patient) throw createError('Patient not found', 404, 'NOT_FOUND');

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { phone: true },
  });

  const twilioSid = await sendReply(patient.phone, body, channel);

  const message = await prisma.message.create({
    data: {
      clinicId,
      patientId,
      channel,
      direction: 'OUTBOUND',
      fromNumber: clinic?.phone ?? '',
      toNumber: patient.phone,
      body,
      isRead: true,
      twilioSid: twilioSid ?? undefined,
    },
  });

  res.status(201).json(message);
});

// POST /api/messages/broadcast
export const broadcastMessage = asyncHandler(async (req: Request, res: Response) => {
  const { channel, targetGroup, messageBody } = req.body as {
    channel: 'WHATSAPP' | 'SMS';
    targetGroup: 'all' | 'recent' | 'no_show';
    messageBody: string;
  };
  const clinicId = req.clinicId!;

  let patients = await prisma.patient.findMany({
    where: { clinicId, isActive: true },
    select: { id: true, phone: true, fullName: true },
  });

  // Filter by target group
  if (targetGroup === 'recent') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const recentPatientIds = await prisma.appointment.findMany({
      where: { clinicId, dateTime: { gte: cutoff } },
      select: { patientId: true },
      distinct: ['patientId'],
    });
    const ids = recentPatientIds.map((r) => r.patientId);
    patients = patients.filter((p) => ids.includes(p.id));
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const patient of patients) {
    const personalizedMsg = messageBody.replace('{{name}}', patient.fullName.split(' ')[0]);
    const sid = channel === 'WHATSAPP'
      ? await sendReply(patient.phone, personalizedMsg, 'WHATSAPP')
      : await sendReply(patient.phone, personalizedMsg, 'SMS');

    if (sid) {
      sentCount++;
      await prisma.message.create({
        data: {
          clinicId,
          patientId: patient.id,
          channel,
          direction: 'OUTBOUND',
          fromNumber: '',
          toNumber: patient.phone,
          body: personalizedMsg,
          isRead: true,
          twilioSid: sid,
        },
      });
    } else {
      failedCount++;
    }
  }

  await prisma.broadcast.create({
    data: { clinicId, channel, targetGroup, messageBody, sentCount, failedCount },
  });

  res.json({ sentCount, failedCount, total: patients.length });
});

// PATCH /api/messages/:id/read
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const message = await prisma.message.findUnique({ where: { id: req.params.id } });
  if (!message || message.clinicId !== req.clinicId) {
    throw createError('Message not found', 404, 'NOT_FOUND');
  }
  await prisma.message.update({ where: { id: req.params.id }, data: { isRead: true } });
  res.json({ message: 'Marked as read' });
});

// GET /api/messages/threads/:patientId
export const getThread = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.patientId, clinicId },
  });
  if (!patient) throw createError('Patient not found', 404, 'NOT_FOUND');

  const messages = await prisma.message.findMany({
    where: { clinicId, patientId: req.params.patientId },
    orderBy: { createdAt: 'asc' },
  });

  // Mark inbound as read
  await prisma.message.updateMany({
    where: { clinicId, patientId: req.params.patientId, direction: 'INBOUND', isRead: false },
    data: { isRead: true },
  });

  // Get AI suggestion for the latest message
  const lastMessages = messages
    .slice(-5)
    .map((m) => `${m.direction === 'INBOUND' ? 'Patient' : 'Clinic'}: ${m.body}`)
    .join('\n');

  const aiSuggestion = await generateReplySuggestion(patient.fullName, lastMessages, '').catch(() => '');

  res.json({ patient, messages, aiSuggestion });
});
