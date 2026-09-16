import { z } from 'zod';

export const createRestaurantSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(500, 'Description is too long'),
  foodType: z
    .string()
    .trim()
    .min(1, 'Food type is required')
    .max(50, 'Food type is too long'),
});

/** Every field optional, but sending an empty object is a mistake worth reporting. */
export const updateRestaurantSchema = createRestaurantSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
