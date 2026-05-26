import { projectRepository } from '../repositories/project.repository';
import { prisma } from '../config/prisma';
import { ForbiddenError, NotFoundError } from '../utils/AppError';
import { activityService } from './activity.service';
import { PROJECT_MEMBER_ROLE } from '../constants';
import type {
  AddMemberInput,
  CreateProjectInput,
  UpdateProjectInput,
} from '../validations/project.validation';

export const projectService = {
  async list(userId: string, page: number, limit: number, search?: string, status?: string) {
    return projectRepository.listForUser(userId, page, limit, search, status);
  },

  async getById(id: string, userId: string) {
    const isMember = await projectRepository.isMember(id, userId);
    if (!isMember) throw new ForbiddenError('You do not have access to this project');
    const project = await projectRepository.findById(id);
    if (!project) throw new NotFoundError('Project not found');
    return project;
  },

  async create(userId: string, input: CreateProjectInput) {
    const memberIds = (input.memberIds || []).filter((id) => id !== userId);

    const project = await projectRepository.create({
      name: input.name,
      description: input.description,
      status: input.status,
      priority: input.priority,
      color: input.color,
      startDate: input.startDate,
      deadline: input.deadline,
      owner: { connect: { id: userId } },
      members: {
        create: [
          { userId, role: PROJECT_MEMBER_ROLE.OWNER },
          ...memberIds.map((id) => ({ userId: id, role: PROJECT_MEMBER_ROLE.MEMBER })),
        ],
      },
    });

    await activityService.log({
      userId,
      projectId: project.id,
      action: 'CREATED',
      entity: 'PROJECT',
      metadata: { name: project.name },
    });
    return project;
  },

  async update(id: string, userId: string, input: UpdateProjectInput) {
    const project = await projectRepository.findById(id);
    if (!project) throw new NotFoundError('Project not found');

    const member = project.members.find((m) => m.userId === userId);
    if (project.ownerId !== userId && member?.role !== 'MANAGER') {
      throw new ForbiddenError('Only owners and managers can edit this project');
    }

    const updated = await projectRepository.update(id, {
      ...input,
      memberIds: undefined,
    } as never);

    await activityService.log({
      userId,
      projectId: id,
      action: 'UPDATED',
      entity: 'PROJECT',
      metadata: input as Record<string, unknown>,
    });
    return updated;
  },

  async remove(id: string, userId: string) {
    const project = await projectRepository.findById(id);
    if (!project) throw new NotFoundError('Project not found');
    if (project.ownerId !== userId) {
      throw new ForbiddenError('Only the owner can delete this project');
    }
    await projectRepository.delete(id);
    return { success: true };
  },

  async addMember(projectId: string, userId: string, payload: AddMemberInput) {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError('Project not found');
    if (project.ownerId !== userId) {
      const member = project.members.find((m) => m.userId === userId);
      if (member?.role !== 'MANAGER')
        throw new ForbiddenError('Only owners and managers can add members');
    }
    const added = await projectRepository.addMember(projectId, payload.userId, payload.role);
    await activityService.log({
      userId,
      projectId,
      action: 'MEMBER_ADDED',
      entity: 'PROJECT',
      metadata: { addedUserId: payload.userId, role: payload.role },
    });
    return added;
  },

  async removeMember(projectId: string, userId: string, targetUserId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError('Project not found');
    if (project.ownerId === targetUserId) {
      throw new ForbiddenError('The owner cannot be removed from the project');
    }
    if (project.ownerId !== userId && userId !== targetUserId) {
      const member = project.members.find((m) => m.userId === userId);
      if (member?.role !== 'MANAGER') throw new ForbiddenError('Insufficient permission');
    }
    await projectRepository.removeMember(projectId, targetUserId);
    return { success: true };
  },

  async analytics(projectId: string, userId: string) {
    const isMember = await projectRepository.isMember(projectId, userId);
    if (!isMember) throw new ForbiddenError();

    const [statusCounts, priorityCounts, totalTasks, recent] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { _all: true },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { projectId },
        _count: { _all: true },
      }),
      prisma.task.count({ where: { projectId } }),
      prisma.activityLog.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      }),
    ]);

    const completed = statusCounts.find((s) => s.status === 'COMPLETED')?._count._all ?? 0;
    const progress = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

    return { statusCounts, priorityCounts, totalTasks, progress, recent };
  },
};
