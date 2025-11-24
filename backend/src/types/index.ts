// Domain response DTOs for API endpoints

export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  assigneeId?: string;
  teamId?: string;
  milestoneId?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description?: string;
  status?: string;
  teamId?: string;
  ownerId?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamResponse {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  members?: Array<{ userId: string; role: string }>;
}

export interface MilestoneResponse {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  dueDate?: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionResponse {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
