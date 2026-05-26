import { prisma } from '../config/prisma';
import { taskRepository } from '../repositories/task.repository';
import { projectRepository } from '../repositories/project.repository';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/AppError';
import { activityService } from './activity.service';
import { notificationService } from './notification.service';
import { SOCKET_EVENTS, TASK_STATUS } from '../constants';
import { getIO } from '../sockets';
import type {
  CommentInput,
  CreateTaskInput,
  ListTasksQuery,
  MoveTaskInput,
  UpdateTaskInput,
} from '../validations/task.validation';

const ensureMember = async (projectId: string, userId: string) => {
  const ok = await projectRepository.isMember(projectId, userId);
  if (!ok) throw new ForbiddenError('You do not have access to this project');
};

const labelsToString = (l?: string[]) => (l && l.length ? l.join(',') : null);
const stringToLabels = (s?: string | null) =>
  s
    ? s
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
    : [];

const serializeTask = <T extends { labels?: string | null }>(t: T) => ({
  ...t,
  labels: stringToLabels(t.labels),
});

export const taskService = {
  async list(query: ListTasksQuery, userId: string) {
    if (query.projectId) await ensureMember(query.projectId, userId);

    const where = {
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.search ? { title: { contains: query.search } } : {}),
      // restrict to projects the user belongs to
      project: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    };

    const { items, total } = await taskRepository.list(
      where,
      { [query.sortBy]: query.sortOrder },
      query.page,
      query.limit,
    );
    return { items: items.map(serializeTask), total };
  },

  async get(id: string, userId: string) {
    const task = await taskRepository.findById(id);
    if (!task) throw new NotFoundError('Task not found');
    await ensureMember(task.projectId, userId);
    return serializeTask(task);
  },

  async create(input: CreateTaskInput, userId: string) {
    await ensureMember(input.projectId, userId);

    const targetStatus = input.status || TASK_STATUS.TODO;
    const topPosition = await taskRepository.highestPosition(input.projectId, targetStatus);

    const task = await taskRepository.create({
      title: input.title,
      description: input.description,
      status: targetStatus,
      priority: input.priority,
      dueDate: input.dueDate,
      labels: labelsToString(input.labels),
      position: topPosition + 1,
      project: { connect: { id: input.projectId } },
      createdBy: { connect: { id: userId } },
      ...(input.assigneeId ? { assignee: { connect: { id: input.assigneeId } } } : {}),
      ...(input.parentId ? { parent: { connect: { id: input.parentId } } } : {}),
      ...(input.checklist?.length
        ? {
            checklist: {
              create: input.checklist.map((c, idx) => ({
                text: c.text,
                done: c.done ?? false,
                position: idx,
              })),
            },
          }
        : {}),
    });

    await activityService.log({
      userId,
      projectId: input.projectId,
      taskId: task.id,
      action: 'CREATED',
      entity: 'TASK',
      metadata: { title: task.title },
    });

    if (input.assigneeId && input.assigneeId !== userId) {
      await notificationService.notify(input.assigneeId, {
        type: 'TASK_ASSIGNED',
        title: 'New task assigned',
        message: `You were assigned to "${task.title}"`,
        link: `/tasks/${task.id}`,
        metadata: { taskId: task.id, projectId: task.projectId },
      });
    }

    getIO()?.to(`project:${input.projectId}`).emit(SOCKET_EVENTS.TASK_CREATED, serializeTask(task));
    return serializeTask(task);
  },

  async update(id: string, input: UpdateTaskInput, userId: string) {
    const existing = await taskRepository.findById(id);
    if (!existing) throw new NotFoundError('Task not found');
    await ensureMember(existing.projectId, userId);

    const previousAssignee = existing.assigneeId;

    const updated = await taskRepository.update(id, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
      ...(input.labels !== undefined ? { labels: labelsToString(input.labels) } : {}),
      ...(input.assigneeId !== undefined
        ? input.assigneeId
          ? { assignee: { connect: { id: input.assigneeId } } }
          : { assignee: { disconnect: true } }
        : {}),
      ...(input.status === TASK_STATUS.COMPLETED ? { completedAt: new Date() } : {}),
    });

    await activityService.log({
      userId,
      projectId: existing.projectId,
      taskId: id,
      action: 'UPDATED',
      entity: 'TASK',
      metadata: input as Record<string, unknown>,
    });

    if (input.assigneeId && input.assigneeId !== previousAssignee && input.assigneeId !== userId) {
      await notificationService.notify(input.assigneeId, {
        type: 'TASK_ASSIGNED',
        title: 'New task assigned',
        message: `You were assigned to "${updated.title}"`,
        link: `/tasks/${id}`,
        metadata: { taskId: id, projectId: existing.projectId },
      });
    }

    getIO()
      ?.to(`project:${existing.projectId}`)
      .emit(SOCKET_EVENTS.TASK_UPDATED, serializeTask(updated));
    return serializeTask(updated);
  },

  async move(id: string, input: MoveTaskInput, userId: string) {
    const existing = await taskRepository.findById(id);
    if (!existing) throw new NotFoundError('Task not found');
    await ensureMember(existing.projectId, userId);

    const updated = await prisma.$transaction(async (tx) => {
      // Shift positions inside the destination column.
      await tx.task.updateMany({
        where: {
          projectId: existing.projectId,
          status: input.status,
          position: { gte: input.position },
        },
        data: { position: { increment: 1 } },
      });
      return tx.task.update({
        where: { id },
        data: {
          status: input.status,
          position: input.position,
          ...(input.status === TASK_STATUS.COMPLETED
            ? { completedAt: new Date() }
            : { completedAt: null }),
        },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
          checklist: { orderBy: { position: 'asc' } },
          _count: { select: { comments: true, attachments: true, subtasks: true } },
        },
      });
    });

    await activityService.log({
      userId,
      projectId: existing.projectId,
      taskId: id,
      action: 'STATUS_CHANGED',
      entity: 'TASK',
      metadata: { from: existing.status, to: input.status },
    });

    getIO()
      ?.to(`project:${existing.projectId}`)
      .emit(SOCKET_EVENTS.TASK_MOVED, serializeTask(updated));
    return serializeTask(updated);
  },

  async remove(id: string, userId: string) {
    const existing = await taskRepository.findById(id);
    if (!existing) throw new NotFoundError('Task not found');
    await ensureMember(existing.projectId, userId);
    await taskRepository.delete(id);
    getIO()?.to(`project:${existing.projectId}`).emit(SOCKET_EVENTS.TASK_DELETED, { id });
    return { success: true };
  },

  async comment(taskId: string, userId: string, input: CommentInput) {
    const task = await taskRepository.findById(taskId);
    if (!task) throw new NotFoundError('Task not found');
    await ensureMember(task.projectId, userId);

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        authorId: userId,
        body: input.body,
        mentions: input.mentions?.length ? input.mentions.join(',') : null,
      },
      include: { author: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });

    if (input.mentions?.length) {
      await Promise.all(
        input.mentions
          .filter((id) => id !== userId)
          .map((uid) =>
            notificationService.notify(uid, {
              type: 'COMMENT_MENTION',
              title: 'You were mentioned',
              message: `Someone mentioned you in "${task.title}"`,
              link: `/tasks/${taskId}`,
              metadata: { taskId, commentId: comment.id },
            }),
          ),
      );
    }

    if (task.assigneeId && task.assigneeId !== userId) {
      await notificationService.notify(task.assigneeId, {
        type: 'STATUS_CHANGE',
        title: 'New comment on your task',
        message: `New comment on "${task.title}"`,
        link: `/tasks/${taskId}`,
        metadata: { taskId },
      });
    }

    getIO()?.to(`project:${task.projectId}`).emit(SOCKET_EVENTS.COMMENT_NEW, comment);
    return comment;
  },

  async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.taskComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundError('Comment not found');
    if (comment.authorId !== userId)
      throw new ForbiddenError('You can only delete your own comments');
    await prisma.taskComment.delete({ where: { id: commentId } });
    return { success: true };
  },

  async addChecklistItem(taskId: string, userId: string, text: string) {
    const task = await taskRepository.findById(taskId);
    if (!task) throw new NotFoundError('Task not found');
    await ensureMember(task.projectId, userId);
    const count = await prisma.checklistItem.count({ where: { taskId } });
    return prisma.checklistItem.create({
      data: { taskId, text, position: count },
    });
  },

  async toggleChecklistItem(taskId: string, itemId: string, userId: string, done: boolean) {
    const task = await taskRepository.findById(taskId);
    if (!task) throw new NotFoundError('Task not found');
    await ensureMember(task.projectId, userId);
    return prisma.checklistItem.update({ where: { id: itemId }, data: { done } });
  },

  async deleteChecklistItem(taskId: string, itemId: string, userId: string) {
    const task = await taskRepository.findById(taskId);
    if (!task) throw new NotFoundError('Task not found');
    await ensureMember(task.projectId, userId);
    await prisma.checklistItem.delete({ where: { id: itemId } });
    return { success: true };
  },

  async board(projectId: string, userId: string) {
    await ensureMember(projectId, userId);
    const tasks = await taskRepository.listByProjectGroupedByStatus(projectId);
    const grouped: Record<string, ReturnType<typeof serializeTask>[]> = {
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      COMPLETED: [],
    };
    for (const t of tasks) {
      const list = grouped[t.status as keyof typeof grouped];
      if (list) list.push(serializeTask(t));
      else throw new BadRequestError(`Unknown task status: ${t.status}`);
    }
    return grouped;
  },
};
