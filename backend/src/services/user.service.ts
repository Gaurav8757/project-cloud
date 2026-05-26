import { userRepository } from '../repositories/user.repository';
import { prisma } from '../config/prisma';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/AppError';
import { comparePassword, hashPassword } from '../utils/crypto';
import type { ChangePasswordInput, UpdateProfileInput } from '../validations/user.validation';

export const userService = {
  async getProfile(userId: string) {
    const user = await userRepository.findByIdSafe(userId);
    if (!user) throw new NotFoundError('User not found');
    const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
    return { ...user, notificationPrefs: prefs };
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatarUrl: true,
        role: { select: { id: true, name: true } },
      },
    });
    return updated;
  },

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    const ok = await comparePassword(input.currentPassword, user.password);
    if (!ok) throw new UnauthorizedError('Current password is incorrect');
    if (input.currentPassword === input.newPassword) {
      throw new BadRequestError('New password must differ from the current one');
    }
    await prisma.user.update({
      where: { id: userId },
      data: { password: await hashPassword(input.newPassword) },
    });
    return { success: true };
  },

  async updateNotificationPrefs(userId: string, prefs: Record<string, boolean>) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...prefs },
      update: prefs,
    });
  },

  async listUsers(page: number, limit: number, search?: string) {
    return userRepository.listPaginated(page, limit, search);
  },

  async adminUpdateUser(id: string, data: { name?: string; roleId?: number; isActive?: boolean }) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        role: { select: { id: true, name: true } },
      },
    });
  },

  async deleteUser(id: string) {
    await prisma.user.delete({ where: { id } });
    return { success: true };
  },
};
