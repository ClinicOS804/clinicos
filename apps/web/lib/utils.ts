import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { AppointmentStatus, ClinicPlan } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Dates ─────────────────────────────────────────────────────
export function formatDate(d: string | Date) {
  return format(typeof d === 'string' ? parseISO(d) : d, 'MMM d, yyyy');
}
export function formatTime(d: string | Date) {
  return format(typeof d === 'string' ? parseISO(d) : d, 'h:mm a');
}
export function formatDateTime(d: string | Date) {
  return format(typeof d === 'string' ? parseISO(d) : d, 'MMM d, yyyy h:mm a');
}
export function timeAgo(d: string | Date) {
  return formatDistanceToNow(typeof d === 'string' ? parseISO(d) : d, { addSuffix: true });
}

// ── Status chips ──────────────────────────────────────────────
export const STATUS_STYLES: Record<AppointmentStatus, { bg: string; text: string; label: string }> = {
  PENDING:     { bg: 'bg-amber-light',  text: 'text-amber',   label: 'Pending' },
  CONFIRMED:   { bg: 'bg-brand-light',  text: 'text-brand',   label: 'Confirmed' },
  ARRIVED:     { bg: 'bg-blue-light',   text: 'text-blue-500',label: 'Arrived' },
  IN_PROGRESS: { bg: 'bg-purple-light', text: 'text-purple',  label: 'In Progress' },
  COMPLETED:   { bg: 'bg-subtle',       text: 'text-muted',   label: 'Completed' },
  CANCELLED:   { bg: 'bg-danger-light', text: 'text-danger',  label: 'Cancelled' },
  NO_SHOW:     { bg: 'bg-danger-light', text: 'text-red-800', label: 'No Show' },
  RESCHEDULED: { bg: 'bg-blue-light',   text: 'text-blue-500',label: 'Rescheduled' },
};

// ── Channel colours ────────────────────────────────────────────
export const CHANNEL_COLORS: Record<string, string> = {
  WHATSAPP:       '#25d366',
  SMS:            '#3b82f6',
  CALL:           '#f59e0b',
  EMAIL:          '#7c3aed',
  MANUAL:         '#64748b',
  ONLINE_BOOKING: '#00c896',
  STAFF_PORTAL:   '#64748b',
};

// ── Avatar ─────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-red-500',
];
export function getAvatarColor(name: string) {
  let h = 0;
  for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
export function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

// ── Plan ───────────────────────────────────────────────────────
export const PLAN_DETAILS: Record<ClinicPlan, { label: string; price: number; color: string }> = {
  TRIAL:      { label: 'Free Trial', price: 0,  color: 'text-muted' },
  STARTER:    { label: 'Starter',    price: 29, color: 'text-blue-500' },
  PRO:        { label: 'Pro',        price: 59, color: 'text-brand' },
  ENTERPRISE: { label: 'Enterprise', price: 99, color: 'text-purple' },
};

// ── Numbers ────────────────────────────────────────────────────
export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}
export function formatPercent(value: number, showSign = false) {
  return `${showSign && value > 0 ? '+' : ''}${value}%`;
}
