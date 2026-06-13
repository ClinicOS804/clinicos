'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import type { Metadata } from 'next';
import type { AuthUser } from '@/types';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginAs, setLoginAs] = useState<'doctor' | 'staff'>('doctor');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const endpoint = loginAs === 'staff' ? '/api/auth/staff/login' : '/api/auth/login';
      const response = await api.post<{ token: string; user: AuthUser }>(endpoint, data);

      setAuth(response.user, response.token);

      // Redirect based on role
      if (response.user.role === 'STAFF') {
        router.push('/staff');
      } else if (!response.user.onboardingDone) {
        router.push('/register/clinic');
      } else {
        router.push('/dashboard');
      }

      toast.success(`Welcome back, ${response.user.name.split(' ')[0]}!`);
    } catch (err) {
      const error = err as { error?: string };
      toast.error(error?.error ?? 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[18px] shadow-modal p-8">
      <h2 className="text-xl font-extrabold text-primary mb-1">Welcome back</h2>
      <p className="text-sm text-muted mb-6">Sign in to your clinic dashboard</p>

      {/* Role selector */}
      <div className="flex bg-subtle rounded-btn p-1 mb-6">
        <button
          type="button"
          onClick={() => setLoginAs('doctor')}
          className={`flex-1 py-2 rounded-[8px] text-sm font-bold transition-all ${
            loginAs === 'doctor' ? 'bg-white text-primary shadow-card' : 'text-muted'
          }`}
        >
          Doctor
        </button>
        <button
          type="button"
          onClick={() => setLoginAs('staff')}
          className={`flex-1 py-2 rounded-[8px] text-sm font-bold transition-all ${
            loginAs === 'staff' ? 'bg-white text-primary shadow-card' : 'text-muted'
          }`}
        >
          Staff
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-xs font-bold text-muted mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="doctor@clinic.com"
            className={`input ${errors.email ? 'border-danger' : ''}`}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-danger mt-1 font-semibold">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs font-bold text-muted">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-bold text-brand hover:text-brand-dark">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`input pr-10 ${errors.password ? 'border-danger' : ''}`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-danger mt-1 font-semibold">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" loading={isLoading}>
          <LogIn className="w-4 h-4" />
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        New to MediCore AI?{' '}
        <Link href="/register" className="font-bold text-brand hover:text-brand-dark">
          Start free trial
        </Link>
      </p>
    </div>
  );
}
