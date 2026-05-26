import { notificationRepository } from '../repositories/notification.repository';
import { SOCKET_EVENTS } from '../constants';
import { getIO } from '../sockets';

interface NotifyPayload {
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export const notificationService = {
  async notify(userId: string, payload: NotifyPayload) {
    const notification = await notificationRepository.create({
      user: { connect: { id: userId } },
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link,
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
    });
    getIO()?.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION_NEW, notification);
    return notification;
  },

  async list(userId: string, page: number, limit: number, unreadOnly = false) {
    return notificationRepository.listForUser(userId, page, limit, unreadOnly);
  },

  async markRead(userId: string, id: string) {
    await notificationRepository.markAsRead(id, userId);
    return { success: true };
  },

  async markAllRead(userId: string) {
    await notificationRepository.markAllRead(userId);
    return { success: true };
  },

  async remove(userId: string, id: string) {
    await notificationRepository.delete(id, userId);
    return { success: true };
  },
};
