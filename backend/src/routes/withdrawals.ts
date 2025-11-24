import { Response, Router } from "express";
import type { Server as IOServer } from "socket.io";
import {
  authenticateToken,
  AuthRequest,
  logAdminAction,
  requireAdmin,
} from "../middleware/auth";
import { validateSchema } from "../middleware/validateSchema";
import prisma from "../prismaClient";
import { withDefaults } from "../utils/prismaHelpers";
import {
  WithdrawalAdminActionSchema,
  WithdrawalRequestSchema,
} from "../validation/schemas";

const router = Router();
const safeAuth: any =
  typeof authenticateToken === "function"
    ? authenticateToken
    : (_req: any, _res: any, next: any) => next();
const safeAdmin: any =
  typeof requireAdmin === "function"
    ? requireAdmin
    : (_req: any, _res: any, next: any) => next();
const safeLogAdmin: any =
  typeof logAdminAction === "function"
    ? logAdminAction
    : (_req: any, _res: any, next: any) => next();

let ioRef: IOServer | null = null;
export function setWithdrawalSocketIO(io: IOServer) {
  ioRef = io;
}

// GET /api/withdrawals/methods
// Get available payment providers for withdrawals
router.get(
  "/methods",
  safeAuth as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const methods = [
        {
          provider: "cryptomus",
          name: "Cryptomus",
          description: "50+ cryptocurrencies supported",
          currencies: ["btc", "eth", "usdt", "bnb", "ltc", "doge"],
          minAmount: 10,
          fees: "1%",
          processingTime: "5-30 minutes",
          features: [
            "Fast processing",
            "Popular currencies",
            "Instant payouts",
          ],
        },
        {
          provider: "nowpayments",
          name: "NOWPayments",
          description: "200+ cryptocurrencies supported",
          currencies: [
            "btc",
            "eth",
            "usdt",
            "trx",
            "ltc",
            "xmr",
            "doge",
            "ada",
            "dot",
            "matic",
          ],
          minAmount: 10,
          fees: "0.5%",
          processingTime: "10-60 minutes",
          features: ["Lowest fees", "Most currencies", "Mass payouts"],
          recommended: true,
        },
      ];

      return res.json({ success: true, methods });
    } catch (err) {
      console.error("Error fetching withdrawal methods:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch withdrawal methods" });
    }
  },
);

// POST /api/withdrawals/request
// User creates a withdrawal request for USD, BTC, ETH, or USDT
router.post(
  "/request",
  safeAuth as any,
  validateSchema(WithdrawalRequestSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const {
        balanceType,
        amount,
        withdrawalAddress,
        paymentProvider = "cryptomus",
      } = req.body as any;
      const amountNum =
        typeof amount === "number" ? amount : parseFloat(amount);

      // Validate payment provider
      if (!["cryptomus", "nowpayments"].includes(paymentProvider)) {
        return res.status(400).json({
          error: "Invalid payment provider. Choose: cryptomus or nowpayments",
        });
      }

      // Get client IP
      const clientIP =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
        (req.headers["x-real-ip"] as string) ||
        req.socket.remoteAddress ||
        "Unknown";

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
          whitelistedIPs: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // ============= SECURITY CHECK: IP Whitelist =============
      if (
        user.whitelistedIPs.length > 0 &&
        !user.whitelistedIPs.includes(clientIP)
      ) {
        // Log security alert
        console.warn(
          `[SECURITY] Withdrawal blocked from unauthorized IP: ${clientIP} for user ${userId}`,
        );

        // TODO: Send security alert email
        // await sendSecurityAlert(user.email, `Withdrawal attempt blocked from unauthorized IP: ${clientIP}`);

        return res.status(403).json({
          error: "Withdrawal blocked: IP not whitelisted",
          hint: "Add this IP via /api/security/whitelist/ip",
          clientIP,
        });
      }

      // ============= SECURITY CHECK: Address Whitelist (for crypto only) =============
      if (withdrawalAddress && balanceType.toUpperCase() !== "USD") {
        const isWhitelisted = await prisma.whitelistedAddress.findFirst({
          where: {
            userId,
            address: withdrawalAddress,
            currency: balanceType.toUpperCase(),
            verified: true,
          },
        });

        if (!isWhitelisted) {
          console.warn(
            `[SECURITY] Withdrawal blocked: Address not whitelisted for user ${userId}`,
          );

          return res.status(403).json({
            error: "Withdrawal address not whitelisted",
            hint: "Add and verify this address via /api/security/whitelist/address",
            address: withdrawalAddress,
          });
        }
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
      const withdrawal = await prisma.crypto_withdrawals.create({
        data: withDefaults({
          userId,
          currency: balanceType.toUpperCase(),
          amount: amountNum,
          destinationAddress: withdrawalAddress || "",
          cryptoType: balanceType.toUpperCase(), // Legacy field for backward compatibility
          cryptoAmount: amountNum,
          usdEquivalent: balanceType.toUpperCase() === "USD" ? amountNum : 0, // Can be calculated if needed
          withdrawalAddress: withdrawalAddress || "", // Legacy field
          status: "pending",
          paymentProvider: paymentProvider, // Store selected provider
        }),
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
      await prisma.transactions.create({
        data: withDefaults({
          userId,
          amount: amountNum,
          type: "withdrawal",
          category: "withdrawal_request",
          description: `Withdrawal request for ${amountNum} ${balanceType.toUpperCase()}`,
          status: "pending",
        }),
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
  },
);

// GET /api/withdrawals/my-requests
// User views their own withdrawal requests
router.get(
  "/my-requests",
  safeAuth as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;

      const withdrawals = await prisma.crypto_withdrawals.findMany({
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
  },
);

// GET /api/withdrawals/admin/all
// Admin views all withdrawal requests with filters
router.get(
  "/admin/all",
  safeAuth as any,
  safeAdmin as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.query;

      const where: any = {};
      if (status && typeof status === "string") {
        where.status = status;
      }

      const withdrawals = await prisma.crypto_withdrawals.findMany({
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
  },
);

// PATCH /api/withdrawals/admin/:id
// Admin approves or rejects a withdrawal request
router.patch(
  "/admin/:id",
  safeAuth as any,
  safeAdmin as any,
  safeLogAdmin as any,
  validateSchema(WithdrawalAdminActionSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { action, adminNotes, txHash, networkFee } = req.body as any;

      if (!action || !["approve", "reject"].includes(action)) {
        return res.status(400).json({
          error: "Invalid action. Must be 'approve' or 'reject'",
        });
      }

      // Get withdrawal request
      const withdrawal = await prisma.crypto_withdrawals.findUnique({
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
        const updatedWithdrawal = await prisma.crypto_withdrawals.update({
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
        await prisma.transactions.updateMany({
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
        await prisma.audit_logs.create({
          data: withDefaults({
            userId: req.user!.userId,
            action: "approve_withdrawal",
            resourceType: "withdrawal",
            resourceId: id || "unknown",
            metadata: JSON.stringify({
              userId: withdrawal.userId,
              balanceType: withdrawal.cryptoType,
              amount: withdrawal.cryptoAmount.toString(),
              txHash,
              networkFee,
              adminNotes,
            }),
          }),
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
        const updatedWithdrawal = await prisma.crypto_withdrawals.update({
          where: { id },
          data: {
            status: "rejected",
            adminApprovedBy: req.user!.userId,
            adminNotes: adminNotes || "Rejected by admin",
            rejectedAt: new Date(),
          },
        });

        // Update transaction
        await prisma.transactions.updateMany({
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
        await prisma.audit_logs.create({
          data: withDefaults({
            userId: req.user!.userId,
            action: "reject_withdrawal",
            resourceType: "withdrawal",
            resourceId: id || "unknown",
            metadata: JSON.stringify({
              userId: withdrawal.userId,
              balanceType: withdrawal.cryptoType,
              amount: withdrawal.cryptoAmount.toString(),
              adminNotes,
              refunded: true,
            }),
          }),
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
  },
);

export default router;
