"use client";

import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosRequestHeaders,
  InternalAxiosRequestConfig,
} from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const isBrowser = typeof window !== "undefined";

// A plain axios instance without interceptors for refresh calls
const plain = axios.create({ baseURL: BASE_URL });

export const adminApi = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Inject Authorization header from localStorage on each request (client only)
adminApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (isBrowser) {
    const token = localStorage.getItem("adminToken");
    if (token) {
      const headers: AxiosRequestHeaders =
        (config.headers as AxiosRequestHeaders) || {};
      headers.Authorization = `Bearer ${token}`;
      config.headers = headers;
    }
  }
  return config;
});

// Response interceptor to attempt a single refresh on 401, then redirect to login
adminApi.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const response = error.response;
    const originalRequest =
      (error.config as AxiosRequestConfig & { _retry?: boolean }) || {};

    if (response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isBrowser) {
        const refreshToken = localStorage.getItem("adminRefreshToken");
        if (refreshToken) {
          try {
            const refreshRes = await plain.post("/api/auth/admin/refresh", {
              token: refreshToken,
            });
            interface RefreshResponse {
              accessToken: string;
              refreshToken?: string;
            }
            const { accessToken, refreshToken: newRefresh } =
              refreshRes.data as RefreshResponse;

            if (accessToken) localStorage.setItem("adminToken", accessToken);
            if (newRefresh)
              localStorage.setItem("adminRefreshToken", newRefresh);

            // Update headers and retry original request
            const reqHeaders: Record<string, string> =
              (originalRequest.headers as Record<string, string>) || {};
            reqHeaders["Authorization"] = `Bearer ${accessToken}`;
            const typedHeaders = reqHeaders as unknown as AxiosRequestHeaders;
            originalRequest.headers = typedHeaders;
            return adminApi(originalRequest);
          } catch {
            // Fall through to redirect below
          }
        }

        // No refresh token or refresh failed → clear and redirect
        try {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminRefreshToken");
        } catch {}
        if (typeof window !== "undefined") {
          window.location.href = "/admin/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default adminApi;
