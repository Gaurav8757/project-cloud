import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { taskService } from '@/services/task.service';
import { getSocket } from '@/lib/socket';
import { KanbanCard } from './KanbanCard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types';

const COLUMNS: { id: TaskStatus; label: string; accent: string }[] = [
  { id: 'TODO', label: 'To do', accent: 'border-slate-500/50' },
  { id: 'IN_PROGRESS', label: 'In progress', accent: 'border-sky-500/50' },
  { id: 'REVIEW', label: 'Review', accent: 'border-amber-500/50' },
  { id: 'COMPLETED', label: 'Completed', accent: 'border-emerald-500/50' },
];

interface KanbanBoardProps {
  projectId: string;
  onAdd?: (status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
}

export function KanbanBoard({ projectId, onAdd, onTaskClick }: KanbanBoardProps) {
  const qc = useQueryClient();
  const [columns, setColumns] = useState<Record<TaskStatus, Task[]>>({
    TODO: [],
    IN_PROGRESS: [],
    REVIEW: [],
    COMPLETED: [],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['board', projectId],
    queryFn: () => taskService.board(projectId),
  });

  useEffect(() => {
    if (data) setColumns(data);
  }, [data]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('project:join', projectId);
    return () => {
      socket.emit('project:leave', projectId);
    };
  }, [projectId]);

  const moveMutation = useMutation({
    mutationFn: ({ id, status, position }: { id: string; status: TaskStatus; position: number }) =>
      taskService.move(id, status, position),
    onError: () => {
      toast.error('Could not move card. Reverting.');
      qc.invalidateQueries({ queryKey: ['board', projectId] });
    },
  });

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcCol = source.droppableId as TaskStatus;
    const destCol = destination.droppableId as TaskStatus;

    // optimistic update
    setColumns((prev) => {
      const src = [...prev[srcCol]];
      const [moved] = src.splice(source.index, 1);
      const dest = srcCol === destCol ? src : [...prev[destCol]];
      const updated = { ...moved, status: destCol };
      dest.splice(destination.index, 0, updated);
      return { ...prev, [srcCol]: src, [destCol]: dest };
    });

    moveMutation.mutate({ id: draggableId, status: destCol, position: destination.index });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((c) => (
          <Skeleton key={c.id} className="h-[500px]" />
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((column) => {
          const items = columns[column.id] ?? [];
          return (
            <Droppable droppableId={column.id} key={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'rounded-xl border bg-card/40 border-t-4 transition-colors',
                    column.accent,
                    snapshot.isDraggingOver && 'bg-primary/[0.04]',
                  )}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-display font-semibold">{column.label}</h3>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {items.length}
                      </span>
                    </div>
                    {onAdd && (
                      <button
                        type="button"
                        onClick={() => onAdd(column.id)}
                        className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={`Add task to ${column.label}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="p-3 space-y-2 min-h-[400px]">
                    {items.length === 0 && !snapshot.isDraggingOver && (
                      <p className="text-center text-xs text-muted-foreground py-8">
                        Drop tasks here
                      </p>
                    )}
                    {items.map((task, idx) => (
                      <Draggable key={task.id} draggableId={task.id} index={idx}>
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            style={prov.draggableProps.style}
                          >
                            <KanbanCard
                              task={task}
                              onClick={() => onTaskClick?.(task)}
                              isDragging={snap.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}
