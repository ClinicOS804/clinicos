import { z } from 'zod';

export const UpdateClinicSchema = z.object({
  name: z.string().min(2).optional(),
  ownerName: z.string().min(2).optional(),
  phone: z.string().min(7).optional(),
  email: z.string().email().optional(),
  specialty: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  bookingSlug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
});

export const UpdateAISettingsSchema = z.object({
  aiEnabled: z.boolean().optional(),
  aiLanguage: z.enum(['english', 'arabic', 'urdu', 'hindi']).optional(),
  aiPersonality: z.enum(['professional', 'friendly', 'formal']).optional(),
  autoConfirm: z.boolean().optional(),
  reminderTiming: z.enum(['24h', '2h', 'both']).optional(),
  reviewTiming: z.string().optional(),
  customIntroMsg: z.string().optional(),
});

export const UpdateWorkingHoursSchema = z.object({
  workingHours: z.string(), // JSON string of working hours
});

export const UpdateTreatmentsSchema = z.object({
  treatments: z.string(), // JSON string of treatments array
});

export type UpdateClinicInput = z.infer<typeof UpdateClinicSchema>;
export type UpdateAISettingsInput = z.infer<typeof UpdateAISettingsSchema>;
