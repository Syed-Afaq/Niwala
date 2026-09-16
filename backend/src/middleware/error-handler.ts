import { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../lib/http-error';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
};

/** express.json() rejects an unparseable body with a SyntaxError carrying a status. */
const isMalformedJson = (err: unknown): boolean =>
  err instanceof SyntaxError && 'body' in err && 'status' in err;

/**
 * Single place where errors become HTTP responses.
 * Unexpected errors are logged server-side and reported as a generic 500 so
 * internal details never leak to clients.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (isMalformedJson(err)) {
    res.status(400).json({ error: { message: 'Malformed JSON body' } });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: {
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: 'Internal server error' } });
};
