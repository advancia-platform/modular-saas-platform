import { Request, Response, NextFunction } from "express";

/**
 * Global error handler middleware
 * Sanitizes error responses based on environment
 * - Production: Generic error messages to prevent information leakage
 * - Development: Detailed error messages with stack traces for debugging
 *
 * IMPORTANT: Must be registered AFTER all routes in index.ts
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log full error details on backend (always)
  console.error("[ERROR]", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    timestamp: new Date().toISOString(),
  });

  const isProduction = process.env.NODE_ENV === "production";
  const statusCode = err.status || err.statusCode || 500;

  if (isProduction) {
    // Generic error message for production
    res.status(statusCode).json({
      success: false,
      error: "An error occurred. Please try again later.",
      timestamp: new Date().toISOString(),
    });
  } else {
    // Detailed error for development
    res.status(statusCode).json({
      success: false,
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * 404 handler for undefined routes
 * Should be registered before the error handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
};
