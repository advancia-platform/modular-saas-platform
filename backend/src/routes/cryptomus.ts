import crypto from "crypto";
import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import prisma from "../prismaClient";
import {
  creditAdminWallet,
  creditUserCryptoWallet,
  emitPaymentNotification,
  recordTransaction,
} from "../services/transactionService.js";

const router = Router();

// Cryptomus configuration (Official API Documentation)
const CRYPTOMUS_API_KEY = process.env.CRYPTOMUS_API_KEY || "";
const CRYPTOMUS_MERCHANT_ID = process.env.CRYPTOMUS_MERCHANT_ID || "";
const CRYPTOMUS_BASE_URL = "https://api.cryptomus.com/v1";

/**
 * Generate signature for Cryptomus API
 * Official docs: sign = MD5(base64(body) + API_KEY)
 */
function generateSignature(data: Record<string, unknown>): string {
  const jsonString = JSON.stringify(data);
  const base64 = Buffer.from(jsonString).toString("base64");
  return crypto
    .createHash("md5")
    .update(base64 + CRYPTOMUS_API_KEY)
    .digest("hex");
}

/**
 * Generate signature for empty body (for GET requests)
 */
function generateEmptySignature(): string {
  const base64 = Buffer.from("").toString("base64");
  return crypto
    .createHash("md5")
    .update(base64 + CRYPTOMUS_API_KEY)
    .digest("hex");
}

/**
 * Verify Cryptomus webhook signature
 */
function verifyCryptomusSignature(
  body: Record<string, unknown>,
  signature: string,
): boolean {
  const expectedSign = generateSignature(body);
  return expectedSign === signature;
}

/**
 * Create a crypto payment invoice
 * POST /api/cryptomus/create-invoice
 */
router.post(
  "/create-invoice",
  authenticateToken as any,
  async (req: any, res) => {
    try {
      const { amount, currency, orderId, description } = req.body;
      const userId = req.user?.user_id;

      if (!amount || !currency) {
        return res
          .status(400)
          .json({ error: "Amount and currency are required" });
      }

      if (!CRYPTOMUS_API_KEY || !CRYPTOMUS_MERCHANT_ID) {
        return res.status(503).json({ error: "Cryptomus is not configured" });
      }

      // Create payment data (following official docs structure)
      const paymentData = {
        amount: amount.toString(),
        currency: currency.toUpperCase(), // BTC, ETH, USDT, etc.
        order_id: orderId || `ORDER-${Date.now()}-${userId}`,
        url_return: `${process.env.FRONTEND_URL}/payments/success`,
        url_callback: `${process.env.BACKEND_URL || "http://localhost:4000"}/api/cryptomus/webhook`,
        is_payment_multiple: false,
        lifetime: 3600, // 1 hour
        additional_data: JSON.stringify({ userId }),
      };

      const signature = generateSignature(paymentData);

      // Make request to Cryptomus API (following official authentication)
      const response = await fetch(`${CRYPTOMUS_BASE_URL}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          merchant: CRYPTOMUS_MERCHANT_ID, // Official header name
          sign: signature, // Official header name
        },
        body: JSON.stringify(paymentData),
      });

      const result = (await response.json()) as {
        result?: { uuid?: string; url?: string };
        uuid?: string;
        url?: string;
        message?: string;
      };

      if (!response.ok) {
        console.error("Cryptomus API error:", result);
        return res
          .status(500)
          .json({ error: "Failed to create payment invoice" });
      }

      const invoiceId =
        result.result?.uuid || result.uuid || `INV-${Date.now()}`;
      const paymentUrl = result.result?.url || result.url || "";

      // Store payment record in database
      await prisma.cryptoPayments.create({
        data: {
          id: invoiceId,
          user_id: userId,
          invoice_id: invoiceId,
          amount: parseFloat(amount),
          currency: currency.toUpperCase(),
          status: "pending",
          payment_url: paymentUrl,
          order_id: paymentData.order_id,
          description: description || "Crypto payment",
        },
      });

      return res.json({
        success: true,
        payment_url: paymentUrl,
        invoice_id: invoiceId,
        amount,
        currency,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Cryptomus create invoice error:", errorMessage);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * Handle Cryptomus webhook callbacks
 * POST /api/cryptomus/webhook
 */
router.post("/webhook", async (req, res) => {
  try {
    const payload = req.body;

    // Verify webhook signature (check both header formats)
    const receivedSign =
      (req.headers["sign"] as string) ||
      (req.headers["cryptomus-signature"] as string);

    if (!verifyCryptomusSignature(payload, receivedSign)) {
      console.error("Invalid Cryptomus webhook signature");
      return res.status(403).json({ error: "Invalid signature" });
    }

    const {
      uuid,
      status,
      order_id,
      amount,
      currency,
      additional_data,
      invoice_id,
    } = payload;

    console.log("Cryptomus webhook received:", {
      uuid,
      status,
      order_id,
      amount,
      currency,
    });

    // Find the existing crypto payment record
    const payment = await prisma.cryptoPayments.findFirst({
      where: { invoice_id: uuid || invoice_id || order_id },
    });

    if (!payment) {
      console.error("Payment not found:", uuid || invoice_id || order_id);
      return res.status(404).json({ error: "Payment not found" });
    }

    // Update payment status in database
    const isPaid = status === "paid" || status === "paid_over";
    await prisma.cryptoPayments.update({
      where: { id: payment.id },
      data: {
        status: isPaid ? "completed" : status,
        paid_at: isPaid ? new Date() : null,
      },
    });

    // If payment is completed, process the transaction
    if (isPaid) {
      const additionalInfo = JSON.parse(additional_data || "{}");
      const userId = additionalInfo.userId || payment.user_id;
      const paymentAmount = parseFloat(amount);
      const paymentCurrency = currency.toUpperCase();

      // Record transaction
      await recordTransaction({
        provider: "cryptomus",
        orderId: order_id,
        amount: paymentAmount,
        currency: paymentCurrency,
        status: "confirmed",
        userId: userId,
        description:
          payment.description || `Crypto payment received (${paymentCurrency})`,
      });

      // Credit wallets
      await creditAdminWallet(paymentAmount, paymentCurrency);
      await creditUserCryptoWallet(userId, paymentAmount, paymentCurrency);

      // Emit real-time notification
      emitPaymentNotification(userId, {
        provider: "cryptomus",
        amount: paymentAmount,
        currency: paymentCurrency,
        orderId: order_id,
      });

      console.log(
        `✅ Cryptomus payment processed: ${paymentAmount} ${paymentCurrency} for user ${userId}`,
      );
    }

    return res.json({ success: true });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Cryptomus webhook error:", errorMessage);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Get payment status
 * GET /api/cryptomus/status/:invoiceId
 */
router.get(
  "/status/:invoiceId",
  authenticateToken as any,
  async (req: any, res) => {
    try {
      const { invoiceId } = req.params;

      const payment = await prisma.cryptoPayments.findFirst({
        where: { invoice_id: invoiceId },
      });

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      return res.json({
        invoice_id: payment.invoice_id,
        amount: payment.amount.toString(),
        currency: payment.currency,
        status: payment.status,
        payment_url: payment.payment_url,
        created_at: payment.created_at,
        paid_at: payment.paid_at,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Get payment status error:", errorMessage);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * Get available currencies
 * GET /api/cryptomus/currencies
 */
router.get("/currencies", async (_req, res) => {
  try {
    if (!CRYPTOMUS_API_KEY || !CRYPTOMUS_MERCHANT_ID) {
      return res.status(503).json({ error: "Cryptomus is not configured" });
    }

    const signature = generateEmptySignature();

    const response = await fetch(`${CRYPTOMUS_BASE_URL}/payment/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        merchant: CRYPTOMUS_MERCHANT_ID,
        sign: signature,
      },
      body: JSON.stringify({}),
    });

    const result = (await response.json()) as {
      result?: unknown[];
      message?: string;
    };

    if (!response.ok) {
      console.error("Cryptomus currencies error:", result);
      return res.status(500).json({ error: "Failed to fetch currencies" });
    }

    return res.json({
      success: true,
      currencies: result.result || [],
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Get currencies error:", errorMessage);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Get user's payment history
 * GET /api/cryptomus/history
 */
router.get("/history", authenticateToken as any, async (req: any, res) => {
  try {
    const userId = req.user?.user_id;
    const { limit = 10, offset = 0 } = req.query;

    const payments = await prisma.cryptoPayments.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.cryptoPayments.count({
      where: { user_id: userId },
    });

    return res.json({
      success: true,
      payments: payments.map((p) => ({
        id: p.id,
        invoice_id: p.invoice_id,
        amount: p.amount.toString(),
        currency: p.currency,
        status: p.status,
        payment_url: p.payment_url,
        created_at: p.created_at,
        paid_at: p.paid_at,
      })),
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Get payment history error:", errorMessage);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Test Cryptomus configuration
 * GET /api/cryptomus/test-config
 */
router.get("/test-config", async (_req, res) => {
  try {
    // Check environment variables
    const config = {
      hasApiKey: !!CRYPTOMUS_API_KEY,
      hasMerchantId: !!CRYPTOMUS_MERCHANT_ID,
      hasBaseUrl: !!CRYPTOMUS_BASE_URL,
      merchantId: CRYPTOMUS_MERCHANT_ID
        ? `${CRYPTOMUS_MERCHANT_ID.substring(0, 8)}...`
        : "missing",
      baseUrl: CRYPTOMUS_BASE_URL || "missing",
    };

    // Test signature generation
    const testBody = { test: "data" };
    const testSignature = generateSignature(testBody);

    // Test empty signature
    const emptySignature = generateEmptySignature();

    return res.json({
      success: true,
      message: "Cryptomus configuration test",
      config,
      signatureTest: {
        algorithm: "MD5",
        withBody: testSignature ? "✓ Generated" : "✗ Failed",
        emptyBody: emptySignature ? "✓ Generated" : "✗ Failed",
      },
      ready: !!(
        CRYPTOMUS_API_KEY &&
        CRYPTOMUS_MERCHANT_ID &&
        CRYPTOMUS_BASE_URL
      ),
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Config test error:", errorMessage);
    return res.status(500).json({
      success: false,
      error: errorMessage,
      ready: false,
    });
  }
});

export default router;
