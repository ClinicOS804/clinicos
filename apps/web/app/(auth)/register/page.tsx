'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { toast } from 'sonner';
import type { AuthUser } from '@/types';

const schema = z.object({
  ownerName: z.string().min(2, 'Your name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(7, 'Phone number is required'),
  clinicName: z.string().min(2, 'Clinic name is required'),
  specialty: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const SPECIALTIES = [
  'General Practice', 'Dental', 'Dermatology', 'Ophthalmology',
  'Pediatrics', 'Cardiology', 'Orthopedics', 'Gynecology',
  'Psychiatry', 'ENT', 'Other',
];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await api.post<{ token: string; clinic: AuthUser & { bookingSlug: string } }>(
        '/api/auth/register',
        data
      );

      setAuth(
        {
          id: response.clinic.id,
          clinicId: response.clinic.id,
          role: 'DOCTOR',
          name: data.ownerName,
          email: data.email,
          clinicName: data.clinicName,
          plan: 'TRIAL',
          onboardingDone: false,
        },
        response.token
      );

      toast.success('Account created! Let\'s set up your clinic.');
      router.push('/register/clinic');
    } catch (err) {
      const error = err as { error?: string };
      toast.error(error?.error ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[18px] shadow-modal p-8">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6">
        {['Account', 'Clinic', 'Hours', 'Plan'].map((step, i) => (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              i === 0 ? 'bg-brand text-white' : 'bg-subtle text-muted'
            }`}>
              {i + 1}
            </div>
            {i < 3 && <div className="flex-1 h-0.5 bg-subtle" />}
          </div>
        ))}
      </div>

      <h2 className="text-xl font-extrabold text-primary mb-1">Create your account</h2>
      <p className="text-sm text-muted mb-6">14-day free trial — no credit card needed</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-muted mb-1.5">Your Full Name *</label>
            <input
              type="text"
              placeholder="Dr. Ahmed Rahman"
              className={`input ${errors.ownerName ? 'border-danger' : ''}`}
              {...register('ownerName')}
            />
            {errors.ownerName && <p className="text-xs text-danger mt-1">{errors.ownerName.message}</p>}
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-bold text-muted mb-1.5">Clinic Name *</label>
            <input
              type="text"
              placeholder="Rahman Dental Clinic"
              className={`input ${errors.clinicName ? 'border-danger' : ''}`}
              {...register('clinicName')}
            />
            {errors.clinicName && <p className="text-xs text-danger mt-1">{errors.clinicName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Specialty</label>
            <select className="input" {...register('specialty')}>
              <option value="">Select...</option>
              {SPECIALTIES.map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Phone *</label>
            <input
              type="tel"
              placeholder="+971 50 123 4567"
              className={`input ${errors.phone ? 'border-danger' : ''}`}
              {...register('phone')}
            />
            {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone.message}</p>}
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-bold text-muted mb-1.5">Email Address *</label>
            <input
              type="email"
              placeholder="you@clinic.com"
              className={`input ${errors.email ? 'border-danger' : ''}`}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-bold text-muted mb-1.5">Password *</label>
            <input
              type="password"
              placeholder="At least 8 characters"
              className={`input ${errors.password ? 'border-danger' : ''}`}
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
          </div>
        </div>

        <Button type="submit" className="w-full mt-2" loading={loading} size="lg">
          Create Account & Continue →
        </Button>
      </form>

      <p className="text-center text-xs text-muted mt-5">
        By signing up, you agree to our{' '}
        <span className="text-brand font-bold">Terms of Service</span> and{' '}
        <span className="text-brand font-bold">Privacy Policy</span>.
      </p>

      <p className="text-center text-sm text-muted mt-3">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-brand hover:text-brand-dark">Sign in</Link>
      </p>
    </div>
  );
}
