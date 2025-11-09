// RPA Module - Transaction Processor
// Automatically validates and processes pending transactions
// Implements fraud detection and compliance checks

import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../prismaClient";
import config from "./config";

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  errors: string[];
  warnings: string[];
  fraudScore: number;
}

class TransactionProcessor {
  private config = config.transactionProcessing;

  /**
   * Validate a transaction for potential fraud or policy violations
   */
  async validateTransaction(transactionId: string): Promise<ValidationResult> {
    try {
      const result: ValidationResult = {
        isValid: true,
        confidence: 1.0,
        errors: [],
        warnings: [],
        fraudScore: 0,
      };

      // Fetch transaction with user details
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        return {
          isValid: false,
          confidence: 0,
          errors: ["Transaction not found"],
          warnings: [],
          fraudScore: 0,
        };
      }

      // Fetch user separately
      const user = await prisma.user.findUnique({
        where: { id: transaction.userId },
        select: { usdBalance: true },
      });

      // Validation Rule 1: Check transaction amount
      const amountNum = Number(transaction.amount);
      if (amountNum <= 0) {
        result.isValid = false;
        result.errors.push("Transaction amount must be positive");
        result.confidence -= 0.3;
      }

      // Validation Rule 2: Check user balance for debits
      if (transaction.type === "debit" && user) {
        const balanceNum = Number(user.usdBalance);
        if (balanceNum < amountNum) {
          result.isValid = false;
          result.errors.push("Insufficient balance");
          result.confidence -= 0.5;
        }
      }

      // Validation Rule 3: Check for duplicate transactions (within 1 minute)
      const oneMinuteAgo = new Date(Date.now() - 60000);
      const duplicates = await prisma.transaction.count({
        where: {
          userId: transaction.userId,
          amount: transaction.amount,
          type: transaction.type,
          createdAt: { gte: oneMinuteAgo },
          id: { not: transactionId },
        },
      });

      if (duplicates > 0) {
        result.warnings.push("Possible duplicate transaction detected");
        result.confidence -= 0.1;
      }

      // Validation Rule 4: Check transaction limits
      const dailyTransactions = await prisma.transaction.aggregate({
        where: {
          userId: transaction.userId,
          createdAt: { gte: new Date(Date.now() - 86400000) }, // Last 24 hours
        },
        _sum: { amount: true },
      });

      const dailyLimit = 10000; // $10,000 daily limit
      const dailySum = dailyTransactions._sum.amount
        ? Number(dailyTransactions._sum.amount)
        : 0;

      if (dailySum + amountNum > dailyLimit) {
        result.warnings.push("Transaction exceeds daily limit");
        result.confidence -= 0.15;
      }

      // Validation Rule 5: Fraud detection based on patterns
      const fraudIndicators = await this.detectFraudPatterns(
        transaction.userId
      );
      if (fraudIndicators > 3) {
        result.warnings.push("Multiple fraud indicators detected");
        result.fraudScore = fraudIndicators * 0.2;
        result.confidence -= fraudIndicators * 0.1;
      }

      // Final decision
      const minConfidence = 0.7; // Minimum 70% confidence required
      if (result.confidence < minConfidence) {
        result.isValid = false;
        result.errors.push("Transaction confidence below threshold");
      }

      return result;
    } catch (error) {
      console.error(
        `[RPA] Validation error for transaction ${transactionId}:`,
        error
      );
      return {
        isValid: false,
        confidence: 0,
        errors: ["Validation system error"],
        warnings: [],
        fraudScore: 0,
      };
    }
  }

  /**
   * Process a validated transaction
   */
  async processTransaction(transactionId: string): Promise<boolean> {
    try {
      const validation = await this.validateTransaction(transactionId);

      if (!validation.isValid) {
        console.log(
          `[RPA] Transaction ${transactionId} failed validation:`,
          validation.errors
        );

        // Update transaction status to failed
        await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: "failed",
            description: `Failed: ${validation.errors.join(", ")}`,
          },
        });

        return false;
      }

      // Fetch transaction details
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        console.log(`[RPA] Transaction ${transactionId} not found`);
        return false;
      }

      // Process based on transaction type
      if (transaction.type === "credit") {
        await this.processCredit(transaction);
      } else if (transaction.type === "debit") {
        await this.processDebit(transaction);
      }

      // Update transaction status
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "completed",
        },
      });

      // Log audit trail
      await this.logTransaction(transactionId, "processed", validation);

      console.log(`[RPA] Successfully processed transaction ${transactionId}`);
      return true;
    } catch (error) {
      console.error(
        `[RPA] Error processing transaction ${transactionId}:`,
        error
      );

      // Mark transaction as failed
      await prisma.transaction
        .update({
          where: { id: transactionId },
          data: { status: "failed" },
        })
        .catch(() => {});

      return false;
    }
  }

  /**
   * Process credit transaction (add funds)
   */
  private async processCredit(transaction: any): Promise<void> {
    const amountNum = Number(transaction.amount);

    await prisma.user.update({
      where: { id: transaction.userId },
      data: {
        usdBalance: { increment: new Decimal(amountNum) },
      },
    });

    console.log(`[RPA] Credited $${amountNum} to user ${transaction.userId}`);
  }

  /**
   * Process debit transaction (deduct funds)
   */
  private async processDebit(transaction: any): Promise<void> {
    const amountNum = Number(transaction.amount);

    await prisma.user.update({
      where: { id: transaction.userId },
      data: {
        usdBalance: { decrement: new Decimal(amountNum) },
      },
    });

    console.log(`[RPA] Debited $${amountNum} from user ${transaction.userId}`);
  }

  /**
   * Detect fraud patterns for a user
   */
  private async detectFraudPatterns(userId: string): Promise<number> {
    let indicators = 0;

    // Pattern 1: Rapid succession of transactions (>5 in 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 300000);
    const recentTransactions = await prisma.transaction.count({
      where: {
        userId,
        createdAt: { gte: fiveMinutesAgo },
      },
    });

    if (recentTransactions > 5) {
      indicators++;
    }

    // Pattern 2: Large transactions from new account (<7 days old)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      const accountAge = Date.now() - user.createdAt.getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      if (accountAge < sevenDays) {
        const largeTransactions = await prisma.transaction.count({
          where: {
            userId,
            amount: { gte: 1000 },
          },
        });

        if (largeTransactions > 0) {
          indicators++;
        }
      }
    }

    // Pattern 3: Round-trip transactions (rapid credit/debit cycles)
    const creditDebitPairs = await prisma.transaction.groupBy({
      by: ["type"],
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 3600000) }, // Last hour
      },
      _count: { type: true },
    });

    const credits =
      creditDebitPairs.find((g) => g.type === "credit")?._count?.type || 0;
    const debits =
      creditDebitPairs.find((g) => g.type === "debit")?._count?.type || 0;

    if (Math.min(credits, debits) > 3) {
      indicators++;
    }

    return indicators;
  }

  /**
   * Log transaction processing to audit trail
   */
  private async logTransaction(
    transactionId: string,
    action: string,
    validation: ValidationResult
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: `transaction_${action}`,
          resourceType: "Transaction",
          resourceId: transactionId,
          userId: transactionId,
          metadata: JSON.stringify({
            confidence: validation.confidence,
            fraudScore: validation.fraudScore,
            warnings: validation.warnings,
          }),
          ipAddress: "RPA-System",
          userAgent: "RPA-TransactionProcessor",
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error(`[RPA] Failed to log transaction ${transactionId}:`, error);
    }
  }

  /**
   * Batch process all pending transactions
   */
  async batchProcess(): Promise<void> {
    try {
      console.log(`[RPA] Starting batch transaction processing...`);

      const pendingTransactions = await prisma.transaction.findMany({
        where: { status: "pending" },
        take: this.config.batchSize,
        orderBy: { createdAt: "asc" },
      });

      console.log(
        `[RPA] Found ${pendingTransactions.length} pending transactions`
      );

      for (const transaction of pendingTransactions) {
        await this.processTransaction(transaction.id);

        // Add small delay to prevent overloading
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(`[RPA] Batch processing complete`);
    } catch (error) {
      console.error("[RPA] Batch processing error:", error);
    }
  }
}

export default new TransactionProcessor();
