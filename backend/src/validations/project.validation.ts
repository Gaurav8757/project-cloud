import { z } from 'zod';
import { PRIORITY, PROJECT_STATUS } from '../constants';

export const createProjectSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  status: z.enum(Object.values(PROJECT_STATUS) as [string, ...string[]]).optional(),
  priority: z.enum(Object.values(PRIORITY) as [string, ...string[]]).optional(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, 'Must be a hex color e.g. #4F46E5')
    .optional(),
  startDate: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  memberIds: z.array(z.string().cuid()).optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  progress: z.number().int().min(0).max(100).optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(['OWNER', 'MANAGER', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
