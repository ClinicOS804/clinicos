'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Check, Zap } from 'lucide-react';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: 29,
    highlight: false,
    features: [
      'Full clinic dashboard',
      '500 patients',
      '1,000 AI messages/month',
      'WhatsApp AI receptionist',
      'SMS appointment reminders',
      'Online patient booking',
      '1 staff account',
    ],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 59,
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Everything in Starter',
      '2,000 patients',
      '5,000 AI messages/month',
      'Voice AI phone calls',
      'Advanced analytics',
      'Google review management',
      '3 staff accounts',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 99,
    highlight: false,
    features: [
      'Everything in Pro',
      'Unlimited patients',
      'Unlimited AI messages',
      '10 staff accounts',
      'Priority support',
      'Custom AI personality',
      'White-glove onboarding',
    ],
  },
];

export default function PlanSelectionPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const checkoutMutation = useMutation({
    mutationFn: (plan: string) =>
      api.post<{ url: string }>('/api/billing/checkout', { plan }),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: () => toast.error('Failed to start checkout. Please try again.'),
  });

  const handleContinue = () => {
    if (selected) {
      checkoutMutation.mutate(selected);
    } else {
      // Skip to dashboard on trial
      router.push('/dashboard');
    }
  };

  return (
    <div className="bg-white rounded-[18px] shadow-modal p-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {['Account', 'Clinic', 'Hours', 'Plan'].map((step, i) => (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
              ${i < 3 ? 'bg-brand text-white' : 'bg-brand text-white'}`}>
              {i < 3 ? '✓' : '4'}
            </div>
            {i < 3 && <div className="flex-1 h-0.5 bg-brand" />}
          </div>
        ))}
      </div>

      <h2 className="text-xl font-extrabold text-primary mb-1">Choose your plan</h2>
      <p className="text-sm text-muted mb-5">
        You&apos;re on a free trial. Upgrade now for full access, or start for free and upgrade later.
      </p>

      <div className="space-y-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            className={cn(
              'relative border-2 rounded-[14px] p-4 cursor-pointer transition-all',
              selected === plan.id
                ? 'border-brand bg-brand-light/30'
                : plan.highlight
                  ? 'border-brand/40 bg-subtle'
                  : 'border-border hover:border-brand/40'
            )}
          >
            {plan.badge && (
              <span className="absolute -top-2.5 left-4 chip bg-brand text-white text-[10px]">
                {plan.badge}
              </span>
            )}

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  selected === plan.id ? 'border-brand bg-brand' : 'border-border'
                )}>
                  {selected === plan.id && <Check className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{plan.name}</p>
                  <p className="text-xs text-muted">{plan.features.slice(0, 2).join(' · ')}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-extrabold text-primary">${plan.price}</p>
                <p className="text-xs text-muted">/month</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <Button
          className="w-full"
          size="lg"
          onClick={handleContinue}
          loading={checkoutMutation.isPending}
        >
          <Zap className="w-4 h-4" />
          {selected ? `Subscribe to ${PLANS.find((p) => p.id === selected)?.name}` : 'Continue to Dashboard'}
        </Button>

        {selected && (
          <button
            onClick={() => { setSelected(null); router.push('/dashboard'); }}
            className="w-full text-xs font-semibold text-muted hover:text-primary py-2"
          >
            Skip for now — continue with free trial
          </button>
        )}

        <p className="text-xs text-center text-muted">
          🔒 Secure payment via Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
