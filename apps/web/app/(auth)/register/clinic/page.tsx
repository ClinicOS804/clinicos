'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Upload, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const SPECIALTIES = [
  'General Practice', 'Dental', 'Dermatology', 'Ophthalmology',
  'Pediatrics', 'Cardiology', 'Orthopedics', 'Gynecology',
  'Psychiatry', 'ENT', 'Other',
];

export default function ClinicSetupPage() {
  const router = useRouter();
  const { user, setAuth, token } = useStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.clinicName ?? '',
      specialty: '',
      address: '',
      bookingSlug: user?.clinicName
        ? user.clinicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        : '',
    },
  });

  const slug = watch('bookingSlug');

  const onSubmit = async (data: {
    name: string;
    specialty: string;
    address: string;
    bookingSlug: string;
  }) => {
    setLoading(true);
    try {
      await api.patch('/api/settings/clinic', {
        name: data.name,
        specialty: data.specialty,
        address: data.address,
        bookingSlug: data.bookingSlug,
      });
      toast.success('Clinic info saved!');
      router.push('/register/hours');
    } catch (err) {
      const error = err as { error?: string };
      toast.error(error?.error ?? 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[18px] shadow-modal p-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {['Account', 'Clinic', 'Hours', 'Plan'].map((step, i) => (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
              ${i < 1 ? 'bg-brand text-white' : i === 1 ? 'bg-brand text-white' : 'bg-subtle text-muted'}`}>
              {i < 1 ? '✓' : i + 1}
            </div>
            {i < 3 && <div className={`flex-1 h-0.5 ${i < 1 ? 'bg-brand' : 'bg-subtle'}`} />}
          </div>
        ))}
      </div>

      <h2 className="text-xl font-extrabold text-primary mb-1">Set up your clinic</h2>
      <p className="text-sm text-muted mb-6">Tell us about your clinic so patients can find you.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="block text-xs font-bold text-muted mb-1.5">Clinic Name *</label>
          <input
            className={`input ${errors.name ? 'border-danger' : ''}`}
            {...register('name', { required: 'Clinic name is required' })}
          />
          {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-muted mb-1.5">Medical Specialty</label>
          <select className="input" {...register('specialty')}>
            <option value="">Select specialty...</option>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s.toLowerCase()}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted mb-1.5">Clinic Address</label>
          <input
            className="input"
            placeholder="Al Barsha, Dubai, UAE"
            {...register('address')}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted mb-1.5">Your Booking URL</label>
          <div className="flex items-center border-2 border-border rounded-input focus-within:border-brand transition-colors">
            <span className="pl-3 text-xs font-semibold text-muted whitespace-nowrap">medicore.ai/book/</span>
            <input
              className="flex-1 py-[10px] pr-3 text-sm font-bold text-primary bg-transparent outline-none"
              placeholder="your-clinic-name"
              {...register('bookingSlug', {
                required: 'Booking URL is required',
                pattern: {
                  value: /^[a-z0-9-]+$/,
                  message: 'Only lowercase letters, numbers, and hyphens',
                },
              })}
            />
          </div>
          {errors.bookingSlug && (
            <p className="text-xs text-danger mt-1">{errors.bookingSlug.message}</p>
          )}
          {slug && (
            <p className="text-xs text-muted mt-1">
              Preview: <span className="text-brand font-semibold">medicore.ai/book/{slug}</span>
            </p>
          )}
        </div>

        {/* Logo upload hint */}
        <div className="bg-subtle rounded-btn p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-border rounded-btn flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-muted" />
          </div>
          <div>
            <p className="text-xs font-bold text-primary">Upload a logo (optional)</p>
            <p className="text-xs text-muted">You can add this later in Settings</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => router.push('/register/hours')}
          >
            Skip
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Save & Continue →
          </Button>
        </div>
      </form>
    </div>
  );
}
