'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { cn, timeAgo, CHANNEL_COLORS } from '@/lib/utils';
import { Send, Bot, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import type { Message, Patient } from '@/types';

interface Thread {
  patient: Pick<Patient, 'id' | 'fullName' | 'phone'>;
  messages: Message[];
  aiSuggestion?: string;
}

const CHANNEL_TABS = ['ALL', 'WHATSAPP', 'SMS', 'EMAIL'] as const;
type ChannelTab = typeof CHANNEL_TABS[number];

export default function MessagesPage() {
  const qc = useQueryClient();
  const [activeChannel, setActiveChannel] = useState<ChannelTab>('ALL');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', activeChannel],
    queryFn: () =>
      api.get<Message[]>(
        `/api/messages?${activeChannel !== 'ALL' ? `channel=${activeChannel}` : ''}&limit=50`
      ),
    refetchInterval: 15000, // poll every 15s as fallback for Socket.io
  });

  const { data: thread, isLoading: loadingThread } = useQuery({
    queryKey: ['thread', selectedPatientId],
    queryFn: () => api.get<Thread>(`/api/messages/threads/${selectedPatientId}`),
    enabled: !!selectedPatientId,
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) =>
      api.post('/api/messages/send', {
        patientId: selectedPatientId,
        body,
        channel: 'WHATSAPP',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['thread', selectedPatientId] });
      qc.invalidateQueries({ queryKey: ['messages'] });
      setReplyText('');
      toast.success('Message sent');
    },
    onError: () => toast.error('Failed to send message'),
  });

  // Group messages by patient (unique threads)
  const threads = messages?.reduce<Record<string, { patient: Message['patient']; lastMsg: Message; unread: number }>>((acc, msg) => {
    const key = msg.patientId ?? msg.fromNumber;
    if (!acc[key] || new Date(msg.createdAt) > new Date(acc[key].lastMsg.createdAt)) {
      acc[key] = {
        patient: msg.patient,
        lastMsg: msg,
        unread: (acc[key]?.unread ?? 0) + (!msg.isRead && msg.direction === 'INBOUND' ? 1 : 0),
      };
    }
    return acc;
  }, {});

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)]">
      <h1 className="text-page-title">Messages</h1>

      <div className="flex gap-4 h-[calc(100%-4rem)]">
        {/* Left: conversation list */}
        <div className={cn(
          'card flex flex-col',
          selectedPatientId ? 'hidden md:flex w-80 flex-shrink-0' : 'flex flex-1 md:w-80 md:flex-shrink-0 md:flex-grow-0'
        )}>
          {/* Channel tabs */}
          <div className="p-3 border-b border-border flex gap-1 overflow-x-auto">
            {CHANNEL_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveChannel(tab)}
                className={cn(
                  'px-3 py-1.5 rounded-btn text-xs font-bold whitespace-nowrap transition-all',
                  activeChannel === tab ? 'bg-brand text-white' : 'bg-subtle text-muted hover:bg-border'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border-b border-[#f8fafc]">
                  <div className="skeleton w-9 h-9 rounded-[10px]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-24" />
                    <div className="skeleton h-3 w-40" />
                  </div>
                </div>
              ))
            ) : !threads || Object.keys(threads).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageSquare className="w-10 h-10 text-faint mb-3" />
                <p className="text-sm font-semibold text-muted">No messages yet</p>
              </div>
            ) : (
              Object.entries(threads).map(([key, { patient, lastMsg, unread }]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPatientId(lastMsg.patientId ?? null)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 border-b border-[#f8fafc] hover:bg-subtle transition-colors text-left',
                    selectedPatientId === lastMsg.patientId && 'bg-brand-light/40'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar name={patient?.fullName ?? lastMsg.fromNumber} size="md" />
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                      style={{ backgroundColor: CHANNEL_COLORS[lastMsg.channel] }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-primary truncate">
                        {patient?.fullName ?? lastMsg.fromNumber}
                      </p>
                      <p className="text-[11px] text-faint flex-shrink-0">{timeAgo(lastMsg.createdAt)}</p>
                    </div>
                    <p className="text-xs text-muted truncate mt-0.5">{lastMsg.body}</p>
                    {unread > 0 && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-brand text-white text-[10px] font-bold rounded-full">
                        {unread} new
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: conversation thread */}
        {selectedPatientId ? (
          <div className="card flex flex-col flex-1 min-w-0">
            {/* Thread header */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <button
                onClick={() => setSelectedPatientId(null)}
                className="md:hidden text-muted hover:text-primary mr-1"
                aria-label="Back to list"
              >
                ←
              </button>
              {thread?.patient && <Avatar name={thread.patient.fullName} size="md" />}
              <div>
                <p className="text-sm font-bold text-primary">{thread?.patient?.fullName}</p>
                <p className="text-xs text-muted">{thread?.patient?.phone}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingThread ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
                    <div className="skeleton h-12 w-56 rounded-[14px]" />
                  </div>
                ))
              ) : (
                thread?.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn('flex', msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start')}
                  >
                    <div className={cn(
                      'max-w-[75%] px-4 py-2.5 rounded-[14px] text-sm',
                      msg.direction === 'OUTBOUND'
                        ? 'bg-brand text-white rounded-br-sm'
                        : 'bg-subtle text-primary rounded-bl-sm',
                    )}>
                      <p className="leading-relaxed">{msg.body}</p>
                      <div className={cn(
                        'flex items-center gap-1.5 mt-1',
                        msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'
                      )}>
                        <p className={cn(
                          'text-[10px]',
                          msg.direction === 'OUTBOUND' ? 'text-white/70' : 'text-faint'
                        )}>
                          {timeAgo(msg.createdAt)}
                        </p>
                        {msg.isHandledByAI && (
                          <span className={cn(
                            'text-[10px] font-bold flex items-center gap-0.5',
                            msg.direction === 'OUTBOUND' ? 'text-white/80' : 'text-brand'
                          )}>
                            <Bot className="w-2.5 h-2.5" /> AI
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* AI Suggestion */}
            {thread?.aiSuggestion && (
              <div className="mx-4 mb-2 bg-brand-light rounded-btn px-3 py-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Bot className="w-4 h-4 text-brand flex-shrink-0" />
                  <p className="text-xs font-semibold text-brand truncate">
                    AI suggests: {thread.aiSuggestion}
                  </p>
                </div>
                <button
                  onClick={() => setReplyText(thread.aiSuggestion ?? '')}
                  className="text-xs font-bold text-brand hover:text-brand-dark flex-shrink-0"
                >
                  Use →
                </button>
              </div>
            )}

            {/* Reply box */}
            <div className="p-3 border-t border-border flex items-end gap-2">
              <textarea
                className="input flex-1 resize-none text-sm min-h-[44px] max-h-32"
                placeholder="Type a message..."
                rows={1}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (replyText.trim()) sendMutation.mutate(replyText);
                  }
                }}
              />
              <Button
                onClick={() => { if (replyText.trim()) sendMutation.mutate(replyText); }}
                loading={sendMutation.isPending}
                disabled={!replyText.trim()}
                className="flex-shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex card flex-1 items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-faint mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted">Select a conversation</p>
              <p className="text-xs text-faint mt-1">Choose a patient from the left to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
