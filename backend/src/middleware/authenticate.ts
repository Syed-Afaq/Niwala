import { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { HttpError } from '../lib/http-error';
import { verifyToken } from '../lib/jwt';

/**
 * Requires a valid `Authorization: Bearer <token>` header and attaches the
 * caller to `req.user`.
 *
 * The user is re-read from the database on every request rather than trusted
 * from the token, so role changes and blocks take effect immediately instead
 * of when the token happens to expire.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.header('authorization');

    if (!header || !header.startsWith('Bearer ')) {
      throw new HttpError(401, 'Missing or malformed Authorization header');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new HttpError(401, 'Missing or malformed Authorization header');
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new HttpError(401, 'Invalid or expired token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isBlocked: true },
    });

    if (!user) {
      throw new HttpError(401, 'Account no longer exists');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
