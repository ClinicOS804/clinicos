'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatusChip } from '@/components/ui/StatusChip';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatTime, CHANNEL_COLORS, cn } from '@/lib/utils';
import { Plus, Search, Calendar, Phone, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { Appointment, AppointmentStatus } from '@/types';

const FILTER_TABS = [
  { label: 'All', value: '' },
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
] as const;

const STATUS_ACTIONS: { label: string; status: AppointmentStatus; icon: React.ElementType; color: string }[] = [
  { label: 'Confirm',   status: 'CONFIRMED',   icon: CheckCircle2, color: 'text-brand' },
  { label: 'Arrived',   status: 'ARRIVED',     icon: Clock,        color: 'text-blue' },
  { label: 'Complete',  status: 'COMPLETED',   icon: CheckCircle2, color: 'text-success' },
  { label: 'No Show',   status: 'NO_SHOW',     icon: XCircle,      color: 'text-danger' },
  { label: 'Cancel',    status: 'CANCELLED',   icon: XCircle,      color: 'text-danger' },
];

export default function AppointmentsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>('today');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', filter],
    queryFn: () => api.get<{ data: Appointment[]; total: number }>(
      `/api/appointments?filter=${filter}&limit=50`
    ),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api.patch(`/api/appointments/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment updated');
    },
    onError: () => toast.error('Failed to update appointment'),
  });

  const filtered = data?.data?.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.patient?.fullName?.toLowerCase().includes(q) ||
      a.treatment.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-page-title">Appointments</h1>
          <p className="text-sm text-muted mt-0.5">{data?.total ?? 0} total</p>
        </div>
        <Button>
          <Plus className="w-4 h-4" /> New Appointment
        </Button>
      </div>

      {/* Filters + search */}
      <div className="card card-body !p-3 flex flex-col sm:flex-row gap-3">
        {/* Tab filters */}
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 flex-shrink-0">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-btn text-xs font-bold whitespace-nowrap transition-all',
                filter === tab.value
                  ? 'bg-brand text-white'
                  : 'bg-subtle text-muted hover:bg-border'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
          <input
            type="search"
            placeholder="Search by patient or treatment..."
            className="input pl-9 h-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="card hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b border-border">
                {['Patient', 'Time', 'Treatment', 'Channel', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="skeleton h-4 w-full rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Calendar className="w-10 h-10 text-faint mx-auto mb-3" />
                    <p className="text-sm text-muted font-semibold">No appointments found</p>
                  </td>
                </tr>
              ) : (
                filtered?.map((appt) => (
                  <tr key={appt.id} className="border-b border-[#f8fafc] hover:bg-subtle transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={appt.patient?.fullName ?? '?'} size="sm" />
                        <div>
                          <p className="text-sm font-bold text-primary">{appt.patient?.fullName}</p>
                          <p className="text-xs text-muted">{appt.patient?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-primary">{formatTime(appt.dateTime)}</p>
                      <p className="text-xs text-muted">{formatDate(appt.dateTime)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-primary">{appt.treatment}</p>
                      {appt.fee && <p className="text-xs text-muted">${appt.fee}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: CHANNEL_COLORS[appt.channel] }}
                        />
                        <span className="text-xs font-semibold text-muted">{appt.channel.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip status={appt.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {STATUS_ACTIONS.filter((a) => a.status !== appt.status).slice(0, 2).map((action) => (
                          <button
                            key={action.status}
                            onClick={() => updateMutation.mutate({ id: appt.id, status: action.status })}
                            className={cn('text-xs font-bold px-2 py-1 rounded-btn hover:bg-subtle transition-colors', action.color)}
                            title={action.label}
                          >
                            {action.label}
                          </button>
                        ))}
                        <a
                          href={`tel:${appt.patient?.phone}`}
                          className="p-1.5 rounded-btn hover:bg-subtle text-muted transition-colors"
                          title="Call patient"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="card card-body !p-4 space-y-3">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-3 w-20" />
            </div>
          ))
        ) : filtered?.length === 0 ? (
          <div className="card card-body !p-10 text-center">
            <Calendar className="w-10 h-10 text-faint mx-auto mb-3" />
            <p className="text-sm text-muted font-semibold">No appointments found</p>
          </div>
        ) : (
          filtered?.map((appt) => (
            <div key={appt.id} className="card card-body !p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Avatar name={appt.patient?.fullName ?? '?'} size="md" />
                  <div>
                    <p className="text-sm font-bold text-primary">{appt.patient?.fullName}</p>
                    <p className="text-xs text-muted">{formatTime(appt.dateTime)}</p>
                  </div>
                </div>
                <StatusChip status={appt.status} />
              </div>
              <p className="text-sm font-semibold text-muted mt-2">{appt.treatment}</p>
              <div className="flex items-center gap-2 mt-3">
                {STATUS_ACTIONS.filter((a) => a.status !== appt.status).slice(0, 2).map((action) => (
                  <button
                    key={action.status}
                    onClick={() => updateMutation.mutate({ id: appt.id, status: action.status })}
                    className="flex-1 text-xs font-bold py-2 rounded-btn bg-subtle text-muted hover:bg-border transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
