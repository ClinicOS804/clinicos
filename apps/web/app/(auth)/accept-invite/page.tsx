'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

function AcceptInviteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<{
    password: string;
    confirm: string;
  }>();

  const onSubmit = async (data: { password: string }) => {
    if (!token) { toast.error('Invalid invite link.'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/accept-invite', { token, password: data.password });
      toast.success('Account activated! Please sign in.');
      router.push('/login');
    } catch (err) {
      const error = err as { error?: string };
      toast.error(error?.error ?? 'This invite link may have expired. Ask your doctor to resend it.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-white rounded-[18px] shadow-modal p-8 text-center">
        <p className="text-danger font-semibold">Invalid or missing invite token.</p>
        <p className="text-sm text-muted mt-2">Please check the link in your email and try again.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[18px] shadow-modal p-8">
      <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
        <UserCheck className="w-6 h-6 text-brand" />
      </div>
      <h2 className="text-xl font-extrabold text-primary text-center mb-1">Accept Invitation</h2>
      <p className="text-sm text-muted text-center mb-6">Set a password to activate your staff account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="block text-xs font-bold text-muted mb-1.5">Create Password *</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              className={`input pr-10 ${errors.password ? 'border-danger' : ''}`}
              placeholder="At least 8 characters"
              autoFocus
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold text-muted mb-1.5">Confirm Password *</label>
          <input
            type="password"
            className={`input ${errors.confirm ? 'border-danger' : ''}`}
            placeholder="Repeat your password"
            {...register('confirm', {
              required: 'Please confirm your password',
              validate: (v) => v === watch('password') || 'Passwords do not match',
            })}
          />
          {errors.confirm && <p className="text-xs text-danger mt-1">{errors.confirm.message}</p>}
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Activate Account →
        </Button>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-[18px] shadow-modal p-8 text-center"><p className="text-muted">Loading...</p></div>}>
      <AcceptInviteForm />
    </Suspense>
  );
}
