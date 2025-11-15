import { PrismaClient } from "@prisma/client";
import { Request, Response, Router } from "express";
import logger from "../logger";
import { authenticateToken, requireAdmin } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/admin/bulk/activate-users
 * Bulk activate/deactivate user accounts
 */
router.post(
  "/activate-users",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userIds, active } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "userIds array is required" });
      }

      if (userIds.length > 100) {
        return res
          .status(400)
          .json({ error: "Maximum 100 users per bulk operation" });
      }

      const result = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { active: active !== false },
      });

      res.json({
        success: true,
        message: `${result.count} users ${
          active !== false ? "activated" : "deactivated"
        }`,
        count: result.count,
      });
    } catch (error) {
      logger.error("Bulk activate users error:", error);
      res.status(500).json({ error: "Failed to activate users" });
    }
  }
);

/**
 * POST /api/admin/bulk/delete-users
 * Bulk delete user accounts (soft delete)
 */
router.post(
  "/delete-users",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userIds, permanent = false } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "userIds array is required" });
      }

      if (userIds.length > 50) {
        return res
          .status(400)
          .json({ error: "Maximum 50 users per delete operation" });
      }

      if (permanent) {
        // Permanent delete (use with caution)
        await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
      } else {
        // Soft delete - set inactive
        await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { active: false },
        });
      }

      res.json({
        success: true,
        message: `${userIds.length} users ${
          permanent ? "permanently deleted" : "deactivated"
        }`,
        count: userIds.length,
      });
    } catch (error) {
      logger.error("Bulk delete users error:", error);
      res.status(500).json({ error: "Failed to delete users" });
    }
  }
);

/**
 * POST /api/admin/bulk/assign-role
 * Bulk assign user roles
 */
router.post(
  "/assign-role",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userIds, role } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "userIds array is required" });
      }

      const validRoles = ["USER", "ADMIN", "MODERATOR"];
      if (!validRoles.includes(role)) {
        return res
          .status(400)
          .json({ error: "Invalid role. Use USER, ADMIN, or MODERATOR" });
      }

      const result = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { role },
      });

      res.json({
        success: true,
        message: `${result.count} users assigned to ${role} role`,
        count: result.count,
      });
    } catch (error) {
      logger.error("Bulk assign role error:", error);
      res.status(500).json({ error: "Failed to assign roles" });
    }
  }
);

/**
 * POST /api/admin/bulk/send-email
 * Bulk send email to selected users
 */
router.post(
  "/send-email",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userIds, subject, message } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "userIds array is required" });
      }

      if (!subject || !message) {
        return res
          .status(400)
          .json({ error: "subject and message are required" });
      }

      if (userIds.length > 500) {
        return res
          .status(400)
          .json({ error: "Maximum 500 users per email operation" });
      }

      // Get user emails
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true },
      });

      // Log email sends (actual sending would use email service)
      await prisma.emailLog.createMany({
        data: users.map((user) => ({
          userId: user.id,
          to: user.email,
          subject,
          template: "admin-bulk-email",
          metadata: { message }, // Store custom message in metadata
          status: "queued",
        })),
      });

      res.json({
        success: true,
        message: `Email queued for ${users.length} users`,
        count: users.length,
      });
    } catch (error) {
      logger.error("Bulk send email error:", error);
      res.status(500).json({ error: "Failed to send emails" });
    }
  }
);

/**
 * POST /api/admin/bulk/adjust-balance
 * Bulk adjust user USD balances
 */
router.post(
  "/adjust-balance",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userIds, amount, operation = "add", reason } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "userIds array is required" });
      }

      if (!amount || isNaN(amount)) {
        return res.status(400).json({ error: "Valid amount is required" });
      }

      if (!["add", "subtract", "set"].includes(operation)) {
        return res
          .status(400)
          .json({ error: "operation must be add, subtract, or set" });
      }

      const adjustAmount = parseFloat(amount);
      const results = [];

      for (const userId of userIds) {
        try {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          if (!user) continue;

          let newBalance;
          switch (operation) {
            case "add":
              newBalance = Number(user.usdBalance) + adjustAmount;
              break;
            case "subtract":
              newBalance = Number(user.usdBalance) - adjustAmount;
              break;
            case "set":
              newBalance = adjustAmount;
              break;
            default:
              continue;
          }

          await prisma.user.update({
            where: { id: userId },
            data: { usdBalance: newBalance },
          });

          // Create transaction record
          await prisma.transaction.create({
            data: {
              userId,
              amount: adjustAmount,
              type: "ADMIN_ADJUSTMENT",
              status: "completed",
              description:
                reason || `Admin balance ${operation}: ${adjustAmount}`,
            },
          });

          results.push(userId);
        } catch (err) {
          logger.error(`Failed to adjust balance for user ${userId}:`, err);
        }
      }

      res.json({
        success: true,
        message: `Balance adjusted for ${results.length} users`,
        count: results.length,
      });
    } catch (error) {
      logger.error("Bulk adjust balance error:", error);
      res.status(500).json({ error: "Failed to adjust balances" });
    }
  }
);

/**
 * POST /api/admin/bulk/verify-email
 * Bulk verify user emails
 */
router.post(
  "/verify-email",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "userIds array is required" });
      }

      const result = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: `${result.count} users email verified`,
        count: result.count,
      });
    } catch (error) {
      logger.error("Bulk verify email error:", error);
      res.status(500).json({ error: "Failed to verify emails" });
    }
  }
);

/**
 * POST /api/admin/bulk/export-users
 * Export selected users data to CSV
 */
router.post(
  "/export-users",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userIds, fields = [] } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "userIds array is required" });
      }

      if (userIds.length > 1000) {
        return res.status(400).json({ error: "Maximum 1000 users per export" });
      }

      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          active: true,
          emailVerified: true,
          usdBalance: true,
          createdAt: true,
          lastLogin: true,
        },
      });

      // Convert to CSV format
      const csvHeaders = [
        "ID",
        "Email",
        "Username",
        "First Name",
        "Last Name",
        "Role",
        "Active",
        "Email Verified",
        "Balance",
        "Created At",
        "Last Login",
      ];

      const csvRows = users.map((user) => [
        user.id,
        user.email,
        user.username,
        user.firstName || "",
        user.lastName || "",
        user.role,
        user.active ? "Yes" : "No",
        user.emailVerified ? "Yes" : "No",
        user.usdBalance.toString(),
        user.createdAt.toISOString(),
        user.lastLogin?.toISOString() || "",
      ]);

      const csv = [
        csvHeaders.join(","),
        ...csvRows.map((row) => row.join(",")),
      ].join("\n");

      res.json({
        success: true,
        csv,
        count: users.length,
      });
    } catch (error) {
      logger.error("Bulk export users error:", error);
      res.status(500).json({ error: "Failed to export users" });
    }
  }
);

/**
 * POST /api/admin/bulk/reset-password
 * Bulk send password reset links
 */
router.post(
  "/reset-password",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "userIds array is required" });
      }

      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true },
      });

      // Create password reset requests
      const requests = await Promise.all(
        users.map(async (user) => {
          const token = `RESET_${user.id}_${Date.now()}_${Math.random()
            .toString(36)
            .substring(7)}`;

          return prisma.passwordResetRequest.create({
            data: {
              userId: user.id,
              email: user.email,
              token,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
          });
        })
      );

      res.json({
        success: true,
        message: `Password reset links created for ${requests.length} users`,
        count: requests.length,
      });
    } catch (error) {
      logger.error("Bulk reset password error:", error);
      res.status(500).json({ error: "Failed to create reset requests" });
    }
  }
);

export default router;

/**
 * POST /api/admin/bulk/enable-gpt5
 * Bulk enable GPT-5 access for users
 */
router.post(
  "/enable-gpt5",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userIds, gpt5Enabled } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "userIds array is required" });
      }

      if (userIds.length > 100) {
        return res
          .status(400)
          .json({ error: "Maximum 100 users per bulk operation" });
      }

      const result = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { gpt5Enabled: gpt5Enabled !== false },
      });

      res.json({
        success: true,
        message: `GPT-5 ${gpt5Enabled !== false ? "enabled" : "disabled"} for ${
          result.count
        } users`,
        count: result.count,
      });
    } catch (error) {
      logger.error("Bulk enable GPT-5 error:", error);
      res.status(500).json({ error: "Failed to update GPT-5 access" });
    }
  }
);

export default router;
