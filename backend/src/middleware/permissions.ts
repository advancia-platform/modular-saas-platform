/**
 * Permission-based Access Control Middleware
 * Implements fine-grained permissions like 'read:accounts', 'write:transactions'
 */

import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./rbac";

// Permission types
type Permission = string; // e.g., 'read:accounts', 'write:transactions', 'admin:users'

// Default role-based permissions mapping
const ROLE_PERMISSIONS = {
  USER: [
    "read:accounts",
    "read:transactions",
    "write:transactions",
    "read:profile",
    "write:profile",
  ],
  STAFF: [
    "read:accounts",
    "read:transactions",
    "write:transactions",
    "read:profile",
    "write:profile",
    "read:users",
    "read:support",
    "write:support",
  ],
  ADMIN: ["read:*", "write:*", "admin:*"],
  SUPERADMIN: [
    "*:*", // All permissions
  ],
};

/**
 * Check if user has specific permission
 */
export function hasPermission(
  userRole: string,
  userPermissions: string[] = [],
  requiredPermission: string,
): boolean {
  // Get role-based permissions
  const rolePermissions =
    ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || [];

  // Combine role and user-specific permissions
  const allPermissions = [...rolePermissions, ...userPermissions];

  // Check for exact match
  if (allPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check for wildcard permissions
  const [action, resource] = requiredPermission.split(":");

  // Check for action wildcards (e.g., 'read:*' matches 'read:accounts')
  if (allPermissions.includes(`${action}:*`)) {
    return true;
  }

  // Check for resource wildcards (e.g., '*:accounts' matches 'read:accounts')
  if (allPermissions.includes(`*:${resource}`)) {
    return true;
  }

  // Check for full wildcards (e.g., '*:*' matches everything)
  if (allPermissions.includes("*:*")) {
    return true;
  }

  return false;
}

/**
 * Middleware to verify user has required permissions
 * @param permissions Array of required permissions (OR logic)
 */
export function verifyAccess(permissions: Permission[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    const { role, permissions: userPermissions = [] } = req.user;

    // Check if user has any of the required permissions
    const hasAnyPermission = permissions.some((permission) =>
      hasPermission(role, userPermissions, permission),
    );

    if (!hasAnyPermission) {
      return res.status(403).json({
        error: "Insufficient permissions",
        code: "INSUFFICIENT_PERMISSIONS",
        required: permissions,
        userRole: role,
      });
    }

    // Store matched permissions in request for logging
    req.matchedPermissions = permissions.filter((permission) =>
      hasPermission(role, userPermissions, permission),
    );

    next();
  };
}

/**
 * Middleware to verify user has ALL required permissions (AND logic)
 */
export function verifyAllAccess(permissions: Permission[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    const { role, permissions: userPermissions = [] } = req.user;

    // Check if user has ALL required permissions
    const missingPermissions = permissions.filter(
      (permission) => !hasPermission(role, userPermissions, permission),
    );

    if (missingPermissions.length > 0) {
      return res.status(403).json({
        error: "Insufficient permissions",
        code: "INSUFFICIENT_PERMISSIONS",
        required: permissions,
        missing: missingPermissions,
        userRole: role,
      });
    }

    req.matchedPermissions = permissions;
    next();
  };
}

/**
 * Get permissions for a specific role
 */
export function getRolePermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
}

/**
 * Check if permission matches pattern (supports wildcards)
 */
export function permissionMatches(
  permission: string,
  pattern: string,
): boolean {
  if (permission === pattern) return true;
  if (pattern === "*:*") return true;

  const [permAction, permResource] = permission.split(":");
  const [patternAction, patternResource] = pattern.split(":");

  return (
    (patternAction === "*" || patternAction === permAction) &&
    (patternResource === "*" || patternResource === permResource)
  );
}

// Extend the Request interface to include matched permissions
declare global {
  namespace Express {
    interface Request {
      matchedPermissions?: string[];
    }
  }
}
