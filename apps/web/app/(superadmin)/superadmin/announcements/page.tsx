'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Megaphone, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAnnouncementsPage() {
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    subject: string;
    body: string;
  }>();

  const sendMutation = useMutation({
    mutationFn: (data: { subject: string; body: string }) =>
      api.post<{ sent: number; total: number }>('/api/superadmin/announce', data),
    onSuccess: (data) => {
      setResult(data);
      reset();
      toast.success(`Sent to ${data.sent} clinics`);
    },
    onError: () => toast.error('Failed to send announcement'),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-page-title">Platform Announcements</h1>
        <p className="text-sm text-muted mt-0.5">Send an email to all active clinics on the platform.</p>
      </div>

      {result && (
        <div className="bg-brand-light border border-brand/20 rounded-card p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-brand" />
          <p className="text-sm font-semibold text-brand">
            Sent to {result.sent} of {result.total} active clinics.
          </p>
        </div>
      )}

      <div className="card card-body">
        <form onSubmit={handleSubmit((d) => sendMutation.mutate(d))} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Subject Line *</label>
            <input
              className={`input ${errors.subject ? 'border-danger' : ''}`}
              placeholder="New feature: Voice AI is now available!"
              {...register('subject', { required: 'Subject is required' })}
            />
            {errors.subject && <p className="text-xs text-danger mt-1">{errors.subject.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Message *</label>
            <textarea
              className={`input resize-none min-h-[180px] ${errors.body ? 'border-danger' : ''}`}
              placeholder={`Dear doctor,\n\nWe're excited to announce...`}
              {...register('body', { required: 'Message body is required' })}
            />
            {errors.body && <p className="text-xs text-danger mt-1">{errors.body.message}</p>}
          </div>

          <div className="bg-amber-light border border-amber/20 rounded-btn p-3 flex items-start gap-2">
            <Megaphone className="w-4 h-4 text-amber flex-shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-amber">
              This sends an email to ALL active clinics. This action cannot be undone.
            </p>
          </div>

          <Button type="submit" loading={sendMutation.isPending} className="w-full">
            <Send className="w-4 h-4" /> Send Announcement
          </Button>
        </form>
      </div>
    </div>
  );
}
