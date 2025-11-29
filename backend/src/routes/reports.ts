/**
 * Reports API Routes
 *
 * Provides analytics data for admin dashboard charts:
 * - Revenue trends (monthly)
 * - Payment provider distribution
 * - New user signups (monthly)
 * - Subscription plan distribution
 */

import { Response, Router } from "express";
import { requireAdmin } from "../middleware/adminAuth";
import { authenticateToken } from "../middleware/auth";
import prisma from "../prismaClient";
import { serializeDecimal } from "../utils/decimal";

const router = Router();

// Helper to get last N months labels
function getLastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(date.toLocaleString("default", { month: "short" }));
  }
  return months;
}

// Helper to get start of month N months ago
function getMonthStart(monthsAgo: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
}

/**
 * GET /api/reports/revenue
 * Returns monthly revenue data for the last 6 months
 */
router.get(
  "/revenue",
  authenticateToken,
  requireAdmin,
  async (req: any, res: Response) => {
    try {
      const months = getLastNMonths(6);
      const values: number[] = [];

      // Calculate revenue for each of the last 6 months
      for (let i = 5; i >= 0; i--) {
        const startDate = getMonthStart(i);
        const endDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          1,
        );

        // Sum completed transactions for this month
        const result = await prisma.transaction.aggregate({
          where: {
            createdAt: {
              gte: startDate,
              lt: endDate,
            },
            status: {
              in: ["completed", "confirmed", "paid"],
            },
          },
          _sum: {
            amount: true,
          },
        });

        const monthRevenue = result._sum.amount
          ? parseFloat(serializeDecimal(result._sum.amount))
          : 0;
        values.push(monthRevenue);
      }

      res.json({
        months,
        values,
        total: values.reduce((a, b) => a + b, 0),
        currency: "USD",
      });
    } catch (error) {
      console.error("Error fetching revenue report:", error);
      res.status(500).json({ error: "Failed to fetch revenue data" });
    }
  },
);

/**
 * GET /api/reports/payment-split
 * Returns payment distribution by provider
 */
router.get(
  "/payment-split",
  authenticateToken,
  requireAdmin,
  async (req: any, res: Response) => {
    try {
      // Get payment counts by provider (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Aggregate by provider
      const providerCounts = await prisma.transaction.groupBy({
        by: ["provider"],
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
          status: {
            in: ["completed", "confirmed", "paid"],
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          amount: true,
        },
      });

      // Build the response object
      const result: Record<string, number> = {
        stripe: 0,
        cryptomus: 0,
        nowpayments: 0,
        alchemypay: 0,
      };

      let totalAmount = 0;

      for (const item of providerCounts) {
        const provider = (item.provider || "other").toLowerCase();
        const amount = item._sum.amount
          ? parseFloat(serializeDecimal(item._sum.amount))
          : 0;

        if (provider in result) {
          result[provider] = amount;
        }
        totalAmount += amount;
      }

      // Convert to percentages if there's data
      if (totalAmount > 0) {
        for (const key of Object.keys(result)) {
          result[key] = Math.round((result[key] / totalAmount) * 100);
        }
      }

      res.json(result);
    } catch (error) {
      console.error("Error fetching payment split:", error);
      res.status(500).json({ error: "Failed to fetch payment distribution" });
    }
  },
);

/**
 * GET /api/reports/new-users
 * Returns monthly new user signups for the last 6 months
 */
router.get(
  "/new-users",
  authenticateToken,
  requireAdmin,
  async (req: any, res: Response) => {
    try {
      const months = getLastNMonths(6);
      const values: number[] = [];

      // Count new users for each of the last 6 months
      for (let i = 5; i >= 0; i--) {
        const startDate = getMonthStart(i);
        const endDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          1,
        );

        const count = await prisma.user.count({
          where: {
            createdAt: {
              gte: startDate,
              lt: endDate,
            },
          },
        });

        values.push(count);
      }

      res.json({
        months,
        values,
        total: values.reduce((a, b) => a + b, 0),
      });
    } catch (error) {
      console.error("Error fetching new users report:", error);
      res.status(500).json({ error: "Failed to fetch new users data" });
    }
  },
);

/**
 * GET /api/reports/plan-distribution
 * Returns distribution of users by subscription tier
 */
router.get(
  "/plan-distribution",
  authenticateToken,
  requireAdmin,
  async (req: any, res: Response) => {
    try {
      // Count users by tier
      const tierCounts = await prisma.user.groupBy({
        by: ["tier"],
        _count: {
          id: true,
        },
      });

      // Build response with default tiers
      const result: Record<string, number> = {
        starter: 0,
        growth: 0,
        scale: 0,
      };

      for (const item of tierCounts) {
        const tier = (item.tier || "starter").toLowerCase();
        if (tier in result) {
          result[tier] = item._count.id;
        } else if (tier === "free" || tier === "basic") {
          result.starter += item._count.id;
        } else if (tier === "pro" || tier === "professional") {
          result.growth += item._count.id;
        } else if (tier === "enterprise" || tier === "premium") {
          result.scale += item._count.id;
        } else {
          // Unknown tier defaults to starter
          result.starter += item._count.id;
        }
      }

      res.json(result);
    } catch (error) {
      console.error("Error fetching plan distribution:", error);
      res.status(500).json({ error: "Failed to fetch plan distribution" });
    }
  },
);

/**
 * GET /api/reports/summary
 * Returns a combined summary of all analytics
 */
router.get(
  "/summary",
  authenticateToken,
  requireAdmin,
  async (req: any, res: Response) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Parallel queries for better performance
      const [
        totalUsers,
        newUsersThisMonth,
        totalRevenue,
        revenueThisMonth,
        pendingWithdrawals,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: { createdAt: { gte: thisMonthStart } },
        }),
        prisma.transaction.aggregate({
          where: { status: { in: ["completed", "confirmed", "paid"] } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            createdAt: { gte: thisMonthStart },
            status: { in: ["completed", "confirmed", "paid"] },
          },
          _sum: { amount: true },
        }),
        prisma.cryptoWithdrawal.count({
          where: { status: "pending" },
        }),
      ]);

      res.json({
        totalUsers,
        newUsersThisMonth,
        totalRevenue: totalRevenue._sum.amount
          ? parseFloat(serializeDecimal(totalRevenue._sum.amount))
          : 0,
        revenueThisMonth: revenueThisMonth._sum.amount
          ? parseFloat(serializeDecimal(revenueThisMonth._sum.amount))
          : 0,
        pendingWithdrawals,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching summary report:", error);
      res.status(500).json({ error: "Failed to fetch summary data" });
    }
  },
);

export default router;
