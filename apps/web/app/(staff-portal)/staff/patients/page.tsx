'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate } from '@/lib/utils';
import { Search, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Patient } from '@/types';

export default function StaffPatientsPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as unknown as { _st?: number })._st);
    (window as unknown as { _st?: number })._st = window.setTimeout(() => setDebounced(val), 300);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['staff-patients', debounced],
    queryFn: () =>
      api.get<{ data: Patient[]; total: number }>(
        `/api/patients?search=${encodeURIComponent(debounced)}&limit=50`
      ),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title">Patients</h1>
        <span className="text-sm text-muted">{data?.total ?? 0} total</span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
        <input
          type="search"
          placeholder="Search by name, phone, or email..."
          className="input pl-9"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Desktop table */}
      <div className="card hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Patient', 'Phone', 'Last Visit', 'Total Visits', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(5)].map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-full rounded" /></td>
                ))}</tr>
              ))
            ) : data?.data?.map((p) => (
              <tr key={p.id} className="border-b border-[#f8fafc] hover:bg-subtle">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.fullName} size="sm" />
                    <div>
                      <p className="text-sm font-bold text-primary">{p.fullName}</p>
                      <p className="text-xs text-muted capitalize">{p.gender ?? '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted">{p.phone}</td>
                <td className="px-4 py-3 text-sm text-muted">
                  {p.appointments?.[0] ? formatDate(p.appointments[0].dateTime) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-faint" />
                    <span className="text-sm font-bold">{p._count?.appointments ?? 0}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/patients/${p.id}`} className="text-xs font-bold text-brand flex items-center gap-1">
                    View <ChevronRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data?.data?.map((p) => (
          <Link key={p.id} href={`/dashboard/patients/${p.id}`} className="card card-body !p-4 block">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={p.fullName} size="md" />
                <div>
                  <p className="text-sm font-bold text-primary">{p.fullName}</p>
                  <p className="text-xs text-muted">{p.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold">{p._count?.appointments ?? 0} visits</p>
                <p className="text-xs text-muted">{p.appointments?.[0] ? formatDate(p.appointments[0].dateTime) : 'No visits'}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
