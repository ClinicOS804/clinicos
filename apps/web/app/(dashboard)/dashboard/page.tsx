'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { StatusChip } from '@/components/ui/StatusChip';
import { Avatar } from '@/components/ui/Avatar';
import { formatTime, formatDate, timeAgo, CHANNEL_COLORS } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import {
  Calendar, Bot, Star, UserX, Plus, Users,
  PhoneCall, MessageSquare, BarChart3, Megaphone,
} from 'lucide-react';
import Link from 'next/link';
import type { Appointment, Message, AILog, AnalyticsOverview } from '@/types';

export default function DashboardPage() {
  const { user } = useStore();

  const { data: todayAppts, isLoading: loadingAppts } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: () => api.get<{ data: Appointment[] }>('/api/appointments?filter=today'),
  });

  const { data: messages, isLoading: loadingMsgs } = useQuery({
    queryKey: ['messages', 'recent'],
    queryFn: () => api.get<Message[]>('/api/messages?limit=5'),
  });

  const { data: aiLogs, isLoading: loadingAI } = useQuery({
    queryKey: ['ai-logs', 'recent'],
    queryFn: () => api.get<AILog[]>('/api/ai/logs?limit=10'),
  });

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get<AnalyticsOverview>('/api/analytics/overview'),
  });

  const { data: aiStats } = useQuery({
    queryKey: ['ai-stats'],
    queryFn: () => api.get<{ callsHandled: number; appointmentsBooked: number }>('/api/ai/stats'),
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const QUICK_ACTIONS = [
    { href: '/dashboard/appointments?new=true', icon: Plus, label: 'New Appt', color: 'bg-brand-light text-brand' },
    { href: '/dashboard/patients?new=true', icon: Users, label: 'Add Patient', color: 'bg-blue-light text-blue' },
    { href: '/dashboard/ai', icon: PhoneCall, label: 'AI Call', color: 'bg-purple-light text-purple' },
    { href: '/dashboard/messages?broadcast=true', icon: Megaphone, label: 'Broadcast', color: 'bg-amber-light text-amber' },
    { href: '/dashboard/reviews', icon: Star, label: 'Reviews', color: 'bg-amber-light text-amber' },
    { href: '/dashboard/analytics', icon: BarChart3, label: 'Reports', color: 'bg-brand-light text-brand' },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-page-title text-primary">
          {greeting()}, Dr. {user?.name?.split(' ').pop()} 👋
        </h1>
        <p className="text-sm text-muted mt-0.5">Here&apos;s what&apos;s happening at your clinic today.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Appointments"
          value={todayAppts?.data?.length ?? 0}
          icon={<Calendar className="w-5 h-5" />}
          color="teal"
          loading={loadingAppts}
        />
        <StatCard
          title="AI Messages Today"
          value={aiStats?.appointmentsBooked ?? 0}
          icon={<Bot className="w-5 h-5" />}
          color="blue"
          loading={loadingAnalytics}
        />
        <StatCard
          title="Google Rating"
          value="4.8"
          subtitle="18 reviews"
          icon={<Star className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="No-Shows This Week"
          value={`${analytics?.noShowRate?.value ?? 0}%`}
          change={analytics?.noShowRate?.change}
          icon={<UserX className="w-5 h-5" />}
          color="red"
          loading={loadingAnalytics}
        />
      </div>

      {/* Main row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-card-title">Today&apos;s Appointments</h2>
            <Link href="/dashboard/appointments" className="text-xs font-bold text-brand hover:text-brand-dark">
              View all →
            </Link>
          </div>
          <div className="card-body space-y-2 p-0">
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
              <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                <Calendar className="w-10 h-10 text-faint mb-3" />
                <p className="text-sm font-semibold text-muted">No appointments today</p>
                <Link href="/dashboard/appointments?new=true" className="text-xs text-brand font-bold mt-2">
                  Book one now →
                </Link>
              </div>
            ) : (
              todayAppts?.data?.slice(0, 6).map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center gap-3 px-[18px] py-3 hover:bg-subtle border-b border-[#f8fafc] last:border-0 transition-colors"
                >
                  <Avatar name={appt.patient?.fullName ?? '?'} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary truncate">{appt.patient?.fullName}</p>
                    <p className="text-xs text-muted truncate">{appt.treatment}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-primary">{formatTime(appt.dateTime)}</p>
                    <StatusChip status={appt.status} className="text-[10px] mt-0.5" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Unified Inbox Preview */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-card-title">Recent Messages</h2>
            <Link href="/dashboard/messages" className="text-xs font-bold text-brand hover:text-brand-dark">
              View all →
            </Link>
          </div>
          <div className="card-body p-0">
            {loadingMsgs ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-[18px] py-3">
                  <div className="skeleton w-9 h-9 rounded-[10px]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-24" />
                    <div className="skeleton h-3 w-40" />
                  </div>
                </div>
              ))
            ) : messages?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <MessageSquare className="w-10 h-10 text-faint mb-3" />
                <p className="text-sm font-semibold text-muted">No messages yet</p>
              </div>
            ) : (
              messages?.slice(0, 5).map((msg) => (
                <div
                  key={msg.id}
                  className="flex items-start gap-3 px-[18px] py-3 hover:bg-subtle border-b border-[#f8fafc] last:border-0 transition-colors"
                >
                  <div
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: CHANNEL_COLORS[msg.channel] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-primary truncate">
                        {msg.patient?.fullName ?? msg.fromNumber}
                      </p>
                      <p className="text-[11px] text-faint flex-shrink-0">{timeAgo(msg.createdAt)}</p>
                    </div>
                    <p className="text-xs text-muted truncate">{msg.body}</p>
                    {!msg.isRead && msg.direction === 'INBOUND' && (
                      <span className="text-[10px] font-bold text-brand">● Unread</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* AI Activity Feed */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-card-title">AI Activity</h2>
          </div>
          <div className="card-body space-y-3 p-0 max-h-64 overflow-y-auto">
            {loadingAI ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 items-start px-[18px] py-2">
                  <div className="skeleton w-2 h-2 rounded-full mt-1.5" />
                  <div className="flex-1 space-y-1">
                    <div className="skeleton h-3 w-48" />
                    <div className="skeleton h-3 w-20" />
                  </div>
                </div>
              ))
            ) : aiLogs?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bot className="w-10 h-10 text-faint mb-3" />
                <p className="text-sm text-muted font-semibold">No AI activity yet</p>
              </div>
            ) : (
              aiLogs?.map((log) => (
                <div key={log.id} className="flex gap-3 items-start px-[18px] py-2 border-b border-[#f8fafc] last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${log.success ? 'bg-brand' : 'bg-danger'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-primary">{log.details}</p>
                    <p className="text-[11px] text-faint">{timeAgo(log.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-card-title">Quick Actions</h2>
          </div>
          <div className="card-body grid grid-cols-3 gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-2 p-3 rounded-btn hover:bg-subtle transition-colors group"
              >
                <div className={`w-10 h-10 rounded-btn flex items-center justify-center ${action.color}`}>
                  <action.icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-muted group-hover:text-primary text-center leading-tight">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Reviews Widget */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-card-title">Google Reviews</h2>
            <Link href="/dashboard/reviews" className="text-xs font-bold text-brand hover:text-brand-dark">
              Manage →
            </Link>
          </div>
          <div className="card-body text-center">
            <div className="text-stat text-amber font-bold">4.8</div>
            <div className="flex justify-center gap-0.5 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-5 h-5"
                  fill={star <= 4 ? '#f59e0b' : 'none'}
                  stroke="#f59e0b"
                />
              ))}
            </div>
            <p className="text-xs text-muted font-semibold">18 reviews</p>
            <Link
              href="/dashboard/reviews"
              className="btn-primary mt-4 w-full justify-center text-xs"
            >
              Request Reviews
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
