import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  trend?: { value: number; positive?: boolean };
}

const toneMap = {
  primary: 'from-indigo-500/20 to-indigo-500/0 text-indigo-400',
  success: 'from-emerald-500/20 to-emerald-500/0 text-emerald-400',
  warning: 'from-amber-500/20 to-amber-500/0 text-amber-400',
  destructive: 'from-rose-500/20 to-rose-500/0 text-rose-400',
  info: 'from-sky-500/20 to-sky-500/0 text-sky-400',
};

export function StatCard({ label, value, icon: Icon, tone = 'primary', trend }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-5 group hover:border-primary/30 transition-colors">
      <div
        className={cn(
          'absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br blur-2xl opacity-50 group-hover:opacity-80 transition-opacity',
          toneMap[tone],
        )}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            {label}
          </p>
          <p className="mt-2 text-3xl font-display font-bold tracking-tight">{value}</p>
          {trend && (
            <p
              className={cn(
                'mt-1 text-xs font-medium',
                trend.positive ? 'text-emerald-400' : 'text-rose-400',
              )}
            >
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% this week
            </p>
          )}
        </div>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border bg-background/80',
            toneMap[tone].split(' ').filter((c) => c.startsWith('text-')).join(' '),
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
