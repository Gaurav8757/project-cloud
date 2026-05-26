import { prisma } from '../config/prisma';

interface LogInput {
  userId?: string;
  projectId?: string;
  taskId?: string;
  action: string;
  entity: string;
  metadata?: Record<string, unknown>;
}

export const activityService = {
  async log(input: LogInput) {
    return prisma.activityLog.create({
      data: {
        userId: input.userId,
        projectId: input.projectId,
        taskId: input.taskId,
        action: input.action,
        entity: input.entity,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  },

  async recentForUser(userId: string, limit = 30) {
    return prisma.activityLog.findMany({
      where: {
        OR: [
          { userId },
          { project: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true, color: true } },
        task: { select: { id: true, title: true } },
      },
    });
  },
};
