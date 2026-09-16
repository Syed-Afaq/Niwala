import { z } from 'zod';

/**
 * Money is stored as Decimal(10,2), so reject anything that would not survive
 * the round trip instead of silently rounding the client's value.
 */
const priceSchema = z
  .number({ invalid_type_error: 'Price must be a number' })
  .positive('Price must be greater than 0')
  .max(99999999.99, 'Price is too large')
  .refine((value) => Number(value.toFixed(2)) === value, {
    message: 'Price can have at most 2 decimal places',
  });

export const createMealSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(500, 'Description is too long'),
  price: priceSchema,
});

export const updateMealSchema = createMealSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export type CreateMealInput = z.infer<typeof createMealSchema>;
export type UpdateMealInput = z.infer<typeof updateMealSchema>;
