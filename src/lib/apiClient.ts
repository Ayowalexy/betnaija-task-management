import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export const TOKEN_KEYS = {
  access: 'flowdesk:access_token',
  refresh: 'flowdesk:refresh_token',
  expiresAt: 'flowdesk:expires_at',
} as const;

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.access);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.refresh);
}

export function storeTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
  localStorage.setItem(TOKEN_KEYS.access, accessToken);
  localStorage.setItem(TOKEN_KEYS.refresh, refreshToken);
  localStorage.setItem(TOKEN_KEYS.expiresAt, String(Date.now() + expiresIn * 1000));
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEYS.access);
  localStorage.removeItem(TOKEN_KEYS.refresh);
  localStorage.removeItem(TOKEN_KEYS.expiresAt);
}

// Unwrap the NestJS TransformInterceptor envelope.
// Paginated:  { data: T[], total, page, limit, meta } → { data: T[], total, page, limit }
// Regular:    { data: T, meta }                       → T
export function unwrap<T>(resData: unknown): T {
  if (resData === null || typeof resData !== 'object') return resData as T;
  const body = resData as Record<string, unknown>;

  if ('meta' in body) {
    const { meta: _meta, ...rest } = body;
    // Paginated: interceptor spread { data, total, page, limit } + meta at same level
    if ('total' in body) return rest as unknown as T;
    // Regular: interceptor wrapped as { data: payload, meta }
    return rest.data as T;
  }

  // Fallback for { data, statusCode, message } shape
  if ('data' in body && 'statusCode' in body) return body.data as T;

  return resData as T;
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Bearer token on each request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (err.response?.status === 401 && !originalRequest._retry) {
      // Don't intercept auth endpoints — they legitimately return 401
      const url = originalRequest.url ?? '';
      if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
        return Promise.reject(err);
      }

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        window.dispatchEvent(new Event('flowdesk:session-expired'));
        return Promise.reject(err);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers!['Authorization'] = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const tokens = unwrap<{ accessToken: string; refreshToken: string; expiresIn: number }>(res.data);
        storeTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
        processQueue(null, tokens.accessToken);
        originalRequest.headers!['Authorization'] = `Bearer ${tokens.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr);
        clearTokens();
        window.dispatchEvent(new Event('flowdesk:session-expired'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  },
);

// ── Typed request helpers (auto-unwrap NestJS envelope) ───────────────────

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.get(url, config);
  return unwrap<T>(res.data);
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.post(url, body, config);
  return unwrap<T>(res.data);
}

export async function apiPatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.patch(url, body, config);
  return unwrap<T>(res.data);
}

export async function apiDelete<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.delete(url, config);
  return unwrap<T>(res.data);
}
