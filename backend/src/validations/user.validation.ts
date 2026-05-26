import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
});

export const updateNotificationPrefsSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  taskAssigned: z.boolean().optional(),
  taskCommented: z.boolean().optional(),
  projectUpdates: z.boolean().optional(),
  deadlineReminders: z.boolean().optional(),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  roleId: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
