'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate, cn } from '@/lib/utils';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ClinicRow {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  specialty?: string;
  plan: string;
  planStatus: string;
  isActive: boolean;
  createdAt: string;
  _count: { patients: number; appointments: number };
}

const PLAN_COLOR: Record<string, string> = {
  TRIAL:      'bg-subtle text-muted',
  STARTER:    'bg-blue-light text-blue',
  PRO:        'bg-brand-light text-brand',
  ENTERPRISE: 'bg-purple-light text-purple',
};

export default function AdminClinicsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as unknown as { _sa?: number })._sa);
    (window as unknown as { _sa?: number })._sa = window.setTimeout(() => setDebouncedSearch(val), 300);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-clinics', debouncedSearch],
    queryFn: () =>
      api.get<{ data: ClinicRow[]; total: number }>(
        `/api/superadmin/clinics?search=${encodeURIComponent(debouncedSearch)}&limit=50`
      ),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/api/superadmin/clinics/${id}/status`, { isActive }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-clinics'] });
      toast.success(`Clinic ${vars.isActive ? 'activated' : 'suspended'}`);
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-page-title">All Clinics</h1>
          <p className="text-sm text-muted">{data?.total ?? 0} total</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search by name, email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Clinic', 'Doctor', 'Plan', 'Status', 'Patients', 'Appts', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="skeleton h-4 w-full rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              : data?.data?.map((clinic) => (
                  <tr key={clinic.id} className="border-b border-[#f8fafc] hover:bg-subtle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={clinic.name} size="sm" />
                        <div>
                          <Link
                            href={`/superadmin/clinics/${clinic.id}`}
                            className="text-sm font-bold text-primary hover:text-brand"
                          >
                            {clinic.name}
                          </Link>
                          <p className="text-xs text-muted capitalize">{clinic.specialty}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">{clinic.ownerName}</td>
                    <td className="px-4 py-3">
                      <span className={cn('chip text-xs', PLAN_COLOR[clinic.plan] ?? 'bg-subtle')}>{clinic.plan}</span>
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
                    <td className="px-4 py-3 text-sm font-bold">{clinic._count.patients.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-muted">{clinic._count.appointments.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-muted">{formatDate(clinic.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => statusMutation.mutate({ id: clinic.id, isActive: !clinic.isActive })}
                        className={cn(
                          'flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-btn transition-colors',
                          clinic.isActive
                            ? 'text-danger hover:bg-danger-light'
                            : 'text-brand hover:bg-brand-light'
                        )}
                      >
                        {clinic.isActive
                          ? <><XCircle className="w-3.5 h-3.5" /> Suspend</>
                          : <><CheckCircle className="w-3.5 h-3.5" /> Activate</>
                        }
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
