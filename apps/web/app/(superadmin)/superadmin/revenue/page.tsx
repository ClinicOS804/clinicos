'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RevenueData {
  monthly: { month: string; estimatedRevenue: number }[];
  distribution: { plan: string; _count: { plan: number } }[];
}

const PLAN_COLORS: Record<string, string> = {
  TRIAL: '#94a3b8', STARTER: '#3b82f6', PRO: '#00c896', ENTERPRISE: '#7c3aed',
};
const PLAN_PRICES: Record<string, number> = { STARTER: 29, PRO: 59, ENTERPRISE: 99 };

export default function AdminRevenuePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: () => api.get<RevenueData>('/api/superadmin/revenue'),
  });

  const currentMonth = data?.monthly?.[data.monthly.length - 1];
  const prevMonth = data?.monthly?.[data.monthly.length - 2];
  const mrrChange = prevMonth?.estimatedRevenue
    ? Math.round(((currentMonth?.estimatedRevenue ?? 0) - prevMonth.estimatedRevenue) / prevMonth.estimatedRevenue * 100)
    : 0;

  const totalActiveSubs = data?.distribution
    ?.filter((d) => d.plan !== 'TRIAL')
    .reduce((sum, d) => sum + d._count.plan, 0) ?? 0;

  const mrr = data?.distribution
    ?.filter((d) => d.plan !== 'TRIAL')
    .reduce((sum, d) => sum + (PLAN_PRICES[d.plan] ?? 0) * d._count.plan, 0) ?? 0;

  const KPICard = ({ title, value, sub, change }: { title: string; value: string; sub?: string; change?: number }) => (
    <div className="card p-5 border-l-4 border-l-brand">
      <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">{title}</p>
      <p className="text-stat text-primary">{value}</p>
      {sub && <p className="text-xs text-muted mt-1 font-semibold">{sub}</p>}
      {change !== undefined && (
        <div className={cn('flex items-center gap-1 mt-2 text-xs font-bold', change >= 0 ? 'text-success' : 'text-danger')}>
          {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(change)}% vs last month
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-page-title">Revenue</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="MRR" value={formatCurrency(mrr)} change={mrrChange} />
        <KPICard title="ARR" value={formatCurrency(mrr * 12)} sub="Annualized" />
        <KPICard title="Paid Subscribers" value={String(totalActiveSubs)} sub="Active plans" />
        <KPICard
          title="ARPU"
          value={totalActiveSubs > 0 ? formatCurrency(mrr / totalActiveSubs) : '$0'}
          sub="Per user/month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header"><h2 className="text-card-title">Monthly Revenue — Last 12 Months</h2></div>
          <div className="card-body">
            {isLoading ? <div className="skeleton h-52 w-full" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.monthly ?? []}>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
                  <Bar dataKey="estimatedRevenue" fill="#00c896" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2 className="text-card-title">Plan Distribution</h2></div>
          <div className="card-body flex items-center gap-6">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={data?.distribution ?? []} dataKey="_count.plan" nameKey="plan"
                  cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                  {(data?.distribution ?? []).map((entry, i) => (
                    <Cell key={i} fill={PLAN_COLORS[entry.plan] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 flex-1">
              {(data?.distribution ?? []).map((entry) => (
                <div key={entry.plan} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PLAN_COLORS[entry.plan] ?? '#94a3b8' }} />
                  <span className="text-xs font-semibold text-primary">{entry.plan}</span>
                  <span className="text-xs text-muted ml-auto font-bold">{entry._count.plan} clinics</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
