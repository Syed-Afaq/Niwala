import { RequestHandler } from 'express';
import { Role } from '@prisma/client';
import { HttpError } from '../lib/http-error';

/**
 * Restricts a route to the given roles. Must run after `authenticate`.
 *
 * This is coarse role gating only. Ownership checks (does this owner own this
 * restaurant/order?) belong in the services that know about those records.
 */
export const authorize =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      return next(new HttpError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'Your role is not allowed to perform this action'));
    }

    next();
  };
