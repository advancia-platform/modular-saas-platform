/**
 * Fraud Detection Service
 * Monitors user activity for suspicious patterns and blocks high-risk transactions
 */

import axios from "axios";
import { randomUUID } from "crypto";
import { NextFunction, Response } from "express";
import prisma from "../prismaClient";

// Configuration
const MAX_WITHDRAWALS_PER_DAY = parseInt(
  process.env.MAX_WITHDRAWALS_PER_DAY || "3",
  10,
);
const MAX_FAILED_PAYMENTS = parseInt(
  process.env.MAX_FAILED_PAYMENTS || "5",
  10,
);
const IP_RISK_THRESHOLD = parseInt(process.env.IP_RISK_THRESHOLD || "70", 10);
const FRAUD_DETECTION_ENABLED = process.env.FRAUD_DETECTION_ENABLED !== "false";

export interface FraudCheckResult {
  allowed: boolean;
  reason?: string;
  severity?: string;
  alertId?: string;
}

/**
 * Create fraud alert
 */
export async function createFraudAlert(params: {
  userId: string;
  alertType: string;
  severity: string;
  description: string;
  ipAddress?: string;
  metadata?: any;
  actionTaken?: string;
}) {
  const alert = await prisma.fraud_alerts.create({
    data: {
      id: randomUUID(),
      userId: params.userId,
      alertType: params.alertType,
      severity: params.severity,
      description: params.description,
      ipAddress: params.ipAddress,
      metadata: params.metadata || {},
      actionTaken: params.actionTaken,
    },
  });

  console.log(
    `[FRAUD ALERT] ${params.severity.toUpperCase()}: ${params.description}`,
  );

  // TODO: Send notification to admin dashboard via Socket.IO
  // TODO: Send email alert for critical severity

  return alert;
}

/**
 * Check withdrawal velocity - max N withdrawals per 24 hours
 */
export async function checkWithdrawalVelocity(
  userId: string,
  ipAddress?: string,
): Promise<FraudCheckResult> {
  if (!FRAUD_DETECTION_ENABLED) {
    return { allowed: true };
  }

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentWithdrawals = await prisma.crypto_withdrawals.count({
    where: {
      userId,
      createdAt: { gte: last24h },
      status: { in: ["pending", "completed"] },
    },
  });

  if (recentWithdrawals >= MAX_WITHDRAWALS_PER_DAY) {
    const alert = await createFraudAlert({
      userId,
      alertType: "velocity_exceeded",
      severity: "high",
      description: `User attempted ${
        recentWithdrawals + 1
      } withdrawals in 24 hours (limit: ${MAX_WITHDRAWALS_PER_DAY})`,
      ipAddress,
      actionTaken: "transaction_blocked",
    });

    return {
      allowed: false,
      reason: `Daily withdrawal limit exceeded (${MAX_WITHDRAWALS_PER_DAY} per 24 hours)`,
      severity: "high",
      alertId: alert.id,
    };
  }

  return { allowed: true };
}

/**
 * Check IP reputation using free ipapi.co service
 */
export async function checkIPReputation(
  ipAddress: string,
): Promise<FraudCheckResult> {
  if (
    !FRAUD_DETECTION_ENABLED ||
    !ipAddress ||
    ipAddress === "127.0.0.1" ||
    ipAddress === "::1"
  ) {
    return { allowed: true };
  }

  try {
    // Check cache first
    let ipRep = await prisma.ip_reputations.findUnique({
      where: { ipAddress },
    });

    // Refresh if older than 7 days or doesn't exist
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    if (!ipRep || ipRep.lastChecked < sevenDaysAgo) {
      try {
        const response = await axios.get(
          `https://ipapi.co/${ipAddress}/json/`,
          {
            timeout: 5000,
            headers: { "User-Agent": "Advancia-Pay-Fraud-Detection/1.0" },
          },
        );

        const data = response.data;

        // Heuristic risk scoring
        const isVPN = data.org?.toLowerCase().includes("vpn") || false;
        const isProxy = data.org?.toLowerCase().includes("proxy") || false;
        const isHosting =
          data.org?.toLowerCase().includes("hosting") ||
          data.org?.toLowerCase().includes("cloud") ||
          data.org?.toLowerCase().includes("datacenter") ||
          false;

        let riskScore = 0;
        if (isVPN) riskScore += 40;
        if (isProxy) riskScore += 40;
        if (isHosting) riskScore += 20;

        ipRep = await prisma.ip_reputations.upsert({
          where: { ipAddress },
          create: {
            id: randomUUID(),
            ipAddress,
            isVPN,
            isProxy,
            isHosting,
            riskScore,
            country: data.country_name,
            city: data.city,
            isp: data.org,
            lastChecked: new Date(),
            updatedAt: new Date(),
            checkCount: 1,
          },
          update: {
            isVPN,
            isProxy,
            isHosting,
            riskScore,
            country: data.country_name,
            city: data.city,
            isp: data.org,
            lastChecked: new Date(),
            updatedAt: new Date(),
            checkCount: { increment: 1 },
          },
        });
      } catch (apiError: any) {
        console.error(`IP reputation API error: ${apiError.message}`);
        // Don't block on API failure - allow transaction
        return { allowed: true };
      }
    }

    // Check blacklist or high risk
    if (ipRep.blacklisted || ipRep.riskScore >= IP_RISK_THRESHOLD) {
      return {
        allowed: false,
        reason: `High-risk IP address detected (score: ${ipRep.riskScore})`,
        severity: "critical",
      };
    }

    // Warning for medium risk
    if (ipRep.riskScore >= 40) {
      // Log but allow
      console.warn(
        `[FRAUD WARNING] Medium-risk IP: ${ipAddress} (score: ${ipRep.riskScore})`,
      );
    }

    return { allowed: true };
  } catch (error: any) {
    console.error(`IP reputation check error: ${error.message}`);
    // Don't block on error - allow transaction
    return { allowed: true };
  }
}

/**
 * Monitor failed payments and lock account if threshold exceeded
 */
export async function monitorFailedPayments(userId: string): Promise<void> {
  if (!FRAUD_DETECTION_ENABLED) {
    return;
  }

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const failedCount = await prisma.payment_sessions.count({
    where: {
      userId,
      status: "failed",
      createdAt: { gte: last24h },
    },
  });

  if (failedCount >= MAX_FAILED_PAYMENTS) {
    // Lock account
    await prisma.user.update({
      where: { id: userId },
      data: { active: false },
    });

    await createFraudAlert({
      userId,
      alertType: "failed_payments",
      severity: "critical",
      description: `Account locked after ${failedCount} failed payments in 24 hours`,
      actionTaken: "account_locked",
    });

    console.log(
      `[FRAUD] Account ${userId} locked due to ${failedCount} failed payments`,
    );
    // TODO: Send admin notification
  }
}

/**
 * Detect unusual withdrawal amounts
 */
export async function detectUnusualAmount(
  userId: string,
  amount: number,
  currency: string,
): Promise<FraudCheckResult> {
  if (!FRAUD_DETECTION_ENABLED) {
    return { allowed: true };
  }

  // Get user's withdrawal history (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const recentWithdrawals = await prisma.crypto_withdrawals.findMany({
    where: {
      userId,
      cryptoType: currency,
      createdAt: { gte: thirtyDaysAgo },
      status: "completed",
    },
    select: { cryptoAmount: true },
  });

  // Need at least 3 withdrawals for baseline
  if (recentWithdrawals.length < 3) {
    return { allowed: true };
  }

  // Calculate average and standard deviation
  const amounts = recentWithdrawals.map((w) => Number(w.cryptoAmount));
  const avg = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
  const variance =
    amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
    amounts.length;
  const stdDev = Math.sqrt(variance);

  // Flag if amount is more than 3 standard deviations from mean (highly unusual)
  const zScore = (amount - avg) / stdDev;

  if (zScore > 3) {
    const alert = await createFraudAlert({
      userId,
      alertType: "unusual_amount",
      severity: "medium",
      description: `Unusual withdrawal amount detected: ${amount} ${currency} (avg: ${avg.toFixed(
        4,
      )}, z-score: ${zScore.toFixed(2)})`,
      metadata: { amount, currency, average: avg, zScore },
      actionTaken: "manual_review",
    });

    // Don't block - just flag for manual review
    console.warn(
      `[FRAUD WARNING] Unusual amount for user ${userId}: ${amount} ${currency}`,
    );
  }

  return { allowed: true };
}

/**
 * Check for duplicate withdrawal addresses (potential account takeover)
 */
export async function checkDuplicateWithdrawalAddress(
  userId: string,
  address: string,
  currency: string,
): Promise<FraudCheckResult> {
  if (!FRAUD_DETECTION_ENABLED) {
    return { allowed: true };
  }

  // Check if this address has been used by other users
  const otherUsersWithAddress = await prisma.crypto_withdrawals.findMany({
    where: {
      withdrawalAddress: address,
      cryptoType: currency,
      userId: { not: userId },
      status: { in: ["completed", "pending"] },
    },
    distinct: ["userId"],
    select: { userId: true },
    take: 5,
  });

  if (otherUsersWithAddress.length > 0) {
    await createFraudAlert({
      userId,
      alertType: "duplicate_withdrawal",
      severity: "high",
      description: `Withdrawal address ${address} has been used by ${otherUsersWithAddress.length} other user(s)`,
      metadata: {
        address,
        currency,
        otherUsers: otherUsersWithAddress.map((u) => u.userId),
      },
      actionTaken: "manual_review",
    });

    return {
      allowed: false,
      reason: "This withdrawal address has been flagged for security review",
      severity: "high",
    };
  }

  return { allowed: true };
}

/**
 * Express middleware: Block if velocity limit exceeded
 */
export async function checkWithdrawalVelocityMiddleware(
  req: any,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user?.userId;
  if (!userId) {
    return next();
  }

  const ipAddress =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress;

  const result = await checkWithdrawalVelocity(userId, ipAddress);

  if (!result.allowed) {
    return res.status(429).json({
      error: "Transaction blocked",
      message: result.reason,
      severity: result.severity,
      alertId: result.alertId,
    });
  }

  next();
}

/**
 * Express middleware: Block if IP is high-risk
 */
export async function checkIPReputationMiddleware(
  req: any,
  res: Response,
  next: NextFunction,
) {
  const ipAddress =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress;

  if (!ipAddress) {
    return next();
  }

  const result = await checkIPReputation(ipAddress);

  if (!result.allowed) {
    const userId = req.user?.userId || "anonymous";

    await createFraudAlert({
      userId,
      alertType: "ip_suspicious",
      severity: result.severity || "critical",
      description: result.reason || "High-risk IP detected",
      ipAddress,
      actionTaken: "transaction_blocked",
    });

    return res.status(403).json({
      error: "Transaction blocked",
      message:
        "Your IP address has been flagged for security reasons. Please contact support.",
      severity: result.severity,
    });
  }

  next();
}

/**
 * Get fraud alerts for admin dashboard
 */
export async function getFraudAlerts(params: {
  resolved?: boolean;
  severity?: string;
  alertType?: string;
  userId?: string;
  limit?: number;
}) {
  const { resolved, severity, alertType, userId, limit = 50 } = params;

  const where: any = {};
  if (resolved !== undefined) {
    where.resolved = resolved;
  }
  if (severity) {
    where.severity = severity;
  }
  if (alertType) {
    where.alertType = alertType;
  }
  if (userId) {
    where.userId = userId;
  }

  const alerts = await prisma.fraud_alerts.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return alerts;
}

/**
 * Resolve fraud alert (admin action)
 */
export async function resolveFraudAlert(
  alertId: string,
  adminUserId: string,
  notes?: string,
) {
  const alert = await prisma.fraud_alerts.update({
    where: { id: alertId },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: adminUserId,
      notes,
    },
  });

  return alert;
}

/**
 * Blacklist/whitelist IP address (admin)
 */
export async function updateIPReputation(
  ipAddress: string,
  action: "blacklist" | "whitelist" | "reset",
) {
  const ipRep = await prisma.ip_reputations.upsert({
    where: { ipAddress },
    create: {
      id: randomUUID(),
      ipAddress,
      blacklisted: action === "blacklist",
      whitelisted: action === "whitelist",
      riskScore: action === "blacklist" ? 100 : 0,
      lastChecked: new Date(),
      updatedAt: new Date(),
    },
    update: {
      blacklisted: action === "blacklist",
      whitelisted: action === "whitelist",
      riskScore:
        action === "blacklist" ? 100 : action === "whitelist" ? 0 : undefined,
      lastChecked: new Date(),
      updatedAt: new Date(),
    },
  });

  return ipRep;
}

/**
 * Get fraud detection statistics (admin dashboard)
 */
export async function getFraudStats(startDate?: Date, endDate?: Date) {
  const where: any = {};
  if (startDate && endDate) {
    where.createdAt = { gte: startDate, lte: endDate };
  }

  const [totalAlerts, bySeverity, byType, unresolved] = await Promise.all([
    prisma.fraud_alerts.count({ where }),

    prisma.fraud_alerts.groupBy({
      by: ["severity"],
      where,
      _count: true,
    }),

    prisma.fraud_alerts.groupBy({
      by: ["alertType"],
      where,
      _count: true,
    }),

    prisma.fraud_alerts.count({
      where: { ...where, resolved: false },
    }),
  ]);

  return {
    totalAlerts,
    unresolved,
    bySeverity,
    byType,
  };
}
