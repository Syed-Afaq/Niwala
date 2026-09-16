import { RequestHandler } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { HttpError } from '../lib/http-error';

/**
 * Flattens a Zod error into the `details` payload.
 *
 * Field errors are keyed by field name. Schema-level errors — from `.refine()`
 * on the object itself, e.g. "provide at least one field" — have no field to
 * attach to, so they land under `form`. Without this they would be dropped and
 * the client would get an empty details object.
 */
function toDetails(error: ZodError) {
  const { fieldErrors, formErrors } = error.flatten();
  const details: Record<string, unknown> = { ...fieldErrors };

  if (formErrors.length > 0) {
    details.form = formErrors;
  }

  return details;
}

/**
 * Validates and replaces `req.body` with the parsed result, so handlers only
 * ever see data that matched the schema.
 */
export const validateBody =
  (schema: ZodSchema): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(new HttpError(400, 'Validation failed', toDetails(result.error)));
    }

    req.body = result.data;
    next();
  };

/**
 * Validates route parameters, so a malformed id is rejected as a 400 before it
 * ever reaches the database.
 *
 * `req.params` is not reassigned: Express owns that object, and merged params
 * from nested routers live on it too.
 */
export const validateParams =
  (schema: ZodSchema): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return next(
        new HttpError(400, 'Invalid request parameters', toDetails(result.error))
      );
    }

    next();
  };
