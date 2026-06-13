import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | ClinicOS AI',
  description: 'Simple, transparent pricing. Start free for 14 days — no credit card required.',
  robots: { index: true, follow: true },
};

const PLANS = [
  {
    id: 'STARTER', name: 'Starter', price: 29, color: 'border-blue-200',
    features: ['Full clinic dashboard', '500 patients', '1,000 AI messages/month', 'WhatsApp AI receptionist', 'SMS appointment reminders', 'Online patient booking page', '1 staff account'],
  },
  {
    id: 'PRO', name: 'Pro', price: 59, highlight: true, color: 'border-brand',
    features: ['Everything in Starter', '2,000 patients', '5,000 AI messages/month', 'Voice AI phone calls', 'Advanced analytics dashboard', 'Google review management', '3 staff accounts'],
  },
  {
    id: 'ENTERPRISE', name: 'Enterprise', price: 99, color: 'border-purple-200',
    features: ['Everything in Pro', 'Unlimited patients', 'Unlimited AI messages', '10 staff accounts', 'Priority email support', 'Custom AI personality & language'],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#00c896] rounded-[8px] flex items-center justify-center">
            <span className="text-white font-extrabold">C</span>
          </div>
          <span className="font-extrabold text-gray-900">ClinicOS AI</span>
        </Link>
        <Link href="/login" className="text-sm font-bold text-gray-500 hover:text-gray-900">Sign In</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Simple, transparent pricing</h1>
          <p className="text-lg text-gray-500">14-day free trial on all plans. No credit card required.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div key={plan.id}
              className={`relative rounded-2xl p-8 border-2 ${plan.highlight ? 'border-[#00c896] bg-[#e6faf5] shadow-xl' : `${plan.color} bg-white`}`}>
              {plan.highlight && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#00c896] text-white text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h2 className="text-xl font-extrabold text-gray-900">{plan.name}</h2>
              <div className="mt-3 mb-6">
                <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                <span className="text-gray-500 ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-[#00c896] font-bold flex-shrink-0 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register"
                className={`block text-center py-3 rounded-xl font-bold transition-colors ${
                  plan.highlight
                    ? 'bg-[#00c896] text-white hover:bg-[#00b386]'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}>
                Start Free Trial
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-10">
          Questions? <a href="mailto:support@clinicos.workee.online" className="text-[#00c896] font-bold">support@clinicos.workee.online</a>
        </p>
      </div>
    </div>
  );
}
