'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import type { AuthUser } from '@/types';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit } = useForm<{ email: string; password: string }>();

  const onSubmit = async (data: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: AuthUser }>(
        '/api/auth/superadmin/login',
        data
      );
      setAuth(res.user, res.token);
      router.push('/superadmin');
    } catch {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-[18px] shadow-modal p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand rounded-btn flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-primary">MediCore AI</p>
            <p className="text-xs text-muted">Super Admin Access</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Admin Email</label>
            <input
              type="email"
              autoComplete="email"
              className="input"
              placeholder="superadmin@medicore.ai"
              {...register('email')}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              className="input"
              placeholder="••••••••"
              {...register('password')}
            />
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Access Admin Panel
          </Button>
        </form>
      </div>
    </div>
  );
}
