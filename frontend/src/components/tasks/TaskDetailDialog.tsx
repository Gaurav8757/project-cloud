import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  MessageSquare,
  Tag,
  User as UserIcon,
  Loader2,
  Send,
  Plus,
  Trash2,
  CheckSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage, getInitials } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/primitives';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { taskService } from '@/services/task.service';
import { taskStatusMeta, priorityMeta, formatRelativeDate } from '@/utils/meta';
import { useAuthStore } from '@/store/auth.store';
import type { TaskStatus } from '@/types';

interface TaskDetailDialogProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function TaskDetailDialog({ taskId, open, onOpenChange }: TaskDetailDialogProps) {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [commentBody, setCommentBody] = useState('');
  const [newChecklist, setNewChecklist] = useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => (taskId ? taskService.get(taskId) : Promise.resolve(null)),
    enabled: !!taskId && open,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      taskService.update(taskId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', taskId] });
      qc.invalidateQueries({ queryKey: ['board'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) => taskService.comment(taskId!, body),
    onSuccess: () => {
      setCommentBody('');
      qc.invalidateQueries({ queryKey: ['task', taskId] });
    },
    onError: () => toast.error('Failed to post comment'),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => taskService.deleteComment(taskId!, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskId] }),
  });

  const addChecklistMutation = useMutation({
    mutationFn: (text: string) => taskService.addChecklistItem(taskId!, text),
    onSuccess: () => {
      setNewChecklist('');
      qc.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });
  const toggleChecklistMutation = useMutation({
    mutationFn: ({ itemId, done }: { itemId: string; done: boolean }) =>
      taskService.toggleChecklistItem(taskId!, itemId, done),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskId] }),
  });
  const deleteChecklistMutation = useMutation({
    mutationFn: (itemId: string) => taskService.deleteChecklistItem(taskId!, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskId] }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => taskService.remove(taskId!),
    onSuccess: () => {
      toast.success('Task deleted');
      qc.invalidateQueries({ queryKey: ['board'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
        {isLoading || !task ? (
          <div className="space-y-3">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={taskStatusMeta[task.status].color}>
                  <span className={`h-1.5 w-1.5 rounded-full ${taskStatusMeta[task.status].dot}`} />
                  {taskStatusMeta[task.status].label}
                </Badge>
                <Badge variant="outline" className={priorityMeta[task.priority].className}>
                  {priorityMeta[task.priority].icon} {priorityMeta[task.priority].label}
                </Badge>
                {task.project && (
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ background: `${task.project.color}22`, color: task.project.color ?? undefined }}
                  >
                    {task.project.name}
                  </span>
                )}
              </div>
              <DialogTitle className="text-xl font-display">{task.title}</DialogTitle>
              <DialogDescription>
                Created by {task.createdBy.name} · {formatRelativeDate(task.createdAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="grid md:grid-cols-[1fr_220px] gap-6 mt-4">
              {/* Main */}
              <div className="space-y-6 min-w-0">
                {/* Description */}
                <section>
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                    Description
                  </h4>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {task.description || (
                      <span className="text-muted-foreground italic">No description.</span>
                    )}
                  </p>
                </section>

                {/* Checklist */}
                <section>
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-2">
                    <CheckSquare className="h-3.5 w-3.5" />
                    Checklist
                  </h4>
                  <div className="space-y-1.5">
                    {task.checklist?.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center gap-3 p-2 rounded-md hover:bg-accent/40"
                      >
                        <Checkbox
                          checked={item.done}
                          onCheckedChange={(c) =>
                            toggleChecklistMutation.mutate({ itemId: item.id, done: !!c })
                          }
                        />
                        <span
                          className={`text-sm flex-1 ${item.done ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {item.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteChecklistMutation.mutate(item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          aria-label="Delete item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a checklist item"
                        value={newChecklist}
                        onChange={(e) => setNewChecklist(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newChecklist.trim()) {
                            addChecklistMutation.mutate(newChecklist.trim());
                          }
                        }}
                        className="h-9"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          newChecklist.trim() && addChecklistMutation.mutate(newChecklist.trim())
                        }
                        disabled={!newChecklist.trim()}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </section>

                {/* Comments */}
                <section>
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Comments
                  </h4>
                  <div className="space-y-4">
                    {task.comments && task.comments.length > 0 ? (
                      task.comments.map((c) => (
                        <div key={c.id} className="flex gap-3 group">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={c.author.avatarUrl ?? undefined} />
                            <AvatarFallback className="text-[10px] bg-primary/15 text-primary">
                              {getInitials(c.author.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{c.author.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeDate(c.createdAt)}
                              </span>
                              {c.authorId === me?.id && (
                                <button
                                  type="button"
                                  onClick={() => deleteCommentMutation.mutate(c.id)}
                                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                  aria-label="Delete comment"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="mt-1 text-sm rounded-lg bg-secondary/60 px-3 py-2">
                              {c.body}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No comments yet.</p>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={me?.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-[10px] bg-primary/15 text-primary">
                          {me ? getInitials(me.name) : '··'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder="Write a comment…"
                          value={commentBody}
                          onChange={(e) => setCommentBody(e.target.value)}
                          rows={2}
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="gradient"
                            disabled={!commentBody.trim() || commentMutation.isPending}
                            onClick={() => commentMutation.mutate(commentBody.trim())}
                          >
                            {commentMutation.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            Post
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Sidebar */}
              <aside className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                    Status
                  </p>
                  <Select
                    value={task.status}
                    onValueChange={(v) => updateMutation.mutate({ status: v as TaskStatus })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">To do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                      <SelectItem value="REVIEW">Review</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                    Priority
                  </p>
                  <Select
                    value={task.priority}
                    onValueChange={(v) => updateMutation.mutate({ priority: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                    <UserIcon className="h-3 w-3" />
                    Assignee
                  </p>
                  {task.assignee ? (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/60">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={task.assignee.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          {getInitials(task.assignee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">{task.assignee.name}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Unassigned</p>
                  )}
                </div>

                {task.dueDate && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due date
                    </p>
                    <p className="text-sm font-mono">
                      {new Date(task.dueDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {task.labels.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Labels
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {task.labels.map((l) => (
                        <Badge key={l} variant="secondary" className="text-[10px]">
                          {l}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm('Delete this task? This cannot be undone.'))
                        deleteTaskMutation.mutate();
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete task
                  </Button>
                </div>
              </aside>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
