/**
 * Alert Policy Management Routes
 * RBAC-protected endpoints for managing alert policies
 */

import { Request, Router } from "express";
import { z } from "zod";
import {
  AuthenticatedRequest,
  requireAdmin,
  requireSuperAdmin,
} from "../middleware/rbac.js";
import prisma from "../prismaClient";
import { logPolicyChange } from "../services/policyAuditService";
import { withDefaults } from "../utils/prismaHelpers";
import { captureError } from "../utils/sentry";

const router = Router();

// Helper to access Express Request properties safely
type ReqWithParams = AuthenticatedRequest & Request;

/**
 * Validation schemas
 */
const createPolicySchema = z.object({
  routeGroup: z.string().min(1).max(50),
  threshold: z.number().int().min(1).max(10000),
  cooldown: z.number().int().min(0).max(3600000).default(300000),
  mode: z.enum(["IMMEDIATE", "BATCHED", "MIXED"]).default("IMMEDIATE"),
  batchIntervalMs: z.number().int().min(0).max(3600000).optional(),
  channels: z
    .array(z.enum(["email", "sms", "slack", "teams", "websocket", "sentry"]))
    .min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  enabled: z.boolean().default(true),
  reason: z.string().optional(),
});

const updatePolicySchema = z.object({
  threshold: z.number().int().min(1).max(10000).optional(),
  cooldown: z.number().int().min(0).max(3600000).optional(),
  mode: z.enum(["IMMEDIATE", "BATCHED", "MIXED"]).optional(),
  batchIntervalMs: z.number().int().min(0).max(3600000).optional(),
  channels: z
    .array(z.enum(["email", "sms", "slack", "teams", "websocket", "sentry"]))
    .min(1)
    .optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  enabled: z.boolean().optional(),
  reason: z.string().optional(),
});

/**
 * GET /api/admin/alert-policies
 * List all alert policies (read-only for ADMIN, editable for SUPERADMIN)
 */
router.get("/", requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const policies = await prisma.alert_policies.findMany({
      orderBy: { routeGroup: "asc" },
    });

    res.json({
      success: true,
      policies,
      canEdit: req.user?.role === "SUPERADMIN",
    });
  } catch (err) {
    console.error("Failed to fetch alert policies:", err);
    captureError(err as Error, {
      tags: { component: "alert-policies", operation: "fetch" },
    });

    res.status(500).json({
      success: false,
      error: "Failed to fetch alert policies",
    });
  }
});

/**
 * GET /api/admin/alert-policies/:group
 * Get a specific policy by route group
 */
router.get("/:group", requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { group } = (req as ReqWithParams).params;

    const policy = await prisma.alert_policies.findUnique({
      where: { routeGroup: group },
    });

    if (!policy) {
      res.status(404).json({
        success: false,
        error: "Policy not found",
      });
      return;
    }

    res.json({
      success: true,
      policy,
      canEdit: req.user?.role === "SUPERADMIN",
    });
  } catch (err) {
    console.error("Failed to fetch policy:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch policy",
    });
  }
});

/**
 * POST /api/admin/alert-policies
 * Create a new alert policy (SUPERADMIN only)
 */
router.post("/", requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const validated = createPolicySchema.parse((req as ReqWithParams).body);

    // Check if policy already exists
    const existing = await prisma.alert_policies.findUnique({
      where: { routeGroup: validated.routeGroup },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        error: "Policy already exists for this route group",
      });
      return;
    }

    const policy = await prisma.alert_policies.create({
      data: withDefaults({
        routeGroup: validated.routeGroup,
        threshold: validated.threshold,
        cooldown: validated.cooldown,
        mode: validated.mode,
        batchIntervalMs: validated.batchIntervalMs,
        channels: validated.channels,
        severity: validated.severity,
        enabled: validated.enabled,
        createdBy: req.user!.id,
        updatedBy: req.user!.id,
      }),
    });

    // Log to audit trail
    await logPolicyChange({
      policyId: policy.id,
      action: "created",
      changedBy: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      ipAddress: (req as ReqWithParams).ip,
      userAgent: (req as ReqWithParams).get("user-agent"),
      changesAfter: policy,
      reason: validated.reason,
    });

    console.log(
      `✓ Policy created for ${validated.routeGroup} by ${req.user!.email}`,
    );

    res.status(201).json({
      success: true,
      policy,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: err.issues,
      });
      return;
    }

    console.error("Failed to create policy:", err);
    captureError(err as Error, {
      tags: { component: "alert-policies", operation: "create" },
      extra: { body: (req as ReqWithParams).body },
    });

    res.status(500).json({
      success: false,
      error: "Failed to create policy",
    });
  }
});

/**
 * PUT /api/admin/alert-policies/:group
 * Update an existing alert policy (SUPERADMIN only)
 */
router.put(
  "/:group",
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { group } = (req as ReqWithParams).params;
      const validated = updatePolicySchema.parse((req as ReqWithParams).body);

      // Get current policy for audit trail
      const currentPolicy = await prisma.alert_policies.findUnique({
        where: { routeGroup: group },
      });

      if (!currentPolicy) {
        res.status(404).json({
          success: false,
          error: "Policy not found",
        });
        return;
      }

      // Update policy
      const updatedPolicy = await prisma.alert_policies.update({
        where: { routeGroup: group },
        data: {
          ...validated,
          updatedBy: req.user!.id,
        },
      });

      // Log to audit trail
      await logPolicyChange({
        policyId: updatedPolicy.id,
        action: "updated",
        changedBy: req.user!.id,
        userEmail: req.user!.email,
        userRole: req.user!.role,
        ipAddress: (req as ReqWithParams).ip,
        userAgent: (req as ReqWithParams).get("user-agent"),
        changesBefore: currentPolicy,
        changesAfter: updatedPolicy,
        reason: validated.reason,
      });

      console.log(`✓ Policy updated for ${group} by ${req.user!.email}`);

      res.json({
        success: true,
        policy: updatedPolicy,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: err.issues,
        });
        return;
      }

      console.error("Failed to update policy:", err);
      captureError(err as Error, {
        tags: { component: "alert-policies", operation: "update" },
        extra: {
          body: (req as ReqWithParams).body,
          group: (req as ReqWithParams).params.group,
        },
      });

      res.status(500).json({
        success: false,
        error: "Failed to update policy",
      });
    }
  },
);

/**
 * DELETE /api/admin/alert-policies/:group
 * Delete an alert policy (SUPERADMIN only, very sensitive)
 */
router.delete(
  "/:group",
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { group } = (req as ReqWithParams).params;
      const { reason } = (req as ReqWithParams).body;

      // Get current policy for audit trail
      const currentPolicy = await prisma.alert_policies.findUnique({
        where: { routeGroup: group },
      });

      if (!currentPolicy) {
        res.status(404).json({
          success: false,
          error: "Policy not found",
        });
        return;
      }

      // Delete policy
      await prisma.alert_policies.delete({
        where: { routeGroup: group },
      });

      // Log to audit trail (critical action)
      await logPolicyChange({
        policyId: currentPolicy.id,
        action: "deleted",
        changedBy: req.user!.id,
        userEmail: req.user!.email,
        userRole: req.user!.role,
        ipAddress: (req as ReqWithParams).ip,
        userAgent: (req as ReqWithParams).get("user-agent"),
        changesBefore: currentPolicy,
        changesAfter: { deleted: true },
        reason: reason || "No reason provided",
      });

      // Alert Sentry (deletion is critical)
      captureError(new Error(`Policy deleted: ${group}`), {
        level: "warning",
        tags: { type: "policy_deletion", routeGroup: group },
        extra: {
          deletedBy: req.user!.email,
          policy: currentPolicy,
          reason,
        },
      });

      console.log(`⚠️ Policy DELETED for ${group} by ${req.user!.email}`);

      res.json({
        success: true,
        message: "Policy deleted successfully",
      });
    } catch (err) {
      console.error("Failed to delete policy:", err);
      captureError(err as Error, {
        tags: { component: "alert-policies", operation: "delete" },
        extra: { group: (req as ReqWithParams).params.group },
      });

      res.status(500).json({
        success: false,
        error: "Failed to delete policy",
      });
    }
  },
);

/**
 * PATCH /api/admin/alert-policies/:group/toggle
 * Enable/disable a policy (SUPERADMIN only)
 */
router.patch(
  "/:group/toggle",
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { group } = (req as ReqWithParams).params;
      const { enabled, reason } = (req as ReqWithParams).body;

      if (typeof enabled !== "boolean") {
        res.status(400).json({
          success: false,
          error: "enabled must be a boolean",
        });
        return;
      }

      // Get current policy for audit trail
      const currentPolicy = await prisma.alert_policies.findUnique({
        where: { routeGroup: group },
      });

      if (!currentPolicy) {
        res.status(404).json({
          success: false,
          error: "Policy not found",
        });
        return;
      }

      // Update enabled status
      const updatedPolicy = await prisma.alert_policies.update({
        where: { routeGroup: group },
        data: {
          enabled,
          updatedBy: req.user!.id,
        },
      });

      // Log to audit trail
      await logPolicyChange({
        policyId: updatedPolicy.id,
        action: enabled ? "enabled" : "disabled",
        changedBy: req.user!.id,
        userEmail: req.user!.email,
        userRole: req.user!.role,
        ipAddress: (req as ReqWithParams).ip,
        userAgent: (req as ReqWithParams).get("user-agent"),
        changesBefore: currentPolicy,
        changesAfter: updatedPolicy,
        reason: reason || `Policy ${enabled ? "enabled" : "disabled"}`,
      });

      console.log(
        `✓ Policy ${enabled ? "enabled" : "disabled"} for ${group} by ${
          req.user!.email
        }`,
      );

      res.json({
        success: true,
        policy: updatedPolicy,
      });
    } catch (err) {
      console.error("Failed to toggle policy:", err);
      res.status(500).json({
        success: false,
        error: "Failed to toggle policy",
      });
    }
  },
);

export default router;
