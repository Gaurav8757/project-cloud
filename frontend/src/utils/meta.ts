import type { Priority, ProjectStatus, TaskStatus } from '@/types';

export const taskStatusMeta: Record<TaskStatus, { label: string; color: string; dot: string }> = {
  TODO: { label: 'To do', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30', dot: 'bg-slate-400' },
  IN_PROGRESS: {
    label: 'In progress',
    color: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    dot: 'bg-sky-400',
  },
  REVIEW: {
    label: 'In review',
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
};

export const projectStatusMeta: Record<ProjectStatus, { label: string; className: string }> = {
  PLANNING: { label: 'Planning', className: 'bg-violet-500/15 text-violet-400' },
  ACTIVE: { label: 'Active', className: 'bg-emerald-500/15 text-emerald-400' },
  ON_HOLD: { label: 'On hold', className: 'bg-amber-500/15 text-amber-400' },
  COMPLETED: { label: 'Completed', className: 'bg-sky-500/15 text-sky-400' },
  ARCHIVED: { label: 'Archived', className: 'bg-slate-500/15 text-slate-400' },
};

export const priorityMeta: Record<Priority, { label: string; className: string; icon: string }> = {
  LOW: { label: 'Low', className: 'text-slate-400 bg-slate-500/10', icon: '↓' },
  MEDIUM: { label: 'Medium', className: 'text-sky-400 bg-sky-500/10', icon: '→' },
  HIGH: { label: 'High', className: 'text-amber-400 bg-amber-500/10', icon: '↑' },
  URGENT: { label: 'Urgent', className: 'text-rose-400 bg-rose-500/10', icon: '⚡' },
};

export const formatRelativeDate = (iso?: string | Date | null): string => {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const diff = (d.getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const fmt = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (abs < 60) return fmt.format(Math.round(diff), 'second');
  if (abs < 3600) return fmt.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return fmt.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 7) return fmt.format(Math.round(diff / 86400), 'day');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};
