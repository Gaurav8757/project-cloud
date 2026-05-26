import { asyncHandler, created, ok } from '../utils/apiResponse';
import { projectService } from '../services/project.service';
import { buildPageMeta, parsePagination } from '../utils/pagination';

export const projectController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const search = (req.query.search as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const { items, total } = await projectService.list(req.user!.sub, page, limit, search, status);
    return ok(res, items, 'OK', 200, buildPageMeta(page, limit, total));
  }),

  get: asyncHandler(async (req, res) => {
    const project = await projectService.getById(req.params.id, req.user!.sub);
    return ok(res, project);
  }),

  create: asyncHandler(async (req, res) => {
    const project = await projectService.create(req.user!.sub, req.body);
    return created(res, project, 'Project created');
  }),

  update: asyncHandler(async (req, res) => {
    const project = await projectService.update(req.params.id, req.user!.sub, req.body);
    return ok(res, project, 'Project updated');
  }),

  remove: asyncHandler(async (req, res) => {
    const result = await projectService.remove(req.params.id, req.user!.sub);
    return ok(res, result, 'Project deleted');
  }),

  addMember: asyncHandler(async (req, res) => {
    const added = await projectService.addMember(req.params.id, req.user!.sub, req.body);
    return created(res, added, 'Member added');
  }),

  removeMember: asyncHandler(async (req, res) => {
    const result = await projectService.removeMember(
      req.params.id,
      req.user!.sub,
      req.params.userId,
    );
    return ok(res, result, 'Member removed');
  }),

  analytics: asyncHandler(async (req, res) => {
    const data = await projectService.analytics(req.params.id, req.user!.sub);
    return ok(res, data);
  }),
};
