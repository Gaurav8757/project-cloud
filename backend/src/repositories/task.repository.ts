import { prisma } from '../config/prisma';
import type { Prisma } from '../generated/prisma/client';

export const taskInclude = {
  assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
  createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
  checklist: { orderBy: { position: 'asc' } },
  _count: { select: { comments: true, attachments: true, subtasks: true } },
} satisfies Prisma.TaskInclude;

export const taskRepository = {
  create: (data: Prisma.TaskCreateInput) => prisma.task.create({ data, include: taskInclude }),

  findById: (id: string) =>
    prisma.task.findUnique({
      where: { id },
      include: {
        ...taskInclude,
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        attachments: true,
        subtasks: { include: taskInclude, orderBy: { position: 'asc' } },
        project: { select: { id: true, name: true, color: true } },
      },
    }),

  update: (id: string, data: Prisma.TaskUpdateInput) =>
    prisma.task.update({ where: { id }, data, include: taskInclude }),

  delete: (id: string) => prisma.task.delete({ where: { id } }),

  list: async (
    where: Prisma.TaskWhereInput,
    orderBy: Prisma.TaskOrderByWithRelationInput,
    page: number,
    limit: number,
  ) => {
    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy,
        include: taskInclude,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);
    return { items, total };
  },

  listByProjectGroupedByStatus: async (projectId: string) => {
    const tasks = await prisma.task.findMany({
      where: { projectId, parentId: null },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
      include: taskInclude,
    });
    return tasks;
  },

  highestPosition: async (projectId: string, status: string): Promise<number> => {
    const top = await prisma.task.findFirst({
      where: { projectId, status },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return top?.position ?? -1;
  },

  countByStatus: (projectId?: string) =>
    prisma.task.groupBy({
      by: ['status'],
      where: projectId ? { projectId } : undefined,
      _count: { _all: true },
    }),

  countAll: () => prisma.task.count(),
};
