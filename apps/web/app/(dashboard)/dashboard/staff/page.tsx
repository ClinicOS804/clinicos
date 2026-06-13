'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn, formatDate, timeAgo } from '@/lib/utils';
import { UserPlus, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { StaffMember } from '@/types';

const ROLE_OPTIONS = ['RECEPTIONIST', 'NURSE', 'ASSISTANT', 'MANAGER'];

export default function StaffPage() {
  const qc = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => api.get<StaffMember[]>('/api/staff'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    name: string; email: string; role: string;
  }>();

  const inviteMutation = useMutation({
    mutationFn: (data: { name: string; email: string; role: string }) =>
      api.post('/api/staff/invite', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      setShowInviteModal(false);
      reset();
      toast.success('Invitation sent!');
    },
    onError: (err: { error?: string }) => toast.error(err?.error ?? 'Failed to invite staff'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/staff/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member deactivated');
    },
    onError: () => toast.error('Failed to deactivate staff member'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-page-title">Staff</h1>
          <p className="text-sm text-muted">{staff?.length ?? 0} members</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <UserPlus className="w-4 h-4" /> Invite Staff
        </Button>
      </div>

      {/* Staff table — desktop */}
      <div className="card hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Name', 'Role', 'Email', 'Status', 'Last Login', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-full rounded" /></td>
                  ))}
                </tr>
              ))
            ) : staff?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="text-sm text-muted font-semibold">No staff members yet</p>
                </td>
              </tr>
            ) : (
              staff?.map((s) => (
                <tr key={s.id} className="border-b border-[#f8fafc] hover:bg-subtle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} size="sm" />
                      <p className="text-sm font-bold text-primary">{s.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-muted">{s.role}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{s.email}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'chip text-xs',
                      s.status === 'ACTIVE' ? 'bg-brand-light text-brand' :
                      s.status === 'PENDING' ? 'bg-amber-light text-amber' :
                      'bg-subtle text-muted'
                    )}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {s.lastLogin ? timeAgo(s.lastLogin) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (confirm(`Deactivate ${s.name}? They will lose access immediately.`)) {
                          deactivateMutation.mutate(s.id);
                        }
                      }}
                      className="p-1.5 text-muted hover:text-danger rounded-btn hover:bg-danger-light transition-colors"
                      title="Deactivate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {staff?.map((s) => (
          <div key={s.id} className="card card-body !p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={s.name} size="md" />
                <div>
                  <p className="text-sm font-bold text-primary">{s.name}</p>
                  <p className="text-xs text-muted">{s.role} · {s.email}</p>
                </div>
              </div>
              <span className={cn(
                'chip text-xs',
                s.status === 'ACTIVE' ? 'bg-brand-light text-brand' : 'bg-amber-light text-amber'
              )}>
                {s.status}
              </span>
            </div>
            {s.lastLogin && (
              <div className="flex items-center gap-1.5 mt-2">
                <Clock className="w-3 h-3 text-faint" />
                <span className="text-xs text-muted">Last login {timeAgo(s.lastLogin)}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      <Modal open={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite Staff Member">
        <form onSubmit={handleSubmit((d) => inviteMutation.mutate(d))} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Full Name *</label>
            <input className="input" placeholder="Fatima Al-Rashid" {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Email Address *</label>
            <input type="email" className="input" placeholder="staff@clinic.com" {...register('email', { required: 'Email is required' })} />
            {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Role</label>
            <select className="input" {...register('role')}>
              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <p className="text-xs text-muted">
            An invitation email will be sent to this address. They&apos;ll set their password when they accept.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" className="flex-1" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={inviteMutation.isPending} className="flex-1">
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
