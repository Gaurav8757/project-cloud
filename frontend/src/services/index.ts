import { api, unwrap } from '@/lib/api';
import type { DashboardOverview, Notification, Task, User } from '@/types';

export const notificationService = {
  list: async (params?: { page?: number; limit?: number; unread?: boolean }) => {
    const res = await api.get('/notifications', { params });
    return {
      items: res.data.data as Notification[],
      meta: res.data.meta as { unread: number; total: number },
    };
  },
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  remove: (id: string) => api.delete(`/notifications/${id}`),
};

export const dashboardService = {
  overview: () => unwrap<DashboardOverview>(api.get('/dashboard/overview')),
  upcoming: () => unwrap<Task[]>(api.get('/dashboard/upcoming')),
  system: () => unwrap(api.get('/dashboard/system')),
};

export const userService = {
  me: () => unwrap<User>(api.get('/users/me')),
  updateProfile: (payload: Partial<Pick<User, 'name' | 'bio' | 'avatarUrl'>>) =>
    unwrap<User>(api.patch('/users/me', payload)),
  changePassword: (currentPassword: string, newPassword: string) =>
    unwrap(api.post('/users/change-password', { currentPassword, newPassword })),
  updateNotificationPrefs: (prefs: Record<string, boolean>) =>
    unwrap(api.patch('/users/notification-preferences', prefs)),
  list: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await api.get('/users', { params });
    return { items: res.data.data as User[], meta: res.data.meta };
  },
  adminUpdate: (id: string, payload: { name?: string; roleId?: number; isActive?: boolean }) =>
    unwrap(api.patch(`/users/${id}`, payload)),
  remove: (id: string) => api.delete(`/users/${id}`),
};
