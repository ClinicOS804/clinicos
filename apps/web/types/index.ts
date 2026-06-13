export type UserRole = 'DOCTOR' | 'STAFF' | 'SUPERADMIN';
export type ClinicPlan = 'TRIAL' | 'STARTER' | 'PRO' | 'ENTERPRISE';
export type PlanStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIALING';
export type StaffRole = 'RECEPTIONIST' | 'NURSE' | 'ASSISTANT' | 'MANAGER';

export interface AuthUser {
  id: string;
  clinicId: string;
  role: UserRole;
  name: string;
  email: string;
  clinicName?: string;
  logoUrl?: string | null;
  plan?: ClinicPlan;
  planStatus?: PlanStatus;
  onboardingDone?: boolean;
  staffRole?: StaffRole;
}

export interface Clinic {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  specialty?: string;
  address?: string;
  logoUrl?: string | null;
  bookingSlug: string;
  timezone: string;
  workingHours?: string;
  treatments?: string;
  defaultFee?: number;
  aiEnabled: boolean;
  aiLanguage: string;
  aiPersonality: string;
  autoConfirm: boolean;
  reminderTiming: string;
  reviewTiming: string;
  customIntroMsg?: string;
  googlePlaceId?: string;
  plan: ClinicPlan;
  planStatus: PlanStatus;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  isActive: boolean;
  onboardingDone: boolean;
  createdAt: string;
}

export type AppointmentStatus =
  | 'PENDING' | 'CONFIRMED' | 'ARRIVED' | 'IN_PROGRESS'
  | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED';

export type BookingChannel =
  | 'MANUAL' | 'WHATSAPP' | 'SMS' | 'CALL' | 'EMAIL' | 'ONLINE_BOOKING' | 'STAFF_PORTAL';

export interface Patient {
  id: string;
  clinicId: string;
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  medicalNotes?: string;
  allergies?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  _count?: { appointments: number };
  appointments?: Appointment[];
  messages?: Message[];
}

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  patient?: Pick<Patient, 'id' | 'fullName' | 'phone' | 'email'>;
  treatment: string;
  dateTime: string;
  durationMin: number;
  status: AppointmentStatus;
  channel: BookingChannel;
  notes?: string;
  fee?: number;
  bookedByAI: boolean;
  confirmationSent: boolean;
  createdAt: string;
}

export type MessageChannel = 'WHATSAPP' | 'SMS' | 'CALL' | 'EMAIL';
export type MessageDirection = 'INBOUND' | 'OUTBOUND';

export interface Message {
  id: string;
  clinicId: string;
  patientId?: string;
  patient?: Pick<Patient, 'id' | 'fullName' | 'phone'>;
  channel: MessageChannel;
  direction: MessageDirection;
  fromNumber: string;
  toNumber: string;
  body: string;
  isRead: boolean;
  isHandledByAI: boolean;
  aiConfidence?: number;
  needsReview: boolean;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  clinicId: string;
  name: string;
  email: string;
  phone?: string;
  role: StaffRole;
  isActive: boolean;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  lastLogin?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  clinicId: string;
  title: string;
  body: string;
  type: string;
  color: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AILog {
  id: string;
  clinicId: string;
  action: string;
  details: string;
  patientId?: string;
  success: boolean;
  error?: string;
  durationMs?: number;
  createdAt: string;
}

export interface AnalyticsOverview {
  revenue: { value: number; change: number };
  appointments: { value: number; change: number };
  returnRate: { value: number; change: number };
  noShowRate: { value: number; change: number };
  totalPatients: number;
  totalCompleted: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
