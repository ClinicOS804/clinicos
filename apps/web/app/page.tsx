import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ClinicOS AI — AI-Powered Clinic Management',
  description:
    'ClinicOS AI is a smart clinic management platform with a 24/7 AI receptionist that books appointments, sends WhatsApp reminders, and manages your clinic — automatically.',
  metadataBase: new URL('https://clinicos.workee.online'),
  openGraph: {
    title: 'ClinicOS AI — Smart Clinic Management',
    description: 'AI receptionist, appointment booking, WhatsApp automation & analytics for modern clinics.',
    url: 'https://clinicos.workee.online',
    siteName: 'ClinicOS AI',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const FEATURES = [
  { icon: '🤖', title: 'AI WhatsApp Receptionist', desc: 'Books appointments, answers FAQs, and sends confirmations in English, Arabic, or Urdu — 24/7, automatically.' },
  { icon: '📅', title: 'Smart Appointment Booking', desc: 'Patients book online from your personal link. AI checks live availability and confirms instantly.' },
  { icon: '💬', title: 'Automated Reminders', desc: '24h and 2h WhatsApp reminders sent automatically. Reduce no-shows by up to 60%.' },
  { icon: '⭐', title: 'Google Review Automation', desc: 'Sends review requests after appointments and helps you build your Google rating on autopilot.' },
  { icon: '📊', title: 'Clinic Analytics', desc: 'Revenue, return rates, no-show trends, top treatments — all in one clear dashboard.' },
  { icon: '🔒', title: 'Fully Isolated & Secure', desc: 'Every clinic is 100% isolated. No doctor can ever see another clinic\'s patient data.' },
];

const PLANS = [
  {
    id: 'STARTER', name: 'Starter', price: 29, highlight: false,
    features: ['Full dashboard', '500 patients', '1,000 AI messages/mo', 'WhatsApp AI', 'SMS reminders', 'Online booking', '1 staff account'],
  },
  {
    id: 'PRO', name: 'Pro', price: 59, highlight: true, badge: 'Most Popular',
    features: ['Everything in Starter', '2,000 patients', '5,000 AI messages/mo', 'Voice AI calls', 'Advanced analytics', 'Review management', '3 staff accounts'],
  },
  {
    id: 'ENTERPRISE', name: 'Enterprise', price: 99, highlight: false,
    features: ['Everything in Pro', 'Unlimited patients & messages', '10 staff accounts', 'Priority support', 'Custom AI personality'],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9] sticky top-0 bg-white/95 backdrop-blur z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#00c896] rounded-[10px] flex items-center justify-center shadow-sm">
            <span className="text-white font-extrabold text-base">C</span>
          </div>
          <span className="font-extrabold text-[#1e293b] text-lg tracking-tight">ClinicOS <span className="text-[#00c896]">AI</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-bold text-[#64748b] hover:text-[#1e293b] transition-colors hidden sm:block">
            Sign In
          </Link>
          <Link
            href="/register"
            className="bg-[#00c896] text-white px-4 py-2 rounded-[10px] text-sm font-bold hover:bg-[#00b386] transition-colors shadow-sm"
          >
            Start Free Trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 py-20 max-w-4xl mx-auto">
        <span className="inline-block bg-[#e6faf5] text-[#00c896] text-xs font-bold px-4 py-1.5 rounded-full mb-5">
          🚀 14-Day Free Trial · No Credit Card Required
        </span>
        <h1 className="text-4xl md:text-[52px] font-extrabold text-[#1e293b] leading-tight mb-5">
          Your Clinic Runs Itself.<br />
          <span className="text-[#00c896]">ClinicOS AI</span> Handles the Rest.
        </h1>
        <p className="text-lg text-[#64748b] max-w-2xl mx-auto mb-8 leading-relaxed">
          AI receptionist that books appointments via WhatsApp, sends reminders, requests Google reviews, 
          and manages your entire clinic — while you focus on patients.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="bg-[#00c896] text-white px-8 py-4 rounded-[10px] font-bold text-base hover:bg-[#00b386] transition-all hover:shadow-lg inline-block"
          >
            Get Started Free →
          </Link>
          <Link
            href="/book/dr-ahmed-rahman"
            className="bg-[#f0f4f8] text-[#1e293b] px-8 py-4 rounded-[10px] font-bold text-base hover:bg-[#e2e8f0] transition-colors inline-block"
          >
            View Demo Booking Page
          </Link>
        </div>
        <p className="text-xs text-[#94a3b8] mt-4">
          Questions? <a href="mailto:support@clinicos.workee.online" className="text-[#00c896] font-bold hover:underline">support@clinicos.workee.online</a>
        </p>
      </section>

      {/* Features */}
      <section className="bg-[#f8fafc] py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#1e293b] text-center mb-2">
            Everything your clinic needs
          </h2>
          <p className="text-[#64748b] text-center mb-10">One platform. Zero chaos.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-[14px] p-6 border border-[#e2e8f0] hover:border-[#00c896]/30 hover:shadow-md transition-all">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="text-sm font-bold text-[#1e293b] mt-3 mb-1">{f.title}</h3>
                <p className="text-sm text-[#64748b] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6" id="pricing">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#1e293b] text-center mb-2">Simple, transparent pricing</h2>
          <p className="text-[#64748b] text-center mb-10">Start free for 14 days. Upgrade when you&apos;re ready.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-[18px] p-6 border-2 transition-all ${
                  plan.highlight
                    ? 'border-[#00c896] bg-[#e6faf5] shadow-lg'
                    : 'border-[#e2e8f0] bg-white hover:border-[#00c896]/40'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00c896] text-white text-[11px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </span>
                )}
                <p className="text-xl font-extrabold text-[#1e293b]">{plan.name}</p>
                <p className="text-3xl font-extrabold text-[#1e293b] mt-1">
                  ${plan.price}<span className="text-sm font-normal text-[#64748b]">/month</span>
                </p>
                <ul className="mt-4 space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#64748b]">
                      <span className="text-[#00c896] font-bold mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-3 rounded-[10px] text-sm font-bold transition-colors ${
                    plan.highlight
                      ? 'bg-[#00c896] text-white hover:bg-[#00b386]'
                      : 'bg-[#f0f4f8] text-[#1e293b] hover:bg-[#e2e8f0]'
                  }`}
                >
                  Start Free Trial →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-[#1e293b] py-16 px-6 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-3">Ready to automate your clinic?</h2>
        <p className="text-[#94a3b8] mb-6 max-w-xl mx-auto">
          Join clinics already using ClinicOS AI to save hours every week and never miss a patient message.
        </p>
        <Link
          href="/register"
          className="bg-[#00c896] text-white px-8 py-4 rounded-[10px] font-bold text-base hover:bg-[#00b386] transition-all inline-block"
        >
          Start Free — No Credit Card →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e2e8f0] px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#00c896] rounded-[8px] flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">C</span>
            </div>
            <span className="font-bold text-[#1e293b]">ClinicOS AI</span>
          </div>
          <p className="text-sm text-[#94a3b8]">
            © {new Date().getFullYear()} ClinicOS AI · 
            <a href="mailto:support@clinicos.workee.online" className="hover:text-[#00c896] ml-1">
              support@clinicos.workee.online
            </a>
          </p>
          <div className="flex gap-4 text-sm text-[#94a3b8]">
            <Link href="/login" className="hover:text-[#1e293b]">Sign In</Link>
            <Link href="/register" className="hover:text-[#1e293b]">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
