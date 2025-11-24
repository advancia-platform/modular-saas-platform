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
// ===== Complex Workflows via Backend APIs =====
//

// Authentication
export async function login(email: string, password: string) {
  const res = await backendApi.post<SuccessResponse<{ token: string }>>(`/api/auth/login`, {
    email,
    password,
  });
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
