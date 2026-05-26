import { api, unwrap } from '@/lib/api';
import type { Task, TaskComment, TaskStatus } from '@/types';

export interface ListTasksParams {
  projectId?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const taskService = {
  list: async (params?: ListTasksParams) => {
    const res = await api.get('/tasks', { params });
    return {
      items: res.data.data as Task[],
      meta: res.data.meta as { page: number; pageSize: number; total: number; totalPages: number },
    };
  },
  get: (id: string) => unwrap<Task>(api.get(`/tasks/${id}`)),
  create: (payload: Partial<Task> & { projectId: string; title: string }) =>
    unwrap<Task>(api.post('/tasks', payload)),
  update: (id: string, payload: Partial<Task>) =>
    unwrap<Task>(api.patch(`/tasks/${id}`, payload)),
  move: (id: string, status: TaskStatus, position: number) =>
    unwrap<Task>(api.patch(`/tasks/${id}/move`, { status, position })),
  remove: (id: string) => api.delete(`/tasks/${id}`),
  board: (projectId: string) =>
    unwrap<Record<TaskStatus, Task[]>>(api.get(`/tasks/board/${projectId}`)),
  comment: (id: string, body: string, mentions?: string[]) =>
    unwrap<TaskComment>(api.post(`/tasks/${id}/comments`, { body, mentions })),
  deleteComment: (id: string, commentId: string) =>
    api.delete(`/tasks/${id}/comments/${commentId}`),
  addChecklistItem: (id: string, text: string) =>
    unwrap(api.post(`/tasks/${id}/checklist`, { text })),
  toggleChecklistItem: (id: string, itemId: string, done: boolean) =>
    unwrap(api.patch(`/tasks/${id}/checklist/${itemId}`, { done })),
  deleteChecklistItem: (id: string, itemId: string) =>
    api.delete(`/tasks/${id}/checklist/${itemId}`),
};
