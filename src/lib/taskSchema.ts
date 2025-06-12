import { z } from 'zod';

export const TaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['Alta', 'Media', 'Baja']),
  dueDate: z.date().optional(),
  assignedDate: z.date().optional()
});

export type TaskInput = z.infer<typeof TaskSchema>;
