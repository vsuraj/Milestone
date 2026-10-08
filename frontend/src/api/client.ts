/**
 * Minimal fetch wrapper for the Django REST API with JWT (SimpleJWT) support.
 *
 * - The short-lived access token lives in memory only.
 * - The refresh token is persisted in localStorage so a page refresh keeps the
 *   session alive (a new access token is obtained on load).
 * - A 401 triggers exactly one token refresh + retry; if that fails the session
 *   is cleared and the registered "session expired" handler is invoked.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
const REFRESH_STORAGE_KEY = 'milestone.refreshToken';
const REQUEST_TIMEOUT_MS = 45_000;

let accessToken: string | null = null;
let sessionExpiredHandler: (() => void) | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const tokenStore = {
  getAccess: () => accessToken,
  getRefresh(): string | null {
    try {
      return localStorage.getItem(REFRESH_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  set(access: string, refresh?: string) {
    accessToken = access;
    if (refresh) {
      try {
        localStorage.setItem(REFRESH_STORAGE_KEY, refresh);
      } catch {
        /* storage unavailable: session lasts until reload */
      }
    }
  },
  clear() {
    accessToken = null;
    try {
      localStorage.removeItem(REFRESH_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },
};

export function onSessionExpired(handler: (() => void) | null) {
  sessionExpiredHandler = handler;
}

/** Turn DRF / SimpleJWT error payloads into a single readable sentence. */
export function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return data.map(String).join(' ');
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.error === 'string') return obj.error;
    if (typeof obj.detail === 'string') return obj.detail;
    const parts: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const text = Array.isArray(value) ? value.join(' ') : String(value);
      parts.push(key === 'non_field_errors' ? text : `${key}: ${text}`);
    }
    if (parts.length) return parts.join(' ');
  }
  return fallback;
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204 || res.status === 205) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function rawRequest(path: string, method: string, body: unknown, auth: boolean) {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. Please try again.', 408);
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

/** Exchange the stored refresh token for a new access token (single-flight). */
export function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  const refresh = tokenStore.getRefresh();
  if (!refresh) return Promise.resolve(null);

  refreshInFlight = (async () => {
    try {
      const res = await rawRequest('/api/auth/token/refresh/', 'POST', { refresh }, false);
      if (!res.ok) {
        tokenStore.clear();
        return null;
      }
      const data = (await res.json()) as { access: string; refresh?: string };
      tokenStore.set(data.access, data.refresh);
      return data.access;
    } catch {
      return null; // network error: keep the refresh token, let the caller decide
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  let res = await rawRequest(path, method, body, auth);

  if (res.status === 401 && auth && tokenStore.getRefresh()) {
    const renewed = await refreshAccessToken();
    if (renewed) {
      res = await rawRequest(path, method, body, auth);
    } else if (!tokenStore.getRefresh()) {
      sessionExpiredHandler?.();
    }
  }

  const data = await parseBody(res);
  if (!res.ok) {
    throw new ApiError(
      extractErrorMessage(data, `Request failed (${res.status})`),
      res.status,
      data,
    );
  }
  return data as T;
}
