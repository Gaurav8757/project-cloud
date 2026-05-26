import { Calendar, MessageSquare, CheckSquare, Paperclip } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage, getInitials } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { priorityMeta, formatRelativeDate } from '@/utils/meta';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface KanbanCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}

export function KanbanCard({ task, onClick, isDragging }: KanbanCardProps) {
  const isOverdue =
    task.dueDate && task.status !== 'COMPLETED' && new Date(task.dueDate) < new Date();

  return (
    <div
      onClick={onClick}
      className={cn(
        'group p-3.5 rounded-lg border bg-card hover:border-primary/40 hover:shadow-md transition-all cursor-pointer',
        isDragging && 'rotate-1 shadow-2xl border-primary/50 ring-2 ring-primary/20',
      )}
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground uppercase tracking-wider"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <h4 className="text-sm font-medium leading-snug line-clamp-2">{task.title}</h4>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge
            variant="outline"
            className={cn('text-[10px] py-0 h-5 px-1.5', priorityMeta[task.priority].className)}
          >
            <span>{priorityMeta[task.priority].icon}</span>
            {priorityMeta[task.priority].label}
          </Badge>
          {task.dueDate && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[10px]',
                isOverdue && 'text-rose-400 font-medium',
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatRelativeDate(task.dueDate)}
            </span>
          )}
        </div>
        {task.assignee && (
          <Avatar className="h-6 w-6">
            <AvatarImage src={task.assignee.avatarUrl ?? undefined} />
            <AvatarFallback className="text-[9px] bg-primary/15 text-primary">
              {getInitials(task.assignee.name)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Activity indicators */}
      {task._count && (task._count.comments > 0 || task._count.attachments > 0 || task._count.subtasks > 0) && (
        <div className="mt-2 pt-2 border-t border-border flex items-center gap-3 text-[11px] text-muted-foreground">
          {task._count.comments > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {task._count.comments}
            </span>
          )}
          {task._count.subtasks > 0 && (
            <span className="inline-flex items-center gap-1">
              <CheckSquare className="h-3 w-3" />
              {task._count.subtasks}
            </span>
          )}
          {task._count.attachments > 0 && (
            <span className="inline-flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {task._count.attachments}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
