/**
 * Policy Audit Routes
 * View audit logs for alert policy changes
 */

import { Request, Router } from "express";
import { AuthenticatedRequest, requireAdmin } from "../middleware/rbac.js";
import {
  detectAnomalies,
  getAllAuditLogs,
  getPolicyAuditHistory,
  getUserAuditLogs,
} from "../services/policyAuditService.js";
import { captureError } from "../utils/sentry.js";

const router = Router();

// Helper to access Express Request properties safely
type ReqWithParams = AuthenticatedRequest & Request;

/**
 * GET /api/admin/policy-audit
 * Get all audit logs (most recent first)
 */
router.get("/", requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const limit = parseInt((req as ReqWithParams).query.limit as string) || 500;
    const logs = await getAllAuditLogs(limit);

    res.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (err) {
    console.error("Failed to fetch audit logs:", err);
    captureError(err as Error, {
      tags: { component: "policy-audit", operation: "fetch-all" },
    });

    res.status(500).json({
      success: false,
      error: "Failed to fetch audit logs",
    });
  }
});

/**
 * GET /api/admin/policy-audit/policy/:policyId
 * Get audit logs for a specific policy
 */
router.get(
  "/policy/:policyId",
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { policyId } = (req as ReqWithParams).params;
      const limit =
        parseInt((req as ReqWithParams).query.limit as string) || 100;

      const logs = await getPolicyAuditHistory(policyId, limit);

      res.json({
        success: true,
        logs,
        count: logs.length,
      });
    } catch (err) {
      console.error("Failed to fetch policy audit logs:", err);
      res.status(500).json({
        success: false,
        error: "Failed to fetch policy audit logs",
      });
    }
  }
);

/**
 * GET /api/admin/policy-audit/user/:userId
 * Get audit logs for a specific user (track admin activity)
 */
router.get(
  "/user/:userId",
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = (req as ReqWithParams).params;
      const limit =
        parseInt((req as ReqWithParams).query.limit as string) || 100;

      const logs = await getUserAuditLogs(userId, limit);

      res.json({
        success: true,
        logs,
        count: logs.length,
      });
    } catch (err) {
      console.error("Failed to fetch user audit logs:", err);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user audit logs",
      });
    }
  }
);

/**
 * GET /api/admin/policy-audit/anomalies
 * Detect suspicious patterns in audit logs
 */
router.get(
  "/anomalies",
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const anomalies = await detectAnomalies();

      res.json({
        success: true,
        anomalies,
        hasAnomalies:
          anomalies.rapidChanges.length > 0 ||
          anomalies.unusualTimes.length > 0 ||
          anomalies.deletions.length > 0,
      });
    } catch (err) {
      console.error("Failed to detect anomalies:", err);
      res.status(500).json({
        success: false,
        error: "Failed to detect anomalies",
      });
    }
  }
);

/**
 * GET /api/admin/policy-audit/verify-integrity
 * Verify the integrity of the audit log hash chain
 * Returns true if chain is intact, false if tampering detected
 */
router.get(
  "/verify-integrity",
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { verifyAuditLogIntegrity } = await import(
        "../services/policyAuditService.js"
      );
      const result = await verifyAuditLogIntegrity();

      if (!result.valid) {
        // Critical: tampering detected
        console.error("🚨 AUDIT LOG TAMPERING DETECTED:", result.errors);
      }

      res.json({
        success: true,
        valid: result.valid,
        totalEntries: result.totalEntries,
        errors: result.errors,
        message: result.valid
          ? "Audit log integrity verified"
          : "⚠️ TAMPERING DETECTED - audit log has been modified",
      });
    } catch (err) {
      console.error("Failed to verify audit integrity:", err);
      res.status(500).json({
        success: false,
        error: "Failed to verify audit log integrity",
      });
    }
  }
);

export default router;
