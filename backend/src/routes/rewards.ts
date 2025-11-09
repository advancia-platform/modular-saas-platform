import { Router } from "express";
import prisma from "../prismaClient";
import { authenticateToken } from "../middleware/auth";
import { Decimal } from "@prisma/client/runtime/library";

const router = Router();

router.get("/:userId", authenticateToken as any, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, type } = req.query;
    
    const where: any = { userId };
    if (status) where.status = status as string;
    if (type) where.type = type as string;
    
    const rewards = await prisma.reward.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    
    const total = rewards.reduce((sum, r) => sum.add(r.amount), new Decimal(0));
    
    res.json({
      rewards: rewards.map(r => ({
        ...r,
        amount: r.amount.toString(),
      })),
      summary: {
        total: total.toString(),
        pending: rewards.filter(r => r.status === "pending").length,
        claimed: rewards.filter(r => r.status === "claimed").length,
        expired: rewards.filter(r => r.status === "expired").length,
      },
    });
  } catch (error: any) {
    console.error("[REWARDS] Error fetching rewards:", error);
    res.status(500).json({ error: "Failed to fetch rewards" });
  }
});

router.post("/claim/:rewardId", authenticateToken as any, async (req, res) => {
  try {
    const { rewardId } = req.params;
    const { userId } = req.body;
    
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
    });
    
    if (!reward) {
      return res.status(404).json({ error: "Reward not found" });
    }
    
    if (reward.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    if (reward.status !== "pending") {
      return res.status(400).json({ error: `Reward is ${reward.status}, cannot claim` });
    }
    
    if (reward.expiresAt && new Date() > reward.expiresAt) {
      await prisma.reward.update({
        where: { id: rewardId },
        data: { status: "expired" },
      });
      return res.status(400).json({ error: "Reward has expired" });
    }
    
    const result = await prisma.$transaction(async (tx) => {
      const claimedReward = await tx.reward.update({
        where: { id: rewardId },
        data: {
          status: "claimed",
          claimedAt: new Date(),
        },
      });
      
      let wallet = await tx.tokenWallet.findUnique({
        where: { userId },
      });
      
      if (!wallet) {
        wallet = await tx.tokenWallet.create({
          data: { userId },
        });
      }
      
      // Update token wallet
      await tx.tokenWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: reward.amount },
          lifetimeEarned: { increment: reward.amount },
        },
      });

      // Update USD balance (1 token = $0.10)
      const usdAmount = Number(reward.amount) * 0.10;
      await tx.user.update({
        where: { id: userId },
        data: {
          usdBalance: { increment: usdAmount },
        },
      });
      
      await tx.tokenTransaction.create({
        data: {
          walletId: wallet.id,
          amount: reward.amount,
          type: "earn",
          status: "completed",
          description: `Claimed reward: ${reward.description}`,
          metadata: JSON.stringify({
            rewardId: reward.id,
            rewardType: reward.type,
            claimedAt: new Date().toISOString(),
          }),
        },
      });
      
      return claimedReward;
    });
    
    res.json({
      success: true,
      reward: {
        ...result,
        amount: result.amount.toString(),
      },
      message: "Reward claimed successfully!",
    });
  } catch (error: any) {
    console.error("[REWARDS] Error claiming reward:", error);
    res.status(500).json({ error: "Failed to claim reward" });
  }
});

router.get("/tier/:userId", authenticateToken as any, async (req, res) => {
  try {
    const { userId } = req.params;
    
    let tier = await prisma.userTier.findUnique({
      where: { userId },
    });
    
    if (!tier) {
      tier = await prisma.userTier.create({
        data: {
          userId,
          currentTier: "bronze",
          points: 0,
        },
      });
    }
    
    const tierThresholds = {
      bronze: { next: "silver", pointsNeeded: 1000 },
      silver: { next: "gold", pointsNeeded: 5000 },
      gold: { next: "platinum", pointsNeeded: 15000 },
      platinum: { next: "diamond", pointsNeeded: 50000 },
      diamond: { next: null, pointsNeeded: null },
    };
    
    const currentTierInfo = tierThresholds[tier.currentTier as keyof typeof tierThresholds];
    const nextTierProgress = currentTierInfo.pointsNeeded 
      ? (tier.points / currentTierInfo.pointsNeeded) * 100 
      : 100;
    
    res.json({
      tier: {
        ...tier,
        lifetimeRewards: tier.lifetimeRewards.toString(),
      },
      nextTier: currentTierInfo.next,
      pointsToNextTier: currentTierInfo.pointsNeeded ? currentTierInfo.pointsNeeded - tier.points : 0,
      progress: Math.min(nextTierProgress, 100),
    });
  } catch (error: any) {
    console.error("[REWARDS] Error fetching tier:", error);
    res.status(500).json({ error: "Failed to fetch tier information" });
  }
});

router.post("/tier/points", authenticateToken as any, async (req, res) => {
  try {
    const { userId, points } = req.body;
    
    if (!userId || points === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    let tier = await prisma.userTier.findUnique({
      where: { userId },
    });
    
    if (!tier) {
      tier = await prisma.userTier.create({
        data: { userId, points: 0 },
      });
    }
    
    const newPoints = tier.points + points;
    
    let newTier = "bronze";
    if (newPoints >= 50000) newTier = "diamond";
    else if (newPoints >= 15000) newTier = "platinum";
    else if (newPoints >= 5000) newTier = "gold";
    else if (newPoints >= 1000) newTier = "silver";
    
    const tierChanged = newTier !== tier.currentTier;
    
    const updatedTier = await prisma.userTier.update({
      where: { userId },
      data: {
        points: newPoints,
        lifetimePoints: { increment: points },
        currentTier: newTier,
      },
    });
    
    if (tierChanged) {
      const bonusAmount = new Decimal(
        newTier === "diamond" ? 1000 :
        newTier === "platinum" ? 500 :
        newTier === "gold" ? 200 :
        newTier === "silver" ? 50 : 0
      );
      
      if (bonusAmount.gt(0)) {
        await prisma.reward.create({
          data: {
            userId,
            type: "milestone",
            amount: bonusAmount,
            title: `${newTier.toUpperCase()} Tier Achieved!`,
            description: `Congratulations! You've reached ${newTier.toUpperCase()} tier!`,
            status: "pending",
          },
        });
      }
    }
    
    res.json({
      success: true,
      tier: {
        ...updatedTier,
        lifetimeRewards: updatedTier.lifetimeRewards.toString(),
      },
      tierChanged,
      message: tierChanged 
        ? `Congratulations! You've reached ${newTier.toUpperCase()} tier!` 
        : `${points} points added`,
    });
  } catch (error: any) {
    console.error("[REWARDS] Error updating tier points:", error);
    res.status(500).json({ error: "Failed to update tier points" });
  }
});


// Get pending rewards for a user
router.get("/pending/:userId", authenticateToken as any, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const rewards = await prisma.reward.findMany({
      where: { 
        userId,
        status: "pending",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: "desc" },
    });
    
    const total = rewards.reduce((sum, r) => sum.add(r.amount), new Decimal(0));
    
    res.json({
      rewards: rewards.map(r => ({
        ...r,
        amount: r.amount.toString(),
      })),
      summary: {
        total: total.toString(),
        count: rewards.length,
      },
    });
  } catch (error: any) {
    console.error("[REWARDS] Error fetching pending rewards:", error);
    res.status(500).json({ error: "Failed to fetch pending rewards" });
  }
});

// Get global leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 10);
    
    const leaderboard = await prisma.userTier.findMany({
      orderBy: { points: "desc" },
      take: limit,
    });
    
    // Get user details for formatted response
    const formatted = await Promise.all(leaderboard.map(async (entry, index) => {
      const user = await prisma.user.findUnique({
        where: { id: entry.userId },
        select: { email: true, firstName: true, lastName: true }
      });
      
      return {
        rank: index + 1,
        userId: entry.userId,
        userName: user?.firstName || user?.email || "Anonymous",
        points: entry.points,
        tier: entry.currentTier,
        lifetimePoints: entry.lifetimePoints,
      };
    }));
    
    res.json({
      leaderboard: formatted,
      count: formatted.length,
    });
  } catch (error: any) {
    console.error("[REWARDS] Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});


export default router;
