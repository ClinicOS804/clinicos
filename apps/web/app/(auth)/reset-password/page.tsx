'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<{
    password: string;
    confirm: string;
  }>();

  const onSubmit = async (data: { password: string }) => {
    if (!token) { toast.error('Invalid reset link.'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, password: data.password });
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      const error = err as { error?: string };
      toast.error(error?.error ?? 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-white rounded-[18px] shadow-modal p-8 text-center">
        <p className="text-danger font-semibold">Invalid or expired reset link.</p>
        <a href="/forgot-password" className="text-brand font-bold text-sm mt-3 block">Request a new link →</a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-white rounded-[18px] shadow-modal p-8 text-center">
        <div className="w-14 h-14 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-brand" />
        </div>
        <h2 className="text-xl font-extrabold text-primary mb-2">Password reset!</h2>
        <p className="text-sm text-muted">Redirecting you to login...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[18px] shadow-modal p-8">
      <h2 className="text-xl font-extrabold text-primary mb-1">Set new password</h2>
      <p className="text-sm text-muted mb-6">
        Choose a strong password for <span className="font-bold">{email}</span>
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="block text-xs font-bold text-muted mb-1.5">New Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              className={`input pr-10 ${errors.password ? 'border-danger' : ''}`}
              placeholder="At least 8 characters"
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
          <label className="block text-xs font-bold text-muted mb-1.5">Confirm Password</label>
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
        <Button type="submit" className="w-full" loading={loading}>Reset Password</Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-[18px] shadow-modal p-8 text-center"><p className="text-muted">Loading...</p></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
