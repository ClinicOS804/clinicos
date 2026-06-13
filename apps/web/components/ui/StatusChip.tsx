import { cn, STATUS_STYLES } from '@/lib/utils';
import type { AppointmentStatus } from '@/types';

export function StatusChip({ status, className }: { status: AppointmentStatus; className?: string }) {
  const s = STATUS_STYLES[status];
  return <span className={cn('chip', s.bg, s.text, className)}>{s.label}</span>;
}
