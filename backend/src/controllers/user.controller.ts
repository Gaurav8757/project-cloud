import { asyncHandler, ok } from '../utils/apiResponse';
import { userService } from '../services/user.service';
import { buildPageMeta, parsePagination } from '../utils/pagination';

export const userController = {
  me: asyncHandler(async (req, res) => {
    const profile = await userService.getProfile(req.user!.sub);
    return ok(res, profile);
  }),

  updateMe: asyncHandler(async (req, res) => {
    const updated = await userService.updateProfile(req.user!.sub, req.body);
    return ok(res, updated, 'Profile updated');
  }),

  changePassword: asyncHandler(async (req, res) => {
    const result = await userService.changePassword(req.user!.sub, req.body);
    return ok(res, result, 'Password changed');
  }),

  updateNotificationPrefs: asyncHandler(async (req, res) => {
    const result = await userService.updateNotificationPrefs(req.user!.sub, req.body);
    return ok(res, result, 'Preferences updated');
  }),

  // Admin
  listUsers: asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const search = (req.query.search as string) || undefined;
    const { items, total } = await userService.listUsers(page, limit, search);
    return ok(res, items, 'OK', 200, buildPageMeta(page, limit, total));
  }),

  adminUpdateUser: asyncHandler(async (req, res) => {
    const updated = await userService.adminUpdateUser(req.params.id, req.body);
    return ok(res, updated, 'User updated');
  }),

  deleteUser: asyncHandler(async (req, res) => {
    const result = await userService.deleteUser(req.params.id);
    return ok(res, result, 'User deleted');
  }),
};
