'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { Avatar } from '@/components/ui/Avatar';
import {
  LayoutDashboard, Calendar, Users, MessageSquare, Bot,
  BarChart3, Star, UserCog, CreditCard, Settings, X, ChevronRight,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',              icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/appointments', icon: Calendar,        label: 'Appointments' },
  { href: '/dashboard/patients',     icon: Users,           label: 'Patients' },
  { href: '/dashboard/messages',     icon: MessageSquare,   label: 'Messages' },
  { href: '/dashboard/ai',           icon: Bot,             label: 'AI Receptionist' },
  { href: '/dashboard/analytics',    icon: BarChart3,       label: 'Analytics' },
  { href: '/dashboard/reviews',      icon: Star,            label: 'Reviews' },
  { href: '/dashboard/staff',        icon: UserCog,         label: 'Staff' },
  { href: '/dashboard/billing',      icon: CreditCard,      label: 'Billing' },
  { href: '/dashboard/settings',     icon: Settings,        label: 'Settings' },
];

export function DoctorSidebar() {
  const pathname = usePathname();
  const { user, sidebarOpen, setSidebarOpen } = useStore();

  const active = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const NavLinks = () => (
    <>
      {NAV.map((item) => {
        const isActive = active(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn('nav-item', isActive && 'nav-item-active')}
            aria-current={isActive ? 'page' : undefined}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
          </Link>
        );
      })}
    </>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-brand rounded-btn flex items-center justify-center flex-shrink-0">
          <span className="text-white font-extrabold text-base">C</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">ClinicOS AI</p>
          <p className="text-xs text-slate-400 truncate">{user?.clinicName}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        <NavLinks />
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 p-2 rounded-btn hover:bg-white/10 transition-colors">
          <Avatar name={user?.name ?? 'U'} imageUrl={user?.logoUrl} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.plan?.toLowerCase()} plan</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: fixed full sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-[220px] bg-sidebar z-30">
        <SidebarContent />
      </aside>

      {/* Tablet: icon rail */}
      <aside className="hidden md:flex lg:hidden flex-col fixed left-0 top-0 h-full w-16 bg-sidebar z-30">
        <div className="flex flex-col items-center py-4 gap-1">
          <div className="w-9 h-9 bg-brand rounded-btn flex items-center justify-center mb-4">
            <span className="text-white font-extrabold">C</span>
          </div>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={cn(
                'w-10 h-10 rounded-btn flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all',
                active(item.href) && 'bg-brand/20 text-white'
              )}
            >
              <item.icon className="w-5 h-5" />
            </Link>
          ))}
        </div>
      </aside>

      {/* Mobile: overlay drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-full w-[280px] bg-sidebar z-50 md:hidden animate-slide-in-right">
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
