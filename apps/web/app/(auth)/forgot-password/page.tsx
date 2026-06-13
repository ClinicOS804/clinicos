'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>();

  const onSubmit = async (data: { email: string }) => {
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', data);
      setSent(true);
    } catch {
      // Always show success to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-white rounded-[18px] shadow-modal p-8 text-center">
        <div className="w-14 h-14 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7 text-brand" />
        </div>
        <h2 className="text-xl font-extrabold text-primary mb-2">Check your email</h2>
        <p className="text-sm text-muted mb-6">
          If this email is registered, you&apos;ll receive a password reset link within a few minutes.
        </p>
        <Link href="/login" className="btn-secondary inline-flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[18px] shadow-modal p-8">
      <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-primary mb-5">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to login
      </Link>

      <h2 className="text-xl font-extrabold text-primary mb-1">Reset password</h2>
      <p className="text-sm text-muted mb-6">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="block text-xs font-bold text-muted mb-1.5">Email Address</label>
          <input
            type="email"
            autoComplete="email"
            className={`input ${errors.email ? 'border-danger' : ''}`}
            placeholder="you@clinic.com"
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          Send Reset Link
        </Button>
      </form>
    </div>
  );
}
