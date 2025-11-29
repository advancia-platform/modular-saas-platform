import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";

export interface ErrorResponse {
  error: string;
  message?: string;
  code?: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    isOperational: boolean = true,
    details?: any,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR", true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND_ERROR");
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict") {
    super(message, 409, "CONFLICT_ERROR");
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, 429, "RATE_LIMIT_ERROR");
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 402, "PAYMENT_ERROR", true, details);
  }
}

export class CryptoError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, "CRYPTO_ERROR", true, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(
      `${service} error: ${message}`,
      502,
      "EXTERNAL_SERVICE_ERROR",
      true,
      details,
    );
  }
}

// Error handler middleware
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId =
    (req.headers["x-request-id"] as string) || generateRequestId();

  // Log error
  logger.error("Request error", {
    error: error.message,
    stack: error.stack,
    requestId,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: (req as any).user?.userId,
    statusCode: error instanceof AppError ? error.statusCode : 500,
  });

  // Handle known application errors
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp: new Date().toISOString(),
      requestId,
    };

    res.status(error.statusCode).json(response);
  }

  // Handle Prisma errors
  if (error.name === "PrismaClientKnownRequestError") {
    const prismaError = error as any;
    let message = "Database error";
    let statusCode = 500;

    switch (prismaError.code) {
      case "P2002":
        message = "Unique constraint violation";
        statusCode = 409;
        break;
      case "P2025":
        message = "Record not found";
        statusCode = 404;
        break;
      case "P2003":
        message = "Foreign key constraint violation";
        statusCode = 400;
        break;
    }

    const response: ErrorResponse = {
      error: message,
      code: `PRISMA_${prismaError.code}`,
      timestamp: new Date().toISOString(),
      requestId,
    };

    res.status(statusCode).json(response);
  }

  // Handle validation errors (e.g., from express-validator)
  if (error.name === "ValidationError" || (error as any).errors) {
    const response: ErrorResponse = {
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: (error as any).errors || error.message,
      timestamp: new Date().toISOString(),
      requestId,
    };

    res.status(400).json(response);
  }

  // Handle JWT errors
  if (
    error.name === "JsonWebTokenError" ||
    error.name === "TokenExpiredError"
  ) {
    const response: ErrorResponse = {
      error: "Invalid or expired token",
      code: "JWT_ERROR",
      timestamp: new Date().toISOString(),
      requestId,
    };

    res.status(401).json(response);
  }

  // Handle multer errors (file upload)
  if (error.name === "MulterError") {
    let message = "File upload error";
    const multerError = error as any;

    switch (multerError.code) {
      case "LIMIT_FILE_SIZE":
        message = "File too large";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected file field";
        break;
    }

    const response: ErrorResponse = {
      error: message,
      code: "FILE_UPLOAD_ERROR",
      details: multerError.field,
      timestamp: new Date().toISOString(),
      requestId,
    };

    res.status(400).json(response);
  }

  // Handle unknown errors
  const response: ErrorResponse = {
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
    code: "INTERNAL_ERROR",
    timestamp: new Date().toISOString(),
    requestId,
  };

  res.status(500).json(response);
}

// Generate unique request ID
function generateRequestId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Async error wrapper
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>,
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Error response helper
export function sendError(
  res: Response,
  error: string | AppError,
  statusCode: number = 500,
  code?: string,
  details?: any,
): void {
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp: new Date().toISOString(),
    };
    res.status(error.statusCode).json(response);
  } else {
    const response: ErrorResponse = {
      error: typeof error === "string" ? error : "Unknown error",
      code,
      details,
      timestamp: new Date().toISOString(),
    };
    res.status(statusCode).json(response);
  }
}

// Success response helper
export function sendSuccess(
  res: Response,
  data?: any,
  message?: string,
  statusCode: number = 200,
): void {
  const response = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
}

// Validation helper
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === "") {
    throw new ValidationError(`${fieldName} is required`);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format");
  }
}

export function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters long");
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    throw new ValidationError(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    );
  }
}

// Database operation helpers
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      // Only retry on specific errors
      const retryableErrors = [
        "P2034", // Transaction failed due to a write conflict
        "P1001", // Can't reach database server
        "P1002", // The database server was reached but timed out
      ];

      const isRetryable = retryableErrors.some((code) =>
        lastError.message.includes(code),
      );

      if (!isRetryable) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}
