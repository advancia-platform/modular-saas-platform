import { NextFunction, Request, Response } from "express";
import { logger } from "../logger";
import prisma from "../prismaClient";
import { AuthRequest } from "./auth";

/**
 * Log admin action to audit trail
 * @param adminId - Admin user ID
 * @param action - Action performed
 * @param target - Target of action (optional)
 * @param details - Additional details (optional)
 * @param req - Express request for metadata
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  target?: string,
  details?: string,
  req?: Request
): Promise<void> {
  try {
    await prisma.adminAuditTrail.create({
      data: {
        adminId,
        action,
        target,
        details,
        ipAddress: req?.ip || req?.socket?.remoteAddress,
        userAgent: req?.get("User-Agent"),
      },
    });

    logger.info("Admin action logged", {
      adminId,
      action,
      target,
      ipAddress: req?.ip,
    });
  } catch (error) {
    logger.error("Failed to log admin action", {
      error: error instanceof Error ? error.message : "Unknown error",
      adminId,
      action,
      target,
    });
  }
}

/**
 * Express middleware to automatically log admin actions
 * Usage: Place after auth middleware to capture admin actions
 */
export function adminAuditMiddleware(action: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const adminId = req.user?.userId;

    if (adminId) {
      // Log the action asynchronously to avoid blocking the request
      setImmediate(async () => {
        await logAdminAction(
          adminId,
          action,
          req.params.id || req.params.userId || req.originalUrl,
          JSON.stringify({
            method: req.method,
            path: req.path,
            query: req.query,
            params: req.params,
          }),
          req
        );
      });
    }

    next();
  };
}

/**
 * Middleware to require admin or auditor role for accessing audit logs
 */
export function requireAdminOrAuditor(req: AuthRequest, res: Response, next: NextFunction) {
  const user = req.user;

  if (!user || !['SUPER_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'].includes(user.role)) {
    return res.status(403).json({
      error: "Forbidden: insufficient privileges",
      required: "Admin or Auditor role required"
    });
  }

  next();
}
