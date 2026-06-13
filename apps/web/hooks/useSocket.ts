'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import type { Notification } from '@/types';

const SOCKET_URL =
  typeof window !== 'undefined'
    ? window.location.origin          // same origin in production
    : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001');

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { user, addNotification } = useStore();

  useEffect(() => {
    if (!user?.clinicId) return;

    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:clinic', user.clinicId);
    });

    socket.on('notification:new', (n: Notification) => {
      addNotification(n);
      const toasters: Record<string, () => void> = {
        teal:  () => toast.success(n.body, { description: n.title }),
        red:   () => toast.error(n.body,   { description: n.title }),
        amber: () => toast.warning(n.body, { description: n.title }),
        blue:  () => toast.info(n.body,    { description: n.title }),
      };
      (toasters[n.color] ?? toasters.teal)();
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user?.clinicId, addNotification]);

  return socketRef.current;
}
