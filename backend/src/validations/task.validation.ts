import { z } from 'zod';
import { PRIORITY, TASK_STATUS } from '../constants';

export const createTaskSchema = z.object({
  projectId: z.string().cuid(),
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(Object.values(TASK_STATUS) as [string, ...string[]]).optional(),
  priority: z.enum(Object.values(PRIORITY) as [string, ...string[]]).optional(),
  dueDate: z.coerce.date().optional(),
  assigneeId: z.string().cuid().optional(),
  labels: z.array(z.string().max(40)).max(10).optional(),
  parentId: z.string().cuid().optional(),
  checklist: z
    .array(z.object({ text: z.string().min(1).max(200), done: z.boolean().optional() }))
    .optional(),
});

export const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true });

export const moveTaskSchema = z.object({
  status: z.enum(Object.values(TASK_STATUS) as [string, ...string[]]),
  position: z.number().int().min(0),
});

export const listTasksQuerySchema = z.object({
  projectId: z.string().cuid().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().cuid().optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'priority', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const commentSchema = z.object({
  body: z.string().min(1).max(5000),
  mentions: z.array(z.string().cuid()).optional(),
});

export const checklistItemSchema = z.object({
  text: z.string().min(1).max(200),
  done: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type CommentInput = z.infer<typeof commentSchema>;
