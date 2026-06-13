'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function StaffProfilePage() {
  const { user } = useStore();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name ?? '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; currentPassword?: string; newPassword?: string }) =>
      api.patch('/api/auth/me', data),
    onSuccess: () => toast.success('Profile updated'),
    onError: (err: { error?: string }) =>
      toast.error(err?.error ?? 'Failed to update profile'),
  });

  const onSubmit = (data: {
    name: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const payload: { name?: string; currentPassword?: string; newPassword?: string } = {
      name: data.name,
    };
    if (data.newPassword) {
      payload.currentPassword = data.currentPassword;
      payload.newPassword = data.newPassword;
    }
    updateMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-page-title">My Profile</h1>

      <div className="card card-body !p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={user?.name ?? ''} size="lg" />
          <div>
            <p className="text-base font-bold text-primary">{user?.name}</p>
            <p className="text-sm text-muted">{user?.email}</p>
            <p className="text-xs text-brand font-bold capitalize mt-0.5">{user?.staffRole?.toLowerCase()}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Display Name</label>
            <input
              className={`input ${errors.name ? 'border-danger' : ''}`}
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs font-bold text-muted mb-3">Change Password (leave blank to keep current)</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Current Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Current password"
                  {...register('currentPassword')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="At least 8 characters"
                    {...register('newPassword', {
                      minLength: { value: 8, message: 'Minimum 8 characters' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-danger mt-1">{errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Repeat new password"
                  {...register('confirmPassword', {
                    validate: (v) =>
                      !watch('newPassword') || v === watch('newPassword') || 'Passwords do not match',
                  })}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-danger mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" loading={updateMutation.isPending}>
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
}
