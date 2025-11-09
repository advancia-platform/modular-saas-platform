import { Router } from "express";
import prisma from "../prismaClient";
import { authenticateToken } from "../middleware/auth";
import { Decimal } from "@prisma/client/runtime/library";
import { serializeDecimalFields } from "../utils/decimal";
import { Server as SocketServer } from "socket.io";

const router = Router();

// Socket.IO instance (injected from index.ts)
let io: SocketServer | null = null;

export function setTokenSocketIO(socketServer: SocketServer) {
  io = socketServer;
  console.log("✅ Socket.IO injected into token service");
}

router.get("/balance/:userId", authenticateToken as any, async (req, res) => {
  try {
    const { userId } = req.params;
    
    let wallet = await prisma.tokenWallet.findUnique({
      where: { userId },
    });
    
    if (!wallet) {
      wallet = await prisma.tokenWallet.create({
        data: { userId },
      });
    }
    
    res.json(serializeDecimalFields(wallet));
  } catch (error: any) {
    console.error("[TOKENS] Error fetching balance:", error);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

router.get("/history/:userId", authenticateToken as any, async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const offset = Math.max(0, Number(req.query.offset) || 0);
    
    const wallet = await prisma.tokenWallet.findUnique({
      where: { userId },
    });
    
    if (!wallet) {
      return res.json({ transactions: [], total: 0 });
    }
    
    const [transactions, total] = await Promise.all([
      prisma.tokenTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.tokenTransaction.count({
        where: { walletId: wallet.id },
      }),
    ]);
    
    res.json({
      transactions: transactions.map(t => serializeDecimalFields(t)),
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("[TOKENS] Error fetching history:", error);
    res.status(500).json({ error: "Failed to fetch transaction history" });
  }
});

router.post("/transfer", authenticateToken as any, async (req, res) => {
  try {
    const { fromUserId, toUserId, amount, description } = req.body;
    
    if (!fromUserId || !toUserId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const transferAmount = new Decimal(amount);
    
    if (transferAmount.lte(0)) {
      return res.status(400).json({ error: "Amount must be positive" });
    }
    
    const result = await prisma.$transaction(async (tx) => {
      let fromWallet = await tx.tokenWallet.findUnique({
        where: { userId: fromUserId },
      });
      
      if (!fromWallet) {
        fromWallet = await tx.tokenWallet.create({
          data: { userId: fromUserId },
        });
      }
      
      if (fromWallet.balance.lt(transferAmount)) {
        throw new Error("Insufficient balance");
      }
      
      let toWallet = await tx.tokenWallet.findUnique({
        where: { userId: toUserId },
      });
      
      if (!toWallet) {
        toWallet = await tx.tokenWallet.create({
          data: { userId: toUserId },
        });
      }
      
      await tx.tokenWallet.update({
        where: { id: fromWallet.id },
        data: { balance: { decrement: transferAmount } },
      });
      
      await tx.tokenWallet.update({
        where: { id: toWallet.id },
        data: {
          balance: { increment: transferAmount },
          lifetimeEarned: { increment: transferAmount },
        },
      });
      
      const fromTx = await tx.tokenTransaction.create({
        data: {
          walletId: fromWallet.id,
          amount: transferAmount.neg(),
          type: "transfer",
          status: "completed",
          description: description || `Transfer to ${toUserId}`,
          toAddress: toUserId,
          metadata: JSON.stringify({ toUserId, timestamp: new Date().toISOString() }),
        },
      });
      
      const toTx = await tx.tokenTransaction.create({
        data: {
          walletId: toWallet.id,
          amount: transferAmount,
          type: "transfer",
          status: "completed",
          description: description || `Transfer from ${fromUserId}`,
          fromAddress: fromUserId,
          metadata: JSON.stringify({ fromUserId, timestamp: new Date().toISOString() }),
        },
      });
      
      return { fromTx, toTx, fromWallet, toWallet };
    });
    
    // Emit Socket.IO events to notify users
    if (io) {
      io.to(`user-${fromUserId}`).emit("token:transfer", {
        type: "sent",
        amount: transferAmount.toString(),
        to: toUserId,
        transactionId: result.fromTx.id,
      });
      
      io.to(`user-${toUserId}`).emit("token:transfer", {
        type: "received",
        amount: transferAmount.toString(),
        from: fromUserId,
        transactionId: result.toTx.id,
      });
    }
    
    res.json({
      success: true,
      transactionId: result.fromTx.id,
      message: "Transfer completed successfully",
    });
  } catch (error: any) {
    console.error("[TOKENS] Error processing transfer:", error);
    res.status(500).json({ error: error.message || "Failed to process transfer" });
  }
});


// Withdraw tokens to a blockchain address
router.post("/withdraw", authenticateToken as any, async (req, res) => {
  try {
    const { userId, amount, toAddress } = req.body;
    
    if (!userId || !amount || !toAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const withdrawAmount = new Decimal(amount);
    
    if (withdrawAmount.lte(0)) {
      return res.status(400).json({ error: "Amount must be positive" });
    }
    
    // Validate address format (basic check)
    if (!toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: "Invalid blockchain address" });
    }
    
    const result = await prisma.$transaction(async (tx) => {
      let wallet = await tx.tokenWallet.findUnique({
        where: { userId },
      });
      
      if (!wallet) {
        throw new Error("Wallet not found");
      }
      
      if (wallet.balance.lt(withdrawAmount)) {
        throw new Error("Insufficient balance for withdrawal");
      }
      
      // Deduct from wallet
      await tx.tokenWallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: withdrawAmount } },
      });
      
      // Record transaction
      const transaction = await tx.tokenTransaction.create({
        data: {
          walletId: wallet.id,
          amount: withdrawAmount.neg(),
          type: "withdraw",
          status: "pending",
          description: `Withdrawal to ${toAddress.substring(0, 10)}...`,
          toAddress: toAddress,
          metadata: JSON.stringify({
            toAddress,
            withdrawnAt: new Date().toISOString(),
          }),
        },
      });
      
      return transaction;
    });
    
    // Emit Socket.IO event
    if (io) {
      io.to(`user-${userId}`).emit("token:withdrawn", {
        amount: withdrawAmount.toString(),
        toAddress,
        transactionId: result.id,
        status: "pending",
      });
    }
    
    res.json({
      success: true,
      transactionId: result.id,
      amount: withdrawAmount.toString(),
      toAddress,
      status: "pending",
      message: "Withdrawal initiated. Processing...",
    });
  } catch (error: any) {
    console.error("[TOKENS] Error processing withdrawal:", error);
    res.status(500).json({ error: error.message || "Failed to process withdrawal" });
  }
});

// Cashout tokens to USD (convert to fiat)
router.post("/cashout", authenticateToken as any, async (req, res) => {
  try {
    const { userId, amount } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const cashoutAmount = new Decimal(amount);
    const conversionRate = new Decimal("0.10"); // 1 token = $0.10 USD
    
    if (cashoutAmount.lte(0)) {
      return res.status(400).json({ error: "Amount must be positive" });
    }
    
    const result = await prisma.$transaction(async (tx) => {
      let wallet = await tx.tokenWallet.findUnique({
        where: { userId },
      });
      
      if (!wallet) {
        throw new Error("Wallet not found");
      }
      
      if (wallet.balance.lt(cashoutAmount)) {
        throw new Error("Insufficient balance for cashout");
      }
      
      const usdValue = cashoutAmount.mul(conversionRate);
      
      // Deduct tokens
      await tx.tokenWallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: cashoutAmount } },
      });
      
      // Record cashout transaction
      const transaction = await tx.tokenTransaction.create({
        data: {
          walletId: wallet.id,
          amount: cashoutAmount.neg(),
          type: "cashout",
          status: "completed",
          description: `Cashed out ${cashoutAmount.toString()} tokens for $${usdValue.toString()}`,
          metadata: JSON.stringify({
            usdValue: usdValue.toString(),
            conversionRate: conversionRate.toString(),
            cashedOutAt: new Date().toISOString(),
          }),
        },
      });
      
      return { transaction, usdValue };
    });
    
    // Emit Socket.IO event
    if (io) {
      io.to(`user-${userId}`).emit("token:cashout", {
        tokensSpent: cashoutAmount.toString(),
        usdReceived: result.usdValue.toString(),
        transactionId: result.transaction.id,
      });
    }
    
    res.json({
      success: true,
      transactionId: result.transaction.id,
      tokensSpent: cashoutAmount.toString(),
      usdReceived: result.usdValue.toString(),
      message: `Successfully cashed out $${result.usdValue.toString()}!`,
    });
  } catch (error: any) {
    console.error("[TOKENS] Error processing cashout:", error);
    res.status(500).json({ error: error.message || "Failed to process cashout" });
  }
});


export default router;
