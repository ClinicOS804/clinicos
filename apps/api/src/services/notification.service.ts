import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export function setSocketServer(socketServer: SocketServer): void {
  io = socketServer;
}

export interface CreateNotificationInput {
  clinicId: string;
  title: string;
  body: string;
  type: 'message' | 'cancellation' | 'new_patient' | 'ai_action' | 'payment' | 'missed_call' | 'ai_escalate';
  color?: string;
  link?: string;
}

const typeColorMap: Record<string, string> = {
  message: 'teal',
  ai_action: 'teal',
  cancellation: 'red',
  new_patient: 'blue',
  missed_call: 'amber',
  payment: 'red',
  ai_escalate: 'amber',
};

/**
 * Creates a notification in the DB and emits it via Socket.io for real-time delivery.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    const color = input.color ?? typeColorMap[input.type] ?? 'teal';

    const notification = await prisma.notification.create({
      data: {
        clinicId: input.clinicId,
        title: input.title,
        body: input.body,
        type: input.type,
        color,
        link: input.link,
      },
    });

    // Emit real-time notification to the clinic's private Socket.io room
    if (io) {
      io.to(input.clinicId).emit('notification:new', {
        id: notification.id,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        color: notification.color,
        link: notification.link,
        createdAt: notification.createdAt,
      });
    }
  } catch (err) {
    logger.error('Failed to create notification', { input, err });
  }
}
