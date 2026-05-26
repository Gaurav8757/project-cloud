import { asyncHandler, ok } from '../utils/apiResponse';
import { notificationService } from '../services/notification.service';
import { buildPageMeta, parsePagination } from '../utils/pagination';

export const notificationController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const unreadOnly = req.query.unread === 'true';
    const { items, total, unread } = await notificationService.list(
      req.user!.sub,
      page,
      limit,
      unreadOnly,
    );
    return ok(res, items, 'OK', 200, { ...buildPageMeta(page, limit, total), unread });
  }),

  markRead: asyncHandler(async (req, res) => {
    const r = await notificationService.markRead(req.user!.sub, req.params.id);
    return ok(res, r);
  }),

  markAllRead: asyncHandler(async (req, res) => {
    const r = await notificationService.markAllRead(req.user!.sub);
    return ok(res, r);
  }),

  remove: asyncHandler(async (req, res) => {
    const r = await notificationService.remove(req.user!.sub, req.params.id);
    return ok(res, r);
  }),
};
