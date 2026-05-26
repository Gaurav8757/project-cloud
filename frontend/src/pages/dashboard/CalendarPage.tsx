import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  format,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskDetailDialog } from '@/components/tasks/TaskDetailDialog';
import { taskService } from '@/services/task.service';
import { cn } from '@/lib/utils';
import { taskStatusMeta } from '@/utils/meta';
import type { Task, TaskStatus } from '@/types';

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['tasks', 'calendar'],
    queryFn: () => taskService.list({ limit: 100, sortBy: 'dueDate', sortOrder: 'asc' }),
  });

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    if (!data) return map;
    data.items.forEach((t) => {
      if (!t.dueDate) return;
      const key = format(new Date(t.dueDate), 'yyyy-MM-dd');
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    });
    return map;
  }, [data]);

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
            Schedule
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonth((m) => subMonths(m, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="font-display text-lg font-semibold min-w-[160px] text-center">
            {format(month, 'MMMM yyyy')}
          </p>
          <Button variant="outline" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMonth(new Date())}>
            Today
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-border">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div
              key={d}
              className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)]">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayTasks = tasksByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, month);
            const today = isToday(day);
            return (
              <div
                key={key}
                className={cn(
                  'p-2 border-r border-b border-border last:border-r-0 transition-colors',
                  !inMonth && 'bg-card/40 text-muted-foreground',
                  today && 'bg-primary/[0.04]',
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      today &&
                        'inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {dayTasks.length}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTaskId(t.id)}
                      className={cn(
                        'w-full text-left text-[11px] px-1.5 py-0.5 rounded truncate transition-colors hover:bg-accent',
                        taskStatusMeta[t.status as TaskStatus].color,
                      )}
                    >
                      {t.title}
                    </button>
                  ))}
                  {dayTasks.length > 3 && (
                    <p className="text-[10px] text-muted-foreground px-1.5">
                      + {dayTasks.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'] as TaskStatus[]).map((s) => (
          <Badge key={s} variant="outline" className={taskStatusMeta[s].color}>
            <span className={`h-1.5 w-1.5 rounded-full ${taskStatusMeta[s].dot}`} />
            {taskStatusMeta[s].label}
          </Badge>
        ))}
        <span className="ml-auto text-muted-foreground inline-flex items-center gap-1">
          <CalIcon className="h-3 w-3" />
          {data?.meta.total ?? 0} scheduled tasks
        </span>
      </div>

      <TaskDetailDialog
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onOpenChange={(v) => !v && setSelectedTaskId(null)}
      />
    </div>
  );
}
