'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Save, Upload, Globe, Bot, Clock, Building2 } from 'lucide-react';
import type { Clinic } from '@/types';

const TABS = [
  { id: 'clinic', label: 'Clinic Info', icon: Building2 },
  { id: 'hours', label: 'Working Hours', icon: Clock },
  { id: 'ai', label: 'AI Settings', icon: Bot },
  { id: 'booking', label: 'Booking URL', icon: Globe },
] as const;

type TabId = typeof TABS[number]['id'];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SettingsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('clinic');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<Clinic>('/api/settings'),
  });

  const clinicForm = useForm({
    values: {
      name: settings?.name ?? '',
      ownerName: settings?.ownerName ?? '',
      phone: settings?.phone ?? '',
      specialty: settings?.specialty ?? '',
      address: settings?.address ?? '',
      timezone: settings?.timezone ?? 'Asia/Dubai',
    },
  });

  const aiForm = useForm({
    values: {
      aiEnabled: settings?.aiEnabled ?? true,
      aiLanguage: settings?.aiLanguage ?? 'english',
      aiPersonality: settings?.aiPersonality ?? 'professional',
      autoConfirm: settings?.autoConfirm ?? true,
      reminderTiming: settings?.reminderTiming ?? 'both',
    },
  });

  const updateClinicMutation = useMutation({
    mutationFn: (data: unknown) => api.patch('/api/settings/clinic', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Clinic info updated');
    },
    onError: () => toast.error('Failed to save changes'),
  });

  const updateAIMutation = useMutation({
    mutationFn: (data: unknown) => api.patch('/api/settings/ai', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('AI settings updated');
    },
    onError: () => toast.error('Failed to save AI settings'),
  });

  const workingHours = settings?.workingHours ? JSON.parse(settings.workingHours) : {};

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="skeleton h-8 w-32" />
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-page-title">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-subtle p-1 rounded-btn w-full overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm font-bold whitespace-nowrap transition-all flex-1 justify-center',
              activeTab === tab.id ? 'bg-white text-primary shadow-card' : 'text-muted hover:text-primary'
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Clinic Info Tab */}
      {activeTab === 'clinic' && (
        <form onSubmit={clinicForm.handleSubmit((data) => updateClinicMutation.mutate(data))}>
          <div className="card card-body space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Clinic Name</label>
                <input className="input" {...clinicForm.register('name')} />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Doctor Name</label>
                <input className="input" {...clinicForm.register('ownerName')} />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Phone / WhatsApp</label>
                <input className="input" {...clinicForm.register('phone')} />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Specialty</label>
                <input className="input" {...clinicForm.register('specialty')} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-muted mb-1.5">Address</label>
                <input className="input" {...clinicForm.register('address')} />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Timezone</label>
                <select className="input" {...clinicForm.register('timezone')}>
                  <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                  <option value="Asia/Riyadh">Asia/Riyadh (UTC+3)</option>
                  <option value="Asia/Karachi">Asia/Karachi (UTC+5)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
                  <option value="Europe/London">Europe/London (UTC+0)</option>
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                </select>
              </div>
            </div>

            {/* Logo upload */}
            <div className="border-t border-border pt-4">
              <label className="block text-xs font-bold text-muted mb-3">Clinic Logo</label>
              <div className="flex items-center gap-4">
                {settings?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.logoUrl} alt="Clinic logo" className="w-16 h-16 rounded-card object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-card bg-subtle flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-faint" />
                  </div>
                )}
                <Button type="button" variant="secondary" size="sm">
                  <Upload className="w-4 h-4" /> Upload Logo
                </Button>
              </div>
              <p className="text-xs text-muted mt-2">JPEG, PNG or WebP. Max 5MB. Shown on your public booking page.</p>
            </div>

            <Button type="submit" loading={updateClinicMutation.isPending}>
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          </div>
        </form>
      )}

      {/* Working Hours Tab */}
      {activeTab === 'hours' && (
        <div className="card card-body space-y-3">
          {DAYS.map((day) => {
            const config = workingHours[day] ?? { isOpen: false, open: '09:00', close: '17:00' };
            return (
              <div key={day} className="flex items-center gap-4 py-2 border-b border-[#f8fafc] last:border-0">
                <div className="w-24 flex items-center gap-2">
                  <div
                    className={cn(
                      'w-8 h-4 rounded-full transition-colors cursor-pointer relative',
                      config.isOpen ? 'bg-brand' : 'bg-border'
                    )}
                  >
                    <div className={cn(
                      'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform',
                      config.isOpen ? 'translate-x-4' : 'translate-x-0.5'
                    )} />
                  </div>
                  <span className="text-sm font-semibold text-primary capitalize">{day.slice(0, 3)}</span>
                </div>
                {config.isOpen ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input type="time" defaultValue={config.open} className="input h-8 text-xs py-0 flex-1" />
                    <span className="text-xs text-muted">to</span>
                    <input type="time" defaultValue={config.close} className="input h-8 text-xs py-0 flex-1" />
                  </div>
                ) : (
                  <span className="text-xs text-muted font-semibold">Closed</span>
                )}
              </div>
            );
          })}
          <Button loading={false}>
            <Save className="w-4 h-4" /> Save Working Hours
          </Button>
        </div>
      )}

      {/* AI Settings Tab */}
      {activeTab === 'ai' && (
        <form onSubmit={aiForm.handleSubmit((data) => updateAIMutation.mutate(data))}>
          <div className="card card-body space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-primary">AI Receptionist</p>
                <p className="text-xs text-muted">Enable or disable the AI for this clinic</p>
              </div>
              <div className={cn('w-12 h-6 rounded-full cursor-pointer relative transition-colors',
                aiForm.watch('aiEnabled') ? 'bg-brand' : 'bg-border'
              )} onClick={() => aiForm.setValue('aiEnabled', !aiForm.watch('aiEnabled'))}>
                <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                  aiForm.watch('aiEnabled') ? 'translate-x-7' : 'translate-x-1'
                )} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">AI Language</label>
                <select className="input" {...aiForm.register('aiLanguage')}>
                  <option value="english">English</option>
                  <option value="arabic">Arabic (عربي)</option>
                  <option value="urdu">Urdu (اردو)</option>
                  <option value="hindi">Hindi (हिंदी)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">AI Personality</label>
                <select className="input" {...aiForm.register('aiPersonality')}>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="formal">Formal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Reminder Timing</label>
                <select className="input" {...aiForm.register('reminderTiming')}>
                  <option value="24h">24 hours before</option>
                  <option value="2h">2 hours before</option>
                  <option value="both">Both (24h and 2h)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-bold text-primary">Auto-Confirm Appointments</p>
                <p className="text-xs text-muted">AI automatically confirms bookings without manual approval</p>
              </div>
              <div className={cn('w-12 h-6 rounded-full cursor-pointer relative transition-colors',
                aiForm.watch('autoConfirm') ? 'bg-brand' : 'bg-border'
              )} onClick={() => aiForm.setValue('autoConfirm', !aiForm.watch('autoConfirm'))}>
                <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                  aiForm.watch('autoConfirm') ? 'translate-x-7' : 'translate-x-1'
                )} />
              </div>
            </div>

            <Button type="submit" loading={updateAIMutation.isPending}>
              <Save className="w-4 h-4" /> Save AI Settings
            </Button>
          </div>
        </form>
      )}

      {/* Booking URL Tab */}
      {activeTab === 'booking' && (
        <div className="card card-body space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Your Booking URL</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted font-semibold">
                  medicore.ai/book/
                </span>
                <input
                  className="input pl-32 font-bold"
                  defaultValue={settings?.bookingSlug}
                  placeholder="your-clinic-slug"
                />
              </div>
              <Button variant="secondary">Copy Link</Button>
            </div>
            <p className="text-xs text-muted mt-2">
              Share this link with patients so they can book appointments online.
            </p>
          </div>

          <div className="bg-subtle rounded-card p-4">
            <p className="text-xs font-bold text-muted mb-2">Preview</p>
            <p className="text-sm font-semibold text-primary">
              https://medicore.ai/book/{settings?.bookingSlug}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Google Business Place ID</label>
            <input
              className="input"
              defaultValue={settings?.googlePlaceId ?? ''}
              placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
            />
            <p className="text-xs text-muted mt-1">
              Required for automatically requesting and managing Google reviews.
            </p>
          </div>

          <Button>
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
