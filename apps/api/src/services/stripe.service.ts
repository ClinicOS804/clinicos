import Stripe from 'stripe';
import { logger } from '../lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
});

export { stripe };

const planPriceMap: Record<string, string> = {
  STARTER: process.env.STRIPE_STARTER_PRICE_ID ?? '',
  PRO: process.env.STRIPE_PRO_PRICE_ID ?? '',
  ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? '',
};

/**
 * Create or retrieve a Stripe Customer for a clinic.
 */
export async function getOrCreateCustomer(
  clinicId: string,
  email: string,
  name: string
): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { clinicId },
  });
  return customer.id;
}

/**
 * Create a Stripe Checkout session for a new subscription.
 */
export async function createCheckoutSession(
  customerId: string,
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE',
  successUrl: string,
  cancelUrl: string,
  clinicId: string
): Promise<string> {
  const priceId = planPriceMap[plan];
  if (!priceId) throw new Error(`No price ID configured for plan: ${plan}`);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { clinicId, plan },
    subscription_data: {
      metadata: { clinicId, plan },
    },
  });

  return session.url!;
}

/**
 * Create a Stripe Customer Portal session (to manage payment method / cancel).
 */
export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

/**
 * Retrieve upcoming invoice for a customer.
 */
export async function getUpcomingInvoice(customerId: string): Promise<Stripe.UpcomingInvoice | null> {
  try {
    return await stripe.invoices.retrieveUpcoming({ customer: customerId });
  } catch {
    return null;
  }
}

/**
 * Validate and construct a Stripe webhook event.
 */
export function constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

/**
 * Get invoices for a customer.
 */
export async function getCustomerInvoices(customerId: string): Promise<Stripe.Invoice[]> {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 20,
  });
  return invoices.data;
}

/**
 * Get subscription details.
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (err) {
    logger.error('Failed to retrieve Stripe subscription', { subscriptionId, err });
    return null;
  }
}
