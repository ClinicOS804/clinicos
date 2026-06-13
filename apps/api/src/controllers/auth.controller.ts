import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { slugify } from '../lib/slugify';
import { asyncHandler } from '../lib/asyncHandler';
import { createError } from '../middleware/error.middleware';
import {
  RegisterSchema,
  LoginSchema,
  StaffLoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '../schemas/auth.schemas';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
} from '../services/email.service';
import { addDays } from 'date-fns';

const SALT_ROUNDS = 12;

// ─── POST /api/auth/register ──────────────────────────────────────────────────
export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = RegisterSchema.parse(req.body);

  const existing = await prisma.clinic.findFirst({
    where: { OR: [{ email: data.email }, { phone: data.phone }] },
  });
  if (existing) {
    throw createError('An account with this email or phone already exists', 409, 'DUPLICATE_CLINIC');
  }

  let slug = data.bookingSlug || slugify(`dr-${data.ownerName}`);
  const slugExists = await prisma.clinic.findUnique({ where: { bookingSlug: slug } });
  if (slugExists) {
    slug = `${slug}-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const trialEndsAt = addDays(new Date(), Number(process.env.TRIAL_DAYS ?? 14));

  const clinic = await prisma.clinic.create({
    data: {
      ownerName: data.ownerName,
      email: data.email,
      passwordHash,
      phone: data.phone,
      name: data.clinicName,
      specialty: data.specialty,
      address: data.address,
      timezone: data.timezone,
      bookingSlug: slug,
      workingHours: data.workingHours,
      treatments: data.treatments,
      plan: 'TRIAL',
      planStatus: 'TRIALING',
      trialEndsAt,
    },
  });

  sendWelcomeEmail(clinic.email, clinic.ownerName, clinic.name).catch(() => null);

  const token = signToken({
    id: clinic.id,
    clinicId: clinic.id,
    role: 'DOCTOR',
    email: clinic.email,
    plan: clinic.plan,
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    message: 'Clinic registered successfully',
    token,
    clinic: {
      id: clinic.id,
      name: clinic.name,
      email: clinic.email,
      ownerName: clinic.ownerName,
      plan: clinic.plan,
      bookingSlug: clinic.bookingSlug,
      onboardingDone: clinic.onboardingDone,
    },
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = LoginSchema.parse(req.body);

  const clinic = await prisma.clinic.findUnique({ where: { email: data.email } });
  if (!clinic) throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(data.password, clinic.passwordHash);
  if (!valid) throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

  if (!clinic.isActive) {
    throw createError('This clinic account has been suspended. Please contact support@clinicos.workee.online', 403, 'ACCOUNT_SUSPENDED');
  }

  const token = signToken({
    id: clinic.id,
    clinicId: clinic.id,
    role: 'DOCTOR',
    email: clinic.email,
    plan: clinic.plan,
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    token,
    user: {
      id: clinic.id,
      clinicId: clinic.id,
      role: 'DOCTOR',
      name: clinic.ownerName,
      email: clinic.email,
      clinicName: clinic.name,
      plan: clinic.plan,
      planStatus: clinic.planStatus,
      onboardingDone: clinic.onboardingDone,
      logoUrl: clinic.logoUrl,
    },
  });
});

// ─── POST /api/auth/staff/login ───────────────────────────────────────────────
export const staffLogin = asyncHandler(async (req: Request, res: Response) => {
  const data = StaffLoginSchema.parse(req.body);

  const staff = await prisma.staffMember.findUnique({
    where: { email: data.email },
    include: { clinic: { select: { id: true, name: true, isActive: true, logoUrl: true } } },
  });

  if (!staff) throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(data.password, staff.passwordHash);
  if (!valid) throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

  if (!staff.isActive) throw createError('Your account has been deactivated', 403, 'ACCOUNT_INACTIVE');
  if (!staff.clinic.isActive) throw createError('This clinic has been suspended', 403, 'CLINIC_SUSPENDED');

  await prisma.staffMember.update({
    where: { id: staff.id },
    data: { lastLogin: new Date() },
  });

  const token = signToken({
    id: staff.id,
    clinicId: staff.clinicId,
    role: 'STAFF',
    email: staff.email,
    staffRole: staff.role,
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    token,
    user: {
      id: staff.id,
      clinicId: staff.clinicId,
      role: 'STAFF',
      staffRole: staff.role,
      name: staff.name,
      email: staff.email,
      clinicName: staff.clinic.name,
      logoUrl: staff.clinic.logoUrl,
    },
  });
});

// ─── POST /api/auth/superadmin/login ─────────────────────────────────────────
export const superadminLogin = asyncHandler(async (req: Request, res: Response) => {
  const data = LoginSchema.parse(req.body);

  const admin = await prisma.superAdmin.findUnique({ where: { email: data.email } });
  if (!admin) throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(data.password, admin.passwordHash);
  if (!valid) throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

  const token = signToken({
    id: admin.id,
    clinicId: '',
    role: 'SUPERADMIN',
    email: admin.email,
  });

  res.json({
    token,
    user: { id: admin.id, name: admin.name, email: admin.email, role: 'SUPERADMIN' },
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.role === 'DOCTOR') {
    const clinic = await prisma.clinic.findUnique({
      where: { id: req.clinicId },
      select: {
        id: true, name: true, ownerName: true, email: true, phone: true,
        specialty: true, logoUrl: true, plan: true, planStatus: true,
        bookingSlug: true, onboardingDone: true, aiEnabled: true,
        trialEndsAt: true, currentPeriodEnd: true,
      },
    });
    if (!clinic) throw createError('Clinic not found', 404, 'NOT_FOUND');
    res.json({ ...clinic, role: 'DOCTOR' });
  } else if (req.user?.role === 'STAFF') {
    const staff = await prisma.staffMember.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true, clinicId: true,
        clinic: { select: { name: true, logoUrl: true } },
      },
    });
    if (!staff) throw createError('Staff not found', 404, 'NOT_FOUND');
    res.json({ ...staff, role: 'STAFF' });
  } else {
    throw createError('Unauthorized', 401, 'UNAUTHORIZED');
  }
});

// ─── PATCH /api/auth/me — update own profile ─────────────────────────────────
export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const { name, currentPassword, newPassword } = req.body as {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  if (req.user?.role === 'STAFF') {
    const staff = await prisma.staffMember.findUnique({ where: { id: req.user.id } });
    if (!staff) throw createError('Not found', 404, 'NOT_FOUND');

    const updates: { name?: string; passwordHash?: string } = {};
    if (name) updates.name = name;

    if (newPassword) {
      if (!currentPassword) throw createError('Current password is required', 400, 'MISSING_FIELD');
      const valid = await bcrypt.compare(currentPassword, staff.passwordHash);
      if (!valid) throw createError('Current password is incorrect', 400, 'WRONG_PASSWORD');
      updates.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    }

    const updated = await prisma.staffMember.update({
      where: { id: staff.id },
      data: updates,
    });
    res.json({ name: updated.name, email: updated.email });

  } else if (req.user?.role === 'DOCTOR') {
    const clinic = await prisma.clinic.findUnique({ where: { id: req.clinicId } });
    if (!clinic) throw createError('Not found', 404, 'NOT_FOUND');

    const updates: { ownerName?: string; passwordHash?: string } = {};
    if (name) updates.ownerName = name;

    if (newPassword) {
      if (!currentPassword) throw createError('Current password is required', 400, 'MISSING_FIELD');
      const valid = await bcrypt.compare(currentPassword, clinic.passwordHash);
      if (!valid) throw createError('Current password is incorrect', 400, 'WRONG_PASSWORD');
      updates.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    }

    const updated = await prisma.clinic.update({
      where: { id: clinic.id },
      data: updates,
    });
    res.json({ name: updated.ownerName, email: updated.email });
  } else {
    throw createError('Unauthorized', 401, 'UNAUTHORIZED');
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const data = ForgotPasswordSchema.parse(req.body);

  // Always 200 — prevent email enumeration attacks
  const clinic = await prisma.clinic.findUnique({ where: { email: data.email } });
  const staff = !clinic
    ? await prisma.staffMember.findUnique({ where: { email: data.email } })
    : null;

  const recipientEmail = clinic?.email ?? staff?.email;

  if (!recipientEmail) {
    res.json({ message: 'If this email exists, a reset link has been sent.' });
    return;
  }

  // Invalidate old tokens
  await prisma.passwordReset.updateMany({
    where: { email: recipientEmail, used: false },
    data: { used: true },
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordReset.create({
    data: { email: recipientEmail, token, expiresAt },
  });

  const resetLink = `${process.env.APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(recipientEmail)}`;
  await sendPasswordResetEmail(recipientEmail, resetLink).catch(() => null);

  res.json({ message: 'If this email exists, a reset link has been sent.' });
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const data = ResetPasswordSchema.parse(req.body);

  const record = await prisma.passwordReset.findUnique({ where: { token: data.token } });
  if (!record || record.used) {
    throw createError('Invalid or already-used reset link', 400, 'INVALID_TOKEN');
  }
  if (record.expiresAt < new Date()) {
    throw createError('This reset link has expired. Please request a new one.', 400, 'TOKEN_EXPIRED');
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const clinic = await prisma.clinic.findUnique({ where: { email: record.email } });
  if (clinic) {
    await prisma.clinic.update({ where: { id: clinic.id }, data: { passwordHash } });
  } else {
    const staff = await prisma.staffMember.findUnique({ where: { email: record.email } });
    if (staff) {
      await prisma.staffMember.update({ where: { id: staff.id }, data: { passwordHash } });
    }
  }

  await prisma.passwordReset.update({ where: { id: record.id }, data: { used: true } });

  res.json({ message: 'Password reset successfully. You can now log in.' });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// ─── POST /api/auth/accept-invite ────────────────────────────────────────────
export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body as { token: string; password: string };

  const staff = await prisma.staffMember.findUnique({ where: { inviteToken: token } });
  if (!staff) throw createError('Invalid or expired invite link', 400, 'INVALID_TOKEN');
  if (staff.inviteExpiry && staff.inviteExpiry < new Date()) {
    throw createError('This invite link has expired. Ask your clinic to resend it.', 400, 'TOKEN_EXPIRED');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await prisma.staffMember.update({
    where: { id: staff.id },
    data: { passwordHash, inviteToken: null, inviteExpiry: null, isActive: true },
  });

  res.json({ message: 'Account activated. You can now log in.' });
});
