'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { StatusChip } from '@/components/ui/StatusChip';
import { formatTime, formatDate, timeAgo, CHANNEL_COLORS } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { Calendar, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import type { Appointment, Message } from '@/types';

export default function StaffDashboardPage() {
  const { user } = useStore();

  const { data: todayAppts, isLoading: loadingAppts } = useQuery({
    queryKey: ['staff-appointments', 'today'],
    queryFn: () => api.get<{ data: Appointment[] }>('/api/appointments?filter=today'),
  });

  const { data: unreadMessages } = useQuery({
    queryKey: ['staff-messages', 'unread'],
    queryFn: () => api.get<Message[]>('/api/messages?unread=true&limit=5'),
  });

  const unreadCount = unreadMessages?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-muted mt-0.5">Staff Dashboard — {user?.clinicName}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 border-l-4 border-l-brand">
          <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">Today&apos;s Appointments</p>
          <p className="text-stat text-primary">{todayAppts?.data?.length ?? 0}</p>
        </div>
        <div className="card p-5 border-l-4 border-l-blue">
          <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">Unread Messages</p>
          <p className="text-stat text-primary">{unreadCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-card-title">Today&apos;s Appointments</h2>
            <Link href="/staff/appointments" className="text-xs font-bold text-brand">View all →</Link>
          </div>
          <div className="card-body p-0">
            {loadingAppts ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-[18px] py-3">
                  <div className="skeleton w-9 h-9 rounded-[10px]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-32" />
                    <div className="skeleton h-3 w-20" />
                  </div>
                </div>
              ))
            ) : todayAppts?.data?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Calendar className="w-8 h-8 text-faint mb-2" />
                <p className="text-sm text-muted font-semibold">No appointments today</p>
              </div>
            ) : (
              todayAppts?.data?.slice(0, 8).map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center gap-3 px-[18px] py-3 hover:bg-subtle border-b border-[#f8fafc] last:border-0"
                >
                  <Avatar name={appt.patient?.fullName ?? '?'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary truncate">{appt.patient?.fullName}</p>
                    <p className="text-xs text-muted">{appt.treatment}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-primary">{formatTime(appt.dateTime)}</p>
                    <StatusChip status={appt.status} className="text-[10px] mt-0.5" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent unread messages */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-card-title">Unread Messages</h2>
            <Link href="/staff/messages" className="text-xs font-bold text-brand">View all →</Link>
          </div>
          <div className="card-body p-0">
            {unreadMessages?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <MessageSquare className="w-8 h-8 text-faint mb-2" />
                <p className="text-sm text-muted font-semibold">No unread messages</p>
              </div>
            ) : (
              unreadMessages?.map((msg) => (
                <Link
                  key={msg.id}
                  href="/staff/messages"
                  className="flex items-start gap-3 px-[18px] py-3 hover:bg-subtle border-b border-[#f8fafc] last:border-0"
                >
                  <div
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: CHANNEL_COLORS[msg.channel] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary truncate">
                      {msg.patient?.fullName ?? msg.fromNumber}
                    </p>
                    <p className="text-xs text-muted truncate">{msg.body}</p>
                  </div>
                  <p className="text-[11px] text-faint flex-shrink-0">{timeAgo(msg.createdAt)}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
