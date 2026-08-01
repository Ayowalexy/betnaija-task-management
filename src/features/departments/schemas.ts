import { z } from 'zod';

export const requestTypePriorityOptions = ['low', 'medium', 'high', 'critical'] as const;

export const requestTypeSchema = z.object({
  name: z.string().min(2, 'Request name must be at least 2 characters'),
  description: z.string().min(1, 'Request description is required'),
  priority: z.enum(requestTypePriorityOptions, { error: 'Select a priority' }),
  responseTimeHours: z
    .number({ error: 'Enter a valid number' })
    .min(0.5, 'Response SLA must be at least 0.5 hours'),
  resolutionTimeHours: z
    .number({ error: 'Enter a valid number' })
    .min(1, 'Resolution SLA must be at least 1 hour'),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  headId: z.string().min(1, 'Department head is required'),
  routing: z.enum(['roster_based', 'all_notify']),
  responseTimeHours: z
    .number({ error: 'Enter a valid number' })
    .min(0.5, 'Response time must be at least 0.5 hours'),
  resolutionTimeHours: z
    .number({ error: 'Enter a valid number' })
    .min(1, 'Resolution time must be at least 1 hour'),
  teamsWebhook: z.string().url('Enter a valid URL').or(z.literal('')),
  description: z.string(),
  requestTypes: z.array(requestTypeSchema),
  utilityIds: z.array(z.string()),
});

export type RequestTypeFormData = z.infer<typeof requestTypeSchema>;
export type CreateDepartmentFormData = z.infer<typeof createDepartmentSchema>;
