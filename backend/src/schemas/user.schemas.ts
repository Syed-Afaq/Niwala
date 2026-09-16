import { z } from 'zod';

export const setBlockedSchema = z.object({
  isBlocked: z.boolean({
    required_error: 'isBlocked is required',
    invalid_type_error: 'isBlocked must be true or false',
  }),
});

export type SetBlockedInput = z.infer<typeof setBlockedSchema>;
