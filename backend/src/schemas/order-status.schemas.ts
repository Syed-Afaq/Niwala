import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const changeOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, {
    errorMap: () => ({
      message: `Status must be one of: ${Object.values(OrderStatus).join(', ')}`,
    }),
  }),
});

export type ChangeOrderStatusInput = z.infer<typeof changeOrderStatusSchema>;
