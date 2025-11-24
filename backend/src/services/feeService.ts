/**
 * Transaction Fee Calculation Service
 * Handles fee calculations for all transaction types with admin-configurable rules
 */

import { PrismaClient } from "@prisma/client";
import { withDefaults } from "../utils/prismaHelpers";

const prisma = new PrismaClient();

export interface FeeCalculation {
  feePercent: number;
  flatFee: number;
  totalFee: number;
  netAmount: number;
  minFee: number;
  maxFee: number | null;
  appliedRuleId?: string;
}

export interface RecordRevenueParams {
  transactionId: string;
  transactionType: string;
  userId: string;
  currency: string;
  baseAmount: number;
  fee: FeeCalculation;
  usdConversionRate?: number;
}

/**
 * Calculate transaction fee based on active rules
 * Rules are prioritized: specific currency > general rule, higher priority > lower priority
 */
export async function calculateTransactionFee(
  feeType: string,
  currency: string,
  amount: number,
): Promise<FeeCalculation> {
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  // Get active fee configuration
  // Priority: 1) Currency-specific, 2) General (currency=null), ordered by priority desc
  const feeConfig = await prisma.transaction_fees.findFirst({
    where: {
      feeType,
      OR: [{ currency: currency.toUpperCase() }, { currency: null }],
      active: true,
    },
    orderBy: [
      { currency: "desc" }, // null comes last, so specific currency first
      { priority: "desc" },
      { createdAt: "desc" },
    ],
  });

  // No fee configured - return zero fee
  if (!feeConfig) {
    return {
      feePercent: 0,
      flatFee: 0,
      totalFee: 0,
      netAmount: amount,
      minFee: 0,
      maxFee: null,
    };
  }

  // Calculate percentage fee
  const feePercent = Number(feeConfig.feePercent);
  const flatFee = Number(feeConfig.flatFee);
  const minFee = Number(feeConfig.minFee);
  const maxFee = feeConfig.maxFee ? Number(feeConfig.maxFee) : null;

  let percentFee = (amount * feePercent) / 100;
  let totalFee = percentFee + flatFee;

  // Apply min/max caps
  if (totalFee < minFee) {
    totalFee = minFee;
  }
  if (maxFee !== null && totalFee > maxFee) {
    totalFee = maxFee;
  }

  // Ensure fee doesn't exceed amount
  if (totalFee > amount) {
    totalFee = amount;
  }

  return {
    feePercent,
    flatFee,
    totalFee: Number(totalFee.toFixed(8)), // Round to 8 decimals
    netAmount: Number((amount - totalFee).toFixed(8)),
    minFee,
    maxFee,
    appliedRuleId: feeConfig.id,
  };
}

/**
 * Record fee revenue for analytics
 */
export async function recordFeeRevenue(params: RecordRevenueParams) {
  const {
    transactionId,
    transactionType,
    userId,
    currency,
    baseAmount,
    fee,
    usdConversionRate = 1,
  } = params;

  // Skip if no fee
  if (fee.totalFee === 0) {
    return null;
  }

  const revenueUSD = fee.totalFee * usdConversionRate;

  const revenue = await prisma.fee_revenues.create({
    data: withDefaults({
      transactionId,
      transactionType,
      userId,
      baseCurrency: currency.toUpperCase(),
      baseAmount,
      feePercent: fee.feePercent,
      flatFee: fee.flatFee,
      totalFee: fee.totalFee,
      netAmount: fee.netAmount,
      revenueUSD,
      feeRuleId: fee.appliedRuleId,
    }),
  });

  return revenue;
}

/**
 * Get fee revenue statistics (admin dashboard)
 */
export async function getFeeRevenueStats(
  startDate?: Date,
  endDate?: Date,
  transactionType?: string,
) {
  const where: any = {};

  if (startDate && endDate) {
    where.createdAt = { gte: startDate, lte: endDate };
  } else if (startDate) {
    where.createdAt = { gte: startDate };
  } else if (endDate) {
    where.createdAt = { lte: endDate };
  }

  if (transactionType) {
    where.transactionType = transactionType;
  }

  const [totalRevenueUSD, byType, byCurrency, count] = await Promise.all([
    // Total revenue in USD
    prisma.fee_revenues.aggregate({
      where,
      _sum: { revenueUSD: true },
    }),

    // Revenue by transaction type
    prisma.fee_revenues.groupBy({
      by: ["transactionType"],
      where,
      _sum: {
        totalFee: true,
        revenueUSD: true,
      },
      _count: true,
    }),

    // Revenue by currency
    prisma.fee_revenues.groupBy({
      by: ["baseCurrency"],
      where,
      _sum: {
        totalFee: true,
        revenueUSD: true,
      },
      _count: true,
    }),

    // Total transaction count
    prisma.fee_revenues.count({ where }),
  ]);

  return {
    totalRevenueUSD: totalRevenueUSD._sum.revenueUSD || 0,
    transactionCount: count,
    byType,
    byCurrency,
  };
}

/**
 * Get top revenue-generating users (admin)
 */
export async function getTopRevenueUsers(
  limit: number = 10,
  startDate?: Date,
  endDate?: Date,
) {
  const where: any = {};
  if (startDate && endDate) {
    where.createdAt = { gte: startDate, lte: endDate };
  }

  const topUsers = await prisma.fee_revenues.groupBy({
    by: ["userId"],
    where,
    _sum: {
      revenueUSD: true,
    },
    _count: true,
    orderBy: {
      _sum: {
        revenueUSD: "desc",
      },
    },
    take: limit,
  });

  // Enrich with user details
  const userIds = topUsers.map((u) => u.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, username: true },
  });

  const userMap = new Map<
    string,
    { id: string; email: string; username: string | null }
  >(users.map((u) => [u.id, u]));

  return topUsers.map((item) => ({
    userId: item.userId,
    userEmail: userMap.get(item.userId)?.email,
    username: userMap.get(item.userId)?.username,
    totalRevenue: item._sum.revenueUSD || 0,
    transactionCount: item._count,
  }));
}

/**
 * Create or update fee rule (admin)
 */
export async function createFeeRule(params: {
  feeType: string;
  currency?: string;
  feePercent: number;
  flatFee?: number;
  minFee?: number;
  maxFee?: number | null;
  priority?: number;
  description?: string;
  createdBy: string;
}) {
  const {
    feeType,
    currency,
    feePercent,
    flatFee = 0,
    minFee = 0,
    maxFee = null,
    priority = 0,
    description,
    createdBy,
  } = params;

  const feeRule = await prisma.transaction_fees.create({
    data: withDefaults({
      feeType,
      currency: currency ? currency.toUpperCase() : null,
      feePercent,
      flatFee,
      minFee,
      maxFee,
      priority,
      description,
      createdBy,
    }),
  });

  return feeRule;
}

/**
 * Update fee rule (admin)
 */
export async function updateFeeRule(
  ruleId: string,
  updates: {
    feePercent?: number;
    flatFee?: number;
    minFee?: number;
    maxFee?: number | null;
    priority?: number;
    active?: boolean;
    description?: string;
  },
) {
  const feeRule = await prisma.transaction_fees.update({
    where: { id: ruleId },
    data: updates,
  });

  return feeRule;
}

/**
 * Delete fee rule (admin)
 */
export async function deleteFeeRule(ruleId: string) {
  await prisma.transaction_fees.delete({
    where: { id: ruleId },
  });
}

/**
 * Get all fee rules (admin)
 */
export async function getAllFeeRules(activeOnly: boolean = false) {
  const where: any = {};
  if (activeOnly) {
    where.active = true;
  }

  return prisma.transaction_fees.findMany({
    where,
    orderBy: [{ feeType: "asc" }, { currency: "asc" }, { priority: "desc" }],
  });
}

/**
 * Calculate fees for multiple amounts at once (batch)
 */
export async function calculateBatchFees(
  feeType: string,
  items: Array<{ currency: string; amount: number }>,
): Promise<FeeCalculation[]> {
  const results = await Promise.all(
    items.map((item) =>
      calculateTransactionFee(feeType, item.currency, item.amount),
    ),
  );
  return results;
}

/**
 * Preview fee (frontend helper - no database write)
 */
export async function previewFee(
  feeType: string,
  currency: string,
  amount: number,
): Promise<FeeCalculation & { description?: string }> {
  const fee = await calculateTransactionFee(feeType, currency, amount);

  // Get rule description
  if (fee.appliedRuleId) {
    const rule = await prisma.transaction_fees.findUnique({
      where: { id: fee.appliedRuleId },
      select: { description: true },
    });

    return {
      ...fee,
      description: rule?.description ?? undefined,
    };
  }

  return fee;
}
