import { Router, Request, Response } from 'express';
import { constructWebhookEvent } from '../services/stripe.service';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { sendWelcomeEmail, sendPaymentFailedEmail } from '../services/email.service';
import Stripe from 'stripe';

const router = Router();

const planFromPriceId = (priceId: string): 'STARTER' | 'PRO' | 'ENTERPRISE' | null => {
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return 'STARTER';
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'PRO';
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) return 'ENTERPRISE';
  return null;
};

/**
 * POST /api/webhooks/stripe
 * Handles all Stripe billing events.
 * NOTE: This route needs raw body — configured in app.ts
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(req.body as Buffer, signature);
  } catch (err) {
    logger.warn('Invalid Stripe webhook signature', { err });
    res.status(400).send('Webhook signature verification failed');
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clinicId = session.metadata?.clinicId;
        const plan = session.metadata?.plan as 'STARTER' | 'PRO' | 'ENTERPRISE';

        if (!clinicId || !plan) break;

        const subscriptionId = session.subscription as string;
        const subscription = await (await import('../services/stripe.service')).getSubscription(subscriptionId);

        await prisma.clinic.update({
          where: { id: clinicId },
          data: {
            plan,
            planStatus: 'ACTIVE',
            stripeSubId: subscriptionId,
            stripeCustomerId: session.customer as string,
            currentPeriodEnd: subscription?.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null,
            trialEndsAt: null,
          },
        });

        const clinic = await prisma.clinic.findUnique({
          where: { id: clinicId },
          select: { email: true, ownerName: true, name: true },
        });

        if (clinic) {
          await sendWelcomeEmail(clinic.email, clinic.ownerName, clinic.name).catch(() => null);
        }

        logger.info(`Subscription activated for clinic ${clinicId}, plan: ${plan}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customer = invoice.customer as string;

        const clinic = await prisma.clinic.findFirst({
          where: { stripeCustomerId: customer },
        });

        if (!clinic) break;

        // Get updated subscription period
        if (invoice.subscription) {
          const sub = await (await import('../services/stripe.service')).getSubscription(invoice.subscription as string);
          await prisma.clinic.update({
            where: { id: clinic.id },
            data: {
              planStatus: 'ACTIVE',
              currentPeriodEnd: sub?.current_period_end ? new Date(sub.current_period_end * 1000) : null,
            },
          });
        }

        // Log invoice
        await prisma.invoice.upsert({
          where: { stripeInvoiceId: invoice.id },
          create: {
            clinicId: clinic.id,
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: 'paid',
            period: new Date((invoice.period_start ?? 0) * 1000).toISOString().slice(0, 7),
            pdfUrl: invoice.invoice_pdf ?? null,
            paidAt: new Date(),
          },
          update: { status: 'paid', paidAt: new Date() },
        });

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customer = invoice.customer as string;

        const clinic = await prisma.clinic.findFirst({
          where: { stripeCustomerId: customer },
          select: { id: true, email: true, ownerName: true },
        });

        if (!clinic) break;

        await prisma.clinic.update({
          where: { id: clinic.id },
          data: { planStatus: 'PAST_DUE' },
        });

        await sendPaymentFailedEmail(clinic.email, clinic.ownerName).catch(() => null);
        logger.info(`Payment failed for clinic ${clinic.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const clinicId = sub.metadata?.clinicId;

        if (clinicId) {
          await prisma.clinic.update({
            where: { id: clinicId },
            data: { planStatus: 'CANCELLED', plan: 'TRIAL' },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const clinicId = sub.metadata?.clinicId;

        if (!clinicId) break;

        const priceId = sub.items.data[0]?.price.id;
        const plan = planFromPriceId(priceId ?? '');

        await prisma.clinic.update({
          where: { id: clinicId },
          data: {
            ...(plan && { plan }),
            planStatus: sub.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        });
        break;
      }

      default:
        logger.debug(`Unhandled Stripe event: ${event.type}`);
    }

    // Always return 200 to Stripe to prevent retries
    res.json({ received: true });
  } catch (err) {
    logger.error('Stripe webhook handler error', { eventType: event.type, err });
    // Still return 200 to prevent Stripe from retrying
    res.json({ received: true });
  }
});

export default router;
