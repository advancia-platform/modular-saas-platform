/**
 * API utility module for frontend HTTP requests
 * Provides centralized API client with authentication
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
}

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", headers = {}, body } = options;

  // Get token from localStorage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== "GET") {
    config.body = JSON.stringify(body);
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Admin API endpoints
 */
export const adminApi = {
  /**
   * GET request to admin endpoints
   */
  get: <T = unknown>(endpoint: string): Promise<T> => {
    return apiRequest<T>(endpoint, { method: "GET" });
  },

  /**
   * POST request to admin endpoints
   */
  post: <T = unknown>(endpoint: string, data?: unknown): Promise<T> => {
    return apiRequest<T>(endpoint, {
      method: "POST",
      body: data,
    });
  },

  /**
   * PUT request to admin endpoints
   */
  put: <T = unknown>(endpoint: string, data?: unknown): Promise<T> => {
    return apiRequest<T>(endpoint, {
      method: "PUT",
      body: data,
    });
  },

  /**
   * DELETE request to admin endpoints
   */
  delete: <T = unknown>(endpoint: string): Promise<T> => {
    return apiRequest<T>(endpoint, { method: "DELETE" });
  },

  /**
   * PATCH request to admin endpoints
   */
  patch: <T = unknown>(endpoint: string, data?: unknown): Promise<T> => {
    return apiRequest<T>(endpoint, {
      method: "PATCH",
      body: data,
    });
  },
};

/**
 * General API helper (non-admin)
 */
export const api = {
  get: <T = unknown>(endpoint: string): Promise<T> =>
    apiRequest<T>(endpoint, { method: "GET" }),
  post: <T = unknown>(endpoint: string, data?: unknown): Promise<T> =>
    apiRequest<T>(endpoint, { method: "POST", body: data }),
  put: <T = unknown>(endpoint: string, data?: unknown): Promise<T> =>
    apiRequest<T>(endpoint, { method: "PUT", body: data }),
  delete: <T = unknown>(endpoint: string): Promise<T> =>
    apiRequest<T>(endpoint, { method: "DELETE" }),
  patch: <T = unknown>(endpoint: string, data?: unknown): Promise<T> =>
    apiRequest<T>(endpoint, { method: "PATCH", body: data }),
};

export default api;
