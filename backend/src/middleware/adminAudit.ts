import { NextFunction, Request, Response } from "express";
import logger from "../logger";
import prisma from "../prismaClient";

interface AdminActionLog {
  adminId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log admin actions to the database
 */
export async function logAdminAction(log: AdminActionLog): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: log.adminId,
        action: `ADMIN_${log.action}`,
        resource: log.resource,
        resourceId: log.resourceId,
        oldValues: log.oldValues ? JSON.stringify(log.oldValues) : null,
        newValues: log.newValues ? JSON.stringify(log.newValues) : null,
        metadata: log.metadata ? JSON.stringify(log.metadata) : null,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      },
    });
    logger.info("Admin action logged", {
      adminId: log.adminId,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
    });
  } catch (error) {
    logger.error("Failed to log admin action", { error, log });
  }
}

/**
 * Middleware to automatically log admin actions
 * Attach this after requireAdmin middleware
 */
export function adminAuditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const user = (req as any).user;

  // Capture the original res.json to log after response
  const originalJson = res.json.bind(res);

  res.json = (body: any) => {
    // Only log successful mutations
    if (
      res.statusCode < 400 &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
    ) {
      const action = getActionFromRequest(req);
      const resource = getResourceFromPath(req.path);
      const resourceId = req.params.id || req.params.userId || req.body?.id;

      logAdminAction({
        adminId: user?.id || "unknown",
        action,
        resource,
        resourceId,
        newValues: ["POST", "PUT", "PATCH"].includes(req.method)
          ? sanitizeBody(req.body)
          : undefined,
        metadata: {
          method: req.method,
          path: req.path,
          query: req.query,
          statusCode: res.statusCode,
        },
        ipAddress:
          (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
          req.socket?.remoteAddress,
        userAgent: req.headers["user-agent"],
      }).catch(() => {}); // Don't block response
    }

    return originalJson(body);
  };

  next();
}

/**
 * Extract action from request method and path
 */
function getActionFromRequest(req: Request): string {
  const method = req.method.toUpperCase();
  const pathParts = req.path.split("/").filter(Boolean);

  // Map common patterns
  const pathAction = pathParts[pathParts.length - 1];

  if (pathAction === "suspend") return "USER_SUSPEND";
  if (pathAction === "activate") return "USER_ACTIVATE";
  if (pathAction === "delete") return "DELETE";
  if (pathAction === "approve") return "APPROVE";
  if (pathAction === "reject") return "REJECT";
  if (pathAction === "refund") return "REFUND";

  switch (method) {
    case "POST":
      return "CREATE";
    case "PUT":
    case "PATCH":
      return "UPDATE";
    case "DELETE":
      return "DELETE";
    default:
      return method;
  }
}

/**
 * Extract resource type from path
 */
function getResourceFromPath(path: string): string {
  const parts = path.split("/").filter(Boolean);

  // Remove 'api' and 'admin' prefixes
  const relevantParts = parts.filter((p) => p !== "api" && p !== "admin");

  if (relevantParts.length === 0) return "unknown";

  // Get the resource name (first non-id part)
  const resource = relevantParts.find(
    (p) => !p.match(/^[a-f0-9-]{24,}$|^[a-z0-9]{20,}$/i),
  );

  return resource?.toUpperCase() || "RESOURCE";
}

/**
 * Remove sensitive fields from request body before logging
 */
function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "apiKey",
    "privateKey",
    "creditCard",
    "cvv",
    "ssn",
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (sensitiveFields.some((f) => key.toLowerCase().includes(f))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeBody(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Get admin activity summary for a time range
 */
export async function getAdminActivitySummary(
  adminId?: string,
  startDate?: Date,
  endDate?: Date,
): Promise<{
  totalActions: number;
  actionsByType: Record<string, number>;
  recentActions: any[];
}> {
  const where: any = {
    action: { startsWith: "ADMIN_" },
    timestamp: {
      gte: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000),
      lte: endDate || new Date(),
    },
  };

  if (adminId) {
    where.userId = adminId;
  }

  const [logs, recentActions] = await Promise.all([
    prisma.auditLog.findMany({ where }),
    prisma.auditLog.findMany({
      where,
      take: 10,
      orderBy: { timestamp: "desc" },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    }),
  ]);

  const actionsByType: Record<string, number> = {};
  for (const log of logs) {
    actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
  }

  return {
    totalActions: logs.length,
    actionsByType,
    recentActions,
  };
}

export default {
  logAdminAction,
  adminAuditMiddleware,
  getAdminActivitySummary,
};
