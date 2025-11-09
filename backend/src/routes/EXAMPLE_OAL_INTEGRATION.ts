/**
 * Example: Integrating OAL Audit Logging into Admin Endpoints
 *
 * This file demonstrates how to add OAL audit logging to existing admin operations
 */

import { Router, Request, Response } from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";
import { logBalanceAdjustment, logRoleChange } from "../services/oalService";

const router = Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

/**
 * EXAMPLE 1: Balance Adjustment with Audit Logging
 * POST /api/admin/users/:userId/adjust-balance
 */
router.post("/:userId/adjust-balance", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { currency, amount, reason } = req.body;
    const adminId = (req as any).user?.userId;

    if (!adminId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    if (!currency || amount === undefined || !reason) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: currency, amount, reason",
      });
    }

    // 1. Create OAL audit log (PENDING status)
    const auditLog = await logBalanceAdjustment({
      userId,
      adminId,
      currency,
      delta: parseFloat(amount),
      reason,
      location: "admin.api",
    });

    // 2. Execute the balance adjustment
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Update the appropriate balance field
    const balanceField = `${currency.toLowerCase()}Balance` as
      | "usdBalance"
      | "btcBalance"
      | "ethBalance";
    const currentBalance = user[balanceField] || 0;
    const newBalance =
      parseFloat(currentBalance.toString()) + parseFloat(amount);

    await prisma.user.update({
      where: { id: userId },
      data: { [balanceField]: newBalance },
    });

    // 3. Approve the audit log (auto-approve for single-step actions)
    await prisma.oAL.update({
      where: { id: auditLog.id },
      data: {
        status: "APPROVED",
        updatedById: adminId,
      },
    });

    return res.json({
      success: true,
      message: "Balance adjusted successfully",
      auditLogId: auditLog.id,
      newBalance,
    });
  } catch (error) {
    console.error("Error adjusting balance:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to adjust balance",
    });
  }
});

/**
 * EXAMPLE 2: Role Change with Audit Logging
 * PATCH /api/admin/users/:userId/role
 */
router.patch("/:userId/role", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { newRole, reason } = req.body;
    const adminId = (req as any).user?.userId;

    if (!adminId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    if (!newRole || !["USER", "ADMIN", "SUPERADMIN"].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be USER, ADMIN, or SUPERADMIN",
      });
    }

    // 1. Get current user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const oldRole = user.role;

    // 2. Create audit log
    const auditLog = await logRoleChange({
      userId,
      adminId,
      oldRole,
      newRole,
      reason: reason || "Role change requested by admin",
      location: "admin.api",
    });

    // 3. Update the role
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    // 4. Approve the audit log
    await prisma.oAL.update({
      where: { id: auditLog.id },
      data: {
        status: "APPROVED",
        updatedById: adminId,
      },
    });

    return res.json({
      success: true,
      message: "Role updated successfully",
      auditLogId: auditLog.id,
      oldRole,
      newRole,
    });
  } catch (error) {
    console.error("Error changing role:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change role",
    });
  }
});

/**
 * EXAMPLE 3: Two-Step Approval Workflow
 *
 * For large balance adjustments, require dual approval:
 * Step 1: Junior admin creates PENDING log
 * Step 2: Senior admin approves/rejects
 */

// Step 1: Request balance adjustment (creates PENDING log)
router.post(
  "/:userId/request-large-adjustment",
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { currency, amount, reason } = req.body;
      const adminId = (req as any).user?.userId;

      if (!adminId) {
        return res
          .status(401)
          .json({ success: false, message: "Not authenticated" });
      }

      // Create PENDING audit log (don't execute yet)
      const auditLog = await logBalanceAdjustment({
        userId,
        adminId,
        currency,
        delta: parseFloat(amount),
        reason,
        location: "admin.api",
      });

      return res.json({
        success: true,
        message: "Adjustment request created. Awaiting approval.",
        auditLogId: auditLog.id,
        status: "PENDING",
      });
    } catch (error) {
      console.error("Error creating adjustment request:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create adjustment request",
      });
    }
  }
);

// Step 2: Approve/reject the request
router.post(
  "/approve-adjustment/:logId",
  async (req: Request, res: Response) => {
    try {
      const { logId } = req.params;
      const { approved } = req.body; // true or false
      const seniorAdminId = (req as any).user?.userId;

      if (!seniorAdminId) {
        return res
          .status(401)
          .json({ success: false, message: "Not authenticated" });
      }

      // Get the audit log
      const auditLog = await prisma.oAL.findUnique({ where: { id: logId } });
      if (!auditLog) {
        return res
          .status(404)
          .json({ success: false, message: "Audit log not found" });
      }

      if (auditLog.status !== "PENDING") {
        return res.status(400).json({
          success: false,
          message: "This request has already been processed",
        });
      }

      // Update status
      const newStatus = approved ? "APPROVED" : "REJECTED";
      await prisma.oAL.update({
        where: { id: logId },
        data: {
          status: newStatus,
          updatedById: seniorAdminId,
        },
      });

      // If approved, execute the action
      if (approved && auditLog.object === "ledger.balance") {
        const metadata = auditLog.metadata as any;
        const userId = auditLog.subjectId!;
        const currency = metadata.currency;
        const delta = metadata.delta;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          const balanceField = `${currency.toLowerCase()}Balance` as
            | "usdBalance"
            | "btcBalance"
            | "ethBalance";
          const currentBalance = user[balanceField] || 0;
          const newBalance =
            parseFloat(currentBalance.toString()) + parseFloat(delta);

          await prisma.user.update({
            where: { id: userId },
            data: { [balanceField]: newBalance },
          });
        }
      }

      return res.json({
        success: true,
        message: approved
          ? "Request approved and executed"
          : "Request rejected",
        status: newStatus,
      });
    } catch (error) {
      console.error("Error processing approval:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to process approval",
      });
    }
  }
);

export default router;
