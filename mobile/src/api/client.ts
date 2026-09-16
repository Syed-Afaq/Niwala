import { API_BASE_URL } from '../config';

/** An error carrying the API's status and message, so screens can show it. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Set by the auth context whenever the session changes. */
export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Called when the API rejects our token, so the app can sign out cleanly. */
export function setOnUnauthorized(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Skip the sign-out hook for calls that are expected to 401, e.g. login. */
  allowUnauthorized?: boolean;
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, allowUnauthorized = false } = options;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    // fetch only rejects when the request never completed.
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const raw = await response.text();
  let payload: any = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !allowUnauthorized) {
      onUnauthorized?.();
    }
    throw new ApiError(
      response.status,
      payload?.error?.message ?? `Request failed (${response.status})`,
      payload?.error?.details
    );
  }

  return payload as T;
}

/** Turns the API's field errors into one readable line. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    const details = error.details as Record<string, string[]> | undefined;
    if (details && typeof details === 'object') {
      const messages = Object.values(details)
        .flat()
        .filter((m): m is string => typeof m === 'string');
      if (messages.length > 0) {
        return messages.join('\n');
      }
    }
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
