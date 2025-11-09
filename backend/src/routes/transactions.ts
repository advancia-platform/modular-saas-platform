import express from "express";
import { Server } from "socket.io";
import { z } from "zod";
import { createNotification } from "../services/notificationService";
import prisma from "../prismaClient";
import { authenticateToken, requireAdmin } from "../middleware/auth";

export interface TransactionItem {
  id: string;
  userId: string;
  amount: number;
  type: "credit" | "debit";
  createdAt: Date;
  currency?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

let ioRef: Server | null = null;

export const setTransactionSocketIO = (io: Server) => {
  ioRef = io;
};

interface RecordTransactionOptions {
  userId: string;
  amount: number | string;
  type: "credit" | "debit";
  currency?: string;
  source?: string;
  metadata?: Record<string, unknown>;
  notificationTitle?: string;
  notificationMessage?: string;
}

const createTransactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["credit", "debit"]),
  currency: z.string().optional(),
  source: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  description: z.string().max(255).optional(),
  category: z.string().max(64).optional(),
});

export const recordTransaction = async ({
  userId,
  amount,
  type,
  currency,
  source,
  metadata,
  notificationTitle,
  notificationMessage,
}: RecordTransactionOptions): Promise<TransactionItem> => {
  const parsed = createTransactionSchema.parse({ amount: typeof amount === 'string' ? Number(amount) : amount, type, currency, source, metadata });

  const trx = await prisma.transaction.create({
    data: {
      userId,
      amount: parsed.amount,
      type: parsed.type,
      description: undefined,
      category: undefined,
      status: "completed",
    },
  });

  const transaction: TransactionItem = {
    id: trx.id,
    userId,
    amount: Number(trx.amount),
    type: parsed.type,
    createdAt: trx.createdAt,
    currency: parsed.currency,
    source: parsed.source,
    metadata,
  };

  if (ioRef) {
    try {
      ioRef.to(`user-${userId}`).emit("transaction-created", transaction);
      ioRef.emit("global-transaction", transaction);
      ioRef.to('admins').emit('admin:transaction', transaction);
    } catch (emitErr) {
      console.warn("Socket emit failed (non-fatal):", emitErr);
    }
  }

  try {
    await createNotification({
      userId,
      type: "all",
      priority: transaction.amount > 1000 ? "high" : "normal",
      category: "transaction",
      title: notificationTitle || (type === "credit" ? "Funds Received" : "Funds Sent"),
      message: notificationMessage || `${type === "credit" ? "Received" : "Sent"} $${transaction.amount.toFixed(2)}`,
      data: {
        transactionId: transaction.id,
        amount: transaction.amount,
        type,
        currency,
        source,
        ...(metadata || {}),
      },
    });
  } catch (notifyErr) {
    console.warn("Notification creation failed (non-fatal):", notifyErr);
  }

  return transaction;
};

const router = express.Router();

// Create new transaction (authenticated)
router.post("/", authenticateToken as any, async (req: any, res) => {
  const { amount, type, currency, source, metadata } = req.body || {};
  const userId = req.user?.userId;

  try {
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const transaction = await recordTransaction({ userId, amount, type, currency, source, metadata });

    res.status(201).json({ success: true, transaction });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.issues });
    }
    console.error("Error creating transaction:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get transactions for a user (self or admin)
router.get("/user/:userId", authenticateToken as any, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const isAdmin = req.user?.role === "ADMIN";
    if (!isAdmin && req.user?.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    const userTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, transactions: userTransactions.map(t => ({
      id: t.id,
      userId: t.userId,
      amount: t.amount.toString(),
      type: t.type as 'credit'|'debit',
      createdAt: t.createdAt,
    })) });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Recent transactions for a user
router.get("/recent/:userId", authenticateToken as any, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const isAdmin = req.user?.role === "ADMIN";
    if (!isAdmin && req.user?.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    const userTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json({ success: true, transactions: userTransactions.map(t => ({
      id: t.id,
      userId: t.userId,
      amount: t.amount.toString(),
      type: t.type as 'credit'|'debit',
      createdAt: t.createdAt,
    })) });
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get all transactions (admin only)
router.get("/", authenticateToken as any, requireAdmin as any, async (_req, res) => {
  try {
    const all = await prisma.transaction.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ success: true, transactions: all.map(t => ({
      id: t.id,
      userId: t.userId,
      amount: t.amount.toString(),
      type: t.type as 'credit'|'debit',
      createdAt: t.createdAt,
    })) });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Calculate balance for a user with breakdown
router.get("/balance/:userId", authenticateToken as any, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const isAdmin = req.user?.role === "ADMIN";
    if (!isAdmin && req.user?.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const userTransactions = await prisma.transaction.findMany({ where: { userId } });

    const balance_main = userTransactions.reduce((acc, t) => (t.type === 'credit' ? acc + Number(t.amount) : acc - Number(t.amount)), 0);
    const totalCredits = userTransactions.filter((t) => t.type === 'credit').reduce((sum, t) => sum + Number(t.amount), 0);
    const bonus_amount = totalCredits * 0.15;
    const referral_amount = 0;
    const total = balance_main + bonus_amount + referral_amount;

    res.json({
      success: true,
      userId,
      balance_main: parseFloat(balance_main.toFixed(2)),
      earnings: parseFloat(bonus_amount.toFixed(2)),
      referral: parseFloat(referral_amount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      balance: parseFloat(total.toFixed(2)),
    });
  } catch (error) {
    console.error("Error calculating balance:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
