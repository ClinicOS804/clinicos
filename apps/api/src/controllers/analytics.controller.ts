import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import {
  startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, subDays, format
} from 'date-fns';

// GET /api/analytics/overview
export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [
    thisMonthAppts,
    lastMonthAppts,
    totalPatients,
    noShowsThisMonth,
    totalCompleted,
    returningPatients,
  ] = await Promise.all([
    prisma.appointment.count({ where: { clinicId, dateTime: { gte: thisMonthStart }, status: { notIn: ['CANCELLED'] } } }),
    prisma.appointment.count({ where: { clinicId, dateTime: { gte: lastMonthStart, lte: lastMonthEnd }, status: { notIn: ['CANCELLED'] } } }),
    prisma.patient.count({ where: { clinicId, isActive: true } }),
    prisma.appointment.count({ where: { clinicId, dateTime: { gte: thisMonthStart }, status: 'NO_SHOW' } }),
    prisma.appointment.count({ where: { clinicId, status: 'COMPLETED' } }),
    prisma.appointment.groupBy({
      by: ['patientId'],
      where: { clinicId, status: 'COMPLETED' },
      having: { patientId: { _count: { gt: 1 } } },
    }),
  ]);

  const apptChange = lastMonthAppts > 0
    ? Math.round(((thisMonthAppts - lastMonthAppts) / lastMonthAppts) * 100)
    : 0;

  const noShowRate = thisMonthAppts > 0
    ? Math.round((noShowsThisMonth / thisMonthAppts) * 100)
    : 0;

  const returnRate = totalPatients > 0
    ? Math.round((returningPatients.length / totalPatients) * 100)
    : 0;

  const revenueResult = await prisma.appointment.aggregate({
    where: { clinicId, status: 'COMPLETED', dateTime: { gte: thisMonthStart } },
    _sum: { fee: true },
  });

  const lastMonthRevenue = await prisma.appointment.aggregate({
    where: { clinicId, status: 'COMPLETED', dateTime: { gte: lastMonthStart, lte: lastMonthEnd } },
    _sum: { fee: true },
  });

  const revenue = Number(revenueResult._sum.fee ?? 0);
  const prevRevenue = Number(lastMonthRevenue._sum.fee ?? 0);
  const revenueChange = prevRevenue > 0
    ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100)
    : 0;

  res.json({
    revenue: { value: revenue, change: revenueChange },
    appointments: { value: thisMonthAppts, change: apptChange },
    returnRate: { value: returnRate, change: 0 },
    noShowRate: { value: noShowRate, change: 0 },
    totalPatients,
    totalCompleted,
  });
});

// GET /api/analytics/weekly-appointments
export const getWeeklyAppointments = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;
  const result: { date: string; count: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const count = await prisma.appointment.count({
      where: {
        clinicId,
        dateTime: { gte: startOfDay(day), lte: endOfDay(day) },
        status: { notIn: ['CANCELLED'] },
      },
    });
    result.push({ date: format(day, 'EEE'), count });
  }

  res.json(result);
});

// GET /api/analytics/monthly-revenue
export const getMonthlyRevenue = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;
  const result: { month: string; revenue: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const month = subMonths(new Date(), i);
    const rev = await prisma.appointment.aggregate({
      where: {
        clinicId,
        status: 'COMPLETED',
        dateTime: { gte: startOfMonth(month), lte: endOfMonth(month) },
      },
      _sum: { fee: true },
    });
    result.push({
      month: format(month, 'MMM yyyy'),
      revenue: Number(rev._sum.fee ?? 0),
    });
  }

  res.json(result);
});

// GET /api/analytics/messages-by-channel
export const getMessagesByChannel = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;

  const grouped = await prisma.message.groupBy({
    by: ['channel'],
    where: { clinicId },
    _count: { channel: true },
  });

  const data = grouped.map((g) => ({
    channel: g.channel,
    count: g._count.channel,
  }));

  res.json(data);
});

// GET /api/analytics/top-treatments
export const getTopTreatments = asyncHandler(async (req: Request, res: Response) => {
  const clinicId = req.clinicId!;

  const grouped = await prisma.appointment.groupBy({
    by: ['treatment'],
    where: { clinicId, status: { notIn: ['CANCELLED'] } },
    _count: { treatment: true },
    orderBy: { _count: { treatment: 'desc' } },
    take: 10,
  });

  res.json(grouped.map((g) => ({ treatment: g.treatment, count: g._count.treatment })));
});
