import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  headId: z.string().optional(),
  routing: z.enum(['roster_based', 'all_notify']),
  responseTimeHours: z
    .number({ error: 'Enter a valid number' })
    .min(0.5, 'Response time must be at least 0.5 hours'),
  resolutionTimeHours: z
    .number({ error: 'Enter a valid number' })
    .min(1, 'Resolution time must be at least 1 hour'),
  teamsWebhook: z.string().url('Enter a valid URL').or(z.literal('')),
  description: z.string(),
});

export type CreateDepartmentFormData = z.infer<typeof createDepartmentSchema>;
