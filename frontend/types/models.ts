// Frontend domain model mirrors of backend DTOs

export interface TaskResponse {
  id: string;
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
  projectId: string;
  assigneeId?: string | null;
  reporterId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  tags: string[];
  dueDate?: string | null; // ISO string for frontend
  completedAt?: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description?: string;
  status?: string;
  teamId?: string;
  ownerId?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}
