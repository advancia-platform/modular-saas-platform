import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";
import logger from "../logger";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/crypto/chart/:symbol
 * Get price chart data for a cryptocurrency
 * Supports: BTC, ETH, USDT
 */
router.get("/chart/:symbol", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { days = "7" } = req.query;

    const validSymbols = ["BTC", "ETH", "USDT"];
    if (!validSymbols.includes(symbol.toUpperCase())) {
      return res.status(400).json({ error: "Invalid symbol. Use BTC, ETH, or USDT" });
    }

    // Generate mock historical data (in production, fetch from CoinGecko/CryptoCompare)
    const numDays = parseInt(days as string);
    const history = generateMockPriceData(symbol.toUpperCase(), numDays);

    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      days: numDays,
      history,
      currentPrice: history[history.length - 1].price,
      change24h: calculateChange(history),
    });
  } catch (error) {
    logger.error("Crypto chart error:", error);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

/**
 * POST /api/crypto/swap
 * Swap one cryptocurrency for another
 */
router.post("/swap", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { fromSymbol, toSymbol, amount } = req.body;

    if (!fromSymbol || !toSymbol || !amount || amount <= 0) {
      return res.status(400).json({ error: "Valid fromSymbol, toSymbol, and amount required" });
    }

    if (fromSymbol === toSymbol) {
      return res.status(400).json({ error: "Cannot swap same currencies" });
    }

    // Get user's crypto wallets
    const fromWallet = await prisma.cryptoWallet.findFirst({
      where: { userId, currency: fromSymbol.toUpperCase() },
    });

    if (!fromWallet || fromWallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Get exchange rates (mock - in production use real API)
    const rates = getCurrentRates();
    const fromRate = rates[fromSymbol.toUpperCase()] || 1;
    const toRate = rates[toSymbol.toUpperCase()] || 1;

    // Calculate swap (0.5% fee)
    const fee = 0.005;
    const usdValue = amount * fromRate;
    const toAmount = (usdValue / toRate) * (1 - fee);
    const feeAmount = usdValue * fee;

    // Get or create destination wallet
    let toWallet = await prisma.cryptoWallet.findFirst({
      where: { userId, currency: toSymbol.toUpperCase() },
    });

    if (!toWallet) {
      toWallet = await prisma.cryptoWallet.create({
        data: {
          userId,
          currency: toSymbol.toUpperCase(),
          balance: 0,
          address: `${toSymbol.toUpperCase()}_${userId}_${Date.now()}`,
        },
      });
    }

    // Execute swap in transaction
    await prisma.$transaction(async (tx) => {
      // Deduct from source
      await tx.cryptoWallet.update({
        where: { id: fromWallet.id },
        data: { balance: { decrement: amount } },
      });

      // Add to destination
      await tx.cryptoWallet.update({
        where: { id: toWallet!.id },
        data: { balance: { increment: toAmount } },
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          userId,
          type: "CRYPTO_SWAP",
          amount: usdValue,
          status: "completed",
          description: `Swapped ${amount} ${fromSymbol} for ${toAmount.toFixed(6)} ${toSymbol} (Fee: ${feeAmount.toFixed(6)} ${fromSymbol})`,
        },
      });
    });

    res.json({
      success: true,
      message: "Swap completed successfully",
      fromAmount: amount,
      toAmount,
      fee: feeAmount,
      rate: toAmount / amount,
    });
  } catch (error) {
    logger.error("Crypto swap error:", error);
    res.status(500).json({ error: "Swap failed" });
  }
});

/**
 * GET /api/crypto/rates
 * Get current exchange rates for all supported currencies
 */
router.get("/rates", authenticateToken, async (req: Request, res: Response) => {
  try {
    const rates = getCurrentRates();
    
    res.json({
      success: true,
      rates,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error("Get rates error:", error);
    res.status(500).json({ error: "Failed to fetch rates" });
  }
});

/**
 * GET /api/crypto/swap/preview
 * Preview a swap without executing
 */
router.get("/swap/preview", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { fromSymbol, toSymbol, amount } = req.query;

    if (!fromSymbol || !toSymbol || !amount) {
      return res.status(400).json({ error: "fromSymbol, toSymbol, and amount required" });
    }

    const rates = getCurrentRates();
    const fromRate = rates[(fromSymbol as string).toUpperCase()] || 1;
    const toRate = rates[(toSymbol as string).toUpperCase()] || 1;

    const fee = 0.005; // 0.5%
    const usdValue = parseFloat(amount as string) * fromRate;
    const toAmount = (usdValue / toRate) * (1 - fee);
    const feeAmount = usdValue * fee;

    res.json({
      success: true,
      fromAmount: parseFloat(amount as string),
      toAmount,
      fee: feeAmount,
      feePercent: 0.5,
      rate: toAmount / parseFloat(amount as string),
      fromRate,
      toRate,
    });
  } catch (error) {
    logger.error("Swap preview error:", error);
    res.status(500).json({ error: "Failed to preview swap" });
  }
});

// Helper: Generate mock price data
function generateMockPriceData(symbol: string, days: number) {
  const basePrices: Record<string, number> = {
    BTC: 45000,
    ETH: 3000,
    USDT: 1,
  };

  const basePrice = basePrices[symbol] || 1;
  const history = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Random price variation
    const variation = (Math.random() - 0.5) * 0.1; // ±5%
    const price = basePrice * (1 + variation);

    history.push({
      date: date.toISOString().split("T")[0],
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000000),
      high: parseFloat((price * 1.02).toFixed(2)),
      low: parseFloat((price * 0.98).toFixed(2)),
    });
  }

  return history;
}

// Helper: Get current exchange rates (mock)
function getCurrentRates(): Record<string, number> {
  return {
    BTC: 45000 + (Math.random() - 0.5) * 2000,
    ETH: 3000 + (Math.random() - 0.5) * 200,
    USDT: 1.0,
  };
}

// Helper: Calculate 24h price change percentage
function calculateChange(history: any[]): number {
  if (history.length < 2) return 0;
  
  const latest = history[history.length - 1].price;
  const previous = history[history.length - 2].price;
  
  return ((latest - previous) / previous) * 100;
}

export default router;
