import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { createError } from '../middleware/error.middleware';
import { signToken, verifyToken } from '../lib/jwt';
import { sendSMS } from '../services/twilio.service';

const router = Router();

// POST /api/patient/request-otp
router.post('/request-otp', asyncHandler(async (req, res) => {
  const { phone } = req.body as { phone: string };
  if (!phone) {
    res.status(400).json({ error: 'Phone number is required' });
    return;
  }

  // Find all patients with this phone across all clinics
  const patients = await prisma.patient.findMany({
    where: { phone },
    include: { clinic: { select: { name: true } } },
  });

  if (patients.length === 0) {
    // Don't reveal if patient exists
    res.json({ message: 'If this number is registered, an OTP has been sent.' });
    return;
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  const token = Buffer.from(JSON.stringify({ phone, otp, exp: expiry.getTime() })).toString('base64');

  // Send OTP via SMS
  await sendSMS(phone, `Your MediCore AI verification code is: ${otp}. Valid for 10 minutes.`).catch(() => null);

  // We return a session token so client can match it on verify
  res.json({ message: 'OTP sent', sessionToken: token });
}));

// POST /api/patient/verify-otp
router.post('/verify-otp', asyncHandler(async (req, res) => {
  const { otp, sessionToken, clinicSlug } = req.body as {
    otp: string;
    sessionToken: string;
    clinicSlug?: string;
  };

  let decoded: { phone: string; otp: string; exp: number };
  try {
    decoded = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
  } catch {
    throw createError('Invalid session', 400, 'INVALID_SESSION');
  }

  if (Date.now() > decoded.exp) throw createError('OTP expired', 400, 'OTP_EXPIRED');
  if (decoded.otp !== otp) throw createError('Invalid OTP', 400, 'INVALID_OTP');

  // Find patient — if clinicSlug is provided, filter to that clinic
  const whereClause = clinicSlug
    ? {
        phone: decoded.phone,
        clinic: { bookingSlug: clinicSlug },
      }
    : { phone: decoded.phone };

  const patient = await prisma.patient.findFirst({
    where: whereClause,
    include: { clinic: { select: { name: true, id: true } } },
  });

  if (!patient) throw createError('Patient not found', 404, 'NOT_FOUND');

  const token = signToken({
    id: patient.id,
    clinicId: patient.clinicId,
    role: 'STAFF', // reuse role mechanism, identify by id lookup
    email: patient.email ?? '',
  });

  res.json({
    token,
    patient: {
      id: patient.id,
      fullName: patient.fullName,
      phone: patient.phone,
      clinicName: patient.clinic.name,
    },
  });
}));

// GET /api/patient/appointments — patient JWT required
router.get('/appointments', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError('Authentication required', 401, 'NO_TOKEN');
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  const appointments = await prisma.appointment.findMany({
    where: { patientId: payload.id, clinicId: payload.clinicId },
    orderBy: { dateTime: 'desc' },
    include: { clinic: { select: { name: true, phone: true, address: true } } },
  });

  res.json(appointments);
}));

// PATCH /api/patient/appointments/:id/cancel — patient self-cancel
router.patch('/appointments/:id/cancel', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError('Authentication required', 401, 'NO_TOKEN');
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  const appointment = await prisma.appointment.findFirst({
    where: { id: req.params.id, patientId: payload.id },
  });

  if (!appointment) throw createError('Appointment not found', 404, 'NOT_FOUND');

  // Cannot cancel if less than 2 hours away
  const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
  if (appointment.dateTime <= twoHoursFromNow) {
    throw createError(
      'Appointments can only be cancelled more than 2 hours in advance. Please call the clinic directly.',
      400,
      'TOO_LATE_TO_CANCEL'
    );
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: 'CANCELLED' },
  });

  res.json({ message: 'Appointment cancelled successfully' });
}));

export default router;
