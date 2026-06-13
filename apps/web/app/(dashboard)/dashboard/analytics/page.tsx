'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Calendar, Users, UserX } from 'lucide-react';
import type { AnalyticsOverview } from '@/types';

const COLORS = ['#00c896', '#3b82f6', '#f59e0b', '#7c3aed', '#ef4444'];

export default function AnalyticsPage() {
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get<AnalyticsOverview>('/api/analytics/overview'),
  });

  const { data: weeklyAppts, isLoading: loadingWeekly } = useQuery({
    queryKey: ['analytics', 'weekly'],
    queryFn: () => api.get<{ date: string; count: number }[]>('/api/analytics/weekly-appointments'),
  });

  const { data: monthlyRevenue, isLoading: loadingRevenue } = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => api.get<{ month: string; revenue: number }[]>('/api/analytics/monthly-revenue'),
  });

  const { data: channels } = useQuery({
    queryKey: ['analytics', 'channels'],
    queryFn: () => api.get<{ channel: string; count: number }[]>('/api/analytics/messages-by-channel'),
  });

  const { data: topTreatments } = useQuery({
    queryKey: ['analytics', 'treatments'],
    queryFn: () => api.get<{ treatment: string; count: number }[]>('/api/analytics/top-treatments'),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-page-title">Analytics</h1>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenue This Month"
          value={formatCurrency(overview?.revenue?.value ?? 0)}
          change={overview?.revenue?.change}
          icon={<DollarSign className="w-5 h-5" />}
          color="teal"
          loading={loadingOverview}
        />
        <StatCard
          title="Appointments"
          value={overview?.appointments?.value ?? 0}
          change={overview?.appointments?.change}
          icon={<Calendar className="w-5 h-5" />}
          color="blue"
          loading={loadingOverview}
        />
        <StatCard
          title="Patient Return Rate"
          value={`${overview?.returnRate?.value ?? 0}%`}
          icon={<Users className="w-5 h-5" />}
          color="amber"
          loading={loadingOverview}
        />
        <StatCard
          title="No-Show Rate"
          value={`${overview?.noShowRate?.value ?? 0}%`}
          change={overview?.noShowRate?.change}
          icon={<UserX className="w-5 h-5" />}
          color="red"
          loading={loadingOverview}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-card-title">Appointments — Last 7 Days</h2>
          </div>
          <div className="card-body">
            {loadingWeekly ? (
              <div className="skeleton h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyAppts ?? []}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="#00c896" radius={[6, 6, 0, 0]} name="Appointments" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-card-title">Messages by Channel</h2>
          </div>
          <div className="card-body flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={channels ?? []}
                  dataKey="count"
                  nameKey="channel"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  label={({ channel, percent }) => `${channel} ${(percent * 100).toFixed(0)}%`}
                >
                  {(channels ?? []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-card-title">Monthly Revenue — Last 6 Months</h2>
          </div>
          <div className="card-body">
            {loadingRevenue ? (
              <div className="skeleton h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyRevenue ?? []}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#00c896"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#00c896' }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-card-title">Top Treatments</h2>
          </div>
          <div className="card-body space-y-3">
            {(topTreatments ?? []).slice(0, 5).map((t, i) => {
              const maxCount = topTreatments?.[0]?.count ?? 1;
              const pct = Math.round((t.count / maxCount) * 100);
              return (
                <div key={t.treatment}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-primary">{t.treatment}</span>
                    <span className="text-xs font-bold text-muted">{t.count}</span>
                  </div>
                  <div className="h-2 bg-subtle rounded-full">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
