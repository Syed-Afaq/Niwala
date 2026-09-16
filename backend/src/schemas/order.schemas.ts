import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        mealId: z.string().uuid('Must be a valid meal id'),
        quantity: z
          .number({ invalid_type_error: 'Quantity must be a number' })
          .int('Quantity must be a whole number')
          .positive('Quantity must be at least 1')
          .max(100, 'Quantity is too large'),
      })
    )
    .min(1, 'An order needs at least one item'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
