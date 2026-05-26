import { prisma } from '../config/prisma';
import { TASK_STATUS } from '../constants';
import { activityService } from './activity.service';

export const dashboardService = {
  async overview(userId: string) {
    const projectFilter = {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    } as const;

    const [
      totalProjects,
      activeProjects,
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasks,
      statusBreakdown,
      recentActivity,
    ] = await Promise.all([
      prisma.project.count({ where: projectFilter }),
      prisma.project.count({ where: { ...projectFilter, status: 'ACTIVE' } }),
      prisma.task.count({ where: { project: projectFilter } }),
      prisma.task.count({
        where: { project: projectFilter, status: { not: TASK_STATUS.COMPLETED } },
      }),
      prisma.task.count({
        where: { project: projectFilter, status: TASK_STATUS.COMPLETED },
      }),
      prisma.task.count({
        where: {
          project: projectFilter,
          status: { not: TASK_STATUS.COMPLETED },
          dueDate: { lt: new Date() },
        },
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: { project: projectFilter },
        _count: { _all: true },
      }),
      activityService.recentForUser(userId, 12),
    ]);

    // Last 7 days completed tasks for the chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const completedRecent = await prisma.task.findMany({
      where: {
        project: projectFilter,
        status: TASK_STATUS.COMPLETED,
        completedAt: { gte: sevenDaysAgo },
      },
      select: { completedAt: true },
    });

    const productivity: { date: string; completed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const completed = completedRecent.filter(
        (t) => t.completedAt && t.completedAt >= d && t.completedAt < next,
      ).length;
      productivity.push({ date: d.toISOString().slice(0, 10), completed });
    }

    return {
      totals: {
        totalProjects,
        activeProjects,
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
      },
      statusBreakdown,
      productivity,
      recentActivity,
    };
  },

  async upcoming(userId: string) {
    const projectFilter = {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    } as const;

    return prisma.task.findMany({
      where: {
        project: projectFilter,
        status: { not: TASK_STATUS.COMPLETED },
        dueDate: { gte: new Date() },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true, color: true } },
      },
    });
  },
};
