// src/lib/api.ts
import { ApiResponse } from '@/types/auth';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const TOKEN_KEY = 'roxy_access_token';

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token: string | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage issues
  }
};

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefreshRetry?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string | null) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { skipAuth = false, skipRefreshRetry = false, headers = {}, ...rest } = options;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getStoredToken();
    if (token && !requestHeaders['Authorization']) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      credentials: 'include',
    });
  } catch (networkError: any) {
    throw new Error(networkError?.message || 'Network error: Unable to reach server');
  }

  // Handle 401 Unauthorized with token refresh (once)
  if (response.status === 401 && !skipAuth && !skipRefreshRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newToken = refreshData?.data?.accessToken;
          if (newToken) {
            setStoredToken(newToken);
            onTokenRefreshed(newToken);
            isRefreshing = false;

            // Retry original request with new token
            requestHeaders['Authorization'] = `Bearer ${newToken}`;
            const retryRes = await fetch(url, {
              ...rest,
              headers: requestHeaders,
              credentials: 'include',
            });
            const retryData = await retryRes.json().catch(() => null);
            if (!retryRes.ok) {
              const errMsg = retryData?.error?.message || retryData?.message || 'Request failed';
              throw new Error(errMsg);
            }
            return retryData;
          }
        }
        // Refresh failed
        setStoredToken(null);
        onTokenRefreshed(null);
      } catch (err) {
        setStoredToken(null);
        onTokenRefreshed(null);
      } finally {
        isRefreshing = false;
      }
    } else {
      // Wait for refresh to complete then retry
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async (newToken) => {
          if (!newToken) {
            reject(new Error('Session expired. Please log in again.'));
            return;
          }
          try {
            requestHeaders['Authorization'] = `Bearer ${newToken}`;
            const retryRes = await fetch(url, {
              ...rest,
              headers: requestHeaders,
              credentials: 'include',
            });
            const retryData = await retryRes.json().catch(() => null);
            if (!retryRes.ok) {
              reject(new Error(retryData?.error?.message || 'Request failed'));
            } else {
              resolve(retryData);
            }
          } catch (e) {
            reject(e);
          }
        });
      });
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      data?.error?.message ||
      data?.message ||
      `Request failed with status ${response.status}`;
    const error: any = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}