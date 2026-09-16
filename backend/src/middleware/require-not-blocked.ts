import { RequestHandler } from 'express';
import { HttpError } from '../lib/http-error';

/**
 * Refuses the request when the caller is blocked.
 *
 * `authenticate` re-reads the user on every request, so this reflects a block
 * applied moments ago rather than whatever the token said when it was issued.
 *
 * A blocked customer can still sign in and read their existing orders — the
 * restriction is on placing new ones.
 */
export const requireNotBlocked: RequestHandler = (req, _res, next) => {
  if (req.user?.isBlocked) {
    return next(
      new HttpError(403, 'Your account has been blocked and cannot place new orders')
    );
  }
  next();
};
