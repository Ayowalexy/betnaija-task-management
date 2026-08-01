import { z } from 'zod';

export const OTHER_REQUEST_TYPE_ID = 'other';

export const createTicketSchema = z
  .object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    priority: z.enum(['low', 'medium', 'high', 'critical'], { error: 'Select a priority' }),
    departmentId: z.string().min(1, 'Select a department'),
    requestTypeId: z.string().min(1, 'Select a request type'),
    customRequestTypeName: z.string().optional(),
    attachments: z.array(z.instanceof(File)).optional(),
  })
  .refine(
    (data) =>
      data.requestTypeId !== OTHER_REQUEST_TYPE_ID ||
      (data.customRequestTypeName?.trim().length ?? 0) >= 3,
    {
      message: 'Enter a request name (at least 3 characters)',
      path: ['customRequestTypeName'],
    },
  );

export type CreateTicketFormData = z.infer<typeof createTicketSchema>;
