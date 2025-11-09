/**
 * Example: Integrating OAL Automatic Logging
 *
 * This file demonstrates how to add automatic audit logging to existing admin routes.
 */

import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { oalLogger, oalLoggers } from "../middleware/oalLogger";
import prisma from "../prismaClient";

const router = Router();

// ============================================
// EXAMPLE 1: Using pre-configured loggers
// ============================================

/**
 * Adjust user balance (with automatic logging)
 */
router.post(
  "/users/:userId/balance",
  authenticateToken,
  requireAdmin,
  oalLoggers.balanceAdjustment, // 👈 Just add this middleware!
  async (req, res) => {
    const { userId } = req.params;
    const { amount, currency, reason } = req.body;

    try {
      // Your existing business logic
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update balance
      const field = `${currency.toLowerCase()}Balance` as keyof typeof user;
      const oldBalance = user[field] as any;
      const newBalance = parseFloat(oldBalance.toString()) + amount;

      await prisma.user.update({
        where: { id: userId },
        data: { [field]: newBalance },
      });

      // OAL log is created automatically! ✅
      return res.json({
        success: true,
        oldBalance,
        newBalance,
      });
    } catch (error) {
      return res.status(500).json({ error: "Balance adjustment failed" });
    }
  }
);

/**
 * Change user role (with automatic logging)
 */
router.patch(
  "/users/:userId/role",
  authenticateToken,
  requireAdmin,
  oalLoggers.roleChange, // 👈 Auto-logged with PENDING status
  async (req, res) => {
    const { userId } = req.params;
    const { role, reason } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const oldRole = user.role;

      await prisma.user.update({
        where: { id: userId },
        data: { role },
      });

      // OAL log created with status=PENDING (requires approval) ✅
      return res.json({
        success: true,
        oldRole,
        newRole: role,
      });
    } catch (error) {
      return res.status(500).json({ error: "Role update failed" });
    }
  }
);

// ============================================
// EXAMPLE 2: Custom logging middleware
// ============================================

/**
 * Custom operation with tailored logging
 */
router.post(
  "/rewards/grant-bonus",
  authenticateToken,
  requireAdmin,
  oalLogger({
    object: "rewards.bonus",
    action: "grant",
    location: "admin.rewards",
    extractSubjectId: (req) => req.body.userId,
    extractMetadata: (req) => ({
      bonusType: req.body.bonusType,
      amount: req.body.amount,
      reason: req.body.reason,
      expiresAt: req.body.expiresAt,
    }),
  }),
  async (req, res) => {
    // Your business logic here
    return res.json({ success: true });
  }
);

// ============================================
// EXAMPLE 3: Conditional logging
// ============================================

/**
 * Only log large transactions (skip small ones)
 */
router.post(
  "/transactions/manual",
  authenticateToken,
  requireAdmin,
  oalLogger({
    object: "transaction",
    action: "create",
    location: "admin.transactions",
    extractSubjectId: (req) => req.body.userId,
    extractMetadata: (req) => ({
      amount: req.body.amount,
      type: req.body.type,
      description: req.body.description,
    }),
    skipLogging: (req) => {
      // Only log transactions over $1000
      return Math.abs(req.body.amount) < 1000;
    },
  }),
  async (req, res) => {
    // Your business logic here
    return res.json({ success: true });
  }
);

// ============================================
// EXAMPLE 4: Without middleware (manual logging)
// ============================================

import { createOALLog } from "../services/oalService";

router.post(
  "/complex-operation",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const adminId = (req as any).user?.userId;

    try {
      // Do multiple things...
      const result1 = await doThing1();
      const result2 = await doThing2();

      // Manually create OAL log at the right moment
      await createOALLog({
        object: "complex.operation",
        action: "execute",
        location: "admin.advanced",
        subjectId: req.body.targetUserId,
        metadata: {
          step1: result1,
          step2: result2,
          inputs: req.body,
        },
        createdById: adminId,
        status: "APPROVED",
      });

      return res.json({ success: true, result1, result2 });
    } catch (error) {
      // Log failures too
      await createOALLog({
        object: "complex.operation",
        action: "execute",
        location: "admin.advanced",
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
          inputs: req.body,
        },
        createdById: adminId,
        status: "REJECTED",
      });

      return res.status(500).json({ error: "Operation failed" });
    }
  }
);

// Dummy functions for example
async function doThing1() {
  return { done: true };
}
async function doThing2() {
  return { done: true };
}

export default router;
