'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDate, timeAgo, cn } from '@/lib/utils';
import { Search, UserPlus, Calendar, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { Patient } from '@/types';

interface PaginatedPatients {
  data: Patient[];
  total: number;
  page: number;
  limit: number;
}

export default function PatientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Simple debounce via timeout
  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as unknown as { _searchTimeout?: number })._searchTimeout);
    (window as unknown as { _searchTimeout?: number })._searchTimeout = window.setTimeout(
      () => setDebouncedSearch(val),
      300
    );
  };

  const { data, isLoading } = useQuery({
    queryKey: ['patients', debouncedSearch],
    queryFn: () =>
      api.get<PaginatedPatients>(
        `/api/patients?search=${encodeURIComponent(debouncedSearch)}&limit=50`
      ),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    fullName: string;
    phone: string;
    email?: string;
    gender?: string;
  }>();

  const createMutation = useMutation({
    mutationFn: (formData: { fullName: string; phone: string; email?: string; gender?: string }) =>
      api.post('/api/patients', formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      setShowAddModal(false);
      reset();
      toast.success('Patient added successfully');
    },
    onError: (err: { error?: string }) => toast.error(err?.error ?? 'Failed to add patient'),
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-page-title">Patients</h1>
          <p className="text-sm text-muted">{data?.total ?? 0} total patients</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <UserPlus className="w-4 h-4" /> Add Patient
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
        <input
          type="search"
          placeholder="Search by name, phone, or email..."
          className="input pl-9"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          aria-label="Search patients"
        />
      </div>

      {/* Desktop table */}
      <div className="card hidden md:block">
        <table className="w-full" role="table" aria-label="Patients list">
          <thead>
            <tr className="border-b border-border">
              {['Patient', 'Phone', 'Last Visit', 'Total Visits', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="skeleton h-4 w-full rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-10 h-10 text-faint" />
                    <p className="text-sm font-semibold text-muted">
                      {debouncedSearch ? 'No patients found' : 'No patients yet'}
                    </p>
                    {!debouncedSearch && (
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="text-xs font-bold text-brand"
                      >
                        Add your first patient →
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              data?.data?.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-b border-[#f8fafc] hover:bg-subtle transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={patient.fullName} size="sm" />
                      <div>
                        <p className="text-sm font-bold text-primary">{patient.fullName}</p>
                        <p className="text-xs text-muted capitalize">{patient.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{patient.phone}</td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {patient.appointments?.[0]
                      ? formatDate(patient.appointments[0].dateTime)
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-faint" />
                      <span className="text-sm font-bold text-primary">
                        {patient._count?.appointments ?? 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/patients/${patient.id}`}
                      className="flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-dark"
                    >
                      View Profile <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="card card-body !p-4 space-y-2">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-3 w-24" />
            </div>
          ))
        ) : (
          data?.data?.map((patient) => (
            <Link
              key={patient.id}
              href={`/dashboard/patients/${patient.id}`}
              className="card card-body !p-4 block hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={patient.fullName} size="md" />
                  <div>
                    <p className="text-sm font-bold text-primary">{patient.fullName}</p>
                    <p className="text-xs text-muted">{patient.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-primary">{patient._count?.appointments ?? 0} visits</p>
                  <p className="text-xs text-muted">
                    {patient.appointments?.[0] ? formatDate(patient.appointments[0].dateTime) : 'No visits'}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Add Patient Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Patient">
        <form
          onSubmit={handleSubmit((d) => createMutation.mutate(d))}
          className="space-y-4"
          noValidate
        >
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Full Name *</label>
            <input
              className={`input ${errors.fullName ? 'border-danger' : ''}`}
              placeholder="Ahmed Al-Rashid"
              {...register('fullName', { required: 'Full name is required' })}
            />
            {errors.fullName && (
              <p className="text-xs text-danger mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Phone / WhatsApp *</label>
            <input
              type="tel"
              className={`input ${errors.phone ? 'border-danger' : ''}`}
              placeholder="+971 50 123 4567"
              {...register('phone', { required: 'Phone is required' })}
            />
            {errors.phone && (
              <p className="text-xs text-danger mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Email (optional)</label>
            <input
              type="email"
              className="input"
              placeholder="patient@email.com"
              {...register('email')}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Gender</label>
            <select className="input" {...register('gender')}>
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              className="flex-1"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending} className="flex-1">
              Add Patient
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
