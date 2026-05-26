import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Users,
  Plus,
  Pencil,
  Settings as SettingsIcon,
  Activity,
} from 'lucide-react';
import { projectService } from '@/services/project.service';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage, getInitials } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/primitives';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/primitives';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { TaskDetailDialog } from '@/components/tasks/TaskDetailDialog';
import { TaskCreateDialog } from '@/components/tasks/TaskCreateDialog';
import { ProjectFormDialog } from '@/components/projects/ProjectFormDialog';
import { projectStatusMeta, priorityMeta, formatRelativeDate } from '@/utils/meta';
import { EmptyState } from '@/components/common/EmptyState';
import type { Task, TaskStatus } from '@/types';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>('TODO');
  const [editOpen, setEditOpen] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.get(id!),
    enabled: !!id,
  });

  const { data: analytics } = useQuery({
    queryKey: ['project', id, 'analytics'],
    queryFn: () => projectService.analytics(id!),
    enabled: !!id,
  });

  if (isLoading || !project) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  const accent = project.color || '#6366f1';

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Back */}
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border bg-card p-6">
        <div
          className="absolute -top-32 -right-32 h-72 w-72 rounded-full blur-3xl opacity-30"
          style={{ background: accent }}
        />
        <div className="relative grid lg:grid-cols-[1fr_320px] gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge className={projectStatusMeta[project.status].className}>
                {projectStatusMeta[project.status].label}
              </Badge>
              <Badge variant="outline" className={priorityMeta[project.priority].className}>
                {priorityMeta[project.priority].icon} {priorityMeta[project.priority].label}
              </Badge>
            </div>
            <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-3 text-muted-foreground max-w-3xl leading-relaxed">
                {project.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {project.deadline && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Due {formatRelativeDate(project.deadline)}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {project.members.length} member{project.members.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Progress */}
            <div>
              <div className="flex items-end justify-between mb-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Progress
                </p>
                <p className="font-display text-2xl font-bold">{project.progress}%</p>
              </div>
              <Progress value={project.progress} indicatorColor={`linear-gradient(90deg, ${accent}, ${accent}aa)`} />
            </div>

            {/* Members */}
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Team
              </p>
              <div className="flex flex-wrap gap-2">
                {project.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 rounded-full bg-secondary/60 pl-1 pr-3 py-1"
                    title={`${m.user.name} · ${m.role}`}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={m.user.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-[10px]">{getInitials(m.user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{m.user.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={() => {
                  setCreateStatus('TODO');
                  setCreateOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                New task
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">
            <SettingsIcon className="h-3.5 w-3.5 mr-1" />
            Board
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-3.5 w-3.5 mr-1" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-6">
          <KanbanBoard
            projectId={project.id}
            onAdd={(status) => {
              setCreateStatus(status);
              setCreateOpen(true);
            }}
            onTaskClick={(task: Task) => setSelectedTaskId(task.id)}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          {analytics && (analytics as { recent: unknown[] }).recent?.length ? (
            <ul className="space-y-3">
              {(analytics as { recent: Array<{ id: string; action: string; entity: string; createdAt: string; user?: { name: string; avatarUrl?: string | null } }> }).recent.map(
                (a) => (
                  <li
                    key={a.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={a.user?.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {a.user ? getInitials(a.user.name) : '··'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{a.user?.name ?? 'System'}</span>{' '}
                        <span className="text-muted-foreground">
                          {a.action.toLowerCase().replace('_', ' ')} {a.entity.toLowerCase()}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeDate(a.createdAt)}
                      </p>
                    </div>
                  </li>
                ),
              )}
            </ul>
          ) : (
            <EmptyState icon={Activity} title="No activity yet" description="Actions in this project will appear here." />
          )}
        </TabsContent>
      </Tabs>

      <TaskDetailDialog
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onOpenChange={(v) => !v && setSelectedTaskId(null)}
      />
      <TaskCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={project.id}
        defaultStatus={createStatus}
        members={project.members}
      />
      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
    </div>
  );
}
