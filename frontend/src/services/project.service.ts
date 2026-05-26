import { api, unwrap } from '@/lib/api';
import type { Project } from '@/types';

export const projectService = {
  list: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const res = await api.get('/projects', { params });
    return {
      items: res.data.data as Project[],
      meta: res.data.meta as { page: number; pageSize: number; total: number; totalPages: number },
    };
  },
  get: (id: string) => unwrap<Project>(api.get(`/projects/${id}`)),
  create: (payload: Partial<Project> & { name: string }) =>
    unwrap<Project>(api.post('/projects', payload)),
  update: (id: string, payload: Partial<Project>) =>
    unwrap<Project>(api.patch(`/projects/${id}`, payload)),
  remove: (id: string) => api.delete(`/projects/${id}`),
  analytics: (id: string) => unwrap(api.get(`/projects/${id}/analytics`)),
  addMember: (id: string, userId: string, role = 'MEMBER') =>
    unwrap(api.post(`/projects/${id}/members`, { userId, role })),
  removeMember: (id: string, userId: string) =>
    api.delete(`/projects/${id}/members/${userId}`),
};
