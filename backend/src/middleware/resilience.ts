import { Request, Response, NextFunction } from "express";

/**
 * Maintenance mode middleware
 * When MAINTENANCE_MODE=true, returns 503 with maintenance message
 * Health checks bypass this to allow monitoring
 */
export function maintenanceMode(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";

  // Always allow health checks
  if (req.path.includes("/health")) {
    return next();
  }

  if (isMaintenanceMode) {
    return res.status(503).json({
      status: "maintenance",
      message: "We're making Advancia Pay even better! Back soon.",
      estimatedDowntime: "15-30 minutes",
      timestamp: new Date().toISOString(),
      supportEmail: "support@advanciapayledger.com",
    });
  }

  next();
}

/**
 * Error handler that stays online even during errors
 * Returns user-friendly messages instead of crashing
 */
export function resilientErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("[ERROR] Caught but continuing:", err);

  // Don't crash - log and return friendly error
  const isProduction = process.env.NODE_ENV === "production";

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    status: "error",
    message: isProduction
      ? "Something went wrong, but we're on it! Please try again."
      : err.message,
    timestamp: new Date().toISOString(),
    ...(isProduction ? {} : { stack: err.stack }),
  });
}

/**
 * 404 handler that doesn't crash
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    status: "not_found",
    message: "Endpoint not found",
    path: req.path,
    timestamp: new Date().toISOString(),
  });
}
