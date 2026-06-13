import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { createError } from '../middleware/error.middleware';
import { CreateAppointmentSchema, UpdateAppointmentSchema, SlotsQuerySchema } from '../schemas/appointment.schemas';
import { sendAppointmentConfirmation } from '../services/reminder.service';
import { createNotification } from '../services/notification.service';
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  addDays, setHours, setMinutes, isBefore, isAfter, parseISO, addMinutes
} from 'date-fns';

// GET /api/appointments
export const listAppointments = asyncHandler(async (req: Request, res: Response) => {
  const { date, status, page = '1', limit = '20', filter } = req.query as Record<string, string>;
  const clinicId = req.clinicId!;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  let dateFilter: { gte?: Date; lte?: Date } = {};
  const today = new Date();

  if (filter === 'today') {
    dateFilter = { gte: startOfDay(today), lte: endOfDay(today) };
  } else if (filter === 'tomorrow') {
    const tomorrow = addDays(today, 1);
    dateFilter = { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) };
  } else if (filter === 'week') {
    dateFilter = { gte: startOfWeek(today), lte: endOfWeek(today) };
  } else if (filter === 'month') {
    dateFilter = { gte: startOfMonth(today), lte: endOfMonth(today) };
  } else if (date) {
    const d = parseISO(date);
    dateFilter = { gte: startOfDay(d), lte: endOfDay(d) };
  }

  const where = {
    clinicId,
    ...(Object.keys(dateFilter).length > 0 ? { dateTime: dateFilter } : {}),
    ...(status ? { status: status as never } : {}),
  };

  const [total, appointments] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, fullName: true, phone: true, email: true } },
      },
      orderBy: { dateTime: 'asc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
  ]);

  res.json({ data: appointments, total, page: pageNum, limit: limitNum });
});

// POST /api/appointments
export const createAppointment = asyncHandler(async (req: Request, res: Response) => {
  const data = CreateAppointmentSchema.parse(req.body);
  const clinicId = req.clinicId!;

  // Verify patient belongs to this clinic
  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, clinicId },
  });
  if (!patient) throw createError('Patient not found', 404, 'PATIENT_NOT_FOUND');

  // Check for slot conflict
  const start = parseISO(data.dateTime);
  const end = addMinutes(start, data.durationMin);

  const conflict = await prisma.appointment.findFirst({
    where: {
      clinicId,
      status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] },
      dateTime: { gte: start, lt: end },
    },
  });
  if (conflict) throw createError('This time slot is already booked', 409, 'SLOT_CONFLICT');

  const appointment = await prisma.appointment.create({
    data: {
      clinicId,
      patientId: data.patientId,
      treatment: data.treatment,
      dateTime: start,
      durationMin: data.durationMin,
      fee: data.fee,
      notes: data.notes,
      channel: data.channel,
      bookedByStaffId: req.user?.role === 'STAFF' ? req.user.id : null,
    },
    include: { patient: true },
  });

  // Send WhatsApp confirmation (non-blocking)
  if (data.sendConfirmation) {
    sendAppointmentConfirmation(appointment.id).catch(() => null);
  }

  // Notify clinic dashboard
  await createNotification({
    clinicId,
    title: 'New Appointment',
    body: `New appointment booked for ${patient.fullName}`,
    type: 'ai_action',
    link: '/dashboard/appointments',
  });

  res.status(201).json(appointment);
});

// GET /api/appointments/:id
export const getAppointment = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    include: {
      patient: { select: { id: true, fullName: true, phone: true, email: true, medicalNotes: true } },
    },
  });
  if (!appointment || appointment.clinicId !== req.clinicId) {
    throw createError('Appointment not found', 404, 'NOT_FOUND');
  }
  res.json(appointment);
});

// PATCH /api/appointments/:id
export const updateAppointment = asyncHandler(async (req: Request, res: Response) => {
  const data = UpdateAppointmentSchema.parse(req.body);
  const existing = await prisma.appointment.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.clinicId !== req.clinicId) {
    throw createError('Appointment not found', 404, 'NOT_FOUND');
  }

  const appointment = await prisma.appointment.update({
    where: { id: req.params.id },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.treatment && { treatment: data.treatment }),
      ...(data.dateTime && { dateTime: parseISO(data.dateTime) }),
      ...(data.durationMin && { durationMin: data.durationMin }),
      ...(data.fee !== undefined && { fee: data.fee }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: { patient: { select: { fullName: true, phone: true } } },
  });

  // Notify on cancellation
  if (data.status === 'CANCELLED') {
    await createNotification({
      clinicId: req.clinicId!,
      title: 'Appointment Cancelled',
      body: `${appointment.patient.fullName} cancelled their appointment`,
      type: 'cancellation',
      link: '/dashboard/appointments',
    });
  }

  res.json(appointment);
});

// DELETE /api/appointments/:id (soft cancel)
export const cancelAppointment = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.appointment.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.clinicId !== req.clinicId) {
    throw createError('Appointment not found', 404, 'NOT_FOUND');
  }

  await prisma.appointment.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' },
  });

  res.json({ message: 'Appointment cancelled' });
});

// GET /api/appointments/slots
export const getAvailableSlots = asyncHandler(async (req: Request, res: Response) => {
  const { date, duration } = SlotsQuerySchema.parse(req.query);
  const clinicId = req.clinicId!;
  const durationMin = parseInt(duration ?? '30');

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { workingHours: true },
  });

  const hours = JSON.parse(clinic?.workingHours ?? '{}');
  const targetDate = parseISO(date);
  const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const dayConfig = hours[dayName];

  if (!dayConfig?.isOpen) {
    res.json({ slots: [], message: 'Clinic is closed on this day' });
    return;
  }

  const [openH, openM] = (dayConfig.open || '09:00').split(':').map(Number);
  const [closeH, closeM] = (dayConfig.close || '17:00').split(':').map(Number);

  const booked = await prisma.appointment.findMany({
    where: {
      clinicId,
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
});
