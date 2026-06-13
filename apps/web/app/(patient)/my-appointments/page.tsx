'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatusChip } from '@/components/ui/StatusChip';
import { Button } from '@/components/ui/Button';
import { formatDateTime, cn } from '@/lib/utils';
import { Calendar, Phone, MapPin, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Appointment } from '@/types';

interface AppointmentWithClinic extends Appointment {
  clinic: { name: string; phone: string; address: string };
}

export default function PatientAppointmentsPage() {
  const qc = useQueryClient();
  const token = typeof window !== 'undefined' ? localStorage.getItem('patientToken') : null;

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => {
      if (!token) throw new Error('Not authenticated');
      return fetch('/api/patient/appointments', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()) as Promise<AppointmentWithClinic[]>;
    },
    enabled: !!token,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/patient/appointments/${id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token ?? ''}` },
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient-appointments'] });
      toast.success('Appointment cancelled');
    },
    onError: (err: { error?: string }) =>
      toast.error(err?.error ?? 'Could not cancel appointment'),
  });

  const upcoming = appointments?.filter(
    (a) => new Date(a.dateTime) > new Date() && !['CANCELLED', 'COMPLETED'].includes(a.status)
  );
  const past = appointments?.filter(
    (a) => new Date(a.dateTime) <= new Date() || ['CANCELLED', 'COMPLETED'].includes(a.status)
  );

  if (!token) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-4">
        <div className="bg-white rounded-[18px] p-8 max-w-sm w-full text-center shadow-modal">
          <Calendar className="w-12 h-12 text-faint mx-auto mb-4" />
          <h2 className="text-lg font-extrabold text-primary mb-2">View Your Appointments</h2>
          <p className="text-sm text-muted mb-4">
            Enter your phone number to access your appointments.
          </p>
          <Button className="w-full" onClick={() => (window.location.href = '/patient/verify')}>
            Get Access →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app py-8 px-4">
      <div className="max-w-lg mx-auto space-y-5">
        <h1 className="text-page-title">My Appointments</h1>

        {/* Upcoming */}
        {(upcoming?.length ?? 0) > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-muted uppercase tracking-wide">Upcoming</h2>
            {upcoming?.map((appt) => (
              <div key={appt.id} className="bg-white rounded-[14px] shadow-card p-4 border border-border">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-primary">{appt.treatment}</p>
                    <p className="text-xs text-muted mt-0.5">{appt.clinic?.name}</p>
                  </div>
                  <StatusChip status={appt.status} />
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Calendar className="w-3.5 h-3.5 text-faint" />
                    {formatDateTime(appt.dateTime)}
                  </div>
                  {appt.clinic?.address && (
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <MapPin className="w-3.5 h-3.5 text-faint" />
                      {appt.clinic.address}
                    </div>
                  )}
                  {appt.clinic?.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Phone className="w-3.5 h-3.5 text-faint" />
                      {appt.clinic.phone}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <a
                    href={`tel:${appt.clinic?.phone}`}
                    className="flex-1 text-center text-xs font-bold py-2 rounded-btn bg-subtle text-muted hover:bg-border transition-colors"
                  >
                    Call Clinic
                  </a>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel this appointment?')) {
                        cancelMutation.mutate(appt.id);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-btn text-xs font-bold text-danger hover:bg-danger-light transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Past */}
        {(past?.length ?? 0) > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-muted uppercase tracking-wide">Past</h2>
            {past?.map((appt) => (
              <div
                key={appt.id}
                className="bg-white rounded-[14px] shadow-card p-4 border border-border opacity-70"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-primary">{appt.treatment}</p>
                    <p className="text-xs text-muted">{appt.clinic?.name}</p>
                  </div>
                  <StatusChip status={appt.status} />
                </div>
                <p className="text-xs text-muted mt-2">{formatDateTime(appt.dateTime)}</p>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (appointments?.length ?? 0) === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-faint mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted">No appointments found</p>
          </div>
        )}

        <p className="text-center text-xs text-muted pt-4">
          Powered by <span className="font-bold text-brand">MediCore AI</span>
        </p>
      </div>
    </div>
  );
}
