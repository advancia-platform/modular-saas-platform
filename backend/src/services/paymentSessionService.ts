/**
 * Payment Session Management Service
 * Handles creation, tracking, and lifecycle of payment sessions
 */

import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { withDefaults } from "../utils/prismaHelpers";

const prisma = new PrismaClient();

const SESSION_EXPIRY_MINUTES = parseInt(
  process.env.PAYMENT_SESSION_EXPIRY || "30",
  10,
);

export interface CreateSessionParams {
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  metadata?: Record<string, any>;
  callbackUrl?: string;
}

export interface PaymentSessionResult {
  sessionId: string;
  redirectUrl?: string;
  expiresAt: Date;
  qrCode?: string; // For crypto payments
}

/**
 * Generate unique session ID in format: DEP-{timestamp}-{random}
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(4).toString("hex").toUpperCase();
  return `DEP-${timestamp}-${random}`;
}

/**
 * Create a new payment session
 */
export async function createPaymentSession(
  params: CreateSessionParams,
): Promise<PaymentSessionResult> {
  const { userId, amount, currency, paymentMethod, metadata, callbackUrl } =
    params;

  // Validate amount
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  // Generate session
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000);

  const session = await prisma.payment_sessions.create({
    data: withDefaults({
      sessionId,
      userId,
      amount,
      currency: currency.toUpperCase(),
      paymentMethod,
      status: "pending",
      expiresAt,
      callbackUrl,
      metadata: metadata || {},
    }),
  });

  // Generate provider-specific redirect URL
  // This will be implemented per provider
  const redirectUrl = await generateProviderRedirect(session);

  // Update session with redirect URL
  await prisma.payment_sessions.update({
    where: { id: session.id },
    data: { redirectUrl },
  });

  return {
    sessionId: session.sessionId,
    redirectUrl,
    expiresAt: session.expiresAt,
  };
}

/**
 * Get payment session status
 */
export async function getPaymentSession(sessionId: string) {
  const session = await prisma.payment_sessions.findUnique({
    where: { sessionId },
  });

  if (!session) {
    throw new Error("Payment session not found");
  }

  // Auto-expire if past expiry time
  if (session.status === "pending" && new Date() > session.expiresAt) {
    await prisma.payment_sessions.update({
      where: { id: session.id },
      data: { status: "expired" },
    });
    session.status = "expired";
  }

  return session;
}

/**
 * Complete payment session (called by webhook handlers)
 */
export async function completePaymentSession(
  sessionId: string,
  transactionId: string,
  provider: string,
) {
  const session = await prisma.payment_sessions.findUnique({
    where: { sessionId },
  });

  if (!session) {
    throw new Error("Payment session not found");
  }

  if (session.status !== "pending") {
    throw new Error(`Cannot complete session with status: ${session.status}`);
  }

  await prisma.payment_sessions.update({
    where: { id: session.id },
    data: {
      status: "completed",
      completedAt: new Date(),
      transactionId,
      provider,
    },
  });

  return session;
}

/**
 * Fail payment session
 */
export async function failPaymentSession(sessionId: string, reason: string) {
  await prisma.payment_sessions.update({
    where: { sessionId },
    data: {
      status: "failed",
      failedReason: reason,
      completedAt: new Date(),
    },
  });
}

/**
 * Cancel payment session (user-initiated)
 */
export async function cancelPaymentSession(sessionId: string, userId: string) {
  const session = await prisma.payment_sessions.findUnique({
    where: { sessionId },
  });

  if (!session) {
    throw new Error("Payment session not found");
  }

  if (session.userId !== userId) {
    throw new Error("Unauthorized to cancel this session");
  }

  if (session.status !== "pending") {
    throw new Error(`Cannot cancel session with status: ${session.status}`);
  }

  await prisma.payment_sessions.update({
    where: { id: session.id },
    data: { status: "cancelled" },
  });
}

/**
 * Get user's payment sessions (history)
 */
export async function getUserPaymentSessions(
  userId: string,
  limit: number = 20,
) {
  return prisma.payment_sessions.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Cleanup expired sessions (cron job)
 */
export async function cleanupExpiredSessions() {
  const result = await prisma.payment_sessions.updateMany({
    where: {
      status: "pending",
      expiresAt: { lt: new Date() },
    },
    data: { status: "expired" },
  });

  console.log(`Expired ${result.count} payment sessions`);
  return result.count;
}

/**
 * Generate provider-specific redirect URL
 * This is a placeholder - implement per provider
 */
async function generateProviderRedirect(
  session: any,
): Promise<string | undefined> {
  const { paymentMethod, amount, currency, sessionId } = session;

  // Return appropriate URL based on payment method
  // For now, return placeholder
  const baseUrl = process.env.BACKEND_URL || "http://localhost:4000";
  const callbackUrl = `${baseUrl}/api/payments/callback/${sessionId}`;

  switch (paymentMethod) {
    case "stripe":
      // Will integrate with Stripe Checkout Session API
      return `${baseUrl}/api/payments/stripe/checkout/${sessionId}`;

    case "coinbase":
    case "cryptomus":
      // Will integrate with crypto payment gateway
      return `${baseUrl}/api/payments/crypto/checkout/${sessionId}`;

    case "paystack":
      // Will integrate with Paystack
      return `${baseUrl}/api/payments/paystack/checkout/${sessionId}`;

    default:
      return undefined;
  }
}

/**
 * Get payment session statistics (admin)
 */
export async function getPaymentSessionStats(startDate?: Date, endDate?: Date) {
  const where: any = {};
  if (startDate) {
    where.createdAt = { gte: startDate };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, lte: endDate };
  }

  const [totalSessions, byStatus, byMethod, totalVolume] = await Promise.all([
    prisma.payment_sessions.count({ where }),

    prisma.payment_sessions.groupBy({
      by: ["status"],
      where,
      _count: true,
      _sum: { amount: true },
    }),

    prisma.payment_sessions.groupBy({
      by: ["paymentMethod"],
      where: { ...where, status: "completed" },
      _count: true,
      _sum: { amount: true },
    }),

    prisma.payment_sessions.aggregate({
      where: { ...where, status: "completed" },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalSessions,
    byStatus,
    byMethod,
    totalVolume: totalVolume._sum.amount || 0,
  };
}
