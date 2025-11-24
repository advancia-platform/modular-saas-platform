import express from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";
import { withDefaults } from "../utils/prismaHelpers";

const router = express.Router();

// Get all admin wallet addresses
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const wallets = await prisma.admin_wallets.findMany({
      select: {
        id: true,
        currency: true,
        balance: true,
        totalIn: true,
        totalOut: true,
        walletAddress: true,
        walletProvider: true,
        walletNotes: true,
        updatedAt: true,
      },
      orderBy: { currency: "asc" },
    });

    res.json({ success: true, wallets });
  } catch (error) {
    console.error("Error fetching admin wallets:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch admin wallets" });
  }
});

// Configure wallet address for a specific currency
router.put("/:currency", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { currency } = req.params;
    const { walletAddress, walletProvider, walletNotes } = req.body;

    // Validate required fields
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: "walletAddress is required",
      });
    }

    // Find or create admin wallet for this currency
    let wallet = await prisma.admin_wallets.findUnique({
      where: { currency: currency.toUpperCase() },
    });

    if (!wallet) {
      // Create new wallet
      wallet = await prisma.admin_wallets.create({
        data: withDefaults({
          currency: currency.toUpperCase(),
          balance: 0,
          totalIn: 0,
          totalOut: 0,
          walletAddress,
          walletProvider: walletProvider || null,
          walletNotes: walletNotes || null,
        }),
      });
    } else {
      // Update existing wallet
      wallet = await prisma.admin_wallets.update({
        where: { currency: currency.toUpperCase() },
        data: {
          walletAddress,
          walletProvider: walletProvider || null,
          walletNotes: walletNotes || null,
        },
      });
    }

    res.json({
      success: true,
      message: `Wallet address for ${currency} configured successfully`,
      wallet: {
        currency: wallet.currency,
        walletAddress: wallet.walletAddress,
        walletProvider: wallet.walletProvider,
        balance: wallet.balance.toString(),
      },
    });
  } catch (error) {
    console.error("Error configuring admin wallet:", error);
    res.status(500).json({
      success: false,
      error: "Failed to configure admin wallet",
    });
  }
});

// Initialize default wallet addresses from environment variables
router.post(
  "/init-from-env",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const envWallets = [
        {
          currency: "BTC",
          address: process.env.ADMIN_BTC_WALLET_ADDRESS,
        },
        {
          currency: "ETH",
          address: process.env.ADMIN_ETH_WALLET_ADDRESS,
        },
        {
          currency: "USDT",
          address: process.env.ADMIN_USDT_WALLET_ADDRESS,
        },
      ];

      const results: Array<{
        currency: string;
        walletAddress: string;
        status: string;
      }> = [];

      for (const { currency, address } of envWallets) {
        if (!address) continue;

        const wallet = await prisma.admin_wallets.upsert({
          where: { currency },
          update: {
            walletAddress: address,
            walletProvider: "Environment Variable",
          },
          create: withDefaults({
            currency,
            balance: 0,
            totalIn: 0,
            totalOut: 0,
            walletAddress: address,
            walletProvider: "Environment Variable",
          }),
        });

        results.push({
          currency: wallet.currency as string,
          walletAddress: wallet.walletAddress as string,
          status: "configured" as const,
        });
      }

      res.json({
        success: true,
        message: `Initialized ${results.length} wallet addresses from environment variables`,
        wallets: results,
      });
    } catch (error) {
      console.error("Error initializing wallets from env:", error);
      res.status(500).json({
        success: false,
        error: "Failed to initialize wallet addresses",
      });
    }
  },
);

export default router;
