'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DoctorSidebar } from '@/components/layout/DoctorSidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useStore } from '@/store/useStore';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import type { Notification } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token, setNotifications, setUnreadCount } = useStore();

  useSocket();

  useEffect(() => {
    if (!token || !user) { router.replace('/login'); return; }
    if (user.role === 'STAFF') { router.replace('/staff'); return; }
    if (user.role === 'SUPERADMIN') { router.replace('/superadmin'); return; }
  }, [user, token, router]);

  useEffect(() => {
    if (!token) return;
    api.get<Notification[]>('/api/notifications').then((n) => {
      setNotifications(n);
      setUnreadCount(n.filter((x) => !x.isRead).length);
    }).catch(() => null);
  }, [token, setNotifications, setUnreadCount]);

  if (!user || user.role !== 'DOCTOR') return null;

  return (
    <div className="min-h-screen bg-app">
      <DoctorSidebar />
      <div className="lg:ml-[220px] md:ml-16 ml-0 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
