import { z } from 'zod';

export const calendarProviderOptions = ['google', 'outlook', 'ics'] as const;
export const calendarSyncModeOptions = ['meeting', 'event'] as const;

export const utilityOptionSchema = z.object({
  name: z.string().min(1, 'Option name is required'),
});

export const createUtilitySchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string(),
    options: z.array(utilityOptionSchema).min(1, 'Add at least one option'),
    calendarEnabled: z.boolean(),
    // Kept as plain strings (rather than z.enum) so the underlying <select>
    // can stay a controlled '' default without tripping enum validation
    // before the friendlier refine() messages below get a chance to run.
    calendarProvider: z.string(),
    calendarAddress: z.string(),
    calendarSyncMode: z.string(),
  })
  .refine(
    (data) =>
      !data.calendarEnabled ||
      calendarProviderOptions.includes(data.calendarProvider as (typeof calendarProviderOptions)[number]),
    { message: 'Select a calendar provider', path: ['calendarProvider'] },
  )
  .refine((data) => !data.calendarEnabled || data.calendarAddress.trim().length > 0, {
    message: 'Enter the calendar address or ID',
    path: ['calendarAddress'],
  })
  .refine(
    (data) =>
      !data.calendarEnabled ||
      calendarSyncModeOptions.includes(data.calendarSyncMode as (typeof calendarSyncModeOptions)[number]),
    { message: 'Select how this utility should sync to the calendar', path: ['calendarSyncMode'] },
  );

export type CreateUtilityFormData = z.infer<typeof createUtilitySchema>;
