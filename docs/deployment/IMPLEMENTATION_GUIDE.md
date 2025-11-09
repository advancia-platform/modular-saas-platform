# 🚀 COMPLETE FRONTEND FEATURES - STEP BY STEP GUIDE

## 🎯 Overview
This guide will help you complete the **Token/Coin System**, **Rewards System**, and **MedBed Health Integration** for your Advancia Pay Ledger platform.

---

## 📋 **PHASE 1: TOKEN/COIN SYSTEM** (Priority #1)

### Step 1: Update Prisma Schema

Add these models to `backend/prisma/schema.prisma`:

```prisma
// Add to User model:
model User {
  // ... existing fields ...
  tokenWallet   TokenWallet?
  userTier      UserTier?
  healthReadings HealthReading[]
}

// Token Wallet Model
model TokenWallet {
  id              String            @id @default(uuid())
  userId          String            @unique
  balance         Decimal           @db.Decimal(18, 8) @default(0)
  tokenType       String            @default("ADVANCIA")
  lockedBalance   Decimal           @db.Decimal(18, 8) @default(0)
  lifetimeEarned  Decimal           @db.Decimal(18, 8) @default(0)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions    TokenTransaction[]
  
  @@index([userId])
  @@map("token_wallets")
}

// Token Transaction Model
model TokenTransaction {
  id          String      @id @default(uuid())
  walletId    String
  amount      Decimal     @db.Decimal(18, 8)
  type        String      // "earn", "withdraw", "cashout", "transfer", "bonus"
  status      String      @default("completed") // "pending", "completed", "failed"
  description String?
  toAddress   String?     // For transfers
  metadata    Json?
  createdAt   DateTime    @default(now())
  
  wallet      TokenWallet @relation(fields: [walletId], references: [id], onDelete: Cascade)
  
  @@index([walletId])
  @@index([createdAt])
  @@index([type])
  @@map("token_transactions")
}

// Rewards Model
model Reward {
  id          String   @id @default(uuid())
  userId      String
  type        String   // "bonus", "referral", "milestone", "achievement", "daily"
  amount      Decimal  @db.Decimal(10, 2)
  status      String   @default("pending") // "pending", "claimed", "expired"
  description String
  metadata    Json?
  expiresAt   DateTime?
  claimedAt   DateTime?
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([status])
  @@index([type])
  @@map("rewards")
}

// User Tier/Level Model
model UserTier {
  id              String   @id @default(uuid())
  userId          String   @unique
  currentTier     String   @default("bronze") // bronze, silver, gold, platinum, diamond
  points          Int      @default(0)
  lifetimeRewards Decimal  @db.Decimal(10, 2) @default(0)
  streak          Int      @default(0) // Daily login streak
  lastActiveDate  DateTime @default(now())
  achievements    Json?    // Array of achievement IDs
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([currentTier])
  @@map("user_tiers")
}

// Health Reading Model
model HealthReading {
  id              String   @id @default(uuid())
  userId          String
  heartRate       Int?
  bloodPressureSys Int?
  bloodPressureDia Int?
  steps           Int?
  sleepHours      Decimal? @db.Decimal(4, 2)
  weight          Decimal? @db.Decimal(5, 2)
  temperature     Decimal? @db.Decimal(4, 2)
  oxygenLevel     Int?     // SpO2 percentage
  metadata        Json?
  recordedAt      DateTime @default(now())
  createdAt       DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([recordedAt])
  @@map("health_readings")
}
```

### Step 2: Run Database Migration

```powershell
cd backend
npx prisma migrate dev --name add_tokens_rewards_health
npx prisma generate
```

### Step 3: Create Token Routes (`backend/src/routes/tokens.ts`)

```typescript
import express from "express";
import prisma from "../prismaClient";
import { Decimal } from "@prisma/client/runtime/library";

const router = express.Router();

// Get token wallet balance
router.get("/balance/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    let wallet = await prisma.tokenWallet.findUnique({
      where: { userId },
    });
    
    // Create wallet if doesn't exist
    if (!wallet) {
      wallet = await prisma.tokenWallet.create({
        data: { userId },
      });
    }
    
    res.json({
      balance: wallet.balance,
      lockedBalance: wallet.lockedBalance,
      lifetimeEarned: wallet.lifetimeEarned,
      tokenType: wallet.tokenType,
    });
  } catch (error) {
    console.error("Error fetching token balance:", error);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

// Get token transaction history
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const wallet = await prisma.tokenWallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: limit,
        },
      },
    });
    
    if (!wallet) {
      return res.json({ transactions: [] });
    }
    
    res.json({ transactions: wallet.transactions });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// Withdraw tokens
router.post("/withdraw", async (req, res) => {
  try {
    const { userId, amount, toAddress } = req.body;
    
    if (!userId || !amount || !toAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const wallet = await prisma.tokenWallet.findUnique({
      where: { userId },
    });
    
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }
    
    const withdrawAmount = new Decimal(amount);
    
    if (wallet.balance.lt(withdrawAmount)) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    
    // Update wallet and create transaction in a transaction
    const result = await prisma.$transaction([
      prisma.tokenWallet.update({
        where: { userId },
        data: {
          balance: { decrement: withdrawAmount },
        },
      }),
      prisma.tokenTransaction.create({
        data: {
          walletId: wallet.id,
          amount: withdrawAmount,
          type: "withdraw",
          description: `Withdrawal to ${toAddress}`,
          toAddress,
          status: "completed",
        },
      }),
    ]);
    
    res.json({
      success: true,
      newBalance: result[0].balance,
      transaction: result[1],
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    res.status(500).json({ error: "Failed to process withdrawal" });
  }
});

// Cash out tokens (convert to fiat)
router.post("/cashout", async (req, res) => {
  try {
    const { userId, amount } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const wallet = await prisma.tokenWallet.findUnique({
      where: { userId },
    });
    
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }
    
    const cashoutAmount = new Decimal(amount);
    
    if (wallet.balance.lt(cashoutAmount)) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    
    // Simulate exchange rate (1 ADVANCIA = $0.10)
    const fiatAmount = cashoutAmount.mul(0.1);
    
    const result = await prisma.$transaction([
      prisma.tokenWallet.update({
        where: { userId },
        data: {
          balance: { decrement: cashoutAmount },
        },
      }),
      prisma.tokenTransaction.create({
        data: {
          walletId: wallet.id,
          amount: cashoutAmount,
          type: "cashout",
          description: `Cash out: ${fiatAmount} USD`,
          metadata: { fiatAmount: fiatAmount.toString(), rate: 0.1 },
          status: "completed",
        },
      }),
    ]);
    
    res.json({
      success: true,
      tokenAmount: cashoutAmount.toString(),
      fiatAmount: fiatAmount.toString(),
      newBalance: result[0].balance,
    });
  } catch (error) {
    console.error("Error processing cashout:", error);
    res.status(500).json({ error: "Failed to process cashout" });
  }
});

// Award bonus tokens (called after credit transactions)
router.post("/award-bonus", async (req, res) => {
  try {
    const { userId, transactionAmount, percentage = 15 } = req.body;
    
    const bonusAmount = new Decimal(transactionAmount).mul(percentage / 100);
    
    let wallet = await prisma.tokenWallet.findUnique({
      where: { userId },
    });
    
    if (!wallet) {
      wallet = await prisma.tokenWallet.create({
        data: { userId },
      });
    }
    
    const result = await prisma.$transaction([
      prisma.tokenWallet.update({
        where: { userId },
        data: {
          balance: { increment: bonusAmount },
          lifetimeEarned: { increment: bonusAmount },
        },
      }),
      prisma.tokenTransaction.create({
        data: {
          walletId: wallet.id,
          amount: bonusAmount,
          type: "bonus",
          description: `${percentage}% bonus on transaction`,
          metadata: { baseAmount: transactionAmount, percentage },
          status: "completed",
        },
      }),
    ]);
    
    res.json({
      success: true,
      bonusAmount: bonusAmount.toString(),
      newBalance: result[0].balance,
    });
  } catch (error) {
    console.error("Error awarding bonus:", error);
    res.status(500).json({ error: "Failed to award bonus" });
  }
});

// Get exchange rate
router.get("/exchange-rate", (req, res) => {
  res.json({
    tokenSymbol: "ADVANCIA",
    rate: 0.10, // 1 ADVANCIA = $0.10 USD
    lastUpdated: new Date().toISOString(),
  });
});

export default router;
```

### Step 4: Add Token Routes to Backend (`backend/src/index.ts`)

```typescript
import tokenRouter from "./routes/tokens";

// Add after other routes:
app.use("/api/tokens", tokenRouter);
```

### Step 5: Create Frontend Token Wallet Component

Create `frontend/src/components/TokenWallet.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, TrendingUp, Download, DollarSign, ArrowUpRight } from "lucide-react";

interface TokenBalance {
  balance: string;
  lockedBalance: string;
  lifetimeEarned: string;
  tokenType: string;
}

interface TokenTransaction {
  id: string;
  amount: string;
  type: string;
  description: string | null;
  createdAt: string;
  status: string;
}

export default function TokenWallet({ userId }: { userId: string }) {
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showCashout, setShowCashout] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, [userId]);

  const fetchBalance = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tokens/balance/${userId}`);
      const data = await res.json();
      setBalance(data);
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tokens/history/${userId}?limit=10`);
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleWithdraw = async (amount: string, address: string) => {
    try {
      const res = await fetch(`${API_URL}/api/tokens/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount, toAddress: address }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        await fetchBalance();
        await fetchTransactions();
        setShowWithdraw(false);
        alert("Withdrawal successful!");
      } else {
        alert(data.error || "Withdrawal failed");
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      alert("Withdrawal failed");
    }
  };

  const handleCashout = async (amount: string) => {
    try {
      const res = await fetch(`${API_URL}/api/tokens/cashout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        await fetchBalance();
        await fetchTransactions();
        setShowCashout(false);
        alert(`Cashed out ${data.tokenAmount} tokens for $${data.fiatAmount} USD`);
      } else {
        alert(data.error || "Cashout failed");
      }
    } catch (error) {
      console.error("Cashout error:", error);
      alert("Cashout failed");
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 rounded-xl h-64"></div>;
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl shadow-xl p-8 text-white"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8" />
            <div>
              <p className="text-sm opacity-90">Token Balance</p>
              <p className="text-xs opacity-75">{balance?.tokenType || "ADVANCIA"}</p>
            </div>
          </div>
          <TrendingUp className="w-6 h-6 opacity-80" />
        </div>

        <div className="space-y-2">
          <h2 className="text-5xl font-bold">
            {parseFloat(balance?.balance || "0").toFixed(2)}
          </h2>
          <p className="text-sm opacity-90">
            Lifetime Earned: {parseFloat(balance?.lifetimeEarned || "0").toFixed(2)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <button
            onClick={() => setShowWithdraw(true)}
            className="bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg px-4 py-3 flex flex-col items-center gap-1 transition"
          >
            <ArrowUpRight className="w-5 h-5" />
            <span className="text-xs font-medium">Withdraw</span>
          </button>

          <button
            onClick={() => setShowCashout(true)}
            className="bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg px-4 py-3 flex flex-col items-center gap-1 transition"
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-xs font-medium">Cash Out</span>
          </button>

          <button className="bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg px-4 py-3 flex flex-col items-center gap-1 transition">
            <Download className="w-5 h-5" />
            <span className="text-xs font-medium">Report</span>
          </button>
        </div>
      </motion.div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Transactions</h3>
        
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div>
                  <p className="font-semibold text-gray-800 capitalize">{tx.type}</p>
                  <p className="text-sm text-gray-600">{tx.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.type === 'earn' || tx.type === 'bonus' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'earn' || tx.type === 'bonus' ? '+' : '-'}
                    {parseFloat(tx.amount).toFixed(2)}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdraw && (
          <WithdrawModal
            onClose={() => setShowWithdraw(false)}
            onSubmit={handleWithdraw}
            maxAmount={balance?.balance || "0"}
          />
        )}
      </AnimatePresence>

      {/* Cashout Modal */}
      <AnimatePresence>
        {showCashout && (
          <CashoutModal
            onClose={() => setShowCashout(false)}
            onSubmit={handleCashout}
            maxAmount={balance?.balance || "0"}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Withdraw Modal Component
function WithdrawModal({ onClose, onSubmit, maxAmount }: any) {
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold mb-4">Withdraw Tokens</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={maxAmount}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
            />
            <p className="text-xs text-gray-500 mt-1">Max: {maxAmount}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Recipient Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0x..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onSubmit(amount, address)}
              disabled={!amount || !address}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Withdraw
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Cashout Modal Component
function CashoutModal({ onClose, onSubmit, maxAmount }: any) {
  const [amount, setAmount] = useState("");
  const rate = 0.10; // 1 token = $0.10
  const fiatAmount = (parseFloat(amount) || 0) * rate;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold mb-4">Cash Out Tokens</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Token Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={maxAmount}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Enter amount"
            />
            <p className="text-xs text-gray-500 mt-1">Max: {maxAmount}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-1">You will receive:</p>
            <p className="text-3xl font-bold text-green-600">${fiatAmount.toFixed(2)} USD</p>
            <p className="text-xs text-gray-500 mt-1">Rate: 1 ADVANCIA = ${rate} USD</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onSubmit(amount)}
              disabled={!amount || parseFloat(amount) <= 0}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cash Out
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
```

### Step 6: Update Token Section

Replace `frontend/src/components/TokenSection.tsx` with the enhanced version:

```typescript
"use client";
import TokenWallet from "./TokenWallet";

export default function TokenSection() {
  // Get userId from your auth context or session
  const userId = "user-123"; // Replace with actual user ID

  return (
    <section id="token" className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-blue-700">Digital Token Wallet</h2>
          <p className="text-gray-600 mt-2">
            Earn, manage, and cash out your Advancia tokens
          </p>
        </div>

        <TokenWallet userId={userId} />
      </div>
    </section>
  );
}
```

### Step 7: Integrate Token Earning with Transactions

Update the transaction creation to award bonus tokens. In `backend/src/routes/transaction.ts`, after creating a credit transaction:

```typescript
// After successful credit transaction:
if (type === 'credit') {
  // Award 15% bonus tokens
  await fetch('http://localhost:4000/api/tokens/award-bonus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      transactionAmount: amount,
      percentage: 15
    })
  });
}
```

### Step 8: Test Token System

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to Token section
4. Verify balance loads
5. Try withdrawing tokens
6. Try cashing out tokens
7. Check transaction history

---

## ✅ TOKEN SYSTEM CHECKLIST

- [ ] Prisma schema updated with token models
- [ ] Database migration completed
- [ ] Token routes created and tested
- [ ] Token routes added to backend
- [ ] TokenWallet component created
- [ ] TokenSection updated with real component
- [ ] Bonus tokens awarded on transactions
- [ ] Withdraw functionality working
- [ ] Cashout functionality working
- [ ] Transaction history displaying

---

## 📚 NEXT STEPS

After completing the Token System:
1. Proceed to **Phase 2: Rewards System** (similar process)
2. Then **Phase 3: MedBed/Health Integration**
3. Update README with new features
4. Add API documentation
5. Create user guides

---

**Estimated Time for Token System:** 4-6 hours
**Current Progress:** Ready to implement!

Let me know when you complete this phase, and I'll provide the next implementation guide for the Rewards System!
