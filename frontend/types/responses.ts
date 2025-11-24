// Shared API response wrappers (frontend)

export interface SuccessResponse<T> {
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: Date;
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

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Legacy compatibility
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
