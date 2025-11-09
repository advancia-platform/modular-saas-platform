import express from "express";
import prisma from "../prismaClient";
import { adminAuth } from "../middleware/adminAuth";
import {
  authenticateToken,
  requireAdmin,
  logAdminAction,
} from "../middleware/auth";

const router = express.Router();

// GET /api/admin/doctors - List all doctors with filtering
router.get("/doctors", adminAuth, async (req, res) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (
      status &&
      ["PENDING", "VERIFIED", "SUSPENDED"].includes(status as string)
    ) {
      where.status = status;
    }

    const doctors = await prisma.doctor.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        specialization: true,
        licenseNumber: true,
        phoneNumber: true,
        status: true,
        verifiedAt: true,
        verifiedBy: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      doctors,
      count: doctors.length,
    });
  } catch (err) {
    console.error("Fetch doctors error:", err);
    return res.status(500).json({ error: "Failed to fetch doctors" });
  }
});

// GET /api/admin/doctor/:id - Get single doctor details
router.get("/doctor/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Fetch consultations separately since relation is not defined in schema
    const consultations = await prisma.consultation.findMany({
      where: { doctorId: id },
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        patientId: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const doctorWithConsultations = {
      ...doctor,
      consultations,
    };

    // Don't return password hash
    const { passwordHash, ...doctorData } = doctorWithConsultations;

    return res.json({ doctor: doctorData });
  } catch (err) {
    console.error("Fetch doctor error:", err);
    return res.status(500).json({ error: "Failed to fetch doctor" });
  }
});

// POST /api/admin/doctor/:id/verify - Verify a doctor
router.post("/doctor/:id/verify", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body || {};

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    if (doctor.status === "VERIFIED") {
      return res.status(400).json({ error: "Doctor is already verified" });
    }

    const updated = await prisma.doctor.update({
      where: { id },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
        verifiedBy: adminId || "admin",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        specialization: true,
        status: true,
        verifiedAt: true,
        verifiedBy: true,
      },
    });

    return res.json({
      message: "Doctor verified successfully",
      doctor: updated,
    });
  } catch (err) {
    console.error("Verify doctor error:", err);
    return res.status(500).json({ error: "Failed to verify doctor" });
  }
});

// POST /api/admin/doctor/:id/suspend - Suspend a doctor
router.post("/doctor/:id/suspend", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    const updated = await prisma.doctor.update({
      where: { id },
      data: { status: "SUSPENDED" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        specialization: true,
        status: true,
      },
    });

    return res.json({
      message: "Doctor suspended successfully",
      doctor: updated,
    });
  } catch (err) {
    console.error("Suspend doctor error:", err);
    return res.status(500).json({ error: "Failed to suspend doctor" });
  }
});

// DELETE /api/admin/doctor/:id - Delete a doctor (hard delete)
router.delete("/doctor/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    await prisma.doctor.delete({
      where: { id },
    });

    return res.json({ message: "Doctor deleted successfully" });
  } catch (err) {
    console.error("Delete doctor error:", err);
    return res.status(500).json({ error: "Failed to delete doctor" });
  }
});

// GET /api/admin/settings - Get current admin settings
router.get(
  "/settings",
  authenticateToken as any,
  requireAdmin as any,
  async (req, res) => {
    try {
      // Get or create settings (there should only be one row)
      let settings = await prisma.adminSettings.findFirst();

      if (!settings) {
        // Create default settings if none exist
        settings = await prisma.adminSettings.create({
          data: {
            processingFeePercent: 2.5,
            minPurchaseAmount: 10,
            debitCardPriceUSD: 1000,
          },
        });
      }

      return res.json({
        id: settings.id,
        crypto: {
          btcAddress: settings.btcAddress || "",
          ethAddress: settings.ethAddress || "",
          usdtAddress: settings.usdtAddress || "",
          ltcAddress: settings.ltcAddress || "",
          otherAddresses: settings.otherAddresses || "",
        },
        exchangeRates: {
          btc: settings.exchangeRateBtc?.toString() || "0",
          eth: settings.exchangeRateEth?.toString() || "0",
          usdt: settings.exchangeRateUsdt?.toString() || "0",
        },
        fees: {
          processingFeePercent:
            settings.processingFeePercent?.toString() || "2.5",
          minPurchaseAmount: settings.minPurchaseAmount?.toString() || "10",
          debitCardPriceUSD: settings.debitCardPriceUSD?.toString() || "1000",
        },
        system: {
          maintenanceMode: false,
          rateLimitPerMinute: 100,
          maxFileUploadMB: 10,
        },
        updatedAt: settings.updatedAt,
        createdAt: settings.createdAt,
      });
    } catch (err) {
      console.error("Error fetching admin settings:", err);
      return res.status(500).json({ error: "Failed to fetch settings" });
    }
  }
);

// PATCH /api/admin/settings - Update admin settings
router.patch(
  "/settings",
  authenticateToken as any,
  requireAdmin as any,
  logAdminAction as any,
  async (req, res) => {
    try {
      const { crypto, exchangeRates, fees } = req.body;

      // Get existing settings or create new
      let settings = await prisma.adminSettings.findFirst();

      if (!settings) {
        settings = await prisma.adminSettings.create({
          data: {
            processingFeePercent: 2.5,
            minPurchaseAmount: 10,
            debitCardPriceUSD: 1000,
          },
        });
      }

      // Build update data
      const updateData: any = {};

      if (crypto) {
        if (crypto.btcAddress !== undefined)
          updateData.btcAddress = crypto.btcAddress;
        if (crypto.ethAddress !== undefined)
          updateData.ethAddress = crypto.ethAddress;
        if (crypto.usdtAddress !== undefined)
          updateData.usdtAddress = crypto.usdtAddress;
        if (crypto.ltcAddress !== undefined)
          updateData.ltcAddress = crypto.ltcAddress;
        if (crypto.otherAddresses !== undefined)
          updateData.otherAddresses = crypto.otherAddresses;
      }

      if (exchangeRates) {
        if (exchangeRates.btc !== undefined)
          updateData.exchangeRateBtc = parseFloat(exchangeRates.btc);
        if (exchangeRates.eth !== undefined)
          updateData.exchangeRateEth = parseFloat(exchangeRates.eth);
        if (exchangeRates.usdt !== undefined)
          updateData.exchangeRateUsdt = parseFloat(exchangeRates.usdt);
      }

      if (fees) {
        if (fees.processingFeePercent !== undefined) {
          updateData.processingFeePercent = parseFloat(
            fees.processingFeePercent
          );
        }
        if (fees.minPurchaseAmount !== undefined) {
          updateData.minPurchaseAmount = parseFloat(fees.minPurchaseAmount);
        }
        if (fees.debitCardPriceUSD !== undefined) {
          updateData.debitCardPriceUSD = parseFloat(fees.debitCardPriceUSD);
        }
      }

      // Update settings
      const updated = await prisma.adminSettings.update({
        where: { id: settings.id },
        data: updateData,
      });

      return res.json({
        message: "Settings updated successfully",
        settings: {
          id: updated.id,
          crypto: {
            btcAddress: updated.btcAddress || "",
            ethAddress: updated.ethAddress || "",
            usdtAddress: updated.usdtAddress || "",
            ltcAddress: updated.ltcAddress || "",
            otherAddresses: updated.otherAddresses || "",
          },
          exchangeRates: {
            btc: updated.exchangeRateBtc?.toString() || "0",
            eth: updated.exchangeRateEth?.toString() || "0",
            usdt: updated.exchangeRateUsdt?.toString() || "0",
          },
          fees: {
            processingFeePercent:
              updated.processingFeePercent?.toString() || "2.5",
            minPurchaseAmount: updated.minPurchaseAmount?.toString() || "10",
            debitCardPriceUSD: updated.debitCardPriceUSD?.toString() || "1000",
          },
          updatedAt: updated.updatedAt,
        },
      });
    } catch (err) {
      console.error("Error updating admin settings:", err);
      return res.status(500).json({ error: "Failed to update settings" });
    }
  }
);

// GET /api/admin/analytics/overview - Get high-level analytics
router.get(
  "/analytics/overview",
  authenticateToken as any,
  requireAdmin as any,
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(String(startDate));
      if (endDate) dateFilter.lte = new Date(String(endDate));

      const whereDate =
        Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

      // User statistics
      const [totalUsers, activeUsers, newUsersThisMonth] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { active: true } }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]);

      // Transaction statistics
      const transactions = await prisma.transaction.aggregate({
        where: whereDate,
        _count: true,
        _sum: { amount: true },
      });

      // Token wallet statistics
      const tokenStats = await prisma.tokenWallet.aggregate({
        _sum: { balance: true, lifetimeEarned: true },
      });

      return res.json({
        users: {
          total: totalUsers,
          active: activeUsers,
          newThisMonth: newUsersThisMonth,
          suspendedCount: totalUsers - activeUsers,
        },
        transactions: {
          total: transactions._count || 0,
          volume: transactions._sum?.amount?.toString() || "0",
        },
        tokens: {
          totalBalance: tokenStats._sum?.balance?.toString() || "0",
          totalEarned: tokenStats._sum?.lifetimeEarned?.toString() || "0",
        },
      });
    } catch (err) {
      console.error("Error fetching analytics overview:", err);
      return res.status(500).json({ error: "Failed to fetch analytics" });
    }
  }
);

// GET /api/admin/analytics/user-growth - Get user growth over time
router.get(
  "/analytics/user-growth",
  authenticateToken as any,
  requireAdmin as any,
  async (req, res) => {
    try {
      const { days = "30" } = req.query;
      const daysNum = Math.min(365, Math.max(1, Number(days)));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      // Group users by day
      const users = await prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      });

      // Aggregate by day
      const dailyCounts: Record<string, number> = {};
      users.forEach((user) => {
        const day = user.createdAt.toISOString().split("T")[0];
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      });

      const data = Object.entries(dailyCounts).map(([date, count]) => ({
        date,
        count,
      }));

      return res.json({ data });
    } catch (err) {
      console.error("Error fetching user growth:", err);
      return res.status(500).json({ error: "Failed to fetch user growth" });
    }
  }
);

// GET /api/admin/analytics/transaction-volume - Get transaction volume over time
router.get(
  "/analytics/transaction-volume",
  authenticateToken as any,
  requireAdmin as any,
  async (req, res) => {
    try {
      const { days = "30" } = req.query;
      const daysNum = Math.min(365, Math.max(1, Number(days)));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      const transactions = await prisma.transaction.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true, amount: true },
        orderBy: { createdAt: "asc" },
      });

      // Aggregate by day
      const dailyVolume: Record<string, number> = {};
      transactions.forEach((tx) => {
        const day = tx.createdAt.toISOString().split("T")[0];
        dailyVolume[day] = (dailyVolume[day] || 0) + Number(tx.amount || 0);
      });

      const data = Object.entries(dailyVolume).map(([date, volume]) => ({
        date,
        volume,
      }));

      return res.json({ data });
    } catch (err) {
      console.error("Error fetching transaction volume:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch transaction volume" });
    }
  }
);

// GET /api/admin/stats - Get admin dashboard statistics
router.get("/stats", adminAuth, async (req, res) => {
  try {
    // Total users count
    const totalUsers = await prisma.user.count();

    // Active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await prisma.user.count({
      where: {
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Total transactions
    const totalTransactions = await prisma.transaction.count();

    // Pending withdrawals count
    const pendingWithdrawals = await prisma.cryptoWithdrawal.count({
      where: {
        status: "PENDING",
      },
    });

    // Total revenue (sum of completed transactions)
    const revenueData = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: "COMPLETED",
      },
    });

    const totalRevenue = revenueData._sum.amount?.toString() || "0";

    // Recent activity (last 5 transactions)
    const recentActivity = await prisma.transaction.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        userId: true,
        type: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    });

    // Fetch user details for recent activity
    const userIds = [...new Set(recentActivity.map((a) => a.userId))];
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalTransactions,
        pendingWithdrawals,
        totalRevenue,
        recentActivity: recentActivity.map((activity) => {
          const user = userMap.get(activity.userId);
          return {
            id: activity.id,
            type: activity.type,
            amount: activity.amount.toString(),
            status: activity.status,
            createdAt: activity.createdAt,
            user: user
              ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                user.email
              : "Unknown",
          };
        }),
      },
    });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    return res.status(500).json({ error: "Failed to fetch admin statistics" });
  }
});

// GET /api/admin/transactions - Get transaction history
router.get("/transactions", adminAuth, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        id: true,
        userId: true,
        amount: true,
        type: true,
        description: true,
        status: true,
        createdAt: true,
      },
    });

    return res.json(transactions);
  } catch (err) {
    console.error("Transaction fetch error:", err);
    return res.status(500).json({ error: "Failed to load transactions" });
  }
});

// POST /api/admin/users/:userId/update-balance - Update user balance
router.post("/users/:userId/update-balance", adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { currency, amount } = req.body;

    if (!userId || !currency || amount === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const validCurrencies = ["USD", "BTC", "ETH", "USDT"];
    const currencyUpper = currency.toUpperCase();
    
    if (!validCurrencies.includes(currencyUpper)) {
      return res.status(400).json({ error: `Invalid currency: ${currencyUpper}` });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const balanceField = `${currencyUpper.toLowerCase()}Balance`;
    const currentBalance = Number(user[balanceField as keyof typeof user] || 0);
    const newBalance = currentBalance + Number(amount);

    if (newBalance < 0) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const updateData: Record<string, number> = {};
    updateData[balanceField] = newBalance;

    await prisma.user.update({ where: { id: userId }, data: updateData });

    await prisma.transaction.create({
      data: {
        userId,
        amount: Number(amount),
        type: "ADMIN_ADJUSTMENT",
        description: `Admin adjusted ${currencyUpper} by ${amount}`,
        status: "completed",
      },
    });

    return res.json({ success: true, newBalance });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/transactions - Get transaction history
router.get("/transactions", adminAuth, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        id: true,
        userId: true,
        amount: true,
        type: true,
        description: true,
        status: true,
        createdAt: true,
      },
    });

    return res.json(transactions);
  } catch (err) {
    console.error("Transaction fetch error:", err);
    return res.status(500).json({ error: "Failed to load transactions" });
  }
});


// ✨ NEW ENDPOINTS: Registration Approval System

// GET /api/admin/users/pending-approvals - List pending user registrations
router.get(
  "/users/pending-approvals",
  authenticateToken as any,
  requireAdmin as any,
  async (req, res) => {
    try {
      const { page = "1", limit = "20" } = req.query;
      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.min(100, Math.max(1, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      // Get pending users (where active = false)
      const [pendingUsers, totalCount] = await Promise.all([
        prisma.user.findMany({
          where: { active: false },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "asc" },
          skip,
          take: limitNum,
        }),
        prisma.user.count({ where: { active: false } }),
      ]);

      return res.json({
        message: "Pending user registrations retrieved successfully",
        data: pendingUsers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum),
        },
      });
    } catch (err) {
      console.error("Error fetching pending approvals:", err);
      return res.status(500).json({ error: "Failed to fetch pending approvals" });
    }
  }
);

// POST /api/admin/users/approve-registration - Approve or reject a registration
router.post(
  "/users/approve-registration",
  authenticateToken as any,
  requireAdmin as any,
  logAdminAction as any,
  async (req, res) => {
    try {
      const { userId, action, reason } = req.body;
      const adminId = (req as any).user?.userId;

      if (!userId || !action || !["approve", "reject"].includes(action)) {
        return res.status(400).json({
          error: "Invalid request. userId and action (approve/reject) required.",
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          active: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.active) {
        return res.status(400).json({ error: "User is already approved" });
      }

      if (action === "approve") {
        const approvedUser = await prisma.user.update({
          where: { id: userId },
          data: { active: true },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            active: true,
          },
        });

        return res.json({
          message: "User registration approved successfully",
          user: approvedUser,
        });
      } else {
        // Reject: delete the user or mark as rejected
        await prisma.user.delete({
          where: { id: userId },
        });

        return res.json({
          message: "User registration rejected and account deleted",
          userId,
          reason: reason || "No reason provided",
        });
      }
    } catch (err) {
      console.error("Error processing approval:", err);
      return res.status(500).json({ error: "Failed to process approval" });
    }
  }
);

// POST /api/admin/users/bulk-approve - Bulk approve or reject registrations
router.post(
  "/users/bulk-approve",
  authenticateToken as any,
  requireAdmin as any,
  logAdminAction as any,
  async (req, res) => {
    try {
      const { userIds, action } = req.body;
      const adminId = (req as any).user?.userId;

      if (
        !Array.isArray(userIds) ||
        userIds.length === 0 ||
        !action ||
        !["approve", "reject"].includes(action)
      ) {
        return res.status(400).json({
          error: "Invalid request. userIds (array) and action (approve/reject) required.",
        });
      }

      const maxBulkSize = 100;
      if (userIds.length > maxBulkSize) {
        return res.status(400).json({
          error: `Maximum bulk operation size is ${maxBulkSize} users`,
        });
      }

      const users = await prisma.user.findMany({
        where: { id: { in: userIds }, active: false },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (users.length === 0) {
        return res.status(400).json({
          error: "No pending users found in the provided list",
        });
      }

      let results = {
        processed: 0,
        approved: 0,
        rejected: 0,
        errors: [] as string[],
      };

      if (action === "approve") {
        // Approve users
        const updated = await prisma.user.updateMany({
          where: { id: { in: users.map((u) => u.id) }, active: false },
          data: { active: true },
        });
        results.approved = updated.count;
        results.processed = updated.count;
      } else {
        // Reject users (delete them)
        for (const user of users) {
          try {
            await prisma.user.delete({
              where: { id: user.id },
            });
            results.rejected++;
            results.processed++;
          } catch (err) {
            results.errors.push(
              `Failed to reject ${user.email}: ${String(err)}`
            );
          }
        }
      }

      return res.json({
        message: `Bulk ${action} completed`,
        results,
      });
    } catch (err) {
      console.error("Error processing bulk approval:", err);
      return res.status(500).json({ error: "Failed to process bulk approval" });
    }
  }
);
export default router;




