import { PrismaClient } from "@prisma/client";
import { Request, Response, Router } from "express";
import logger from "../logger";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/tokens/withdraw
 * Withdraw tokens to USD balance
 */
router.post(
  "/withdraw",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      // Get token wallet
      const wallet = await prisma.token_wallets.findUnique({
        where: { userId },
      });
      if (!wallet || wallet.balance < amount) {
        return res.status(400).json({ error: "Insufficient token balance" });
      }

      // Calculate USD value (1 token = $0.10 for example)
      const exchangeRate = 0.1;
      const usdAmount = amount * exchangeRate;

      // Start transaction
      await prisma.$transaction(async (tx) => {
        // Deduct from token wallet
        await tx.tokenWallet.update({
          where: { userId },
          data: { balance: { decrement: amount } },
        });

        // Add to USD balance
        await tx.user.update({
          where: { id: userId },
          data: { usdBalance: { increment: usdAmount } },
        });

        // Create token transaction
        await tx.tokenTransaction.create({
          data: {
            walletId: wallet.id,
            amount: -amount,
            type: "WITHDRAWAL",
            status: "completed",
            description: `Withdrew ${amount} tokens to USD ($${usdAmount.toFixed(2)})`,
          },
        });
      });

      res.json({
        success: true,
        message: `Withdrew ${amount} tokens ($${usdAmount.toFixed(2)} USD)`,
        exchangeRate,
      });
    } catch (error) {
      logger.error("Token withdrawal error:", error);
      res.status(500).json({ error: "Failed to withdraw tokens" });
    }
  },
);

/**
 * POST /api/tokens/transfer
 * Transfer tokens to another user
 */
router.post(
  "/transfer",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { toUserId, toEmail, amount, message } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      // Find recipient
      let recipient;
      if (toUserId) {
        recipient = await prisma.user.findUnique({ where: { id: toUserId } });
      } else if (toEmail) {
        recipient = await prisma.user.findUnique({ where: { email: toEmail } });
      }

      if (!recipient) {
        return res.status(404).json({ error: "Recipient not found" });
      }

      if (recipient.id === userId) {
        return res.status(400).json({ error: "Cannot transfer to yourself" });
      }

      // Get sender wallet
      const senderWallet = await prisma.token_wallets.findUnique({
        where: { userId },
      });
      if (!senderWallet || senderWallet.balance < amount) {
        return res.status(400).json({ error: "Insufficient token balance" });
      }

      // Get or create recipient wallet
      let recipientWallet = await prisma.token_wallets.findUnique({
        where: { userId: recipient.id },
      });
      if (!recipientWallet) {
        recipientWallet = await prisma.token_wallets.create({
          data: withDefaults({ userId: recipient.id }),
        });
      }

      // Transfer
      await prisma.$transaction(async (tx) => {
        // Deduct from sender
        await tx.tokenWallet.update({
          where: { userId },
          data: { balance: { decrement: amount } },
        });

        // Add to recipient
        await tx.tokenWallet.update({
          where: { userId: recipient.id },
          data: { balance: { increment: amount } },
        });

        // Create sender transaction
        await tx.tokenTransaction.create({
          data: {
            walletId: senderWallet.id,
            amount: -amount,
            type: "TRANSFER_OUT",
            status: "completed",
            description: message || `Transferred to ${recipient.email}`,
            toAddress: recipient.email,
          },
        });

        // Create recipient transaction
        await tx.tokenTransaction.create({
          data: {
            walletId: recipientWallet!.id,
            amount,
            type: "TRANSFER_IN",
            status: "completed",
            description: message || "Received from sender",
            fromAddress: (req as any).user.email,
          },
        });
      });

      res.json({
        success: true,
        message: `Transferred ${amount} tokens to ${recipient.email}`,
      });
    } catch (error) {
      logger.error("Token transfer error:", error);
      res.status(500).json({ error: "Failed to transfer tokens" });
    }
  },
);

/**
 * POST /api/tokens/buy
 * Buy tokens with USD balance
 */
router.post("/buy", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { usdAmount } = req.body;

    if (!usdAmount || usdAmount <= 0) {
      return res.status(400).json({ error: "Invalid USD amount" });
    }

    // Check USD balance
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.usdBalance < usdAmount) {
      return res.status(400).json({ error: "Insufficient USD balance" });
    }

    // Calculate tokens (1 USD = 10 tokens for example)
    const exchangeRate = 10;
    const tokenAmount = usdAmount * exchangeRate;

    // Get or create wallet
    let wallet = await prisma.token_wallets.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.token_wallets.create({
        data: withDefaults({ userId }),
      });
    }

    // Transaction
    await prisma.$transaction(async (tx) => {
      // Deduct USD
      await tx.user.update({
        where: { id: userId },
        data: { usdBalance: { decrement: usdAmount } },
      });

      // Add tokens
      await tx.tokenWallet.update({
        where: { userId },
        data: {
          balance: { increment: tokenAmount },
          lifetimeEarned: { increment: tokenAmount },
        },
      });

      // Create transaction
      await tx.tokenTransaction.create({
        data: {
          walletId: wallet!.id,
          amount: tokenAmount,
          type: "PURCHASE",
          status: "completed",
          description: `Purchased ${tokenAmount} tokens with $${usdAmount}`,
          metadata: JSON.stringify({ exchangeRate, usdAmount }),
        },
      });
    });

    res.json({
      success: true,
      message: `Purchased ${tokenAmount} tokens for $${usdAmount}`,
      exchangeRate,
    });
  } catch (error) {
    logger.error("Token purchase error:", error);
    res.status(500).json({ error: "Failed to purchase tokens" });
  }
});

/**
 * POST /api/tokens/stake
 * Stake tokens to earn rewards
 */
router.post(
  "/stake",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { amount, duration = 30 } = req.body; // duration in days

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const wallet = await prisma.token_wallets.findUnique({
        where: { userId },
      });
      if (!wallet || wallet.balance < amount) {
        return res.status(400).json({ error: "Insufficient token balance" });
      }

      // Calculate staking reward (5% APY for example)
      const annualRate = 0.05;
      const dailyRate = annualRate / 365;
      const reward = amount * dailyRate * duration;
      const unstakeDate = new Date();
      unstakeDate.setDate(unstakeDate.getDate() + duration);

      // Lock tokens
      await prisma.$transaction(async (tx) => {
        await tx.tokenWallet.update({
          where: { userId },
          data: {
            balance: { decrement: amount },
            lockedBalance: { increment: amount },
          },
        });

        await tx.tokenTransaction.create({
          data: {
            walletId: wallet.id,
            amount: -amount,
            type: "STAKE",
            status: "completed",
            description: `Staked ${amount} tokens for ${duration} days`,
            metadata: JSON.stringify({
              duration,
              reward,
              unstakeDate,
              stakingRate: annualRate,
            }),
          },
        });
      });

      res.json({
        success: true,
        message: `Staked ${amount} tokens for ${duration} days`,
        estimatedReward: reward,
        unstakeDate,
        apy: annualRate * 100,
      });
    } catch (error) {
      logger.error("Token staking error:", error);
      res.status(500).json({ error: "Failed to stake tokens" });
    }
  },
);

/**
 * GET /api/tokens/chart
 * Get token price history
 */
router.get("/chart", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { days = "30" } = req.query;

    // Generate mock price history (replace with real data)
    const history = Array.from({ length: parseInt(days as string) }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (parseInt(days as string) - i - 1));

      // Mock price with slight variation
      const basePrice = 0.1;
      const variation = (Math.random() - 0.5) * 0.02;
      const price = basePrice + variation;

      return {
        date: date.toISOString().split("T")[0],
        price: parseFloat(price.toFixed(4)),
        volume: Math.floor(Math.random() * 10000),
      };
    });

    res.json({
      success: true,
      history,
      currentPrice: history[history.length - 1].price,
      change24h:
        ((history[history.length - 1].price -
          history[history.length - 2].price) /
          history[history.length - 2].price) *
        100,
    });
  } catch (error) {
    logger.error("Token chart error:", error);
    res.status(500).json({ error: "Failed to fetch token chart" });
  }
});

export default router;
