import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { createError } from '../middleware/error.middleware';
import { sendEmail } from '../services/email.service';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

// GET /api/superadmin/stats
export const getPlatformStats = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const monthStart = startOfMonth(now);

  const [
    totalClinics,
    activeClinics,
    totalPatients,
    totalAppointments,
    newThisMonth,
    cancelled,
  ] = await Promise.all([
    prisma.clinic.count(),
    prisma.clinic.count({ where: { isActive: true, planStatus: 'ACTIVE' } }),
    prisma.patient.count(),
    prisma.appointment.count(),
    prisma.clinic.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.clinic.count({ where: { planStatus: 'CANCELLED' } }),
  ]);

  // MRR estimate
  const mrrData = await prisma.clinic.groupBy({
    by: ['plan'],
    where: { planStatus: 'ACTIVE', plan: { notIn: ['TRIAL'] } },
    _count: { plan: true },
  });

  const planPrices: Record<string, number> = { STARTER: 29, PRO: 59, ENTERPRISE: 99 };
  const mrr = mrrData.reduce((sum, g) => {
    return sum + (planPrices[g.plan] ?? 0) * g._count.plan;
  }, 0);

  const recentSignups = await prisma.clinic.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true, name: true, ownerName: true, email: true, plan: true,
      planStatus: true, createdAt: true, specialty: true,
    },
  });

  res.json({
    totalClinics,
    activeClinics,
    totalPatients,
    totalAppointments,
    newThisMonth,
    cancelled,
    mrr,
    recentSignups,
  });
});

// GET /api/superadmin/clinics
export const listClinics = asyncHandler(async (req: Request, res: Response) => {
  const { search, plan, status, page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const where = {
    ...(search ? {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
        { ownerName: { contains: search } },
      ],
    } : {}),
    ...(plan ? { plan: plan as never } : {}),
    ...(status === 'active' ? { isActive: true } : status === 'suspended' ? { isActive: false } : {}),
  };

  const [total, clinics] = await Promise.all([
    prisma.clinic.count({ where }),
    prisma.clinic.findMany({
      where,
      select: {
        id: true, name: true, ownerName: true, email: true, specialty: true,
        plan: true, planStatus: true, isActive: true, createdAt: true,
        _count: { select: { patients: true, appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
  ]);

  res.json({ data: clinics, total, page: pageNum, limit: limitNum });
});

// GET /api/superadmin/clinics/:id
export const getClinicDetail = asyncHandler(async (req: Request, res: Response) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, name: true, ownerName: true, email: true, phone: true,
      specialty: true, address: true, plan: true, planStatus: true,
      isActive: true, createdAt: true, trialEndsAt: true, currentPeriodEnd: true,
      aiEnabled: true, bookingSlug: true,
      _count: { select: { patients: true, appointments: true, staff: true } },
    },
  });
  if (!clinic) throw createError('Clinic not found', 404, 'NOT_FOUND');
  res.json(clinic);
});

// PATCH /api/superadmin/clinics/:id/status
export const updateClinicStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body as { isActive: boolean };
  await prisma.clinic.update({
    where: { id: req.params.id },
    data: { isActive },
  });
  res.json({ message: `Clinic ${isActive ? 'activated' : 'suspended'}` });
});

// PATCH /api/superadmin/clinics/:id/plan
export const overridePlan = asyncHandler(async (req: Request, res: Response) => {
  const { plan, planStatus } = req.body as { plan: string; planStatus: string };
  await prisma.clinic.update({
    where: { id: req.params.id },
    data: { plan: plan as never, planStatus: planStatus as never },
  });
  res.json({ message: 'Plan updated' });
});

// GET /api/superadmin/revenue
export const getRevenue = asyncHandler(async (req: Request, res: Response) => {
  const monthlyData: { month: string; estimatedRevenue: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const month = subMonths(new Date(), i);
    const clinicsActive = await prisma.clinic.count({
      where: {
        planStatus: 'ACTIVE',
        plan: { notIn: ['TRIAL'] },
        createdAt: { lte: endOfMonth(month) },
      },
    });
    // Estimate revenue (real data would come from Stripe)
    monthlyData.push({
      month: month.toISOString().slice(0, 7),
      estimatedRevenue: clinicsActive * 44, // average of plan prices
    });
  }

  // Plan distribution
  const distribution = await prisma.clinic.groupBy({
    by: ['plan'],
    _count: { plan: true },
  });

  res.json({ monthly: monthlyData, distribution });
});

// POST /api/superadmin/announce
export const sendAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { subject, body } = req.body as { subject: string; body: string };

  const clinics = await prisma.clinic.findMany({
    where: { isActive: true },
    select: { email: true, ownerName: true },
  });

  let sent = 0;
  for (const clinic of clinics) {
    await sendEmail({
      to: clinic.email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1e293b;">${subject}</h2>
          <div style="color: #64748b; white-space: pre-wrap;">${body}</div>
          <hr style="margin: 24px 0; border-color: #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px;">MediCore AI Platform Announcement</p>
        </div>
      `,
    }).catch(() => null);
    sent++;
  }

  res.json({ sent, total: clinics.length });
});
