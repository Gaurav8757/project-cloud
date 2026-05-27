import { prisma } from '../config/prisma';
import type { Prisma } from '../generated/prisma/client';

export const userRepository = {
  findByEmail: (email: string) =>
    prisma.user.findUnique({ where: { email }, include: { role: true } }),

  findById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      include: { role: true, notificationPrefs: true },
    }),

  findByIdSafe: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        bio: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
    }),

  create: (data: Prisma.UserCreateInput) =>
    prisma.user.create({
      data,
      include: { role: true },
    }),

  update: (id: string, data: Prisma.UserUpdateInput) =>
    prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    }),

  listPaginated: async (
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ items: unknown[]; total: number }> => {
    const where: Prisma.UserWhereInput = search
      ? { OR: [{ email: { contains: search } }, { name: { contains: search } }] }
      : {};
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          role: { select: { id: true, name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total };
  },

  delete: (id: string) => prisma.user.delete({ where: { id } }),

  countAll: () => prisma.user.count(),
};
