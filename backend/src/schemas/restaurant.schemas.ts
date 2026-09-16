import { z } from 'zod';
import { UPLOADED_IMAGE_PATH } from '../lib/uploads';

/**
 * An image path returned by POST /uploads/images, or null to remove the image.
 * Arbitrary external URLs are rejected.
 */
const imageUrlSchema = z
  .string()
  .regex(UPLOADED_IMAGE_PATH, 'imageUrl must be a path returned by the upload endpoint')
  .nullable();

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
  imageUrl: imageUrlSchema.optional(),
});

/** Every field optional, but sending an empty object is a mistake worth reporting. */
export const updateRestaurantSchema = createRestaurantSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
