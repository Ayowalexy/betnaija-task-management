import { z } from 'zod';

export const createUtilityRequestSchema = z
  .object({
    utilityId: z.string().min(1, 'Select a utility'),
    departmentId: z.string().min(1, 'Select a department'),
    utilityOptionId: z.string().min(1, 'Select an option'),
    date: z.string().min(1, 'Select a date'),
    startTime: z.string().min(1, 'Select a start time'),
    endTime: z.string().min(1, 'Select an end time'),
    details: z.string().min(5, 'Add a few details about this request'),
  })
  .refine((data) => !data.startTime || !data.endTime || data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export type CreateUtilityRequestFormData = z.infer<typeof createUtilityRequestSchema>;

export const editUtilityRequestSchema = z
  .object({
    utilityOptionId: z.string().min(1, 'Select an option'),
    date: z.string().min(1, 'Select a date'),
    startTime: z.string().min(1, 'Select a start time'),
    endTime: z.string().min(1, 'Select an end time'),
    details: z.string().min(5, 'Add a few details about this request'),
  })
  .refine((data) => !data.startTime || !data.endTime || data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export type EditUtilityRequestFormData = z.infer<typeof editUtilityRequestSchema>;

export const rejectUtilityRequestSchema = z.object({
  reason: z.string().min(5, 'Enter a reason for rejecting this request'),
});

export type RejectUtilityRequestFormData = z.infer<typeof rejectUtilityRequestSchema>;
