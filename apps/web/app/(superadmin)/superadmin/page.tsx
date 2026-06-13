'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import { Building2, Users, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface PlatformStats {
  totalClinics: number;
  activeClinics: number;
  totalPatients: number;
  totalAppointments: number;
  newThisMonth: number;
  cancelled: number;
  mrr: number;
  recentSignups: {
    id: string;
    name: string;
    ownerName: string;
    email: string;
    plan: string;
    planStatus: string;
    createdAt: string;
    specialty?: string;
  }[];
}

const PLAN_COLOR: Record<string, string> = {
  TRIAL:      'bg-subtle text-muted',
  STARTER:    'bg-blue-light text-blue',
  PRO:        'bg-brand-light text-brand',
  ENTERPRISE: 'bg-purple-light text-purple',
};

export default function SuperAdminOverviewPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<PlatformStats>('/api/superadmin/stats'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title">Platform Overview</h1>
        <p className="text-sm text-muted mt-0.5">MediCore AI — Super Admin Dashboard</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clinics"
          value={stats?.totalClinics ?? 0}
          subtitle={`${stats?.activeClinics ?? 0} active`}
          icon={<Building2 className="w-5 h-5" />}
          color="teal"
          loading={isLoading}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.mrr ?? 0)}
          subtitle="MRR estimate"
          icon={<DollarSign className="w-5 h-5" />}
          color="blue"
          loading={isLoading}
        />
        <StatCard
          title="Total Patients"
          value={(stats?.totalPatients ?? 0).toLocaleString()}
          icon={<Users className="w-5 h-5" />}
          color="purple"
          loading={isLoading}
        />
        <StatCard
          title="New This Month"
          value={stats?.newThisMonth ?? 0}
          subtitle={`${stats?.cancelled ?? 0} cancelled`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="amber"
          loading={isLoading}
        />
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-card-title">Recent Signups</h2>
          <Link href="/superadmin/clinics" className="text-xs font-bold text-brand hover:text-brand-dark">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Clinic', 'Doctor', 'Specialty', 'Plan', 'Status', 'Joined'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="skeleton h-4 w-full rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                : stats?.recentSignups?.map((clinic) => (
                    <tr key={clinic.id} className="border-b border-[#f8fafc] hover:bg-subtle">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={clinic.name} size="sm" />
                          <Link
                            href={`/superadmin/clinics/${clinic.id}`}
                            className="text-sm font-bold text-primary hover:text-brand"
                          >
                            {clinic.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">{clinic.ownerName}</td>
                      <td className="px-4 py-3 text-sm text-muted capitalize">{clinic.specialty ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('chip text-xs', PLAN_COLOR[clinic.plan] ?? 'bg-subtle text-muted')}>
                          {clinic.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'chip text-xs',
                          clinic.planStatus === 'ACTIVE' ? 'bg-brand-light text-brand' :
                          clinic.planStatus === 'TRIALING' ? 'bg-amber-light text-amber' :
                          'bg-danger-light text-danger'
                        )}>
                          {clinic.planStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">{formatDate(clinic.createdAt)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
