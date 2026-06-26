import { z } from 'zod';

export const createUserSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    role: z.enum(['root_admin', 'dept_head', 'team_member'], { error: 'Role is required' }),
    departmentId: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.role !== 'root_admin' && !data.departmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Department is required for this role',
        path: ['departmentId'],
      });
    }
  });

export type CreateUserFormData = z.infer<typeof createUserSchema>;
