import { z } from 'zod';

export const CreateAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  treatment: z.string().min(1, 'Treatment is required'),
  dateTime: z.string().datetime({ message: 'Valid date/time required' }),
  durationMin: z.number().int().min(15).max(120).default(30),
  fee: z.number().positive().optional(),
  notes: z.string().optional(),
  channel: z
    .enum(['MANUAL', 'WHATSAPP', 'SMS', 'CALL', 'EMAIL', 'ONLINE_BOOKING', 'STAFF_PORTAL'])
    .default('MANUAL'),
  sendConfirmation: z.boolean().default(true),
});

export const UpdateAppointmentSchema = z.object({
  status: z
    .enum([
      'PENDING',
      'CONFIRMED',
      'ARRIVED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
      'RESCHEDULED',
    ])
    .optional(),
  treatment: z.string().optional(),
  dateTime: z.string().datetime().optional(),
  durationMin: z.number().int().min(15).max(120).optional(),
  fee: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const SlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  duration: z.string().optional(),
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;
