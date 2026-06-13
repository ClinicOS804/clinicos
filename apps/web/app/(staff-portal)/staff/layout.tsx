'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { Topbar } from '@/components/layout/Topbar';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Calendar, Users, MessageSquare, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

const STAFF_NAV = [
  { href: '/staff',              icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/staff/appointments', icon: Calendar,        label: 'Appointments' },
  { href: '/staff/patients',     icon: Users,           label: 'Patients' },
  { href: '/staff/messages',     icon: MessageSquare,   label: 'Messages' },
  { href: '/staff/profile',      icon: User,            label: 'My Profile' },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!token || !user) { router.replace('/login'); return; }
    if (user.role === 'DOCTOR') { router.replace('/dashboard'); return; }
  }, [user, token, router]);

  if (!user || user.role !== 'STAFF') return null;

  const active = (href: string) =>
    href === '/staff' ? pathname === '/staff' : pathname.startsWith(href);

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-white/10">
        <p className="text-sm font-bold text-white truncate">{user.clinicName}</p>
        <p className="text-xs text-slate-400 mt-0.5">Staff Portal</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {STAFF_NAV.map((item) => (
          <Link key={item.href} href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn('nav-item', active(item.href) && 'nav-item-active')}>
            <item.icon className="w-4 h-4" />{item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <p className="text-xs font-semibold text-white">{user.name}</p>
        <p className="text-xs text-slate-400 capitalize">{user.staffRole?.toLowerCase()}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-app">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-[220px] bg-sidebar z-30">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-[260px] bg-sidebar z-50 md:hidden">
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <Sidebar />
          </aside>
        </>
      )}

      <div className="md:ml-[220px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white border-b border-border px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5 text-muted" />
            </button>
            <span className="text-sm font-bold text-primary">Staff Portal</span>
          </div>
          <p className="text-xs text-muted font-semibold hidden sm:block">{user.name}</p>
        </header>
        <main className="flex-1 p-4 md:p-6 max-w-[1400px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
