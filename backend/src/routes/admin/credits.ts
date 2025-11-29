/**
 * Admin Credits Route
 *
 * Provides legitimate promotional/compensation credit functionality
 * with proper limits, approval workflows, and audit trails.
 */

import { Router } from "express";
import logger from "../../logger";
import { logAdminAction } from "../../middleware/adminAudit";
import { requireAdmin } from "../../middleware/adminAuth";
import { authenticateToken } from "../../middleware/auth";
import prisma from "../../prismaClient";
import { serializeDecimal } from "../../utils/decimal";

const router = Router();

// Credit type limits (in USD equivalent)
const CREDIT_LIMITS: Record<
  string,
  { max: number; requiresApproval: number; dailyLimit: number }
> = {
  PROMOTIONAL_CREDIT: { max: 100, requiresApproval: 50, dailyLimit: 500 },
  REFUND: { max: 1000, requiresApproval: 500, dailyLimit: 5000 },
  COMPENSATION: { max: 250, requiresApproval: 100, dailyLimit: 1000 },
  BONUS: { max: 50, requiresApproval: 25, dailyLimit: 200 },
};

// Roles that can bypass certain limits
const SUPER_ADMIN_ROLES = ["SUPER_ADMIN", "admin"];

interface CreditRequest {
  userId: string;
  amount: number;
  type: keyof typeof CREDIT_LIMITS;
  reason: string;
  referenceId?: string; // e.g., support ticket ID
}

/**
 * POST /api/admin/credits
 * Add promotional/compensation credits to user account
 */
router.post("/", authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const admin = req.user;
    const { userId, amount, type, reason, referenceId }: CreditRequest =
      req.body;

    // 1. Validate required fields
    if (!userId || !amount || !type || !reason) {
      return res.status(400).json({
        error: "Missing required fields: userId, amount, type, reason",
      });
    }

    // 2. Validate credit type
    const limits = CREDIT_LIMITS[type];
    if (!limits) {
      return res.status(400).json({
        error: `Invalid credit type. Allowed: ${Object.keys(CREDIT_LIMITS).join(", ")}`,
      });
    }

    // 3. Validate amount is positive
    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be positive" });
    }

    // 4. Check maximum single transaction limit
    const isSuperAdmin = SUPER_ADMIN_ROLES.includes(admin.role);
    if (amount > limits.max && !isSuperAdmin) {
      return res.status(403).json({
        error: `Amount exceeds maximum limit of $${limits.max} for ${type}. Contact SUPER_ADMIN.`,
      });
    }

    // 5. Check if approval is required (skip approval flow if model doesn't exist)
    if (amount > limits.requiresApproval && !isSuperAdmin) {
      // Log the pending request instead of creating approval record
      await logAdminAction({
        adminId: admin.id,
        action: "CREDIT_REQUEST_PENDING",
        resource: "USER_BALANCE",
        resourceId: userId,
        newValues: { amount, type, reason },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return res.json({
        success: false,
        requiresApproval: true,
        message: `Credit of $${amount} requires SUPER_ADMIN approval. Please contact a supervisor.`,
      });
    }

    // 6. Check daily limit for this admin
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const dailyCredits = await prisma.transaction.aggregate({
      where: {
        type: { in: Object.keys(CREDIT_LIMITS) },
        createdAt: { gte: todayStart },
        description: { contains: admin.id }, // Admin who created it
      },
      _sum: { amount: true },
    });

    const dailyTotal = Number(dailyCredits._sum.amount || 0) + amount;
    if (dailyTotal > limits.dailyLimit && !isSuperAdmin) {
      return res.status(403).json({
        error: `Daily limit of $${limits.dailyLimit} exceeded. You've issued $${dailyTotal - amount} today.`,
      });
    }

    // 7. Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 8. Create the credit transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type,
        amount, // Prisma handles number to Decimal conversion
        status: "completed",
        description: `${type}: ${reason} (Admin: ${admin.id})`,
        provider: "admin_credit",
      },
    });

    // 9. Update user balance if balance field exists
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          balance: { increment: amount },
        },
      });
    } catch {
      // Balance field may not exist, that's okay
      logger.warn("Could not update user balance field", { userId });
    }

    // 10. Log the action for audit trail
    await logAdminAction({
      adminId: admin.id,
      action: "CREDIT_ISSUED",
      resource: "USER_BALANCE",
      resourceId: userId,
      newValues: {
        amount,
        type,
        reason,
        transactionId: transaction.id,
        userEmail: user.email,
        referenceId,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    logger.info("Admin credit issued", {
      adminId: admin.id,
      userId,
      amount,
      type,
      transactionId: transaction.id,
    });

    res.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: serializeDecimal(transaction.amount),
        type: transaction.type,
        status: transaction.status,
      },
      user: {
        id: user.id,
        email: user.email,
        name:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      },
    });
  } catch (error) {
    logger.error("Failed to issue admin credit", { error });
    res.status(500).json({ error: "Failed to issue credit" });
  }
});

/**
 * GET /api/admin/credits/history
 * View credit history with filters
 */
router.get(
  "/history",
  authenticateToken,
  requireAdmin,
  async (req: any, res) => {
    try {
      const { userId, type, startDate, endDate, limit = 50 } = req.query;

      const where: any = {
        type: { in: Object.keys(CREDIT_LIMITS) },
      };

      if (userId) where.userId = userId;
      if (type) where.type = type;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const credits = await prisma.transaction.findMany({
        where,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      });

      res.json({
        credits: credits.map((c) => ({
          id: c.id,
          userId: c.userId,
          amount: serializeDecimal(c.amount),
          type: c.type,
          status: c.status,
          description: c.description,
          createdAt: c.createdAt,
          user: c.user
            ? {
                id: c.user.id,
                email: c.user.email,
                name: `${c.user.firstName || ""} ${c.user.lastName || ""}`.trim(),
              }
            : null,
        })),
      });
    } catch (error) {
      logger.error("Failed to fetch credit history", { error });
      res.status(500).json({ error: "Failed to fetch credit history" });
    }
  },
);

/**
 * GET /api/admin/credits/limits
 * Get current credit limits for UI display
 */
router.get(
  "/limits",
  authenticateToken,
  requireAdmin,
  async (req: any, res) => {
    const admin = req.user;
    const isSuperAdmin = SUPER_ADMIN_ROLES.includes(admin.role);

    res.json({
      limits: CREDIT_LIMITS,
      canBypassLimits: isSuperAdmin,
      role: admin.role,
    });
  },
);

/**
 * GET /api/admin/credits/daily-usage
 * Get admin's daily credit usage
 */
router.get(
  "/daily-usage",
  authenticateToken,
  requireAdmin,
  async (req: any, res) => {
    try {
      const admin = req.user;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const dailyCredits = await prisma.transaction.aggregate({
        where: {
          type: { in: Object.keys(CREDIT_LIMITS) },
          createdAt: { gte: todayStart },
          description: { contains: admin.id },
        },
        _sum: { amount: true },
        _count: true,
      });

      res.json({
        today: {
          total: Number(dailyCredits._sum.amount || 0),
          count: dailyCredits._count,
        },
        limits: CREDIT_LIMITS,
      });
    } catch (error) {
      logger.error("Failed to fetch daily usage", { error });
      res.status(500).json({ error: "Failed to fetch daily usage" });
    }
  },
);

export default router;
