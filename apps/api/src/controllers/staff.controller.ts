import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { createError } from '../middleware/error.middleware';
import { sendStaffInviteEmail } from '../services/email.service';
import { addHours } from 'date-fns';

const PLAN_STAFF_LIMITS: Record<string, number> = {
  TRIAL: 0,
  STARTER: 1,
  PRO: 3,
  ENTERPRISE: 10,
};

// GET /api/staff
export const listStaff = asyncHandler(async (req: Request, res: Response) => {
  const staff = await prisma.staffMember.findMany({
    where: { clinicId: req.clinicId! },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      isActive: true, lastLogin: true, createdAt: true,
      inviteToken: true, // present means invite still pending
    },
    orderBy: { createdAt: 'desc' },
  });

  const withStatus = staff.map((s) => ({
    ...s,
    status: s.inviteToken ? 'PENDING' : s.isActive ? 'ACTIVE' : 'INACTIVE',
    inviteToken: undefined, // don't expose token to frontend
  }));

  res.json(withStatus);
});

// POST /api/staff/invite
export const inviteStaff = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, role } = req.body as { name: string; email: string; role: string };
  const clinicId = req.clinicId!;

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { plan: true, name: true, _count: { select: { staff: { where: { isActive: true } } } } },
  });
  if (!clinic) throw createError('Clinic not found', 404, 'NOT_FOUND');

  const limit = PLAN_STAFF_LIMITS[clinic.plan] ?? 0;
  if (clinic._count.staff >= limit) {
    throw createError(
      `Your ${clinic.plan} plan allows a maximum of ${limit} staff member${limit !== 1 ? 's' : ''}. Please upgrade to add more.`,
      403,
      'STAFF_LIMIT_REACHED'
    );
  }

  const existing = await prisma.staffMember.findUnique({ where: { email } });
  if (existing) throw createError('A staff member with this email already exists', 409, 'DUPLICATE_STAFF');

  const inviteToken = crypto.randomBytes(32).toString('hex');
  const inviteExpiry = addHours(new Date(), 48);
  const tempHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

  const staff = await prisma.staffMember.create({
    data: {
      clinicId,
      name,
      email,
      role: role as never,
      passwordHash: tempHash,
      inviteToken,
      inviteExpiry,
      isActive: false, // becomes active when they set their password
    },
  });

  const inviteLink = `${process.env.APP_URL}/auth/accept-invite?token=${inviteToken}`;
  await sendStaffInviteEmail(email, name, clinic.name, inviteLink).catch(() => null);

  res.status(201).json({ id: staff.id, name, email, role, status: 'PENDING' });
});

// PATCH /api/staff/:id
export const updateStaff = asyncHandler(async (req: Request, res: Response) => {
  const { role, isActive } = req.body as { role?: string; isActive?: boolean };
  const existing = await prisma.staffMember.findFirst({
    where: { id: req.params.id, clinicId: req.clinicId! },
  });
  if (!existing) throw createError('Staff member not found', 404, 'NOT_FOUND');

  const updated = await prisma.staffMember.update({
    where: { id: req.params.id },
    data: {
      ...(role && { role: role as never }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  res.json(updated);
});

// DELETE /api/staff/:id — deactivate
export const deactivateStaff = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.staffMember.findFirst({
    where: { id: req.params.id, clinicId: req.clinicId! },
  });
  if (!existing) throw createError('Staff member not found', 404, 'NOT_FOUND');

  await prisma.staffMember.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({ message: 'Staff member deactivated' });
});
