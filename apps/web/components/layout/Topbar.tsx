'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn, timeAgo } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { Menu, Bell, LogOut, X, CheckCheck } from 'lucide-react';
import type { Notification } from '@/types';

export function Topbar({ title }: { title?: string }) {
  const router = useRouter();
  const { user, toggleSidebar, notifications, unreadCount, markAllRead, clearAuth } = useStore();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await api.post('/api/auth/logout', {}).catch(() => null);
    clearAuth();
    router.push('/login');
  };

  const handleMarkAllRead = async () => {
    await api.patch('/api/notifications/read-all', {}).catch(() => null);
    markAllRead();
  };

  const dotColor: Record<string, string> = {
    teal: 'bg-brand', blue: 'bg-blue-500', red: 'bg-danger', amber: 'bg-amber-400',
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-border px-4 md:px-6 h-14 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-btn hover:bg-subtle"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5 text-muted" />
        </button>
        {title && <p className="text-[15px] font-bold text-primary">{title}</p>}
      </div>

      <div className="flex items-center gap-2">
        {/* Bell */}
        <div className="relative">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-btn hover:bg-subtle relative"
            onClick={() => setOpen((p) => !p)}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
          >
            <Bell className="w-5 h-5 text-muted" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-11 w-80 bg-white rounded-card shadow-modal border border-border z-40 overflow-hidden animate-pop-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <p className="text-sm font-bold text-primary">Notifications</p>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs font-semibold text-brand flex items-center gap-1">
                        <CheckCheck className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                    <button onClick={() => setOpen(false)} aria-label="Close"><X className="w-4 h-4 text-muted" /></button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <p className="text-2xl mb-2">🎉</p>
                      <p className="text-sm font-semibold text-muted">You&apos;re all caught up!</p>
                    </div>
                  ) : (
                    notifications.map((n: Notification) => (
                      <div key={n.id} className={cn('flex gap-3 px-4 py-3 border-b border-[#f8fafc] hover:bg-subtle', !n.isRead && 'bg-brand-light/20')}>
                        <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', dotColor[n.color] ?? 'bg-brand')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-primary">{n.title}</p>
                          <p className="text-xs text-muted truncate mt-0.5">{n.body}</p>
                          <p className="text-[11px] text-faint mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User */}
        <div className="hidden sm:block text-right">
          <p className="text-xs font-bold text-primary leading-tight">{user?.name}</p>
          <p className="text-[11px] text-muted capitalize">{user?.role?.toLowerCase()}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-9 h-9 flex items-center justify-center rounded-btn hover:bg-subtle text-muted hover:text-danger"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
