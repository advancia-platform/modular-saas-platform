import { Response, Router } from "express";
import type { Server as IOServer } from "socket.io";
import {
  authenticateToken,
  AuthRequest,
  logAdminAction,
  requireAdmin,
} from "../middleware/auth";
import prisma from "../prismaClient";

const router = Router();

let ioRef: IOServer | null = null;
export function setWithdrawalSocketIO(io: IOServer) {
  ioRef = io;
}

// POST /api/withdrawals/request
// User creates a withdrawal request for USD, BTC, ETH, or USDT
router.post(
  "/request",
  authenticateToken as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { balanceType, amount, withdrawalAddress, notes } = req.body;

      // Validate inputs
      if (
        !balanceType ||
        !["USD", "BTC", "ETH", "USDT"].includes(balanceType.toUpperCase())
      ) {
        return res.status(400).json({
          error: "Invalid balanceType. Must be USD, BTC, ETH, or USDT",
        });
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({
          error: "Invalid amount. Must be a positive number",
        });
      }

      // For crypto withdrawals, validate address is provided
      if (
        ["BTC", "ETH", "USDT"].includes(balanceType.toUpperCase()) &&
        !withdrawalAddress
      ) {
        return res.status(400).json({
          error: "Withdrawal address is required for crypto withdrawals",
        });
      }

      // Get user and check balance
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          usdBalance: true,
          btcBalance: true,
          ethBalance: true,
          usdtBalance: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Determine balance field
      const balanceField =
        balanceType.toUpperCase() === "USD"
          ? "usdBalance"
          : balanceType.toUpperCase() === "BTC"
            ? "btcBalance"
            : balanceType.toUpperCase() === "ETH"
              ? "ethBalance"
              : "usdtBalance";

      // Check if user has sufficient balance
      if (user[balanceField].toNumber() < amountNum) {
        return res.status(400).json({
          error: `Insufficient ${balanceType.toUpperCase()} balance`,
          available: user[balanceField].toString(),
          requested: amountNum,
        });
      }

      // Create withdrawal request
      const withdrawal = await prisma.cryptoWithdrawal.create({
        data: {
          userId,
          cryptoType: balanceType.toUpperCase(),
          cryptoAmount: amountNum,
          usdEquivalent: balanceType.toUpperCase() === "USD" ? amountNum : 0, // Can be calculated if needed
          withdrawalAddress: withdrawalAddress || "",
          status: "pending",
        },
      });

      // Deduct from user balance immediately (locked until processed)
      await prisma.user.update({
        where: { id: userId },
        data: {
          [balanceField]: {
            decrement: amountNum,
          },
        },
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId,
          amount: amountNum,
          type: "withdrawal",
          category: "withdrawal_request",
          description: `Withdrawal request for ${amountNum} ${balanceType.toUpperCase()}`,
          status: "pending",
        },
      });

      // Notify admins via socket
      if (ioRef) {
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { id: true },
        });

        for (const admin of admins) {
          ioRef.to(`user-${admin.id}`).emit("new-withdrawal-request", {
            withdrawalId: withdrawal.id,
            userId,
            userEmail: user.email,
            balanceType: balanceType.toUpperCase(),
            amount: amountNum,
          });
        }
      }

      return res.json({
        success: true,
        message: "Withdrawal request created successfully",
        withdrawal: {
          id: withdrawal.id,
          balanceType: balanceType.toUpperCase(),
          amount: amountNum,
          status: "pending",
          createdAt: withdrawal.createdAt,
        },
      });
    } catch (err) {
      console.error("Error creating withdrawal request:", err);
      return res
        .status(500)
        .json({ error: "Failed to create withdrawal request" });
    }
  }
);

// GET /api/withdrawals/my-requests
// User views their own withdrawal requests
router.get(
  "/my-requests",
  authenticateToken as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;

      const withdrawals = await prisma.cryptoWithdrawal.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          cryptoType: true,
          cryptoAmount: true,
          withdrawalAddress: true,
          status: true,
          adminNotes: true,
          createdAt: true,
          approvedAt: true,
          rejectedAt: true,
          completedAt: true,
        },
      });

      return res.json({
        withdrawals: withdrawals.map((w) => ({
          ...w,
          cryptoAmount: w.cryptoAmount.toString(),
        })),
      });
    } catch (err) {
      console.error("Error fetching user withdrawal requests:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch withdrawal requests" });
    }
  }
);

// GET /api/withdrawals/admin/all
// Admin views all withdrawal requests with filters
router.get(
  "/admin/all",
  authenticateToken as any,
  requireAdmin as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.query;

      const where: any = {};
      if (status && typeof status === "string") {
        where.status = status;
      }

      const withdrawals = await prisma.cryptoWithdrawal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
      });

      return res.json({
        withdrawals: withdrawals.map((w) => ({
          ...w,
          cryptoAmount: w.cryptoAmount.toString(),
          usdEquivalent: w.usdEquivalent.toString(),
          networkFee: w.networkFee?.toString() || null,
        })),
      });
    } catch (err) {
      console.error("Error fetching all withdrawal requests:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch withdrawal requests" });
    }
  }
);

// PATCH /api/withdrawals/admin/:id
// Admin approves or rejects a withdrawal request
router.patch(
  "/admin/:id",
  authenticateToken as any,
  requireAdmin as any,
  logAdminAction as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { action, adminNotes, txHash, networkFee } = req.body;

      if (!action || !["approve", "reject"].includes(action)) {
        return res.status(400).json({
          error: "Invalid action. Must be 'approve' or 'reject'",
        });
      }

      // Get withdrawal request
      const withdrawal = await prisma.cryptoWithdrawal.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              usdBalance: true,
              btcBalance: true,
              ethBalance: true,
              usdtBalance: true,
            },
          },
        },
      });

      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal request not found" });
      }

      if (withdrawal.status !== "pending") {
        return res.status(400).json({
          error: `Cannot process withdrawal with status: ${withdrawal.status}`,
        });
      }

      const balanceField =
        withdrawal.cryptoType === "USD"
          ? "usdBalance"
          : withdrawal.cryptoType === "BTC"
            ? "btcBalance"
            : withdrawal.cryptoType === "ETH"
              ? "ethBalance"
              : "usdtBalance";

      if (action === "approve") {
        // Update withdrawal to approved/completed
        const updatedWithdrawal = await prisma.cryptoWithdrawal.update({
          where: { id },
          data: {
            status: "completed",
            adminApprovedBy: req.user!.userId,
            adminNotes: adminNotes || "Approved by admin",
            txHash: txHash || null,
            networkFee: networkFee ? parseFloat(networkFee) : null,
            approvedAt: new Date(),
            completedAt: new Date(),
          },
        });

        // Update transaction to completed
        await prisma.transaction.updateMany({
          where: {
            userId: withdrawal.userId,
            type: "withdrawal",
            amount: withdrawal.cryptoAmount.toNumber(),
            status: "pending",
          },
          data: {
            status: "completed",
            description: `Withdrawal approved: ${withdrawal.cryptoAmount} ${withdrawal.cryptoType}`,
          },
        });

        // Notify user
        if (ioRef) {
          ioRef.to(`user-${withdrawal.userId}`).emit("withdrawal-approved", {
            withdrawalId: id,
            balanceType: withdrawal.cryptoType,
            amount: withdrawal.cryptoAmount.toString(),
            txHash,
          });
        }

        // Log audit
        await prisma.auditLog.create({
          data: {
            userId: req.user!.userId,
            action: "approve_withdrawal",
            resourceType: "withdrawal",
            resourceId: id,
            metadata: JSON.stringify({
              userId: withdrawal.userId,
              balanceType: withdrawal.cryptoType,
              amount: withdrawal.cryptoAmount.toString(),
              txHash,
              networkFee,
              adminNotes,
            }),
          },
        });

        return res.json({
          success: true,
          message: "Withdrawal approved successfully",
          withdrawal: {
            ...updatedWithdrawal,
            cryptoAmount: updatedWithdrawal.cryptoAmount.toString(),
          },
        });
      } else {
        // Reject: refund balance to user
        await prisma.user.update({
          where: { id: withdrawal.userId },
          data: {
            [balanceField]: {
              increment: withdrawal.cryptoAmount,
            },
          },
        });

        // Update withdrawal to rejected
        const updatedWithdrawal = await prisma.cryptoWithdrawal.update({
          where: { id },
          data: {
            status: "rejected",
            adminApprovedBy: req.user!.userId,
            adminNotes: adminNotes || "Rejected by admin",
            rejectedAt: new Date(),
          },
        });

        // Update transaction
        await prisma.transaction.updateMany({
          where: {
            userId: withdrawal.userId,
            type: "withdrawal",
            amount: withdrawal.cryptoAmount.toNumber(),
            status: "pending",
          },
          data: {
            status: "failed",
            description: `Withdrawal rejected: ${withdrawal.cryptoAmount} ${
              withdrawal.cryptoType
            }. Reason: ${adminNotes || "Admin decision"}`,
          },
        });

        // Notify user
        if (ioRef) {
          ioRef.to(`user-${withdrawal.userId}`).emit("withdrawal-rejected", {
            withdrawalId: id,
            balanceType: withdrawal.cryptoType,
            amount: withdrawal.cryptoAmount.toString(),
            reason: adminNotes,
          });
        }

        // Log audit
        await prisma.auditLog.create({
          data: {
            userId: req.user!.userId,
            action: "reject_withdrawal",
            resourceType: "withdrawal",
            resourceId: id,
            metadata: JSON.stringify({
              userId: withdrawal.userId,
              balanceType: withdrawal.cryptoType,
              amount: withdrawal.cryptoAmount.toString(),
              adminNotes,
              refunded: true,
            }),
          },
        });

        return res.json({
          success: true,
          message: "Withdrawal rejected and balance refunded",
          withdrawal: {
            ...updatedWithdrawal,
            cryptoAmount: updatedWithdrawal.cryptoAmount.toString(),
          },
        });
      }
    } catch (err) {
      console.error("Error processing withdrawal:", err);
      return res.status(500).json({ error: "Failed to process withdrawal" });
    }
  }
);

export default router;
