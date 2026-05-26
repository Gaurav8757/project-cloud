import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ListChecks, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage, getInitials } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { TaskDetailDialog } from '@/components/tasks/TaskDetailDialog';
import { taskService } from '@/services/task.service';
import { projectService } from '@/services/project.service';
import { taskStatusMeta, priorityMeta, formatRelativeDate } from '@/utils/meta';
import { cn } from '@/lib/utils';
import { useDebounced } from '@/hooks/useDebounced';
import type { TaskStatus } from '@/types';

export default function TasksPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 250);
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [projectId, setProjectId] = useState('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: projects } = useQuery({
    queryKey: ['projects', { limit: 100 }],
    queryFn: () => projectService.list({ limit: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { debouncedSearch, status, priority, projectId }],
    queryFn: () =>
      taskService.list({
        search: debouncedSearch || undefined,
        status: status === 'all' ? undefined : status,
        priority: priority === 'all' ? undefined : priority,
        projectId: projectId === 'all' ? undefined : projectId,
        sortBy: 'dueDate',
        sortOrder: 'asc',
        limit: 50,
      }),
  });

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
          Work
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">All tasks</h1>
        <p className="mt-1 text-muted-foreground">
          {data?.meta.total ?? 0} tasks across your projects
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger>
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects?.items.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="TODO">To do</SelectItem>
              <SelectItem value="IN_PROGRESS">In progress</SelectItem>
              <SelectItem value="REVIEW">Review</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <ul className="divide-y divide-border">
            {data.items.map((task) => {
              const isOverdue =
                task.dueDate &&
                task.status !== 'COMPLETED' &&
                new Date(task.dueDate) < new Date();
              return (
                <li
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_140px_120px_auto] items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors cursor-pointer"
                >
                  <span
                    className={cn('h-2 w-2 rounded-full', taskStatusMeta[task.status as TaskStatus].dot)}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {task.project?.name ?? 'Project'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'hidden sm:inline-flex justify-self-start',
                      taskStatusMeta[task.status as TaskStatus].color,
                    )}
                  >
                    {taskStatusMeta[task.status as TaskStatus].label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      'hidden sm:inline-flex justify-self-start',
                      priorityMeta[task.priority].className,
                    )}
                  >
                    {priorityMeta[task.priority].icon} {priorityMeta[task.priority].label}
                  </Badge>
                  <div className="flex items-center gap-3 justify-self-end">
                    {task.dueDate && (
                      <span
                        className={cn(
                          'text-xs font-mono inline-flex items-center gap-1',
                          isOverdue ? 'text-rose-400' : 'text-muted-foreground',
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        {formatRelativeDate(task.dueDate)}
                      </span>
                    )}
                    {task.assignee && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignee.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          {getInitials(task.assignee.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={ListChecks}
              title="No tasks match your filters"
              description="Try adjusting search or filter criteria."
            />
          </div>
        )}
      </div>

      <TaskDetailDialog
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onOpenChange={(v) => !v && setSelectedTaskId(null)}
      />
    </div>
  );
}
