import jwt, { SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { env } from './env';

export type JwtPayload = {
  /** User id. */
  sub: string;
  role: Role;
};

const payloadSchema = z.object({
  sub: z.string().min(1),
  role: z.nativeEnum(Role),
});

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    // @types/jsonwebtoken types this as ms.StringValue rather than string.
    // env.JWT_EXPIRES_IN is already format-checked in env.ts, so the cast is safe.
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

/**
 * Verifies the signature and expiry, then checks the payload shape.
 * Throws if the token is invalid, expired, or malformed.
 */
export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  return payloadSchema.parse(decoded);
}
