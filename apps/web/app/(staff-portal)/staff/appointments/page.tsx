'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatusChip } from '@/components/ui/StatusChip';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatTime, formatDate, CHANNEL_COLORS } from '@/lib/utils';
import { Calendar, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { Appointment, AppointmentStatus } from '@/types';

const FILTER_TABS = [
  { label: 'Today',    value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'This Week',value: 'week' },
  { label: 'All',      value: '' },
];

const QUICK_STATUS: { label: string; status: AppointmentStatus }[] = [
  { label: 'Arrived',  status: 'ARRIVED' },
  { label: 'Complete', status: 'COMPLETED' },
  { label: 'No Show',  status: 'NO_SHOW' },
  { label: 'Cancel',   status: 'CANCELLED' },
];

export default function StaffAppointmentsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('today');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['staff-appts', filter],
    queryFn: () =>
      api.get<{ data: Appointment[]; total: number }>(
        `/api/appointments?filter=${filter}&limit=100`
      ),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api.patch(`/api/appointments/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-appts'] });
      toast.success('Updated');
    },
    onError: () => toast.error('Failed to update'),
  });

  const filtered = data?.data?.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.patient?.fullName?.toLowerCase().includes(q) || a.treatment.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-page-title">Appointments</h1>
        <span className="text-sm text-muted">{data?.total ?? 0} total</span>
      </div>

      {/* Filters */}
      <div className="card card-body !p-3 flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-btn text-xs font-bold whitespace-nowrap transition-all',
                filter === tab.value ? 'bg-brand text-white' : 'bg-subtle text-muted hover:bg-border'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
          <input
            type="search"
            placeholder="Search patient or treatment..."
            className="input pl-9 h-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="card hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Patient', 'Time', 'Treatment', 'Channel', 'Status', 'Quick Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(6)].map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-full rounded" /></td>
                ))}</tr>
              ))
            ) : filtered?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <Calendar className="w-8 h-8 text-faint mx-auto mb-2" />
                  <p className="text-sm text-muted font-semibold">No appointments found</p>
                </td>
              </tr>
            ) : filtered?.map((appt) => (
              <tr key={appt.id} className="border-b border-[#f8fafc] hover:bg-subtle">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={appt.patient?.fullName ?? '?'} size="sm" />
                    <div>
                      <p className="text-sm font-bold text-primary">{appt.patient?.fullName}</p>
                      <p className="text-xs text-muted">{appt.patient?.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-bold">{formatTime(appt.dateTime)}</p>
                  <p className="text-xs text-muted">{formatDate(appt.dateTime)}</p>
                </td>
                <td className="px-4 py-3 text-sm font-semibold">{appt.treatment}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHANNEL_COLORS[appt.channel] }} />
                    <span className="text-xs font-semibold text-muted">{appt.channel.replace('_', ' ')}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><StatusChip status={appt.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {QUICK_STATUS.filter((s) => s.status !== appt.status).slice(0, 2).map((s) => (
                      <button
                        key={s.status}
                        onClick={() => updateMutation.mutate({ id: appt.id, status: s.status })}
                        className="text-xs font-bold px-2 py-1 rounded-btn bg-subtle hover:bg-border text-muted transition-colors"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered?.map((appt) => (
          <div key={appt.id} className="card card-body !p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <Avatar name={appt.patient?.fullName ?? '?'} size="md" />
                <div>
                  <p className="text-sm font-bold text-primary">{appt.patient?.fullName}</p>
                  <p className="text-xs text-muted">{formatTime(appt.dateTime)} · {appt.treatment}</p>
                </div>
              </div>
              <StatusChip status={appt.status} />
            </div>
            <div className="flex gap-2 mt-3">
              {QUICK_STATUS.filter((s) => s.status !== appt.status).slice(0, 2).map((s) => (
                <button
                  key={s.status}
                  onClick={() => updateMutation.mutate({ id: appt.id, status: s.status })}
                  className="flex-1 text-xs font-bold py-2 rounded-btn bg-subtle text-muted hover:bg-border"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
