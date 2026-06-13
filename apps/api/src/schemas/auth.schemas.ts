import { z } from 'zod';

export const RegisterSchema = z.object({
  // Doctor personal info
  ownerName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(7, 'Phone number is required'),
  // Clinic info
  clinicName: z.string().min(2, 'Clinic name is required'),
  specialty: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().default('Asia/Dubai'),
  // Onboarding optional at register time
  workingHours: z.string().optional(),
  treatments: z.string().optional(),
  bookingSlug: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const StaffLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
