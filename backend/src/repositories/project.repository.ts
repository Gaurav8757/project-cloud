import { prisma } from '../config/prisma';
import type { Prisma } from '@prisma/client';

const projectInclude = {
  owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
  members: {
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  },
  _count: { select: { tasks: true } },
} satisfies Prisma.ProjectInclude;

export const projectRepository = {
  create: (data: Prisma.ProjectCreateInput) =>
    prisma.project.create({ data, include: projectInclude }),

  findById: (id: string) =>
    prisma.project.findUnique({
      where: { id },
      include: projectInclude,
    }),

  update: (id: string, data: Prisma.ProjectUpdateInput) =>
    prisma.project.update({
      where: { id },
      data,
      include: projectInclude,
    }),

  delete: (id: string) => prisma.project.delete({ where: { id } }),

  listForUser: async (
    userId: string,
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ) => {
    const where: Prisma.ProjectWhereInput = {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      ...(search ? { name: { contains: search } } : {}),
      ...(status ? { status } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: projectInclude,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);
    return { items, total };
  },

  isMember: async (projectId: string, userId: string): Promise<boolean> => {
    const found = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      select: { id: true },
    });
    return Boolean(found);
  },

  addMember: (projectId: string, userId: string, role: string) =>
    prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      create: { projectId, userId, role },
      update: { role },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    }),

  removeMember: (projectId: string, userId: string) =>
    prisma.projectMember.delete({ where: { projectId_userId: { projectId, userId } } }),

  countAll: () => prisma.project.count(),
};
