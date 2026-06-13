'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { CreditCard, Download, ArrowUpRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionInfo {
  plan: string;
  planStatus: string;
  planDetails: { name: string; price: number; staff: number; patients: number; aiMessages: number };
  currentPeriodEnd?: string;
  trialEndsAt?: string;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  pdfUrl?: string;
  date: string;
  period: string;
}

const PLAN_FEATURES: Record<string, string[]> = {
  TRIAL:      ['Basic dashboard', 'Up to 50 patients', 'No AI messaging'],
  STARTER:    ['Full dashboard', '500 patients', '1,000 AI messages/mo', 'WhatsApp AI', 'SMS reminders', 'Online booking'],
  PRO:        ['Everything in Starter', '2,000 patients', '5,000 AI messages/mo', 'Voice AI', 'Analytics', 'Review management', '3 staff accounts'],
  ENTERPRISE: ['Everything in Pro', 'Unlimited patients & messages', '10 staff accounts', 'Priority support', 'Custom AI personality'],
};

export default function BillingPage() {
  const { user } = useStore();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: () => api.get<SubscriptionInfo>('/api/billing/subscription'),
  });

  const { data: invoices } = useQuery({
    queryKey: ['billing', 'invoices'],
    queryFn: () => api.get<Invoice[]>('/api/billing/invoices'),
  });

  const checkoutMutation = useMutation({
    mutationFn: (plan: string) => api.post<{ url: string }>('/api/billing/checkout', { plan }),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: () => toast.error('Failed to start checkout'),
  });

  const portalMutation = useMutation({
    mutationFn: () => api.post<{ url: string }>('/api/billing/portal', {}),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: () => toast.error('Failed to open billing portal'),
  });

  const isPastDue = subscription?.planStatus === 'PAST_DUE';
  const isTrial = subscription?.plan === 'TRIAL';

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="card card-body !p-6 space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-6 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-page-title">Billing & Subscription</h1>

      {/* Past due warning */}
      {isPastDue && (
        <div className="bg-danger-light border border-danger/20 rounded-card p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-danger">Payment Failed</p>
            <p className="text-sm text-danger/80 mt-0.5">Your subscription payment failed. Update your payment method to restore full access.</p>
            <Button
              variant="danger"
              size="sm"
              className="mt-3"
              onClick={() => portalMutation.mutate()}
              loading={portalMutation.isPending}
            >
              Update Payment Method
            </Button>
          </div>
        </div>
      )}

      {/* Trial banner */}
      {isTrial && subscription?.trialEndsAt && (
        <div className="bg-amber-light border border-amber/20 rounded-card p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber">
              Free trial — ends {formatDate(subscription.trialEndsAt)}
            </p>
            <p className="text-sm text-amber/80 mt-0.5">Upgrade now to keep your AI receptionist running without interruption.</p>
          </div>
          <Button size="sm" onClick={() => checkoutMutation.mutate('STARTER')}>
            Upgrade →
          </Button>
        </div>
      )}

      {/* Current plan card */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-card-title">Current Plan</h2>
        </div>
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-extrabold text-primary">
                  {subscription?.planDetails?.name ?? subscription?.plan}
                </p>
                <span className={cn(
                  'chip text-xs',
                  subscription?.planStatus === 'ACTIVE' ? 'bg-brand-light text-brand' :
                  subscription?.planStatus === 'TRIALING' ? 'bg-amber-light text-amber' :
                  'bg-danger-light text-danger'
                )}>
                  {subscription?.planStatus === 'TRIALING' ? 'Trial' : subscription?.planStatus}
                </span>
              </div>
              {subscription?.planDetails?.price! > 0 && (
                <p className="text-muted mt-1 font-semibold">
                  ${subscription?.planDetails?.price}/month
                </p>
              )}
              {subscription?.currentPeriodEnd && (
                <p className="text-xs text-muted mt-1">
                  Renews {formatDate(subscription.currentPeriodEnd)}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              {!isTrial && (
                <Button variant="secondary" onClick={() => portalMutation.mutate()} loading={portalMutation.isPending}>
                  <CreditCard className="w-4 h-4" />
                  Manage Billing
                </Button>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(PLAN_FEATURES[subscription?.plan ?? 'TRIAL'] ?? []).map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-brand flex-shrink-0" />
                <span className="text-sm text-muted font-semibold">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upgrade options (show for Trial and Starter) */}
      {(isTrial || subscription?.plan === 'STARTER') && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-card-title">Upgrade Your Plan</h2>
          </div>
          <div className="card-body grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { plan: 'STARTER', name: 'Starter', price: 29, highlight: false },
              { plan: 'PRO', name: 'Pro', price: 59, highlight: true },
              { plan: 'ENTERPRISE', name: 'Enterprise', price: 99, highlight: false },
            ].map((p) => (
              <div
                key={p.plan}
                className={cn(
                  'rounded-card p-5 border-2 transition-all',
                  p.highlight ? 'border-brand bg-brand-light' : 'border-border hover:border-brand/50'
                )}
              >
                {p.highlight && (
                  <span className="chip bg-brand text-white text-[10px] mb-2">Most Popular</span>
                )}
                <p className="text-lg font-extrabold text-primary">{p.name}</p>
                <p className="text-2xl font-extrabold text-primary mt-1">
                  ${p.price}<span className="text-sm font-normal text-muted">/mo</span>
                </p>
                <Button
                  className={cn('w-full mt-4', !p.highlight && 'bg-subtle text-primary hover:bg-border')}
                  variant={p.highlight ? 'primary' : 'secondary'}
                  onClick={() => checkoutMutation.mutate(p.plan)}
                  loading={checkoutMutation.isPending}
                  disabled={subscription?.plan === p.plan}
                >
                  {subscription?.plan === p.plan ? 'Current Plan' : `Upgrade to ${p.name}`}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice history */}
      {invoices && invoices.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-card-title">Invoice History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Date', 'Period', 'Amount', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-[#f8fafc] hover:bg-subtle">
                    <td className="px-4 py-3 text-sm font-semibold">{formatDate(inv.date)}</td>
                    <td className="px-4 py-3 text-sm text-muted">{inv.period}</td>
                    <td className="px-4 py-3 text-sm font-bold">{formatCurrency(inv.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('chip', inv.status === 'paid' ? 'bg-brand-light text-brand' : 'bg-danger-light text-danger')}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {inv.pdfUrl && (
                        <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-dark">
                          <Download className="w-3 h-3" /> PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
