import { cn, formatPercent } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  color?: 'teal' | 'blue' | 'amber' | 'red' | 'purple';
  loading?: boolean;
  subtitle?: string;
}

const colors = {
  teal:   { icon: 'bg-brand-light text-brand',   border: 'border-l-brand' },
  blue:   { icon: 'bg-blue-light text-blue-500', border: 'border-l-blue-500' },
  amber:  { icon: 'bg-amber-light text-amber',   border: 'border-l-amber' },
  red:    { icon: 'bg-danger-light text-danger', border: 'border-l-danger' },
  purple: { icon: 'bg-purple-light text-purple', border: 'border-l-purple' },
};

export function StatCard({ title, value, change, icon, color = 'teal', loading, subtitle }: StatCardProps) {
  const c = colors[color];

  if (loading) {
    return (
      <div className="card p-5">
        <div className="skeleton h-3 w-24 mb-3 rounded" />
        <div className="skeleton h-8 w-16 mb-2 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    );
  }

  return (
    <div className={cn('card p-5 border-l-4', c.border)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">{title}</p>
          <p className="text-stat text-primary leading-none">{value}</p>
          {subtitle && <p className="text-xs text-muted mt-1 font-semibold">{subtitle}</p>}
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-bold', change >= 0 ? 'text-success' : 'text-danger')}>
              {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{formatPercent(Math.abs(change), false)} vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('w-10 h-10 rounded-btn flex items-center justify-center flex-shrink-0', c.icon)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
