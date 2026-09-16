import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { HttpError } from '../lib/http-error';

/**
 * Validates and replaces `req.body` with the parsed result, so handlers only
 * ever see data that matched the schema.
 */
export const validateBody =
  (schema: ZodSchema): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(
        new HttpError(400, 'Validation failed', result.error.flatten().fieldErrors)
      );
    }

    req.body = result.data;
    next();
  };
