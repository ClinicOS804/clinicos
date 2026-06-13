import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { template: '%s | ClinicOS AI', default: 'ClinicOS AI' },
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand rounded-[14px] mb-4 shadow-lg">
            <span className="text-white font-extrabold text-2xl">C</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            ClinicOS <span className="text-brand">AI</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Smart Clinic Management</p>
        </div>
        {children}
      </div>
    </div>
  );
}
