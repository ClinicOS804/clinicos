'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Building2, DollarSign, Megaphone, LogOut, ShieldCheck } from 'lucide-react';

const NAV = [
  { href: '/superadmin',               icon: LayoutDashboard, label: 'Overview' },
  { href: '/superadmin/clinics',       icon: Building2,       label: 'Clinics' },
  { href: '/superadmin/revenue',       icon: DollarSign,      label: 'Revenue' },
  { href: '/superadmin/announcements', icon: Megaphone,       label: 'Announcements' },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, token, clearAuth } = useStore();

  const isLogin = pathname === '/superadmin/login';

  useEffect(() => {
    if (isLogin) return;
    if (!token || !user) { router.replace('/superadmin/login'); return; }
    if (user.role !== 'SUPERADMIN') { router.replace('/login'); return; }
  }, [user, token, router, isLogin]);

  if (isLogin) return <>{children}</>;
  if (!user || user.role !== 'SUPERADMIN') return null;

  const active = (href: string) =>
    href === '/superadmin' ? pathname === '/superadmin' : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-app flex">
      <aside className="w-[220px] bg-sidebar flex-shrink-0 flex flex-col fixed h-full z-30">
        <div className="px-4 py-5 border-b border-white/10 flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-brand" />
          <div>
            <p className="text-sm font-bold text-white">ClinicOS AI</p>
            <p className="text-xs text-slate-400">Super Admin</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className={cn('nav-item', active(item.href) && 'nav-item-active')}>
              <item.icon className="w-4 h-4" />{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <p className="text-xs font-semibold text-white px-2 mb-2">{user.email}</p>
          <button
            onClick={() => { clearAuth(); router.push('/superadmin/login'); }}
            className="nav-item w-full text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>
      <main className="ml-[220px] flex-1 p-6 overflow-auto max-w-[1400px]">
        {children}
      </main>
    </div>
  );
}
