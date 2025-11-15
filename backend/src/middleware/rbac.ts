/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces strict authorization for admin operations
 */

import { NextFunction, Request, Response } from "express";
import { captureError } from "../utils/sentry.js";

/**
 * Extended request interface with user info
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "USER" | "STAFF" | "ADMIN" | "SUPERADMIN";
    username?: string;
  };
}

/**
 * Require user to be authenticated
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
    });
    return;
  }
  next();
}

/**
 * Require user to be at least ADMIN role
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
    });
    return;
  }

  const allowedRoles = ["ADMIN", "SUPERADMIN"];
  if (!allowedRoles.includes(req.user.role)) {
    // Log unauthorized attempt
    captureError(new Error("Unauthorized superadmin access attempt"), {
      level: "warning",
      tags: { type: "security", event: "unauthorized_superadmin_access" },
      extra: {
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role,
        path: (req as Request).path,
        method: (req as Request).method,
        ip: (req as Request).ip,
      },
    });

    res.status(403).json({
      error: "Forbidden",
      message: "Admin privileges required",
      requiredRole: "ADMIN or SUPERADMIN",
      userRole: req.user.role,
    });
    return;
  }

  next();
}

/**
 * Require user to be SUPERADMIN (for sensitive operations)
 */
export function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
    });
    return;
  }

  if (req.user.role !== "SUPERADMIN") {
    // Log unauthorized attempt
    captureError(new Error("Unauthorized superadmin access attempt"), {
      level: "warning",
      tags: { type: "security", event: "unauthorized_superadmin_access" },
      extra: {
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role,
        path: (req as Request).path,
        method: (req as Request).method,
        ip: (req as Request).ip,
      },
    });

    res.status(403).json({
      error: "Forbidden",
      message: "SuperAdmin privileges required for this operation",
      requiredRole: "SUPERADMIN",
      userRole: req.user.role,
    });
    return;
  }

  next();
}

/**
 * Check if user has specific role
 */
export function hasRole(
  req: AuthenticatedRequest,
  role: "USER" | "STAFF" | "ADMIN" | "SUPERADMIN"
): boolean {
  return req.user?.role === role;
}

/**
 * Check if user has at least the specified role level
 */
export function hasMinRole(
  req: AuthenticatedRequest,
  minRole: "USER" | "STAFF" | "ADMIN" | "SUPERADMIN"
): boolean {
  if (!req.user) return false;

  const roleHierarchy = {
    USER: 1,
    STAFF: 2,
    ADMIN: 3,
    SUPERADMIN: 4,
  };

  return roleHierarchy[req.user.role] >= roleHierarchy[minRole];
}

/**
 * Validate that user can only access their own resources (unless admin)
 */
export function requireOwnerOrAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
  resourceUserId: string
): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Admins and superadmins can access any resource
  if (["ADMIN", "SUPERADMIN"].includes(req.user.role)) {
    next();
    return;
  }

  // Regular users can only access their own resources
  if (req.user.id !== resourceUserId) {
    res.status(403).json({
      error: "Forbidden",
      message: "You can only access your own resources",
    });
    return;
  }

  next();
}
