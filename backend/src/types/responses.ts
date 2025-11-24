// Shared response DTOs for API endpoints

export interface ErrorResponse {
  error: {
    code: string; // e.g., "VALIDATION_ERROR", "NOT_FOUND"
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface SuccessResponse<T> {
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: Date;
  };
}
