import crypto from "crypto";
import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import prisma from "../prismaClient";

const router = Router();

// Cryptomus configuration
const CRYPTOMUS_API_KEY = process.env.CRYPTOMUS_API_KEY || "";
const CRYPTOMUS_MERCHANT_ID = process.env.CRYPTOMUS_MERCHANT_ID || "";
const CRYPTOMUS_PAYMENT_URL = "https://api.cryptomus.com/v1/payment";

/**
 * Generate signature for Cryptomus API
 */
function generateSignature(data: any): string {
  const jsonString = JSON.stringify(data);
  const base64 = Buffer.from(jsonString).toString("base64");
  return crypto
    .createHash("md5")
    .update(base64 + CRYPTOMUS_API_KEY)
    .digest("hex");
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

      // Create payment data
      const paymentData = {
        amount: amount.toString(),
        currency: currency.toUpperCase(), // BTC, ETH, USDT, etc.
        order_id: orderId || `ORDER-${Date.now()}`,
        url_return: `${process.env.FRONTEND_URL}/payments/success`,
        url_callback: `${process.env.BACKEND_URL || "http://localhost:4000"}/api/cryptomus/webhook`,
        is_payment_multiple: false,
        lifetime: 3600, // 1 hour
        additional_data: JSON.stringify({ userId }),
      };

      const signature = generateSignature(paymentData);

      // Make request to Cryptomus API
      const response = await fetch(CRYPTOMUS_PAYMENT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          merchant: CRYPTOMUS_MERCHANT_ID,
          sign: signature,
        },
        body: JSON.stringify(paymentData),
      });

      const result: any = await response.json();

      if (!response.ok) {
        console.error("Cryptomus API error:", result);
        return res
          .status(500)
          .json({ error: "Failed to create payment invoice" });
      }

      // Store payment record in database
      await prisma.cryptoPayments.create({
        data: {
          id: result.result?.uuid || result.uuid,
          user_id: userId,
          invoice_id: result.result?.uuid || result.uuid,
          amount: parseFloat(amount),
          currency: currency.toUpperCase(),
          status: "pending",
          payment_url: result.result?.url || result.url,
          order_id: paymentData.order_id,
          description: description || "Crypto payment",
        },
      });

      return res.json({
        success: true,
        payment_url: result.result?.url || result.url,
        invoice_id: result.result?.uuid || result.uuid,
        amount,
        currency,
      });
    } catch (error: any) {
      console.error("Cryptomus create invoice error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * Handle Cryptomus webhook callbacks
 * POST /api/cryptomus/webhook
 */
router.post("/webhook", async (req, res) => {
  try {
    const payload = req.body;

    // Verify webhook signature
    const receivedSign = req.headers["sign"] as string;
    const expectedSign = generateSignature(payload);

    if (receivedSign !== expectedSign) {
      console.error("Invalid webhook signature");
      return res.status(403).json({ error: "Invalid signature" });
    }

    const { uuid, status, order_id, amount, currency, additional_data } =
      payload;

    // Update payment status in database
    const payment = await prisma.cryptoPayments.findFirst({
      where: { invoice_id: uuid },
    });

    if (!payment) {
      console.error("Payment not found:", uuid);
      return res.status(404).json({ error: "Payment not found" });
    }

    await prisma.cryptoPayments.update({
      where: { id: payment.id },
      data: {
        status: status === "paid" ? "completed" : status,
        paid_at: status === "paid" ? new Date() : null,
      },
    });

    // If payment is completed, credit user account
    if (status === "paid") {
      const additionalInfo = JSON.parse(additional_data || "{}");
      const userId = additionalInfo.user_id || payment.user_id;

      // Add balance to user
      await prisma.user.update({
        where: { id: userId },
        data: {
          usdBalance: { increment: parseFloat(amount) },
        },
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId,
          amount: parseFloat(amount),
          type: "credit",
          description: `Crypto payment received (${currency}) - Order: ${order_id}`,
          status: "completed",
        },
      });

      console.log(
        `✅ Payment completed for user ${userId}: ${amount} ${currency}`
      );
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Cryptomus webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Get payment status
 * GET /api/cryptomus/status/:invoiceId
 */
router.get("/status/:invoiceId", authenticateToken as any, async (req, res) => {
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
  } catch (error: any) {
    console.error("Get payment status error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Get user's crypto payment history
 * GET /api/cryptomus/history
 */
router.get("/history", authenticateToken as any, async (req: any, res) => {
  try {
    const userId = req.user?.userId || req.user?.user_id;

    const payments = await prisma.cryptoPayments.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    return res.json({
      payments: payments.map((p: any) => ({
        id: p.id,
        invoice_id: p.invoice_id,
        amount: p.amount.toString(),
        currency: p.currency,
        status: p.status,
        order_id: p.orderId,
        description: p.description,
        created_at: p.created_at,
        paid_at: p.paid_at,
      })),
    });
  } catch (error: any) {
    console.error("Get payment history error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
