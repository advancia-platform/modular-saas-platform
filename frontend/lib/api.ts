import axios from 'axios';
import { ProjectResponse, TaskResponse } from '../types/models';
import { PaginatedResponse, SuccessResponse } from '../types/responses';

// 🔹 Internal API client (Next.js App Router endpoints - Prisma-backed)
const internalApi = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// 🔹 Backend API client (self-hosted backend service)
const backendApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000',
  withCredentials: true,
});

// 🔹 Auto-attach JWT from localStorage on every backend request
backendApi.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Handle token refresh or logout on 401
backendApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Clear invalid token and redirect to login
      localStorage.removeItem('jwt');
      sessionStorage.removeItem('jwt');
      // Optional: redirect or emit event for global auth handler
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

//
// ===== Simple Reads via Prisma-backed Next.js routes =====
//

// Tasks
export async function fetchTasks(page = 1, pageSize = 10) {
  const res = await internalApi.get<PaginatedResponse<TaskResponse>>(
    `/tasks?page=${page}&pageSize=${pageSize}`
  );
  return res.data;
}

// Projects
export async function fetchProjects(page = 1, pageSize = 10) {
  const res = await internalApi.get<PaginatedResponse<ProjectResponse>>(
    `/projects?page=${page}&pageSize=${pageSize}`
  );
  return res.data;
}

// Single project (example)
export async function fetchProject(id: string) {
  const res = await internalApi.get<SuccessResponse<ProjectResponse>>(`/projects/${id}`);
  return res.data;
}

//
// ===== Auth Helpers =====
//

export function setAuthToken(token: string, persist = true) {
  if (typeof window !== 'undefined') {
    if (persist) {
      localStorage.setItem('jwt', token);
    } else {
      sessionStorage.setItem('jwt', token);
    }
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
  }
  return null;
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('jwt');
    sessionStorage.removeItem('jwt');
  }
}

//
// ===== Complex Workflows via Backend APIs =====
//

// Authentication
export async function login(email: string, password: string, rememberMe = true) {
  const res = await backendApi.post<SuccessResponse<{ token: string }>>(`/api/auth/login`, {
    email,
    password,
  });

  // Auto-save token after successful login
  if (res.data?.token) {
    setAuthToken(res.data.token, rememberMe);
  }

  return res.data;
}

// Password recovery
export async function recoverPassword(email: string) {
  const res = await backendApi.post<SuccessResponse<{ status: string }>>(`/api/auth/recover`, {
    email,
  });
  return res.data;
}

// Gamification example
export async function fetchUserPoints(userId: string) {
  const res = await backendApi.get<SuccessResponse<{ points: number }>>(
    `/api/gamification/${userId}/points`
  );
  return res.data;
}
