/**
 * Trust and reputation scoring service
 * Similar to ScamAdviser/Trustpilot for Advancia Pay
 * Per Advancia Pay: Audit logging, Winston logging, PCI-DSS compliance
 */

import { Prisma } from "@prisma/client";
import logger from "../logger";
import prisma from "../prismaClient";

// Use Prisma.Decimal constructor (Jest-compatible)
const Decimal = Prisma.Decimal;

export interface TrustScore {
  overall: number; // 0-100
  transactionHistory: number;
  accountAge: number;
  verificationLevel: number;
  communityRating: number;
  fraudIndicators: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface UserReputation {
  userId: string;
  trustScore: TrustScore;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageTransactionAmount: Decimal;
  accountAgeInDays: number;
  verificationStatus: {
    email: boolean;
    phone: boolean;
    kyc: boolean;
    twoFactor: boolean;
  };
  communityReviews: number;
  averageRating: number;
  lastUpdated: Date;
}

/**
 * Calculate comprehensive trust score for a user
 */
export async function calculateTrustScore(userId: string): Promise<TrustScore> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 100,
        },
        auditLogs: {
          orderBy: { timestamp: "desc" },
          take: 50,
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // 1. Transaction History Score (0-25 points)
    const transactionScore = calculateTransactionScore(user.transactions);

    // 2. Account Age Score (0-25 points)
    const accountAgeScore = calculateAccountAgeScore(user.createdAt);

    // 3. Verification Level Score (0-25 points)
    const verificationScore = calculateVerificationScore({
      email: user.isEmailVerified,
      phone: user.phoneNumber !== null,
      kyc: user.kycVerified || false,
      twoFactor: user.totpSecret !== null,
    });

    // 4. Community Rating Score (0-25 points)
    const communityScore = await calculateCommunityScore(userId);

    // Detect fraud indicators
    const fraudIndicators = await detectFraudIndicators(userId);

    // Calculate overall score
    const overall = Math.round(
      transactionScore + accountAgeScore + verificationScore + communityScore,
    );

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "critical";
    if (overall >= 80) riskLevel = "low";
    else if (overall >= 60) riskLevel = "medium";
    else if (overall >= 40) riskLevel = "high";
    else riskLevel = "critical";

    // Override risk level if fraud indicators present
    if (fraudIndicators.length > 3) riskLevel = "critical";
    else if (fraudIndicators.length > 1) riskLevel = "high";

    const trustScore: TrustScore = {
      overall,
      transactionHistory: transactionScore,
      accountAge: accountAgeScore,
      verificationLevel: verificationScore,
      communityRating: communityScore,
      fraudIndicators,
      riskLevel,
    };

    // Audit log per Advancia Pay patterns
    logger.info("Trust score calculated", {
      userId,
      overall,
      riskLevel,
      fraudIndicatorCount: fraudIndicators.length,
    });

    return trustScore;
  } catch (error: any) {
    logger.error("Failed to calculate trust score", {
      userId,
      error: error.message,
    });
    throw error;
  }
}

function calculateTransactionScore(transactions: any[]): number {
  if (transactions.length === 0) return 0;

  const total = transactions.length;
  const successful = transactions.filter(
    (t) => t.status === "COMPLETED" || t.status === "SUCCESS",
  ).length;
  const failed = transactions.filter(
    (t) => t.status === "FAILED" || t.status === "DECLINED",
  ).length;

  // Success rate
  const successRate = successful / total;

  // Volume score (more transactions = higher trust, capped at 100)
  const volumeScore = Math.min(total / 100, 1);

  // Combined score (0-25)
  return Math.round(successRate * 20 + volumeScore * 5);
}

function calculateAccountAgeScore(createdAt: Date): number {
  const now = new Date();
  const ageInDays = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Score increases with age, maxes out at 365 days
  if (ageInDays >= 365) return 25;
  if (ageInDays >= 180) return 20;
  if (ageInDays >= 90) return 15;
  if (ageInDays >= 30) return 10;
  if (ageInDays >= 7) return 5;
  return 0;
}

function calculateVerificationScore(verification: {
  email: boolean;
  phone: boolean;
  kyc: boolean;
  twoFactor: boolean;
}): number {
  let score = 0;
  if (verification.email) score += 5;
  if (verification.phone) score += 5;
  if (verification.kyc) score += 10; // KYC is most important
  if (verification.twoFactor) score += 5;
  return score;
}

async function calculateCommunityScore(userId: string): Promise<number> {
  // Fetch user reviews/ratings (implement based on your review system)
  const reviews = await prisma.userReview.findMany({
    where: { revieweeId: userId },
  });

  if (reviews.length === 0) return 12.5; // Neutral score

  const averageRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  // Convert 1-5 star rating to 0-25 score
  return Math.round((averageRating / 5) * 25);
}

async function detectFraudIndicators(userId: string): Promise<string[]> {
  const indicators: string[] = [];

  // Check for suspicious patterns
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      transactions: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      },
      auditLogs: {
        where: {
          action: { in: ["LOGIN_FAILED", "WITHDRAWAL_FAILED"] },
        },
        take: 10,
      },
    },
  });

  if (!user) return indicators;

  // 1. Multiple failed logins
  const failedLogins = user.auditLogs.filter((log) =>
    log.action.includes("LOGIN_FAILED"),
  );
  if (failedLogins.length > 5) {
    indicators.push("Multiple failed login attempts detected");
  }

  // 2. High failure rate in recent transactions
  const recentTransactions = user.transactions;
  const failedRecent = recentTransactions.filter((t) => t.status === "FAILED");
  if (
    recentTransactions.length > 0 &&
    failedRecent.length / recentTransactions.length > 0.5
  ) {
    indicators.push("High transaction failure rate");
  }

  // 3. Rapid successive transactions (velocity check)
  if (recentTransactions.length > 20) {
    indicators.push("Unusually high transaction velocity");
  }

  // 4. Unverified email
  if (!user.isEmailVerified) {
    indicators.push("Email not verified");
  }

  // 5. No KYC verification
  if (!user.kycVerified) {
    indicators.push("KYC verification pending");
  }

  return indicators;
}

/**
 * Get comprehensive user reputation data
 */
export async function getUserReputation(
  userId: string,
): Promise<UserReputation> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      transactions: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const trustScore = await calculateTrustScore(userId);

  const totalTransactions = user.transactions.length;
  const successfulTransactions = user.transactions.filter(
    (t) => t.status === "COMPLETED" || t.status === "SUCCESS",
  ).length;
  const failedTransactions = user.transactions.filter(
    (t) => t.status === "FAILED",
  ).length;

  const totalAmount = user.transactions.reduce(
    (sum, t) => sum.add(t.amount),
    new Decimal(0),
  );
  const averageTransactionAmount =
    totalTransactions > 0 ? totalAmount.div(totalTransactions) : new Decimal(0);

  const accountAgeInDays = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  const reviews = await prisma.userReview.findMany({
    where: { revieweeId: userId },
  });
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return {
    userId,
    trustScore,
    totalTransactions,
    successfulTransactions,
    failedTransactions,
    averageTransactionAmount,
    accountAgeInDays,
    verificationStatus: {
      email: user.isEmailVerified,
      phone: user.phoneNumber !== null,
      kyc: user.kycVerified || false,
      twoFactor: user.totpSecret !== null,
    },
    communityReviews: reviews.length,
    averageRating,
    lastUpdated: new Date(),
  };
}
