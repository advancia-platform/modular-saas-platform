import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";
import logger from "../logger";

const router = Router();
const prisma = new PrismaClient();

// User tier levels with benefits
const USER_TIERS = {
  BRONZE: { minTokens: 0, multiplier: 1, benefits: ["Basic rewards"] },
  SILVER: { minTokens: 1000, multiplier: 1.25, benefits: ["Basic rewards", "Priority support"] },
  GOLD: { minTokens: 5000, multiplier: 1.5, benefits: ["Basic rewards", "Priority support", "Exclusive offers"] },
  PLATINUM: { minTokens: 10000, multiplier: 2, benefits: ["All benefits", "VIP support", "Premium features"] },
  DIAMOND: { minTokens: 50000, multiplier: 3, benefits: ["All benefits", "Dedicated manager", "Custom features"] },
};

/**
 * GET /api/gamification/tier
 * Get current user tier
 */
router.get("/tier", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const wallet = await prisma.tokenWallet.findUnique({ where: { userId } });
    const totalTokens = Number(wallet?.balance || 0) + Number(wallet?.lifetimeEarned || 0);

    let currentTier = "BRONZE";
    for (const [tier, requirements] of Object.entries(USER_TIERS).reverse()) {
      if (totalTokens >= requirements.minTokens) {
        currentTier = tier;
        break;
      }
    }

    const tierInfo = USER_TIERS[currentTier as keyof typeof USER_TIERS];
    const nextTierIndex = Object.keys(USER_TIERS).indexOf(currentTier) + 1;
    const nextTier = Object.keys(USER_TIERS)[nextTierIndex];
    const nextTierRequirement = nextTier ? USER_TIERS[nextTier as keyof typeof USER_TIERS].minTokens : null;

    res.json({
      success: true,
      currentTier,
      totalTokens,
      multiplier: tierInfo.multiplier,
      benefits: tierInfo.benefits,
      nextTier,
      tokensUntilNextTier: nextTierRequirement ? nextTierRequirement - totalTokens : null,
    });
  } catch (error) {
    logger.error("Get tier error:", error);
    res.status(500).json({ error: "Failed to get tier" });
  }
});

/**
 * GET /api/gamification/achievements
 * Get user achievements
 */
router.get("/achievements", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Define achievements
    const achievements = [
      { id: "first_login", name: "Welcome Aboard", description: "Complete your first login", reward: 100 },
      { id: "first_transaction", name: "First Steps", description: "Make your first transaction", reward: 50 },
      { id: "transactions_10", name: "Active User", description: "Complete 10 transactions", reward: 200 },
      { id: "transactions_100", name: "Power User", description: "Complete 100 transactions", reward: 1000 },
      { id: "referral_1", name: "Influencer", description: "Refer 1 friend", reward: 500 },
      { id: "referral_10", name: "Ambassador", description: "Refer 10 friends", reward: 5000 },
      { id: "streak_7", name: "Week Warrior", description: "Login 7 days in a row", reward: 300 },
      { id: "streak_30", name: "Month Master", description: "Login 30 days in a row", reward: 2000 },
    ];

    // Check user progress
    const transactionCount = await prisma.transaction.count({ where: { userId } });
    const referralCount = await prisma.userTier.count({ where: { referredBy: userId } });

    // Mock login streak (would need DailyLoginStreak table)
    const currentStreak = 5;

    const unlockedAchievements = achievements.filter((achievement) => {
      if (achievement.id.startsWith("transactions_")) {
        const required = parseInt(achievement.id.split("_")[1]);
        return transactionCount >= required;
      }
      if (achievement.id.startsWith("referral_")) {
        const required = parseInt(achievement.id.split("_")[1]);
        return referralCount >= required;
      }
      if (achievement.id.startsWith("streak_")) {
        const required = parseInt(achievement.id.split("_")[1]);
        return currentStreak >= required;
      }
      return true; // first_login, first_transaction
    });

    res.json({
      success: true,
      achievements: achievements.map((achievement) => ({
        ...achievement,
        unlocked: unlockedAchievements.some((a) => a.id === achievement.id),
        progress: achievement.id.startsWith("transactions_")
          ? transactionCount
          : achievement.id.startsWith("referral_")
          ? referralCount
          : achievement.id.startsWith("streak_")
          ? currentStreak
          : 1,
      })),
      totalUnlocked: unlockedAchievements.length,
      totalRewards: unlockedAchievements.reduce((sum, a) => sum + a.reward, 0),
    });
  } catch (error) {
    logger.error("Get achievements error:", error);
    res.status(500).json({ error: "Failed to get achievements" });
  }
});

/**
 * GET /api/gamification/leaderboard
 * Get token leaderboard
 */
router.get("/leaderboard", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { period = "all" } = req.query; // all, month, week

    const wallets = await prisma.tokenWallet.findMany({
      orderBy: { lifetimeEarned: "desc" },
      take: 100,
    });

    // Get user details separately
    const leaderboardWithUsers = await Promise.all(
      wallets.map(async (wallet, index) => {
        const user = await prisma.user.findUnique({
          where: { id: wallet.userId },
          select: { email: true, firstName: true, lastName: true },
        });

        return {
          rank: index + 1,
          userId: wallet.userId,
          name: user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email || "Unknown",
          tokens: Number(wallet.lifetimeEarned),
          tier: Object.entries(USER_TIERS)
            .reverse()
            .find(([_, req]) => Number(wallet.lifetimeEarned) >= req.minTokens)?.[0] || "BRONZE",
        };
      })
    );

    res.json({
      success: true,
      leaderboard: leaderboardWithUsers,
      period,
    });
  } catch (error) {
    logger.error("Get leaderboard error:", error);
    res.status(500).json({ error: "Failed to get leaderboard" });
  }
});

/**
 * POST /api/gamification/referral
 * Generate referral link
 */
router.post("/referral", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Generate unique referral code
    const referralCode = `REF-${userId}-${Date.now().toString(36).toUpperCase()}`;

    const referralLink = `https://advanciapayledger.com/signup?ref=${referralCode}`;

    res.json({
      success: true,
      referralCode,
      referralLink,
      reward: 500, // Tokens earned per referral
      referrals: await prisma.userTier.count({ where: { referredBy: userId } }),
    });
  } catch (error) {
    logger.error("Generate referral error:", error);
    res.status(500).json({ error: "Failed to generate referral" });
  }
});

/**
 * POST /api/gamification/daily-bonus
 * Claim daily login bonus
 */
router.post("/daily-bonus", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Check if already claimed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get wallet first
    let wallet = await prisma.tokenWallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.tokenWallet.create({ data: { userId } });
    }

    const lastClaim = await prisma.tokenTransaction.findFirst({
      where: {
        walletId: wallet.id,
        type: "DAILY_BONUS",
        createdAt: { gte: today },
      },
    });

    if (lastClaim) {
      return res.status(400).json({ error: "Daily bonus already claimed today" });
    }

    // Calculate bonus based on tier
    const totalTokens = Number(wallet.balance) + Number(wallet.lifetimeEarned);
    let currentTier = "BRONZE";
    for (const [tier, requirements] of Object.entries(USER_TIERS).reverse()) {
      if (totalTokens >= requirements.minTokens) {
        currentTier = tier;
        break;
      }
    }

    const tierInfo = USER_TIERS[currentTier as keyof typeof USER_TIERS];
    const baseBonus = 10;
    const bonus = Math.floor(baseBonus * tierInfo.multiplier);

    // Award bonus
    await prisma.$transaction(async (tx) => {
      await tx.tokenWallet.update({
        where: { userId },
        data: {
          balance: { increment: bonus },
          lifetimeEarned: { increment: bonus },
        },
      });

      await tx.tokenTransaction.create({
        data: {
          walletId: wallet!.id,
          amount: bonus,
          type: "DAILY_BONUS",
          status: "completed",
          description: `Daily login bonus (${currentTier} tier)`,
        },
      });
    });

    res.json({
      success: true,
      message: "Daily bonus claimed!",
      bonus,
      tier: currentTier,
      nextClaimTime: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    logger.error("Daily bonus error:", error);
    res.status(500).json({ error: "Failed to claim daily bonus" });
  }
});

/**
 * GET /api/gamification/challenges
 * Get active challenges
 */
router.get("/challenges", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Define challenges
    const challenges = [
      {
        id: "spend_100",
        name: "Big Spender",
        description: "Spend $100 this week",
        reward: 500,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        progress: 0,
        target: 100,
      },
      {
        id: "transactions_20",
        name: "Active Trader",
        description: "Make 20 transactions this month",
        reward: 1000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        progress: 0,
        target: 20,
      },
      {
        id: "crypto_purchase",
        name: "Crypto Explorer",
        description: "Make your first crypto purchase",
        reward: 300,
        deadline: null,
        progress: 0,
        target: 1,
      },
    ];

    // Calculate actual progress (simplified)
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);

    const weeklySpend = await prisma.transaction.aggregate({
      where: {
        userId,
        createdAt: { gte: thisWeekStart },
        type: "payment",
      },
      _sum: { amount: true },
    });

    const monthlyTransactions = await prisma.transaction.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const cryptoPurchases = await prisma.cryptoWallet.count({ where: { userId } });

    challenges[0].progress = weeklySpend._sum.amount || 0;
    challenges[1].progress = monthlyTransactions;
    challenges[2].progress = cryptoPurchases > 0 ? 1 : 0;

    res.json({
      success: true,
      challenges: challenges.map((c) => ({
        ...c,
        completed: c.progress >= c.target,
        progressPercent: Math.min((c.progress / c.target) * 100, 100),
      })),
    });
  } catch (error) {
    logger.error("Get challenges error:", error);
    res.status(500).json({ error: "Failed to get challenges" });
  }
});

export default router;
