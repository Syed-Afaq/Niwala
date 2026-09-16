import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Must be a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    // bcrypt only considers the first 72 bytes, so reject longer input
    // instead of silently ignoring the tail.
    .max(72, 'Password must be at most 72 characters'),
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'Role must be REGULAR_USER or RESTAURANT_OWNER' }),
  }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Must be a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
