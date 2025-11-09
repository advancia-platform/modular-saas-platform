import { Request, Response, Router } from "express";
import prisma from "../prismaClient";

const router = Router();

// GET /api/admin/dashboard/stats - Real-time dashboard statistics
router.get("/dashboard/stats", async (req: Request, res: Response) => {
  try {
    // User statistics
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { active: true } });
    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    // Transaction statistics
    const totalTransactions = await prisma.transaction.count();
    const transactionsToday = await prisma.transaction.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    const transactionVolume = await prisma.transaction.aggregate({
      _sum: { amount: true },
    });

    // Token statistics
    const totalTokenWallets = await prisma.tokenWallet.count();
    const tokenSupply = await prisma.tokenWallet.aggregate({
      _sum: { balance: true },
    });

    // Invoice statistics
    const totalInvoices = await prisma.invoice.count();
    const paidInvoices = await prisma.invoice.count({
      where: { status: "paid" },
    });
    const pendingInvoices = await prisma.invoice.count({
      where: { status: "pending" },
    });

    const invoiceRevenue = await prisma.invoice.aggregate({
      where: { status: "paid" },
      _sum: { amount: true },
    });

    // Email statistics
    const emailsSent = await prisma.emailLog.count({
      where: { status: "sent" },
    });
    const emailsFailed = await prisma.emailLog.count({
      where: { status: "failed" },
    });

    // Reward statistics
    const totalRewards = await prisma.reward.count();
    const claimedRewards = await prisma.reward.count({
      where: { status: "claimed" },
    });

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        inactiveRate:
          totalUsers > 0
            ? (((totalUsers - activeUsers) / totalUsers) * 100).toFixed(1)
            : 0,
      },
      transactions: {
        total: totalTransactions,
        today: transactionsToday,
        volume: transactionVolume._sum.amount || 0,
        averageValue:
          totalTransactions > 0
            ? (
                Number(transactionVolume._sum.amount || 0) / totalTransactions
              ).toFixed(2)
            : 0,
      },
      tokens: {
        totalWallets: totalTokenWallets,
        totalSupply: tokenSupply._sum.balance || 0,
        inCirculation: tokenSupply._sum.balance || 0,
      },
      invoices: {
        total: totalInvoices,
        paid: paidInvoices,
        pending: pendingInvoices,
        revenue: invoiceRevenue._sum.amount || 0,
        paymentRate:
          totalInvoices > 0
            ? ((paidInvoices / totalInvoices) * 100).toFixed(1)
            : 0,
      },
      emails: {
        sent: emailsSent,
        failed: emailsFailed,
        deliveryRate:
          emailsSent + emailsFailed > 0
            ? ((emailsSent / (emailsSent + emailsFailed)) * 100).toFixed(1)
            : 0,
      },
      rewards: {
        total: totalRewards,
        claimed: claimedRewards,
        pending: totalRewards - claimedRewards,
        claimRate:
          totalRewards > 0
            ? ((claimedRewards / totalRewards) * 100).toFixed(1)
            : 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

// GET /api/admin/dashboard/charts/users - User growth chart data
router.get("/dashboard/charts/users", async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = Number(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get user registrations per day
    const userGrowth = await prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM users
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    const formattedData = userGrowth.map((item) => ({
      date: item.date.toISOString().split("T")[0],
      count: Number(item.count),
    }));

    res.json({ data: formattedData });
  } catch (error) {
    console.error("Error fetching user growth chart:", error);
    res.status(500).json({ error: "Failed to fetch user growth data" });
  }
});

// GET /api/admin/dashboard/charts/transactions - Transaction volume chart
router.get(
  "/dashboard/charts/transactions",
  async (req: Request, res: Response) => {
    try {
      const { days = 30 } = req.query;
      const daysAgo = Number(days);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const transactionData = await prisma.$queryRaw<
        Array<{ date: Date; count: bigint; volume: any }>
      >`
      SELECT DATE("createdAt") as date, COUNT(*) as count, SUM(amount) as volume
      FROM transactions
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

      const formattedData = transactionData.map((item) => ({
        date: item.date.toISOString().split("T")[0],
        count: Number(item.count),
        volume: Number(item.volume || 0),
      }));

      res.json({ data: formattedData });
    } catch (error) {
      console.error("Error fetching transaction chart:", error);
      res.status(500).json({ error: "Failed to fetch transaction data" });
    }
  }
);

// GET /api/admin/dashboard/charts/revenue - Revenue chart
router.get("/dashboard/charts/revenue", async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = Number(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const revenueData = await prisma.$queryRaw<
      Array<{ date: Date; revenue: any }>
    >`
      SELECT DATE("paidDate") as date, SUM(amount) as revenue
      FROM invoices
      WHERE status = 'paid' AND "paidDate" >= ${startDate}
      GROUP BY DATE("paidDate")
      ORDER BY date ASC
    `;

    const formattedData = revenueData.map((item) => ({
      date: item.date.toISOString().split("T")[0],
      revenue: Number(item.revenue || 0),
    }));

    res.json({ data: formattedData });
  } catch (error) {
    console.error("Error fetching revenue chart:", error);
    res.status(500).json({ error: "Failed to fetch revenue data" });
  }
});

// GET /api/admin/users/search - Advanced user search
router.get("/users/search", async (req: Request, res: Response) => {
  try {
    const { q, role, active, limit = 50, offset = 0 } = req.query;

    const where: any = {};

    if (q) {
      where.OR = [
        { email: { contains: q as string, mode: "insensitive" } },
        { username: { contains: q as string, mode: "insensitive" } },
        { firstName: { contains: q as string, mode: "insensitive" } },
        { lastName: { contains: q as string, mode: "insensitive" } },
      ];
    }

    if (role) where.role = role;
    if (active !== undefined) where.active = active === "true";

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        usdBalance: true,
        active: true,
        createdAt: true,
        lastLogin: true,
      },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
});

// POST /api/admin/users/:userId/suspend - Suspend user
router.post("/users/:userId/suspend", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { active: false },
    });

    // TODO: Log admin action
    console.log(
      `User ${userId} suspended. Reason: ${reason || "No reason provided"}`
    );

    res.json({
      success: true,
      user,
      message: "User suspended successfully",
    });
  } catch (error) {
    console.error("Error suspending user:", error);
    res.status(500).json({ error: "Failed to suspend user" });
  }
});

// POST /api/admin/users/:userId/activate - Activate user
router.post("/users/:userId/activate", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { active: true },
    });

    res.json({
      success: true,
      user,
      message: "User activated successfully",
    });
  } catch (error) {
    console.error("Error activating user:", error);
    res.status(500).json({ error: "Failed to activate user" });
  }
});

// GET /api/admin/transactions/recent - Recent transactions feed
router.get("/transactions/recent", async (req: Request, res: Response) => {
  try {
    const { limit = 20 } = req.query;

    const transactions = await prisma.transaction.findMany({
      take: Number(limit),
      orderBy: { createdAt: "desc" },
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

    res.json({ transactions });
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    res.status(500).json({ error: "Failed to fetch recent transactions" });
  }
});

// GET /api/admin/system/health - System health metrics
router.get("/system/health", async (req: Request, res: Response) => {
  try {
    // Database health
    const dbHealthStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbHealthStart;

    // Check database connections
    const dbStatus =
      dbResponseTime < 100
        ? "healthy"
        : dbResponseTime < 500
          ? "degraded"
          : "critical";

    // Memory usage
    const memUsage = process.memoryUsage();

    // Uptime
    const uptime = process.uptime();

    res.json({
      status: "operational",
      database: {
        status: dbStatus,
        responseTime: `${dbResponseTime}ms`,
        connected: true,
      },
      server: {
        uptime: `${Math.floor(uptime / 60)} minutes`,
        memory: {
          used: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          percentage: `${Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)}%`,
        },
        nodeVersion: process.version,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error checking system health:", error);
    res.status(500).json({
      status: "error",
      error: "Failed to check system health",
    });
  }
});

// GET /api/admin/logs - Application logs (simple version)
router.get("/logs", async (req: Request, res: Response) => {
  try {
    const { limit = 100, level } = req.query;

    // In production, this would read from a logging service or file
    // For now, return recent audit logs as a proxy
    const auditLogs = await prisma.auditLog.findMany({
      take: Number(limit),
      orderBy: { timestamp: "desc" },
      select: {
        id: true,
        action: true,
        resourceType: true,
        resourceId: true,
        userId: true,
        timestamp: true,
        metadata: true,
      },
    });

    res.json({
      logs: auditLogs,
      total: auditLogs.length,
      message: "Showing audit logs as application logs proxy",
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

export default router;
