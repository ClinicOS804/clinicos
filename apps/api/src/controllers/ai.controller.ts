import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { UpdateAISettingsSchema } from '../schemas/settings.schemas';
import { sendWhatsApp } from '../services/twilio.service';

// GET /api/ai/logs
export const getAILogs = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '50' } = req.query as Record<string, string>;
  const clinicId = req.clinicId!;

  const logs = await prisma.aILog.findMany({
    where: { clinicId },
    orderBy: { createdAt: 'desc' },
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
  });

  res.json(logs);
});

// GET /api/ai/stats
export const getAIStats = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [callsHandled, apptBooked, avgDuration] = await Promise.all([
    prisma.aILog.count({ where: { clinicId, action: 'answered_faq' } }),
    prisma.aILog.count({ where: { clinicId, action: 'booked_appointment' } }),
    prisma.aILog.aggregate({
      where: { clinicId, durationMs: { not: null } },
      _avg: { durationMs: true },
    }),
  ]);

  res.json({
    callsHandled,
    appointmentsBooked: apptBooked,
    avgResponseTimeMs: Math.round(avgDuration._avg.durationMs ?? 0),
  });
});

// GET /api/ai/config
export const getAIConfig = asyncHandler(async (req: Request, res: Response) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: req.clinicId! },
    select: {
      aiEnabled: true, aiLanguage: true, aiPersonality: true,
      autoConfirm: true, reminderTiming: true, reviewTiming: true, customIntroMsg: true,
    },
  });
  res.json(clinic);
});

// PATCH /api/ai/config
export const updateAIConfig = asyncHandler(async (req: Request, res: Response) => {
  const data = UpdateAISettingsSchema.parse(req.body);
  const clinic = await prisma.clinic.update({
    where: { id: req.clinicId! },
    data,
  });
  res.json(clinic);
});

// POST /api/ai/test — send a test WhatsApp message
export const testAI = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body as { phone: string };
  const clinic = await prisma.clinic.findUnique({
    where: { id: req.clinicId! },
    select: { name: true, aiEnabled: true },
  });

  const testMessage = `👋 Hello! This is a test message from ${clinic?.name ?? 'your clinic'}'s AI receptionist. Your AI is configured and working correctly!`;
  const sid = await sendWhatsApp(phone, testMessage);

  if (!sid) {
    res.status(502).json({ error: 'Failed to send test message. Check your Twilio configuration.' });
    return;
  }

  res.json({ message: 'Test message sent!', sid });
});
