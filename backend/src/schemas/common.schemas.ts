import { z } from 'zod';

/** Every model uses a uuid primary key. */
export const idParamSchema = z.object({
  id: z.string().uuid('Must be a valid id'),
});

export const restaurantIdParamSchema = z.object({
  restaurantId: z.string().uuid('Must be a valid restaurant id'),
});
