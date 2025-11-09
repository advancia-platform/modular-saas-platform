/**
 * OAL Automatic Logging Middleware
 *
 * Automatically logs sensitive operations to the OAL audit system.
 * Tracks user actions, balance changes, role modifications, and more.
 */

import { Request, Response, NextFunction } from "express";
import { createOALLog } from "../services/oalService";

interface OALMiddlewareOptions {
  object: string; // e.g., "ledger.balance", "user.role"
  action: string; // e.g., "adjust", "update", "delete"
  location?: string; // Defaults to route path
  extractSubjectId?: (req: Request) => string | undefined;
  extractMetadata?: (req: Request, res: Response) => any;
  skipLogging?: (req: Request) => boolean;
  requireApproval?: boolean; // If true, sets status to PENDING instead of APPROVED
}

/**
 * Create an automatic OAL logging middleware
 *
 * @example
 * // Log all balance adjustments
 * router.post('/adjust-balance',
 *   authenticateToken,
 *   requireAdmin,
 *   oalLogger({
 *     object: 'ledger.balance',
 *     action: 'adjust',
 *     extractSubjectId: (req) => req.body.userId,
 *     extractMetadata: (req) => ({
 *       delta: req.body.amount,
 *       currency: req.body.currency,
 *       reason: req.body.reason
 *     })
 *   }),
 *   adjustBalanceHandler
 * );
 */
export function oalLogger(options: OALMiddlewareOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip if condition is met
    if (options.skipLogging && options.skipLogging(req)) {
      return next();
    }

    // Extract admin ID from JWT
    const adminId = (req as any).user?.userId;
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Extract subject ID (the user being acted upon)
    const subjectId = options.extractSubjectId
      ? options.extractSubjectId(req)
      : undefined;

    // Determine location
    const location = options.location || `api.${req.path}`;

    try {
      // Store original send function
      const originalSend = res.send;

      // Intercept response to capture success/failure
      res.send = function (data: any) {
        res.send = originalSend; // Restore original

        // Only log if the request was successful
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;

        if (isSuccess) {
          // Extract metadata after response is ready
          const metadata = options.extractMetadata
            ? options.extractMetadata(req, res)
            : {
                method: req.method,
                path: req.path,
                body: sanitizeBody(req.body),
                query: req.query,
              };

          // Create audit log (fire and forget - don't block response)
          createOALLog({
            object: options.object,
            action: options.action,
            location,
            subjectId,
            metadata,
            createdById: adminId,
            status: options.requireApproval ? "PENDING" : "APPROVED",
          }).catch((err) => {
            console.error("Failed to create OAL log:", err);
          });
        }

        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error("OAL middleware error:", error);
      next(); // Don't block request on logging failure
    }
  };
}

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== "object") return body;

  const sanitized = { ...body };
  const sensitiveFields = [
    "password",
    "passwordHash",
    "totpSecret",
    "backupCodes",
    "token",
    "apiKey",
  ];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }

  return sanitized;
}

/**
 * Pre-configured middleware for common operations
 */
export const oalLoggers = {
  /**
   * Log balance adjustments
   */
  balanceAdjustment: oalLogger({
    object: "ledger.balance",
    action: "adjust",
    location: "admin.balance",
    extractSubjectId: (req) => req.body.userId || req.params.userId,
    extractMetadata: (req) => ({
      delta: req.body.amount || req.body.delta,
      currency: req.body.currency || "USD",
      reason: req.body.reason || "Manual adjustment",
      oldBalance: req.body.oldBalance,
      newBalance: req.body.newBalance,
    }),
  }),

  /**
   * Log role changes
   */
  roleChange: oalLogger({
    object: "user.role",
    action: "update",
    location: "admin.users",
    extractSubjectId: (req) => req.body.userId || req.params.userId,
    extractMetadata: (req) => ({
      oldRole: req.body.oldRole,
      newRole: req.body.newRole || req.body.role,
      reason: req.body.reason,
    }),
    requireApproval: true, // Role changes need approval
  }),

  /**
   * Log user suspensions
   */
  userSuspension: oalLogger({
    object: "user.status",
    action: "suspend",
    location: "admin.users",
    extractSubjectId: (req) => req.body.userId || req.params.userId,
    extractMetadata: (req) => ({
      reason: req.body.reason,
      duration: req.body.duration,
      until: req.body.until,
    }),
  }),

  /**
   * Log user deletions
   */
  userDeletion: oalLogger({
    object: "user",
    action: "delete",
    location: "admin.users",
    extractSubjectId: (req) => req.params.userId,
    extractMetadata: (req) => ({
      reason: req.body.reason,
      email: req.body.email,
    }),
    requireApproval: true, // Deletions need approval
  }),

  /**
   * Log system config changes
   */
  configChange: oalLogger({
    object: "system.config",
    action: "update",
    location: "admin.settings",
    extractMetadata: (req) => ({
      key: req.body.key || req.params.key,
      oldValue: req.body.oldValue,
      newValue: req.body.newValue || req.body.value,
    }),
    requireApproval: true, // Config changes need approval
  }),

  /**
   * Log transaction reversals
   */
  transactionReversal: oalLogger({
    object: "transaction",
    action: "reverse",
    location: "admin.transactions",
    extractSubjectId: (req) => req.body.userId,
    extractMetadata: (req) => ({
      transactionId: req.body.transactionId || req.params.transactionId,
      amount: req.body.amount,
      reason: req.body.reason,
    }),
    requireApproval: true,
  }),

  /**
   * Log manual crypto withdrawals
   */
  cryptoWithdrawal: oalLogger({
    object: "crypto.withdrawal",
    action: "approve",
    location: "admin.crypto",
    extractSubjectId: (req) => req.body.userId,
    extractMetadata: (req) => ({
      withdrawalId: req.body.withdrawalId || req.params.withdrawalId,
      amount: req.body.amount,
      currency: req.body.currency,
      address: req.body.address,
    }),
  }),

  /**
   * Log IP blocks
   */
  ipBlock: oalLogger({
    object: "security.ip",
    action: "block",
    location: "admin.security",
    extractMetadata: (req) => ({
      ip: req.body.ip,
      reason: req.body.reason,
      until: req.body.until,
    }),
  }),

  /**
   * Log admin privilege grants
   */
  grantAdminAccess: oalLogger({
    object: "admin.access",
    action: "grant",
    location: "admin.privileges",
    extractSubjectId: (req) => req.body.userId || req.params.userId,
    extractMetadata: (req) => ({
      permissions: req.body.permissions,
      scope: req.body.scope,
      reason: req.body.reason,
    }),
    requireApproval: true,
  }),
};

/**
 * Batch logging for multiple operations
 * Useful for bulk operations like mass user imports
 */
export async function batchOALLog(
  entries: Array<{
    object: string;
    action: string;
    location: string;
    subjectId?: string;
    metadata?: any;
    createdById: string;
    status?: "PENDING" | "APPROVED" | "REJECTED";
  }>
) {
  const promises = entries.map((entry) => createOALLog(entry));
  return Promise.allSettled(promises);
}

export default oalLogger;
