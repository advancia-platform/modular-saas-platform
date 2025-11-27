import { Router } from "express";
import { logger } from "../logger";
import { authenticateToken, AuthRequest, requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";
import { notifyComplianceIssue, notifyWithdrawal } from "../services/notificationService";
import { asyncHandler } from "../utils/errorHandler";

const router = Router();

// Example: Admin crypto withdrawal route with notifications
router.post('/crypto',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res) => {
    const { userId, amount, currency, address } = req.body;

    try {
      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, btcBalance: true, ethBalance: true, usdtBalance: true }
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check balance (simplified example)
      const balanceField = currency === 'BTC' ? 'btcBalance' :
                          currency === 'ETH' ? 'ethBalance' : 'usdtBalance';

      if (user[balanceField].toNumber() < amount) {
        return res.status(400).json({
          error: `Insufficient ${currency} balance`,
          available: user[balanceField].toString()
        });
      }

      // Create withdrawal record
      const withdrawal = await prisma.crypto_withdrawals.create({
        data: {
          userId,
          currency,
          amount,
          destinationAddress: address,
          cryptoType: currency,
          cryptoAmount: amount,
          status: "processing",
          paymentProvider: "nowpayments"
        }
      });

      // Simulate external API call (NOWPayments, Cryptomus, etc.)
      // const externalResult = await createPayout(amount, currency, address);

      // Update withdrawal to completed
      const completedWithdrawal = await prisma.crypto_withdrawals.update({
        where: { id: withdrawal.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          txHash: "simulated_tx_hash_" + withdrawal.id // In real implementation, get from API
        }
      });

      // Update user balance
      await prisma.user.update({
        where: { id: userId },
        data: {
          [balanceField]: {
            decrement: amount
          }
        }
      });

      // 🎯 SEND WITHDRAWAL NOTIFICATION
      await notifyWithdrawal(
        userId,
        amount,
        currency,
        completedWithdrawal.txHash || withdrawal.id
      );

      // Log for compliance
      logger.info(`Crypto withdrawal completed`, {
        userId,
        amount,
        currency,
        txHash: completedWithdrawal.txHash,
        adminId: req.user?.userId
      });

      res.status(201).json({
        success: true,
        withdrawal: {
          id: completedWithdrawal.id,
          amount,
          currency,
          status: "completed",
          txHash: completedWithdrawal.txHash
        }
      });

    } catch (error) {
      logger.error('Crypto withdrawal failed', {
        userId,
        amount,
        currency,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Notify compliance team of failed withdrawal
      if (amount > 10000) { // High value transaction
        await notifyComplianceIssue(
          req.user?.userId || 'system',
          `High-value crypto withdrawal failed: ${currency} ${amount} for user ${userId}`,
          'HIGH'
        );
      }

      res.status(500).json({ error: "Withdrawal processing failed" });
    }
  })
);

export default router;
