import { Link } from 'react-router-dom';
import { Calendar, Users, ListChecks, MoreVertical, Trash2, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage, getInitials } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/primitives';
import { projectStatusMeta, priorityMeta, formatRelativeDate } from '@/utils/meta';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  onEdit?: (p: Project) => void;
  onDelete?: (p: Project) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const accent = project.color || '#6366f1';

  return (
    <div className="group relative rounded-xl border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all">
      {/* color stripe */}
      <div className="h-1.5 w-full" style={{ background: accent }} />

      <div className="p-5">
        <div className="flex items-start justify-between">
          <Link to={`/projects/${project.id}`} className="block flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={cn('font-medium', projectStatusMeta[project.status].className)}>
                {projectStatusMeta[project.status].label}
              </Badge>
              <Badge variant="outline" className={cn('font-medium', priorityMeta[project.priority].className)}>
                <span>{priorityMeta[project.priority].icon}</span>
                {priorityMeta[project.priority].label}
              </Badge>
            </div>
            <h3 className="font-display font-semibold text-lg leading-tight truncate group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
              {project.description || 'No description provided.'}
            </p>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded-md"
                aria-label="More options"
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Pencil /> Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(project)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* progress */}
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-mono font-medium">{project.progress}%</span>
          </div>
          <Progress
            value={project.progress}
            indicatorColor={`linear-gradient(90deg, ${accent}, ${accent}aa)`}
          />
        </div>

        {/* footer */}
        <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <ListChecks className="h-3.5 w-3.5" />
              {project._count.tasks}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {project.members.length}
            </span>
            {project.deadline && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatRelativeDate(project.deadline)}
              </span>
            )}
          </div>
          <div className="flex -space-x-2">
            {project.members.slice(0, 4).map((m) => (
              <Avatar key={m.id} className="h-6 w-6 ring-2 ring-card">
                <AvatarImage src={m.user.avatarUrl ?? undefined} />
                <AvatarFallback className="text-[9px] bg-primary/15 text-primary">
                  {getInitials(m.user.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {project.members.length > 4 && (
              <div className="h-6 w-6 rounded-full ring-2 ring-card bg-muted text-[9px] grid place-items-center font-medium text-muted-foreground">
                +{project.members.length - 4}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
