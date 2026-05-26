import { asyncHandler, ok } from '../utils/apiResponse';
import { dashboardService } from '../services/dashboard.service';
import { prisma } from '../config/prisma';

export const dashboardController = {
  overview: asyncHandler(async (req, res) => {
    const data = await dashboardService.overview(req.user!.sub);
    return ok(res, data);
  }),

  upcoming: asyncHandler(async (req, res) => {
    const data = await dashboardService.upcoming(req.user!.sub);
    return ok(res, data);
  }),

  // Admin system analytics
  systemAnalytics: asyncHandler(async (_req, res) => {
    const [users, projects, tasks, completed] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'COMPLETED' } }),
    ]);
    return ok(res, { users, projects, tasks, completed });
  }),
};
