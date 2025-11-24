import prisma from "../prismaClient";
import { withDefaults } from "../utils/prismaHelpers";

export interface TransactionData {
  provider: "stripe" | "cryptomus";
  orderId: string;
  amount: number;
  currency: string;
  userId: string;
  description?: string;
  metadata?: any;
}

export interface UnifiedTransaction {
  id: string;
  provider: string;
  orderId: string;
  amount: number;
  currency: string;
  status: "pending" | "confirmed" | "failed";
  userId: string;
  description?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Unified Transaction Manager
 * Handles payments from multiple providers (Stripe, Cryptomus, etc.)
 */
export class TransactionManager {
  /**
   * Create and process a transaction from any provider
   */
  static async createTransaction(
    txData: TransactionData,
  ): Promise<UnifiedTransaction> {
    try {
      // Create transaction record
      const transaction = await prisma.transactions.create({
        data: withDefaults({
          userId: txData.userId,
          amount: txData.amount,
          type: "credit",
          description:
            txData.description ||
            `Payment via ${txData.provider} - Order: ${txData.orderId}`,
          category: `${txData.provider}_payment`,
          status: "confirmed", // Assume confirmed since webhook verified it
        }),
      });

      // Credit admin wallet
      await this.creditAdminWallet(txData.amount, txData.currency);

      // Credit user account (crypto wallet for crypto payments, USD balance for fiat)
      if (txData.provider === "cryptomus") {
        await this.creditUserCryptoWallet(
          txData.userId,
          txData.amount,
          txData.currency,
        );
      } else if (txData.provider === "stripe") {
        await this.creditUserUsdBalance(txData.userId, txData.amount);
      }

      // Emit real-time notification
      const io = (global as any).io;
      if (io) {
        io.to(`user-${txData.userId}`).emit("payment_confirmed", {
          provider: txData.provider,
          amount: txData.amount,
          currency: txData.currency,
          orderId: txData.orderId,
        });
      }

      console.log(
        `✅ Transaction processed: ${txData.provider} - ${txData.amount} ${txData.currency} for user ${txData.userId}`,
      );

      return {
        id: transaction.id,
        provider: txData.provider,
        orderId: txData.orderId,
        amount: txData.amount,
        currency: txData.currency,
        status: "confirmed",
        userId: txData.userId,
        description: transaction.description || undefined,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  }

  /**
   * Get transaction status by order ID
   */
  static async getTransactionStatus(
    orderId: string,
  ): Promise<UnifiedTransaction | null> {
    try {
      // Try regular transactions first
      const transaction = await prisma.transactions.findFirst({
        where: {
          description: {
            contains: `Order: ${orderId}`,
          },
        },
      });

      if (transaction) {
        return {
          id: transaction.id,
          provider: transaction.category?.replace("_payment", "") || "unknown",
          orderId: orderId,
          amount: transaction.amount,
          currency: "USD", // Default, could be enhanced
          status: transaction.status as "pending" | "confirmed" | "failed",
          userId: transaction.userId,
          description: transaction.description || undefined,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
        };
      }

      // Try crypto payments
      const cryptoPayment = await prisma.cryptoPayments.findFirst({
        where: {
          order_id: orderId,
        },
      });

      if (cryptoPayment) {
        return {
          id: cryptoPayment.id,
          provider: "cryptomus",
          orderId: orderId,
          amount: cryptoPayment.amount,
          currency: cryptoPayment.currency,
          status:
            cryptoPayment.status === "paid"
              ? "confirmed"
              : cryptoPayment.status === "pending"
                ? "pending"
                : "failed",
          userId: cryptoPayment.user_id,
          description: cryptoPayment.description || undefined,
          createdAt: cryptoPayment.created_at || new Date(),
          updatedAt: cryptoPayment.updated_at || new Date(),
        };
      }

      return null;
    } catch (error) {
      console.error("Error getting transaction status:", error);
      throw error;
    }
  }

  /**
   * Credit admin wallet (internal ledger)
   */
  private static async creditAdminWallet(amount: number, currency: string) {
    try {
      let adminWallet = await prisma.admin_wallets.findFirst({
        where: { currency: currency.toUpperCase() },
      });

      if (!adminWallet) {
        adminWallet = await prisma.admin_wallets.create({
          data: withDefaults({
            currency: currency.toUpperCase(),
            balance: 0,
            totalIn: 0,
          }),
        });
      }

      await prisma.admin_wallets.update({
        where: { id: adminWallet.id },
        data: {
          balance: { increment: amount },
          totalIn: { increment: amount },
        },
      });

      console.log(`Admin wallet credited: +${amount} ${currency}`);
    } catch (error) {
      console.error("Error crediting admin wallet:", error);
      throw error;
    }
  }

  /**
   * Credit user's crypto wallet
   */
  private static async creditUserCryptoWallet(
    userId: string,
    amount: number,
    currency: string,
  ) {
    try {
      let userWallet = await prisma.crypto_wallets.findFirst({
        where: {
          userId: userId,
          currency: currency.toUpperCase(),
        },
      });

      if (!userWallet) {
        userWallet = await prisma.crypto_wallets.create({
          data: withDefaults({
            userId: userId,
            currency: currency.toUpperCase(),
            balance: 0,
            address: "",
          }),
        });
      }

      await prisma.crypto_wallets.update({
        where: { id: userWallet.id },
        data: {
          balance: { increment: amount },
        },
      });

      console.log(
        `User ${userId} crypto wallet credited: +${amount} ${currency}`,
      );
    } catch (error) {
      console.error("Error crediting user crypto wallet:", error);
      throw error;
    }
  }

  /**
   * Credit user's USD balance
   */
  private static async creditUserUsdBalance(userId: string, amount: number) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          usdBalance: { increment: amount },
        },
      });

      console.log(`User ${userId} USD balance credited: +${amount}`);
    } catch (error) {
      console.error("Error crediting user USD balance:", error);
      throw error;
    }
  }
}

export default TransactionManager;
