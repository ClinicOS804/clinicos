import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { createError } from '../middleware/error.middleware';
import {
  getOrCreateCustomer,
  createCheckoutSession,
  createPortalSession,
  getCustomerInvoices,
  getSubscription,
} from '../services/stripe.service';

// GET /api/billing/subscription
export const getSubscriptionInfo = asyncHandler(async (req: Request, res: Response) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: req.clinicId! },
    select: {
      plan: true, planStatus: true, stripeCustomerId: true, stripeSubId: true,
      currentPeriodEnd: true, trialEndsAt: true,
    },
  });
  if (!clinic) throw createError('Clinic not found', 404, 'NOT_FOUND');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stripeSubscription: any = null;
  if (clinic.stripeSubId) {
    stripeSubscription = await getSubscription(clinic.stripeSubId);
  }

  const planDetails = {
    TRIAL: { name: 'Free Trial', price: 0, staff: 0, patients: 50, aiMessages: 100 },
    STARTER: { name: 'Starter', price: 29, staff: 1, patients: 500, aiMessages: 1000 },
    PRO: { name: 'Pro', price: 59, staff: 3, patients: 2000, aiMessages: 5000 },
    ENTERPRISE: { name: 'Enterprise', price: 99, staff: 10, patients: -1, aiMessages: -1 },
  };

  res.json({
    plan: clinic.plan,
    planStatus: clinic.planStatus,
    planDetails: planDetails[clinic.plan],
    currentPeriodEnd: clinic.currentPeriodEnd,
    trialEndsAt: clinic.trialEndsAt,
    paymentMethod: stripeSubscription?.default_payment_method ?? null,
  });
});

// GET /api/billing/invoices
export const getInvoices = asyncHandler(async (req: Request, res: Response) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: req.clinicId! },
    select: { stripeCustomerId: true },
  });

  if (!clinic?.stripeCustomerId) {
    res.json([]);
    return;
  }

  const stripeInvoices = await getCustomerInvoices(clinic.stripeCustomerId);
  res.json(
    stripeInvoices.map((inv) => ({
      id: inv.id,
      amount: (inv.amount_paid ?? inv.amount_due) / 100,
      currency: inv.currency,
      status: inv.status,
      pdfUrl: inv.invoice_pdf,
      date: new Date((inv.created ?? 0) * 1000),
      period: inv.period_start
        ? new Date(inv.period_start * 1000).toISOString().slice(0, 7)
        : '',
    }))
  );
});

// POST /api/billing/checkout
export const createCheckout = asyncHandler(async (req: Request, res: Response) => {
  const { plan } = req.body as { plan: 'STARTER' | 'PRO' | 'ENTERPRISE' };
  const clinic = await prisma.clinic.findUnique({
    where: { id: req.clinicId! },
    select: { id: true, email: true, ownerName: true, stripeCustomerId: true },
  });
  if (!clinic) throw createError('Clinic not found', 404, 'NOT_FOUND');

  let customerId = clinic.stripeCustomerId;
  if (!customerId) {
    customerId = await getOrCreateCustomer(clinic.id, clinic.email, clinic.ownerName);
    await prisma.clinic.update({
      where: { id: clinic.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const successUrl = `${process.env.APP_URL}/dashboard/billing?success=true`;
  const cancelUrl = `${process.env.APP_URL}/dashboard/billing?cancelled=true`;

  const url = await createCheckoutSession(customerId, plan, successUrl, cancelUrl, clinic.id);
  res.json({ url });
});

// POST /api/billing/portal
export const openPortal = asyncHandler(async (req: Request, res: Response) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: req.clinicId! },
    select: { stripeCustomerId: true },
  });

  if (!clinic?.stripeCustomerId) {
    throw createError('No billing account found. Please subscribe first.', 400, 'NO_BILLING');
  }

  const returnUrl = `${process.env.APP_URL}/dashboard/billing`;
  const url = await createPortalSession(clinic.stripeCustomerId, returnUrl);
  res.json({ url });
});
