import { prisma } from '../config/prisma';
import type { Prisma } from '@prisma/client';

export const notificationRepository = {
  create: (data: Prisma.NotificationCreateInput) => prisma.notification.create({ data }),

  createMany: (data: Prisma.NotificationCreateManyInput[]) =>
    prisma.notification.createMany({ data }),

  listForUser: async (userId: string, page: number, limit: number, unreadOnly = false) => {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(unreadOnly ? { read: false } : {}),
    };
    const [items, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);
    return { items, total, unread };
  },

  markAsRead: (id: string, userId: string) =>
    prisma.notification.update({ where: { id }, data: { read: true } }).catch(() => null) &&
    prisma.notification.updateMany({ where: { id, userId }, data: { read: true } }),

  markAllRead: (userId: string) =>
    prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } }),

  delete: (id: string, userId: string) => prisma.notification.deleteMany({ where: { id, userId } }),
};
