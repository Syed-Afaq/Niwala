/**
 * An error carrying the HTTP status the client should receive.
 * Anything else reaching the error handler is treated as a 500.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
