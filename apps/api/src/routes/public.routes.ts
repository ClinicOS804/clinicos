import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { CreatePatientSchema } from '../schemas/patient.schemas';
import { sendAppointmentConfirmation } from '../services/reminder.service';
import { createNotification } from '../services/notification.service';
import {
  parseISO, addMinutes, startOfDay, endOfDay,
  setHours, setMinutes, isBefore, isAfter,
} from 'date-fns';

const router = Router();

// ─── GET /api/public/clinic/:slug ─────────────────────────────────────────────
router.get('/clinic/:slug', asyncHandler(async (req, res) => {
  const clinic = await prisma.clinic.findUnique({
    where: { bookingSlug: req.params.slug },
    select: {
      id: true, name: true, ownerName: true, specialty: true,
      address: true, phone: true, logoUrl: true, treatments: true,
      workingHours: true, defaultFee: true, isActive: true, planStatus: true,
    },
  });

  if (!clinic) {
    res.status(404).json({ error: 'Clinic not found', code: 'NOT_FOUND' });
    return;
  }

  if (!clinic.isActive || clinic.planStatus === 'CANCELLED') {
    res.status(403).json({
      error: 'This clinic is not currently accepting online bookings.',
      code: 'CLINIC_INACTIVE',
    });
    return;
  }

  res.json(clinic);
}));

// ─── GET /api/public/slots/:slug ──────────────────────────────────────────────
router.get('/slots/:slug', asyncHandler(async (req, res) => {
  const { date, duration = '30' } = req.query as { date: string; duration?: string };

  if (!date) {
    res.status(400).json({ error: 'date parameter is required' });
    return;
  }

  const clinic = await prisma.clinic.findUnique({
    where: { bookingSlug: req.params.slug },
    select: { id: true, workingHours: true, isActive: true },
  });

  if (!clinic || !clinic.isActive) {
    res.status(404).json({ error: 'Clinic not found' });
    return;
  }

  const targetDate = parseISO(date);
  const hours = JSON.parse(clinic.workingHours ?? '{}');
  const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const dayConfig = hours[dayName] as { isOpen: boolean; open: string; close: string } | undefined;

  if (!dayConfig?.isOpen) {
    res.json({ slots: [] });
    return;
  }

  const [openH, openM] = (dayConfig.open || '09:00').split(':').map(Number);
  const [closeH, closeM] = (dayConfig.close || '17:00').split(':').map(Number);
  const durationMin = parseInt(duration);

  const booked = await prisma.appointment.findMany({
    where: {
      clinicId: clinic.id,
      dateTime: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) },
      status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] },
    },
    select: { dateTime: true, durationMin: true },
  });

  const slots: string[] = [];
  let slotTime = setMinutes(setHours(targetDate, openH), openM);
  const closeTime = setMinutes(setHours(targetDate, closeH), closeM);

  while (isBefore(slotTime, closeTime)) {
    const slotEnd = addMinutes(slotTime, durationMin);
    const isBooked = booked.some((b) => {
      const bEnd = addMinutes(b.dateTime, b.durationMin);
      return slotTime < bEnd && slotEnd > b.dateTime;
    });
    if (!isBooked && isAfter(slotTime, new Date())) {
      slots.push(slotTime.toISOString());
    }
    slotTime = addMinutes(slotTime, durationMin);
  }

  res.json({ slots });
}));

// ─── POST /api/public/book/:slug ──────────────────────────────────────────────
router.post('/book/:slug', asyncHandler(async (req, res) => {
  const clinic = await prisma.clinic.findUnique({
    where: { bookingSlug: req.params.slug },
    select: { id: true, name: true, isActive: true, planStatus: true },
  });

  if (!clinic || !clinic.isActive || clinic.planStatus === 'CANCELLED') {
    res.status(403).json({ error: 'This clinic is not currently accepting bookings.' });
    return;
  }

  const patientData = CreatePatientSchema.parse({
    fullName: req.body.fullName,
    phone: req.body.phone,
    email: req.body.email,
  });

  // Find or create patient
  let patient = await prisma.patient.findUnique({
    where: { clinicId_phone: { clinicId: clinic.id, phone: patientData.phone } },
  });

  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        clinicId: clinic.id,
        fullName: patientData.fullName,
        phone: patientData.phone,
        email: patientData.email || null,
      },
    });
  }

  const { treatment, dateTime, notes } = req.body as {
    treatment: string;
    dateTime: string;
    notes?: string;
  };

  if (!treatment || !dateTime) {
    res.status(400).json({ error: 'Treatment and date/time are required' });
    return;
  }

  const start = parseISO(dateTime);

  // Conflict check
  const conflict = await prisma.appointment.findFirst({
    where: {
      clinicId: clinic.id,
      dateTime: start,
      status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] },
    },
  });

  if (conflict) {
    res.status(409).json({
      error: 'This time slot is no longer available. Please choose another time.',
    });
    return;
  }

  const appointment = await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientId: patient.id,
      treatment,
      dateTime: start,
      notes: notes || null,
      channel: 'ONLINE_BOOKING',
      bookedByAI: false,
    },
  });

  // Non-blocking side effects
  sendAppointmentConfirmation(appointment.id).catch(() => null);

  createNotification({
    clinicId: clinic.id,
    title: 'New Online Booking',
    body: `${patient.fullName} booked via your booking page`,
    type: 'new_patient',
    link: '/dashboard/appointments',
  }).catch(() => null);

  res.status(201).json({
    message: '✅ Your appointment request has been sent! You will receive a WhatsApp confirmation shortly.',
    appointmentId: appointment.id,
  });
}));

export default router;
