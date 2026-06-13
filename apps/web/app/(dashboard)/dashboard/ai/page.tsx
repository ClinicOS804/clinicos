'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { cn, timeAgo } from '@/lib/utils';
import { Bot, Zap, Phone, Calendar, Save, TestTube2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AILog } from '@/types';

interface AIConfig {
  aiEnabled: boolean;
  aiLanguage: string;
  aiPersonality: string;
  autoConfirm: boolean;
  reminderTiming: string;
  reviewTiming: string;
  customIntroMsg?: string;
}

interface AIStats {
  callsHandled: number;
  appointmentsBooked: number;
  avgResponseTimeMs: number;
}

const LOG_ACTION_COLORS: Record<string, string> = {
  booked_appointment:   'bg-brand',
  sent_reminder:        'bg-blue-500',
  answered_faq:         'bg-purple-500',
  sent_review_request:  'bg-amber-400',
  cancelled_appointment:'bg-danger',
  escalated_to_human:   'bg-amber-400',
};

export default function AIPage() {
  const qc = useQueryClient();
  const [testPhone, setTestPhone] = useState('');

  const { data: config } = useQuery({
    queryKey: ['ai-config'],
    queryFn: () => api.get<AIConfig>('/api/ai/config'),
  });

  const { data: stats } = useQuery({
    queryKey: ['ai-stats'],
    queryFn: () => api.get<AIStats>('/api/ai/stats'),
  });

  const { data: logs, isLoading: loadingLogs } = useQuery({
    queryKey: ['ai-logs'],
    queryFn: () => api.get<AILog[]>('/api/ai/logs?limit=30'),
    refetchInterval: 30000,
  });

  const { register, handleSubmit, watch, setValue } = useForm<AIConfig>({
    values: config,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<AIConfig>) => api.patch('/api/ai/config', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-config'] });
      toast.success('AI settings saved');
    },
    onError: () => toast.error('Failed to save AI settings'),
  });

  const testMutation = useMutation({
    mutationFn: () => api.post('/api/ai/test', { phone: testPhone }),
    onSuccess: () => toast.success('Test message sent! Check your WhatsApp.'),
    onError: (err: { error?: string }) =>
      toast.error(err?.error ?? 'Test failed. Check your Twilio config.'),
  });

  const aiEnabled = watch('aiEnabled');

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title">AI Receptionist</h1>

        {/* Live status toggle */}
        <div className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-btn border-2 cursor-pointer transition-all',
          config?.aiEnabled
            ? 'border-brand bg-brand-light'
            : 'border-border bg-subtle'
        )}
          onClick={() => {
            const newVal = !config?.aiEnabled;
            updateMutation.mutate({ aiEnabled: newVal });
          }}
        >
          <div className={cn(
            'w-2 h-2 rounded-full',
            config?.aiEnabled ? 'bg-brand animate-pulse' : 'bg-muted'
          )} />
          <span className={cn(
            'text-sm font-bold',
            config?.aiEnabled ? 'text-brand' : 'text-muted'
          )}>
            {config?.aiEnabled ? 'Live & Active' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Calls Handled"
          value={stats?.callsHandled ?? 0}
          icon={<Phone className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Appointments Booked"
          value={stats?.appointmentsBooked ?? 0}
          icon={<Calendar className="w-5 h-5" />}
          color="teal"
        />
        <StatCard
          title="Avg Response Time"
          value={stats?.avgResponseTimeMs
            ? `${(stats.avgResponseTimeMs / 1000).toFixed(1)}s`
            : '—'
          }
          icon={<Zap className="w-5 h-5" />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Configuration */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-card-title">AI Configuration</h2>
          </div>
          <form
            onSubmit={handleSubmit((d) => updateMutation.mutate(d))}
            className="card-body space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">Language</label>
              <select className="input" {...register('aiLanguage')}>
                <option value="english">🇬🇧 English</option>
                <option value="arabic">🇦🇪 Arabic (عربي)</option>
                <option value="urdu">🇵🇰 Urdu (اردو)</option>
                <option value="hindi">🇮🇳 Hindi (हिंदी)</option>
              </select>
              <p className="text-xs text-muted mt-1">
                AI will auto-detect and respond in the patient&apos;s language.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">Personality</label>
              <div className="grid grid-cols-3 gap-2">
                {(['professional', 'friendly', 'formal'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setValue('aiPersonality', p)}
                    className={cn(
                      'py-2.5 rounded-btn border-2 text-xs font-bold transition-all capitalize',
                      watch('aiPersonality') === p
                        ? 'border-brand bg-brand-light text-brand'
                        : 'border-border text-muted hover:border-brand/50'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">Reminder Timing</label>
              <select className="input" {...register('reminderTiming')}>
                <option value="24h">24 hours before only</option>
                <option value="2h">2 hours before only</option>
                <option value="both">Both (24h + 2h)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">Custom Greeting Message</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="e.g. Welcome to Rahman Dental! How can I help you today?"
                {...register('customIntroMsg')}
              />
            </div>

            {/* Auto-confirm toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-bold text-primary">Auto-Confirm Appointments</p>
                <p className="text-xs text-muted">AI confirms bookings without manual approval</p>
              </div>
              <div
                className={cn(
                  'w-12 h-6 rounded-full cursor-pointer relative transition-colors',
                  watch('autoConfirm') ? 'bg-brand' : 'bg-border'
                )}
                onClick={() => setValue('autoConfirm', !watch('autoConfirm'))}
                role="switch"
                aria-checked={watch('autoConfirm')}
                tabIndex={0}
              >
                <div className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm',
                  watch('autoConfirm') ? 'translate-x-7' : 'translate-x-1'
                )} />
              </div>
            </div>

            <Button type="submit" loading={updateMutation.isPending}>
              <Save className="w-4 h-4" /> Save AI Settings
            </Button>
          </form>
        </div>

        {/* Activity log */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-card-title">Recent AI Activity</h2>
          </div>
          <div className="card-body p-0 max-h-[480px] overflow-y-auto">
            {loadingLogs ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 items-start px-[18px] py-3 border-b border-[#f8fafc]">
                  <div className="skeleton w-2 h-2 rounded-full mt-1.5" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-48" />
                    <div className="skeleton h-3 w-24" />
                  </div>
                </div>
              ))
            ) : logs?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Bot className="w-10 h-10 text-faint mb-3" />
                <p className="text-sm font-semibold text-muted">No AI activity yet</p>
                <p className="text-xs text-faint mt-1">
                  Activity will appear here once patients start messaging
                </p>
              </div>
            ) : (
              logs?.map((log) => (
                <div
                  key={log.id}
                  className="flex gap-3 items-start px-[18px] py-3 border-b border-[#f8fafc] last:border-0"
                >
                  <div className={cn(
                    'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                    LOG_ACTION_COLORS[log.action] ?? 'bg-brand'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-primary">
                      {log.details}
                    </p>
                    <p className="text-[11px] text-faint mt-0.5">{timeAgo(log.createdAt)}</p>
                  </div>
                  {!log.success && (
                    <span className="chip bg-danger-light text-danger text-[10px] flex-shrink-0">
                      Failed
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Test AI */}
      <div className="card card-body">
        <h2 className="text-card-title mb-3">Test Your AI Receptionist</h2>
        <p className="text-sm text-muted mb-4">
          Send a test WhatsApp message to verify your AI is configured correctly.
        </p>
        <div className="flex gap-3">
          <input
            type="tel"
            className="input flex-1"
            placeholder="Enter your WhatsApp number (e.g. +971501234567)"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
          />
          <Button
            onClick={() => testMutation.mutate()}
            loading={testMutation.isPending}
            disabled={!testPhone.trim()}
            variant="secondary"
          >
            <TestTube2 className="w-4 h-4" /> Send Test
          </Button>
        </div>
      </div>
    </div>
  );
}
