import { asyncHandler, created, ok } from '../utils/apiResponse';
import { taskService } from '../services/task.service';
import { buildPageMeta } from '../utils/pagination';

export const taskController = {
  list: asyncHandler(async (req, res) => {
    const query = req.query as never;
    const { items, total } = await taskService.list(query, req.user!.sub);
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    return ok(res, items, 'OK', 200, buildPageMeta(page, limit, total));
  }),

  get: asyncHandler(async (req, res) => {
    const task = await taskService.get(req.params.id, req.user!.sub);
    return ok(res, task);
  }),

  create: asyncHandler(async (req, res) => {
    const task = await taskService.create(req.body, req.user!.sub);
    return created(res, task, 'Task created');
  }),

  update: asyncHandler(async (req, res) => {
    const task = await taskService.update(req.params.id, req.body, req.user!.sub);
    return ok(res, task, 'Task updated');
  }),

  move: asyncHandler(async (req, res) => {
    const task = await taskService.move(req.params.id, req.body, req.user!.sub);
    return ok(res, task, 'Task moved');
  }),

  remove: asyncHandler(async (req, res) => {
    const result = await taskService.remove(req.params.id, req.user!.sub);
    return ok(res, result, 'Task deleted');
  }),

  comment: asyncHandler(async (req, res) => {
    const c = await taskService.comment(req.params.id, req.user!.sub, req.body);
    return created(res, c, 'Comment added');
  }),

  deleteComment: asyncHandler(async (req, res) => {
    const r = await taskService.deleteComment(req.params.commentId, req.user!.sub);
    return ok(res, r, 'Comment deleted');
  }),

  addChecklistItem: asyncHandler(async (req, res) => {
    const item = await taskService.addChecklistItem(req.params.id, req.user!.sub, req.body.text);
    return created(res, item);
  }),

  toggleChecklistItem: asyncHandler(async (req, res) => {
    const item = await taskService.toggleChecklistItem(
      req.params.id,
      req.params.itemId,
      req.user!.sub,
      Boolean(req.body.done),
    );
    return ok(res, item);
  }),

  deleteChecklistItem: asyncHandler(async (req, res) => {
    const r = await taskService.deleteChecklistItem(
      req.params.id,
      req.params.itemId,
      req.user!.sub,
    );
    return ok(res, r);
  }),

  board: asyncHandler(async (req, res) => {
    const grouped = await taskService.board(req.params.projectId, req.user!.sub);
    return ok(res, grouped);
  }),
};
