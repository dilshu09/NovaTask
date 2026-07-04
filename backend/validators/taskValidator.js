import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.enum(['development', 'design', 'marketing', 'finance', 'operations', 'general']).optional(),
  dueDate: z.string().optional().nullable(),
  position: z.number().optional(),
  assignee: z.object({
    name: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
  }).optional().nullable(),
  assignees: z.array(z.object({
    name: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
  })).optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();
