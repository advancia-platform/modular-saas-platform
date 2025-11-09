import { Router } from "express";
import prisma from "../prismaClient";
import {
  authenticateToken,
  requireAdmin,
  logAdminAction,
} from "../middleware/auth";
import type { Server as IOServer } from "socket.io";

const router = Router();

let ioRef: IOServer | null = null;
export function setAdminUsersSocketIO(io: IOServer) {
  ioRef = io;
}

// GET /api/admin/users
// Supports pagination and filtering: ?page=1&pageSize=20&role=ADMIN&search=foo
router.get(
  "/users",
  authenticateToken as any,
  requireAdmin as any,
  async (req, res) => {
    try {
      const page = Math.max(1, Number((req.query as any).page) || 1);
      const pageSize = Math.max(
        1,
        Math.min(100, Number((req.query as any).pageSize) || 20)
      );
      const skip = (page - 1) * pageSize;

      const { role, search } = req.query as { role?: string; search?: string };
      const where: any = {};
      if (role) where.role = String(role).toUpperCase();
      if (search) {
        const q = String(search);
        where.OR = [
          { email: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
        ];
      }

      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            active: true,
            role: true,
            usdBalance: true,
          },
        }),
      ]);

      const items = users.map((u) => ({
        id: u.id,
        name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username,
        email: u.email,
        role: u.role,
        status: u.active ? "ACTIVE" : "SUSPENDED",
        createdAt: u.createdAt,
        usdBalance: (u as any).usdBalance?.toString?.() ?? "0",
      }));

      return res.json({ items, total, page, pageSize });
    } catch (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);

// POST /api/admin/fund/:id
router.post(
  "/fund/:id",
  authenticateToken as any,
  requireAdmin as any,
  logAdminAction as any,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { amount } = req.body || {};
      if (typeof amount !== "number" || isNaN(amount)) {
        return res.status(400).json({ error: "Invalid amount provided" });
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, username: true, firstName: true, lastName: true },
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      const wallet = await prisma.tokenWallet.upsert({
        where: { userId: id },
        update: { balance: amount, lifetimeEarned: { increment: amount } },
        create: {
          userId: id,
          balance: amount,
          lifetimeEarned: amount,
          tokenType: "ADVANCIA",
        },
      });

      await prisma.tokenTransaction.create({
        data: {
          walletId: wallet.id,
          amount: amount,
          type: "bonus",
          status: "completed",
          description: "Admin balance adjustment",
        },
      });

      const userName =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.username;
      return res.json({
        message: `Updated balance for ${userName}`,
        user: { id: user.id, name: userName, balance: Number(amount), wallet },
      });
    } catch (err) {
      console.error("Error updating user balance:", err);
      return res.status(500).json({ error: "Failed to update balance" });
    }
  }
);

// POST /api/admin/fund-all
// Increment usdBalance for all users by amount; create transactions and admin accounting
router.post(
  "/fund-all",
  authenticateToken as any,
  requireAdmin as any,
  logAdminAction as any,
  async (req, res) => {
    try {
      const { amount, description, batchSize: bs } = req.body || {};
      const amt = Number(amount);
      const batchSize = Math.max(1, Math.min(10_000, Number(bs) || 1000));
      if (!amount || isNaN(amt) || amt <= 0) {
        return res
          .status(400)
          .json({ error: "A positive amount is required." });
      }

      // Fetch all user IDs (filtering can be applied if desired)
      const users = await prisma.user.findMany({ select: { id: true } });
      const userIds = users.map((u) => u.id);
      const totalUsers = userIds.length;
      if (totalUsers === 0)
        return res.json({
          creditedUsers: 0,
          amountPerUser: amt,
          totalAmount: 0,
          batchSize,
        });

      let processed = 0;
      let batchIndex = 0;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const chunk = userIds.slice(i, i + batchSize);
        const chunkTotal = amt * chunk.length;
        batchIndex += 1;

        await prisma.$transaction(async (tx) => {
          // Admin accounting for this batch
          await tx.adminPortfolio.upsert({
            where: { currency: "USD" },
            update: { balance: { decrement: chunkTotal } },
            create: { currency: "USD", balance: -chunkTotal },
          });
          await tx.adminTransfer.create({
            data: {
              currency: "USD",
              amount: chunkTotal,
              source: "admin:bulk-credit",
              note: `Bulk credit batch ${batchIndex} (+$${amt} x ${
                chunk.length
              })${description ? ` - ${description}` : ""}`,
            },
          });

          // Credit users in this batch
          await tx.user.updateMany({
            where: { id: { in: chunk } },
            data: { usdBalance: { increment: amt } },
          });
          await tx.transaction.createMany({
            data: chunk.map((id) => ({
              userId: id,
              amount: amt,
              type: "credit",
              description: description || "Admin bulk credit",
              status: "completed",
            })),
          });
        });

        processed += chunk.length;

        // Progress and user notifications (best-effort; may be heavy for very large batches)
        if (ioRef) {
          try {
            for (const id of chunk)
              ioRef
                .to(`user-${id}`)
                .emit("balance-updated", { userId: id, delta: amt });
            ioRef.emit("admin:bulk-credit:progress", {
              processed,
              totalUsers,
              batchSize,
              amountPerUser: amt,
              batchIndex,
            });
          } catch (e) {
            console.error("Socket emit failed (bulk credit progress)", e);
          }
        }
      }

      ioRef?.emit("admin:bulk-credit:done", {
        processed: totalUsers,
        totalUsers,
        amountPerUser: amt,
        totalAmount: amt * totalUsers,
      });

      return res.json({
        creditedUsers: totalUsers,
        amountPerUser: amt,
        totalAmount: amt * totalUsers,
        batchSize,
      });
    } catch (err) {
      console.error("Error in bulk credit (batched):", err);
      return res
        .status(500)
        .json({ error: "Failed to credit all users (batched)" });
    }
  }
);

// POST /api/admin/update-role/:id
router.post(
  "/update-role/:id",
  authenticateToken as any,
  requireAdmin as any,
  logAdminAction as any,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body || {};
      const validTiers = [
        "bronze",
        "silver",
        "gold",
        "platinum",
        "diamond",
        "admin",
      ];
      if (!role || !validTiers.includes(String(role).toLowerCase())) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const userTier = await prisma.userTier.upsert({
        where: { userId: id },
        update: { currentTier: String(role).toLowerCase() },
        create: {
          userId: id,
          currentTier: String(role).toLowerCase(),
          points: 0,
        },
      });

      return res.json({
        message: `User tier updated to ${role}`,
        role: userTier.currentTier,
      });
    } catch (err) {
      console.error("Error updating user role:", err);
      return res.status(500).json({ error: "Failed to update user role" });
    }
  }
);

// POST /api/admin/users/:id/add-balance
// Admin can add USD, BTC, ETH, or USDT to user's balance
router.post(
  "/users/:id/add-balance",
  authenticateToken as any,
  requireAdmin as any,
  logAdminAction as any,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { balanceType, amount, description } = req.body;

      // Validate inputs
      if (
        !balanceType ||
        !["USD", "BTC", "ETH", "USDT"].includes(balanceType.toUpperCase())
      ) {
        return res.status(400).json({
          error: "Invalid balanceType. Must be USD, BTC, ETH, or USDT",
        });
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({
          error: "Invalid amount. Must be a positive number",
        });
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          username: true,
          usdBalance: true,
          btcBalance: true,
          ethBalance: true,
          usdtBalance: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Determine which balance field to update
      const balanceField =
        balanceType.toUpperCase() === "USD"
          ? "usdBalance"
          : balanceType.toUpperCase() === "BTC"
          ? "btcBalance"
          : balanceType.toUpperCase() === "ETH"
          ? "ethBalance"
          : "usdtBalance";

      // Update user balance
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          [balanceField]: {
            increment: amountNum,
          },
        },
        select: {
          id: true,
          email: true,
          username: true,
          usdBalance: true,
          btcBalance: true,
          ethBalance: true,
          usdtBalance: true,
        },
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: id,
          amount: amountNum,
          type: "credit",
          category: "admin_adjustment",
          description:
            description ||
            `Admin added ${amountNum} ${balanceType.toUpperCase()} to balance`,
          status: "completed",
        },
      });

      // Log in audit trail
      await prisma.auditLog.create({
        data: {
          userId: (req as any).user.userId, // Admin who performed the action
          action: "add_balance",
          resourceType: "user",
          resourceId: id,
          metadata: JSON.stringify({
            balanceType,
            amount: amountNum,
            description,
            oldBalance: user[balanceField],
            newBalance: updatedUser[balanceField],
          }),
        },
      });

      // Emit socket event for real-time update
      if (ioRef) {
        ioRef.to(`user-${id}`).emit("balance-updated", {
          userId: id,
          balanceType: balanceType.toUpperCase(),
          newBalance: updatedUser[balanceField].toString(),
        });
      }

      return res.json({
        success: true,
        message: `Added ${amountNum} ${balanceType.toUpperCase()} to ${
          user.username || user.email
        }'s balance`,
        balances: {
          usd: updatedUser.usdBalance.toString(),
          btc: updatedUser.btcBalance.toString(),
          eth: updatedUser.ethBalance.toString(),
          usdt: updatedUser.usdtBalance.toString(),
        },
      });
    } catch (err) {
      console.error("Error adding balance:", err);
      return res.status(500).json({ error: "Failed to add balance" });
    }
  }
);

// PATCH /api/admin/users/:id/role - updates the Role enum on User
router.patch(
  "/users/:id/role",
  authenticateToken as any,
  requireAdmin as any,
  logAdminAction as any,
  async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      const { role } = (req.body || {}) as { role?: string };
      const allowed = ["USER", "STAFF", "ADMIN"] as const;
      const next = String(role || "").toUpperCase();
      if (!allowed.includes(next as any)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      const updated = await prisma.user.update({
        where: { id },
        data: { role: next as any },
      });
      return res.json({ id: updated.id, role: updated.role });
    } catch (err) {
      console.error("Error updating user role (PATCH):", err);
      return res.status(500).json({ error: "Failed to update user role" });
    }
  }
);

// GET /api/admin/users/:id - fetch full user detail: profile, balances, kyc, recent activity
router.get(
  "/users/:id",
  authenticateToken as any,
  requireAdmin as any,
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          active: true,
          usdBalance: true,
          btcBalance: true,
          ethBalance: true,
          usdtBalance: true,
          createdAt: true,
          lastLogin: true,
          totpEnabled: true,
          totpVerified: true,
        },
      });

      if (!user) return res.status(404).json({ error: "User not found" });

      // Fetch token wallet
      const wallet = await prisma.tokenWallet.findUnique({
        where: { userId: id },
        select: {
          balance: true,
          tokenType: true,
          lifetimeEarned: true,
          lockedBalance: true,
        },
      });

      // Fetch recent transactions (last 10)
      const transactions = await prisma.transaction.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          description: true,
          createdAt: true,
        },
      });

      // Fetch user tier
      const tier = await prisma.userTier.findUnique({
        where: { userId: id },
        select: { currentTier: true, points: true, lifetimePoints: true },
      });

      // Format response
      const profile = {
        id: user.id,
        email: user.email,
        username: user.username,
        name:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.username,
        role: user.role,
        status: user.active ? "ACTIVE" : "SUSPENDED",
        verified: user.totpVerified || false,
        usdBalance: user.usdBalance?.toString() ?? "0",
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      };

      const balances = {
        usd: user.usdBalance?.toString() ?? "0",
        btc: user.btcBalance?.toString() ?? "0",
        eth: user.ethBalance?.toString() ?? "0",
        usdt: user.usdtBalance?.toString() ?? "0",
        tokenBalance: wallet?.balance?.toString() ?? "0",
        tokenType: wallet?.tokenType ?? "ADVANCIA",
        lifetimeEarned: wallet?.lifetimeEarned?.toString() ?? "0",
        lockedBalance: wallet?.lockedBalance?.toString() ?? "0",
      };

      const tierInfo = {
        currentTier: tier?.currentTier ?? "bronze",
        points: tier?.points ?? 0,
        lifetimePoints: tier?.lifetimePoints ?? 0,
      };

      const recentActivity = transactions.map((t) => ({
        id: t.id,
        amount: t.amount?.toString() ?? "0",
        type: t.type,
        status: t.status,
        description: t.description,
        createdAt: t.createdAt,
      }));

      return res.json({
        profile,
        balances,
        tier: tierInfo,
        transactions: recentActivity,
        kyc: { status: "PENDING", documents: [] }, // Placeholder for future KYC integration
      });
    } catch (err) {
      console.error("Error fetching user detail:", err);
      return res.status(500).json({ error: "Failed to fetch user detail" });
    }
  }
);

// GET /api/admin/users/:id/activity - Get activity/audit logs for a user
router.get(
  "/users/:id/activity",
  authenticateToken as any,
  requireAdmin as any,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { page = "1", pageSize = "20" } = req.query;
      const pageNum = Math.max(1, Number(page));
      const pageSizeNum = Math.max(1, Math.min(100, Number(pageSize)));
      const skip = (pageNum - 1) * pageSizeNum;

      // Fetch audit logs for this user (either as the subject or as the actor)
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: {
            OR: [
              { userId: id }, // Actions performed on this user
              { resourceId: id }, // When this user is the resource
            ],
          },
          orderBy: { timestamp: "desc" },
          skip,
          take: pageSizeNum,
          select: {
            id: true,
            action: true,
            resourceType: true,
            resourceId: true,
            userId: true,
            timestamp: true,
            ipAddress: true,
            metadata: true,
          },
        }),
        prisma.auditLog.count({
          where: {
            OR: [{ userId: id }, { resourceId: id }],
          },
        }),
      ]);

      const items = logs.map((log) => ({
        id: log.id,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        performedBy: log.userId,
        timestamp: log.timestamp,
        ipAddress: log.ipAddress,
        metadata: log.metadata,
      }));

      return res.json({
        items,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum),
      });
    } catch (err) {
      console.error("Error fetching user activity:", err);
      return res.status(500).json({ error: "Failed to fetch user activity" });
    }
  }
);

// PATCH /api/admin/users/:id/status - toggle user active/suspended status
router.patch(
  "/users/:id/status",
  authenticateToken as any,
  requireAdmin as any,
  logAdminAction as any,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body as { status?: string };
      const validStatuses = ["ACTIVE", "SUSPENDED"];
      const next = String(status || "").toUpperCase();
      if (!validStatuses.includes(next)) {
        return res
          .status(400)
          .json({ error: "Invalid status. Use ACTIVE or SUSPENDED." });
      }
      const active = next === "ACTIVE";
      const updated = await prisma.user.update({
        where: { id },
        data: { active },
      });
      return res.json({
        id: updated.id,
        status: updated.active ? "ACTIVE" : "SUSPENDED",
      });
    } catch (err) {
      console.error("Error updating user status:", err);
      return res.status(500).json({ error: "Failed to update user status" });
    }
  }
);

// GET /api/admin/bulk-credits/recent?limit=5
// Returns most recent AdminTransfer entries with source = 'admin:bulk-credit'
router.get(
  "/bulk-credits/recent",
  authenticateToken as any,
  requireAdmin as any,
  async (req, res) => {
    try {
      const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 5));
      const rows = await prisma.adminTransfer.findMany({
        where: { source: "admin:bulk-credit" },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: { id: true, amount: true, note: true, createdAt: true },
      });
      const result = rows.map((r) => ({
        id: r.id,
        amount: Number(r.amount),
        note: r.note || null,
        createdAt: r.createdAt,
      }));
      return res.json({ items: result });
    } catch (err) {
      console.error("Error fetching recent bulk credits:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch recent bulk credits" });
    }
  }
);

// GET /api/admin/bulk-credits?page=1&pageSize=5
// Paginated list with running total and total count
router.get(
  "/bulk-credits",
  authenticateToken as any,
  requireAdmin as any,
  async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const pageSize = Math.max(
        1,
        Math.min(100, Number((req.query as any).pageSize) || 5)
      );
      const skip = (page - 1) * pageSize;
      const where = { source: "admin:bulk-credit" as const };

      const [rows, aggregates] = await prisma.$transaction([
        prisma.adminTransfer.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          select: { id: true, amount: true, note: true, createdAt: true },
        }),
        prisma.adminTransfer.aggregate({
          where,
          _sum: { amount: true },
          _count: true,
        }),
      ]);

      const totalItems = aggregates._count || 0;
      const totalAmount = Number(aggregates._sum?.amount || 0);
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

      const items = rows.map((r) => ({
        id: r.id,
        amount: Number(r.amount),
        note: r.note || null,
        createdAt: r.createdAt,
      }));
      return res.json({
        items,
        page,
        pageSize,
        totalItems,
        totalPages,
        totalAmount,
      });
    } catch (err) {
      console.error("Error fetching paginated bulk credits:", err);
      return res.status(500).json({ error: "Failed to fetch bulk credits" });
    }
  }
);

export default router;
