'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
}

interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Request body (will be stringified for JSON) */
  body?: Record<string, unknown> | FormData;
  /** Cache TTL in milliseconds (default: 0 = no cache) */
  cacheTTL?: number;
  /** Skip cache and force fresh request */
  skipCache?: boolean;
  /** Retry count on failure */
  retries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Custom error handler */
  onError?: (error: ApiError) => void;
}

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRIES = 0;
const DEFAULT_RETRY_DELAY = 1000;

// In-memory cache
const cache = new Map<string, CacheEntry<unknown>>();

// ============================================================================
// Helper Functions
// ============================================================================

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
}

function getCacheKey(path: string, options?: RequestOptions): string {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.stringify(options.body) : '';
  return `${method}:${path}:${body}`;
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCache<T>(key: string, data: T, ttl: number): void {
  const now = Date.now();
  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttl,
  });
}

function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Core API Function
// ============================================================================

export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    body,
    cacheTTL = 0,
    skipCache = false,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    timeout = DEFAULT_TIMEOUT,
    onError,
    ...fetchOptions
  } = options;

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const method = fetchOptions.method || (body ? 'POST' : 'GET');
  const cacheKey = getCacheKey(path, options);

  // Check cache for GET requests
  if (method === 'GET' && cacheTTL > 0 && !skipCache) {
    const cached = getFromCache<T>(cacheKey);
    if (cached !== null) {
      return { data: cached, error: null, status: 200 };
    }
  }

  // Build headers
  const headers = new Headers(fetchOptions.headers);
  const token = getAuthToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (body && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Build request options
  const requestOptions: RequestInit = {
    ...fetchOptions,
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  };

  // Execute with retries
  let lastError: ApiError | null = null;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle response
      const contentType = response.headers.get('content-type');
      let data: T | null = null;

      if (contentType?.includes('application/json')) {
        const json = await response.json();
        data = json as T;

        // Handle token refresh in response
        if (json.token) {
          setAuthToken(json.token);
        }
      } else if (contentType?.includes('text/')) {
        data = (await response.text()) as unknown as T;
      }

      // Handle errors
      if (!response.ok) {
        const error: ApiError = {
          message:
            (data as Record<string, unknown>)?.message?.toString() ||
            (data as Record<string, unknown>)?.error?.toString() ||
            `Request failed with status ${response.status}`,
          status: response.status,
          code: (data as Record<string, unknown>)?.code?.toString(),
          details: data as Record<string, unknown>,
        };

        // Handle 401 - Clear auth and redirect
        if (response.status === 401) {
          clearAuthToken();
          if (typeof window !== 'undefined' && !path.includes('/auth/')) {
            window.location.href = '/login';
          }
        }

        onError?.(error);
        return { data: null, error, status: response.status };
      }

      // Cache successful GET responses
      if (method === 'GET' && cacheTTL > 0 && data) {
        setCache(cacheKey, data, cacheTTL);
      }

      return { data, error: null, status: response.status };
    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === 'AbortError';

      lastError = {
        message: isAbort ? 'Request timeout' : (error as Error).message || 'Network error',
        code: isAbort ? 'TIMEOUT' : 'NETWORK_ERROR',
      };

      attempt++;

      if (attempt <= retries) {
        await sleep(retryDelay * attempt); // Exponential backoff
      }
    }
  }

  onError?.(lastError!);
  return { data: null, error: lastError, status: 0 };
}

// ============================================================================
// Convenience Methods
// ============================================================================

api.get = <T = unknown>(path: string, options?: RequestOptions) =>
  api<T>(path, { ...options, method: 'GET' });

api.post = <T = unknown>(path: string, body?: Record<string, unknown>, options?: RequestOptions) =>
  api<T>(path, { ...options, method: 'POST', body });

api.put = <T = unknown>(path: string, body?: Record<string, unknown>, options?: RequestOptions) =>
  api<T>(path, { ...options, method: 'PUT', body });

api.patch = <T = unknown>(path: string, body?: Record<string, unknown>, options?: RequestOptions) =>
  api<T>(path, { ...options, method: 'PATCH', body });

api.delete = <T = unknown>(path: string, options?: RequestOptions) =>
  api<T>(path, { ...options, method: 'DELETE' });

// ============================================================================
// Cache Management
// ============================================================================

api.clearCache = clearCache;
api.invalidate = (pattern: string) => clearCache(pattern);

// ============================================================================
// React Hook: useApi
// ============================================================================

interface UseApiOptions<T> extends RequestOptions {
  /** Skip initial fetch */
  skip?: boolean;
  /** Dependencies to trigger refetch */
  deps?: unknown[];
  /** Transform response data */
  transform?: (data: T) => T;
  /** Initial data */
  initialData?: T;
}

interface UseApiResult<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  refetch: () => Promise<void>;
  mutate: (newData: T | ((prev: T | null) => T)) => void;
}

export function useApi<T = unknown>(
  path: string | null,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const { skip = false, deps = [], transform, initialData, ...apiOptions } = options;

  const [data, setData] = useState<T | null>(initialData ?? null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(!skip && !!path);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!path) return;

    // Cancel previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    const result = await api<T>(path, {
      ...apiOptions,
      // signal: abortRef.current.signal,
    });

    if (result.error) {
      setError(result.error);
      setData(null);
    } else {
      const finalData = transform && result.data ? transform(result.data) : result.data;
      setData(finalData);
    }

    setLoading(false);
  }, [path, JSON.stringify(apiOptions), transform]);

  useEffect(() => {
    if (!skip && path) {
      fetchData();
    }

    return () => {
      abortRef.current?.abort();
    };
  }, [path, skip, fetchData, ...deps]);

  const mutate = useCallback((newData: T | ((prev: T | null) => T)) => {
    setData((prev) =>
      typeof newData === 'function' ? (newData as (prev: T | null) => T)(prev) : newData
    );
  }, []);

  return {
    data,
    error,
    loading,
    refetch: fetchData,
    mutate,
  };
}

// ============================================================================
// React Hook: useMutation
// ============================================================================

interface UseMutationOptions<T, V> {
  /** Called on success */
  onSuccess?: (data: T, variables: V) => void;
  /** Called on error */
  onError?: (error: ApiError, variables: V) => void;
  /** Called on completion (success or error) */
  onSettled?: (data: T | null, error: ApiError | null, variables: V) => void;
  /** Invalidate cache patterns on success */
  invalidates?: string[];
}

interface UseMutationResult<T, V> {
  mutate: (variables: V) => Promise<T | null>;
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reset: () => void;
}

export function useMutation<
  T = unknown,
  V extends Record<string, unknown> = Record<string, unknown>,
>(path: string, options: UseMutationOptions<T, V> & RequestOptions = {}): UseMutationResult<T, V> {
  const { onSuccess, onError, onSettled, invalidates, ...apiOptions } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  const mutate = useCallback(
    async (variables: V): Promise<T | null> => {
      setLoading(true);
      setError(null);

      const result = await api<T>(path, {
        method: 'POST',
        ...apiOptions,
        body: variables,
      });

      if (result.error) {
        setError(result.error);
        onError?.(result.error, variables);
        onSettled?.(null, result.error, variables);
      } else {
        setData(result.data);
        onSuccess?.(result.data!, variables);
        onSettled?.(result.data, null, variables);

        // Invalidate cache patterns
        if (invalidates) {
          invalidates.forEach((pattern) => clearCache(pattern));
        }
      }

      setLoading(false);
      return result.data;
    },
    [path, JSON.stringify(apiOptions), onSuccess, onError, onSettled, invalidates]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, data, error, loading, reset };
}

// ============================================================================
// Exports
// ============================================================================

export default api;
export { clearAuthToken, getAuthToken, setAuthToken };
export type { ApiError, ApiResponse, RequestOptions };
