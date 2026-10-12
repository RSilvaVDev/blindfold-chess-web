import { SESSION_EXPIRED_EVENT } from '../auth/authContext';
import { getSupabase } from '../auth/supabaseClient';
import { getEnv } from '../config/env';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Calls blindfold-chess-api with the current access token. A 401 means the
// session is no longer valid, so it signs out and the router returns to login.
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(`${getEnv().apiUrl}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection.");
  }

  if (response.status === 401) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    throw new ApiError(401, 'Your session expired. Sign in again.');
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === 'object' && 'message' in body
        ? String(body.message)
        : `Request failed (${response.status}).`;
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
}
