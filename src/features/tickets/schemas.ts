import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high', 'critical'], { error: 'Select a priority' }),
  departmentId: z.string().min(1, 'Select a department'),
  attachments: z.array(z.instanceof(File)).optional(),
});

export type CreateTicketFormData = z.infer<typeof createTicketSchema>;
