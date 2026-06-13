'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const totalMins = 6 * 60 + i * 30;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const label = `${h % 12 === 0 ? 12 : h % 12}:${m === 0 ? '00' : '30'} ${h < 12 ? 'AM' : 'PM'}`;
  const value = `${String(h).padStart(2, '0')}:${m === 0 ? '00' : '30'}`;
  return { label, value };
});

type DayConfig = {
  isOpen: boolean;
  open: string;
  close: string;
  slotDuration: number;
};

type WorkingHours = Record<string, DayConfig>;

const DEFAULT_HOURS: WorkingHours = {
  monday:    { isOpen: true,  open: '09:00', close: '17:00', slotDuration: 30 },
  tuesday:   { isOpen: true,  open: '09:00', close: '17:00', slotDuration: 30 },
  wednesday: { isOpen: true,  open: '09:00', close: '17:00', slotDuration: 30 },
  thursday:  { isOpen: true,  open: '09:00', close: '17:00', slotDuration: 30 },
  friday:    { isOpen: false, open: '09:00', close: '17:00', slotDuration: 30 },
  saturday:  { isOpen: true,  open: '10:00', close: '14:00', slotDuration: 30 },
  sunday:    { isOpen: false, open: '09:00', close: '17:00', slotDuration: 30 },
};

export default function WorkingHoursPage() {
  const router = useRouter();
  const [hours, setHours] = useState<WorkingHours>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(false);

  const toggleDay = (day: string) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], isOpen: !prev[day].isOpen },
    }));
  };

  const updateDay = (day: string, field: keyof DayConfig, value: string | number | boolean) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const onSubmit = async () => {
    setLoading(true);
    try {
      await api.patch('/api/settings/hours', { workingHours: JSON.stringify(hours) });
      toast.success('Working hours saved!');
      router.push('/register/plan');
    } catch {
      toast.error('Failed to save. Continuing anyway...');
      router.push('/register/plan');
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
              ${i < 2 ? 'bg-brand text-white' : i === 2 ? 'bg-brand text-white' : 'bg-subtle text-muted'}`}>
              {i < 2 ? '✓' : i + 1}
            </div>
            {i < 3 && <div className={`flex-1 h-0.5 ${i < 2 ? 'bg-brand' : 'bg-subtle'}`} />}
          </div>
        ))}
      </div>

      <h2 className="text-xl font-extrabold text-primary mb-1">Working hours</h2>
      <p className="text-sm text-muted mb-5">
        Set your clinic hours so the AI only books during open times.
      </p>

      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
        {DAYS.map(({ key, label }) => {
          const day = hours[key];
          return (
            <div
              key={key}
              className={cn(
                'flex flex-wrap items-center gap-3 p-3 rounded-btn border transition-all',
                day.isOpen ? 'border-brand/30 bg-brand-light/20' : 'border-border bg-subtle'
              )}
            >
              {/* Toggle */}
              <button
                type="button"
                onClick={() => toggleDay(key)}
                className={cn(
                  'relative w-10 h-5 rounded-full transition-colors flex-shrink-0',
                  day.isOpen ? 'bg-brand' : 'bg-border'
                )}
                aria-pressed={day.isOpen}
                aria-label={`Toggle ${label}`}
              >
                <span className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                  day.isOpen ? 'translate-x-5' : 'translate-x-0.5'
                )} />
              </button>

              <span className={cn(
                'text-sm font-bold w-20 flex-shrink-0',
                day.isOpen ? 'text-primary' : 'text-muted'
              )}>
                {label}
              </span>

              {day.isOpen ? (
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  <select
                    value={day.open}
                    onChange={(e) => updateDay(key, 'open', e.target.value)}
                    className="input !py-1.5 !text-xs flex-1 min-w-[100px]"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <span className="text-xs text-muted font-semibold">to</span>
                  <select
                    value={day.close}
                    onChange={(e) => updateDay(key, 'close', e.target.value)}
                    className="input !py-1.5 !text-xs flex-1 min-w-[100px]"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <select
                    value={day.slotDuration}
                    onChange={(e) => updateDay(key, 'slotDuration', Number(e.target.value))}
                    className="input !py-1.5 !text-xs w-24 flex-shrink-0"
                    title="Appointment slot duration"
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
              ) : (
                <span className="text-xs text-muted font-semibold">Closed</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 mt-5">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={() => router.push('/register/plan')}
        >
          Skip
        </Button>
        <Button className="flex-1" onClick={onSubmit} loading={loading}>
          Save & Continue →
        </Button>
      </div>
    </div>
  );
}
