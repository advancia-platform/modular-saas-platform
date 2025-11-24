import { z } from 'zod';

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  assigneeId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
});

export const projectCreateSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  status: z.string().optional(),
  teamId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
