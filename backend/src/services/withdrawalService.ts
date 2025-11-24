/**
 * Enhanced Crypto Withdrawal Service
 *
 * Handles the complete withdrawal flow:
 * 1. User requests withdrawal
 * 2. Admin reviews and gets destination address
 * 3. Admin sends from their external wallet (Coinbase, Binance, etc.)
 * 4. Admin confirms transaction hash
 * 5. System updates withdrawal status
 */

import crypto from "crypto";
import prisma from "../prismaClient";
import { withDefaults } from "../utils/prismaHelpers";

export interface WithdrawalRequest {
  userId: string;
  currency: "BTC" | "ETH" | "USDT";
  amount: number;
  destinationAddress: string;
  network?: string; // e.g., "ERC20" for USDT, "TRC20", etc.
}

export interface WithdrawalApproval {
  withdrawalId: string;
  adminId: string;
  txHash: string; // Transaction hash from external wallet (Coinbase, Binance, etc.)
  adminNotes?: string;
}

/**
 * Step 1: User creates withdrawal request
 */
export async function createWithdrawalRequest(request: WithdrawalRequest) {
  const { userId, currency, amount, destinationAddress, network } = request;

  // Validate user has sufficient balance
  const userWallet = await prisma.crypto_wallets.findFirst({
    where: { userId, currency },
  });

  if (!userWallet || Number(userWallet.balance) < amount) {
    throw new Error("Insufficient balance");
  }

  // Get admin wallet info to show in approval UI
  const adminWallet = await prisma.admin_wallets.findUnique({
    where: { currency },
    select: {
      walletAddress: true,
      walletProvider: true,
      balance: true,
    },
  });

  if (!adminWallet?.walletAddress) {
    throw new Error(`Admin wallet address not configured for ${currency}`);
  }

  // Create withdrawal record
  const withdrawal = await prisma.crypto_withdrawals.create({
    data: withDefaults({
      userId,
      currency,
      amount,
      destinationAddress,
      cryptoType: currency, // Legacy field for backward compatibility
      cryptoAmount: amount,
      usdEquivalent: 0, // Can be calculated if needed
      withdrawalAddress: destinationAddress, // Legacy field
      status: "pending", // pending → approved → completed
      requestedAt: new Date(),
    }),
  });

  // Deduct from user's balance (hold until confirmed)
  await prisma.crypto_wallets.update({
    where: { id: userWallet.id },
    data: {
      balance: { decrement: amount },
      lockedBalance: { increment: amount }, // Lock funds until withdrawal confirmed
    },
  });

  // Create audit log
  await prisma.audit_logs.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      action: "WITHDRAWAL_REQUEST",
      resourceType: "CRYPTO_WITHDRAWAL",
      resourceId: withdrawal.id,
      details: JSON.stringify({
        withdrawalId: withdrawal.id,
        currency,
        amount,
        destinationAddress,
        adminWallet: adminWallet.walletAddress,
      }),
      ipAddress: "system",
    },
  });

  return {
    withdrawal,
    adminWallet: {
      address: adminWallet.walletAddress,
      provider: adminWallet.walletProvider,
      instructions: `Send ${amount} ${currency} from your ${
        adminWallet.walletProvider || "crypto wallet"
      } (${
        adminWallet.walletAddress
      }) to user's address: ${destinationAddress}`,
    },
  };
}

/**
 * Step 2: Admin approves withdrawal and sends crypto from external wallet
 *
 * Admin process:
 * 1. Opens their crypto wallet (Coinbase, Binance, Hardware wallet, etc.)
 * 2. Sends crypto to user's destinationAddress
 * 3. Gets transaction hash from their wallet
 * 4. Submits approval with txHash
 */
export async function approveWithdrawal(approval: WithdrawalApproval) {
  const { withdrawalId, adminId, txHash, adminNotes } = approval;

  // Get withdrawal details
  const withdrawal = await prisma.crypto_withdrawals.findUnique({
    where: { id: withdrawalId },
    include: { user: true },
  });

  if (!withdrawal) {
    throw new Error("Withdrawal not found");
  }

  if (withdrawal.status !== "pending") {
    throw new Error(`Withdrawal already ${withdrawal.status}`);
  }

  // Update withdrawal status
  const updated = await prisma.crypto_withdrawals.update({
    where: { id: withdrawalId },
    data: {
      status: "completed",
      txHash, // External transaction hash from admin's wallet
      approvedBy: adminId,
      approvedAt: new Date(),
      completedAt: new Date(),
      adminNotes: adminNotes || "Sent from admin wallet",
    },
  });

  // Release locked balance (already deducted)
  await prisma.crypto_wallets.updateMany({
    where: {
      userId: withdrawal.userId,
      currency: withdrawal.currency,
    },
    data: {
      lockedBalance: { decrement: Number(withdrawal.amount) },
    },
  });

  // Update admin wallet totalOut
  await prisma.admin_wallets.update({
    where: { currency: withdrawal.currency },
    data: {
      totalOut: { increment: Number(withdrawal.amount) },
    },
  });

  // Create admin wallet transaction record
  const adminWallet = await prisma.admin_wallets.findUnique({
    where: { currency: withdrawal.currency },
  });

  if (adminWallet) {
    await prisma.admin_wallet_transactions.create({
      data: withDefaults({
        adminWalletId: adminWallet.id,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        type: "credit", // Credit given to user (sent from admin wallet)
        description: `Withdrawal to ${withdrawal.destinationAddress}. TxHash: ${txHash}`,
      }),
    });
  }

  // Create audit log
  await prisma.audit_logs.create({
    data: {
      id: crypto.randomUUID(),
      userId: adminId,
      action: "WITHDRAWAL_APPROVED",
      resourceType: "CRYPTO_WITHDRAWAL",
      resourceId: withdrawalId,
      details: JSON.stringify({
        withdrawalId,
        currency: withdrawal.currency,
        amount: withdrawal.amount.toString(),
        destinationAddress: withdrawal.destinationAddress,
        txHash,
        userEmail: withdrawal.user.email,
      }),
      ipAddress: "admin",
    },
  });

  return updated;
}

/**
 * Step 3: Admin rejects withdrawal
 */
export async function rejectWithdrawal(
  withdrawalId: string,
  adminId: string,
  reason: string,
) {
  const withdrawal = await prisma.crypto_withdrawals.findUnique({
    where: { id: withdrawalId },
  });

  if (!withdrawal) {
    throw new Error("Withdrawal not found");
  }

  if (withdrawal.status !== "pending") {
    throw new Error(`Withdrawal already ${withdrawal.status}`);
  }

  // Update withdrawal status
  const updated = await prisma.crypto_withdrawals.update({
    where: { id: withdrawalId },
    data: {
      status: "rejected",
      approvedBy: adminId,
      approvedAt: new Date(),
      adminNotes: reason,
    },
  });

  // Refund user's balance (unlock and restore)
  const userWallet = await prisma.crypto_wallets.findFirst({
    where: {
      userId: withdrawal.userId,
      currency: withdrawal.currency,
    },
  });

  if (userWallet) {
    await prisma.crypto_wallets.update({
      where: { id: userWallet.id },
      data: {
        balance: { increment: Number(withdrawal.amount) },
        lockedBalance: { decrement: Number(withdrawal.amount) },
      },
    });
  }

  // Create audit log
  await prisma.audit_logs.create({
    data: {
      id: crypto.randomUUID(),
      userId: adminId,
      action: "WITHDRAWAL_REJECTED",
      resourceType: "CRYPTO_WITHDRAWAL",
      resourceId: withdrawalId,
      details: JSON.stringify({
        withdrawalId,
        currency: withdrawal.currency,
        amount: withdrawal.amount.toString(),
        reason,
      }),
      ipAddress: "admin",
    },
  });

  return updated;
}

/**
 * Get admin wallet info for withdrawal instructions
 */
export async function getAdminWalletInfo(currency: string) {
  const adminWallet = await prisma.admin_wallets.findUnique({
    where: { currency: currency.toUpperCase() },
    select: {
      currency: true,
      walletAddress: true,
      walletProvider: true,
      balance: true,
      totalIn: true,
      totalOut: true,
    },
  });

  if (!adminWallet) {
    throw new Error(`Admin wallet not found for ${currency}`);
  }

  if (!adminWallet.walletAddress) {
    throw new Error(`Admin wallet address not configured for ${currency}`);
  }

  return adminWallet;
}

/**
 * Get pending withdrawals for admin review
 */
export async function getPendingWithdrawals() {
  const withdrawals = await prisma.crypto_withdrawals.findMany({
    where: { status: "pending" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { requestedAt: "asc" },
  });

  // Get admin wallet info for each currency
  const currencies = [...new Set(withdrawals.map((w: any) => w.currency))];
  const adminWallets = await Promise.all(
    currencies.map((currency: any) =>
      prisma.admin_wallets.findUnique({
        where: { currency },
        select: {
          currency: true,
          walletAddress: true,
          walletProvider: true,
        },
      }),
    ),
  );

  const walletMap = Object.fromEntries(
    adminWallets.filter((w) => w).map((w) => [w!.currency, w]),
  );

  return withdrawals.map((withdrawal: any) => ({
    ...withdrawal,
    adminWallet: walletMap[withdrawal.currency],
    instructions: walletMap[withdrawal.currency]
      ? `Send ${withdrawal.amount} ${withdrawal.currency} from your ${
          walletMap[withdrawal.currency]!.walletProvider || "crypto wallet"
        } to: ${withdrawal.destinationAddress}`
      : "Admin wallet not configured",
  }));
}
