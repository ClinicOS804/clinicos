import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { createError } from '../middleware/error.middleware';
import { CreatePatientSchema, UpdatePatientSchema } from '../schemas/patient.schemas';
import { createNotification } from '../services/notification.service';
import crypto from 'crypto';

// GET /api/patients
export const listPatients = asyncHandler(async (req: Request, res: Response) => {
  const { search, page = '1', limit = '20' } = req.query as Record<string, string>;
  const clinicId = req.clinicId!;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const where = {
    clinicId,
    isActive: true,
    ...(search
      ? {
          OR: [
            { fullName: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {}),
  };

  const [total, patients] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        gender: true,
        createdAt: true,
        _count: { select: { appointments: true } },
        appointments: {
          orderBy: { dateTime: 'desc' },
          take: 1,
          select: { dateTime: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
  ]);

  res.json({ data: patients, total, page: pageNum, limit: limitNum });
});

// POST /api/patients
export const createPatient = asyncHandler(async (req: Request, res: Response) => {
  const data = CreatePatientSchema.parse(req.body);
  const clinicId = req.clinicId!;

  const existing = await prisma.patient.findUnique({
    where: { clinicId_phone: { clinicId, phone: data.phone } },
  });
  if (existing) throw createError('A patient with this phone number already exists', 409, 'DUPLICATE_PATIENT');

  const patient = await prisma.patient.create({
    data: {
      clinicId,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      gender: data.gender,
      bloodGroup: data.bloodGroup,
      medicalNotes: data.medicalNotes,
      allergies: data.allergies,
      emergencyName: data.emergencyName,
      emergencyPhone: data.emergencyPhone,
    },
  });

  await createNotification({
    clinicId,
    title: 'New Patient',
    body: `${patient.fullName} has been added as a new patient`,
    type: 'new_patient',
    link: `/dashboard/patients/${patient.id}`,
  });

  res.status(201).json(patient);
});

// GET /api/patients/:id
export const getPatient = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.id, clinicId },
    include: {
      appointments: {
        orderBy: { dateTime: 'desc' },
        take: 20,
        select: {
          id: true, treatment: true, dateTime: true, status: true, fee: true, channel: true, notes: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true, channel: true, direction: true, body: true, isRead: true, createdAt: true,
        },
      },
    },
  });
  if (!patient) throw createError('Patient not found', 404, 'NOT_FOUND');
  res.json(patient);
});

// PATCH /api/patients/:id
export const updatePatient = asyncHandler(async (req: Request, res: Response) => {
  const data = UpdatePatientSchema.parse(req.body);
  const clinicId = req.clinicId!;

  const existing = await prisma.patient.findFirst({ where: { id: req.params.id, clinicId } });
  if (!existing) throw createError('Patient not found', 404, 'NOT_FOUND');

  const patient = await prisma.patient.update({
    where: { id: req.params.id },
    data: {
      ...(data.fullName && { fullName: data.fullName }),
      ...(data.phone && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
      ...(data.gender && { gender: data.gender }),
      ...(data.bloodGroup !== undefined && { bloodGroup: data.bloodGroup }),
      ...(data.medicalNotes !== undefined && { medicalNotes: data.medicalNotes }),
      ...(data.allergies !== undefined && { allergies: data.allergies }),
      ...(data.emergencyName !== undefined && { emergencyName: data.emergencyName }),
      ...(data.emergencyPhone !== undefined && { emergencyPhone: data.emergencyPhone }),
    },
  });

  res.json(patient);
});

// DELETE /api/patients/:id — soft deactivate (Doctor only)
export const deactivatePatient = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;
  if (req.user?.role !== 'DOCTOR') throw createError('Only doctors can deactivate patients', 403, 'FORBIDDEN');

  const existing = await prisma.patient.findFirst({ where: { id: req.params.id, clinicId } });
  if (!existing) throw createError('Patient not found', 404, 'NOT_FOUND');

  await prisma.patient.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: 'Patient deactivated' });
});

// GET /api/patients/:id/appointments
export const getPatientAppointments = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;
  const patient = await prisma.patient.findFirst({ where: { id: req.params.id, clinicId } });
  if (!patient) throw createError('Patient not found', 404, 'NOT_FOUND');

  const appointments = await prisma.appointment.findMany({
    where: { patientId: req.params.id, clinicId },
    orderBy: { dateTime: 'desc' },
  });
  res.json(appointments);
});

// GET /api/patients/:id/messages
export const getPatientMessages = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;
  const patient = await prisma.patient.findFirst({ where: { id: req.params.id, clinicId } });
  if (!patient) throw createError('Patient not found', 404, 'NOT_FOUND');

  const messages = await prisma.message.findMany({
    where: { patientId: req.params.id, clinicId },
    orderBy: { createdAt: 'asc' },
  });
  res.json(messages);
});

// POST /api/patients/:id/magic-link
export const sendMagicLink = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;
  const patient = await prisma.patient.findFirst({ where: { id: req.params.id, clinicId } });
  if (!patient) throw createError('Patient not found', 404, 'NOT_FOUND');

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.patient.update({
    where: { id: patient.id },
    data: { magicLinkToken: token, magicLinkExpiry: expiry, portalEnabled: true },
  });

  const link = `${process.env.APP_URL}/patient/verify?token=${token}`;
  // In production: send via WhatsApp/SMS
  res.json({ message: 'Magic link created', link });
});
