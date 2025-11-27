import crypto from "crypto";
import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import prisma from "../prismaClient";

const router = Router();

// Safe middleware wrapper to prevent undefined crashes
const safeAuth =
  typeof authenticateToken === "function"
    ? authenticateToken
    : (_req: any, _res: any, next: any) => next();

// NOWPayments configuration
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || "";
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || "";
const NOWPAYMENTS_BASE_URL = "https://api.nowpayments.io/v1";

// Type definitions for NOWPayments API responses
interface CurrenciesResponse {
  currencies: string[];
}

interface MinAmountResponse {
  min_amount: string | number;
  currency_from: string;
  currency_to: string;
}

interface InvoiceResponse {
  id: string | number;
  token_id?: string;
  order_id: string;
  order_description: string;
  price_amount: number;
  price_currency: string;
  pay_currency?: string;
  ipn_callback_url?: string;
  invoice_url: string;
  success_url?: string;
  cancel_url?: string;
  created_at: string;
  updated_at: string;
}

interface PaymentResponse {
  payment_id: string | number;
  invoice_id?: string | number;
  payment_status: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  order_id?: string;
  order_description?: string;
  purchase_id?: string | number;
  payin_hash?: string;
  payout_hash?: string;
  amount_received?: number;
  outcome_amount?: number;
  outcome_currency?: string;
  network?: string;
  network_precision?: number;
  expiration_estimate_date?: string;
  actually_paid?: number;
  created_at?: string;
  updated_at?: string;
}

interface EstimateResponse {
  currency_from: string;
  amount_from: number;
  currency_to: string;
  estimated_amount: number;
}

/**
 * Silent mode logging - only log in development
 */
function logDev(message: string, data?: any) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[NOWPayments] ${message}`, data || "");
  }
  // TODO: Add production analytics integration here (Sentry, DataDog, etc.)
}

/**
 * Safe error response handler
 */
function handleError(res: any, error: any, context: string) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  logDev(`Error in ${context}:`, errorMessage);

  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : errorMessage,
      context,
    });
  }
}

/**
 * Verify NOWPayments IPN signature
 * Signature = HMAC-SHA512(request_body, IPN_SECRET)
 */
function verifyIPNSignature(payload: string, signature: string): boolean {
  const hmac = crypto.createHmac("sha512", NOWPAYMENTS_IPN_SECRET);
  hmac.update(payload);
  const expectedSignature = hmac.digest("hex");
  return expectedSignature === signature;
}

/**
 * Get available cryptocurrencies from NOWPayments
 * GET /api/nowpayments/currencies
 */
router.get("/currencies", safeAuth as any, async (req: any, res) => {
  try {
    logDev("Fetching available currencies");

    if (!NOWPAYMENTS_API_KEY) {
      logDev("API key not configured");
      return res.status(500).json({
        success: false,
        error: "NOWPayments API key not configured",
      });
    }

    const response = await fetch(
      `${NOWPAYMENTS_BASE_URL}/currencies?fixed_rate=true`,
      {
        headers: {
          "x-api-key": NOWPAYMENTS_API_KEY,
        },
        signal: AbortSignal.timeout(10000), // 10s timeout
      },
    );

    if (!response.ok) {
      const error = await response.text();
      logDev("Failed to fetch currencies", { status: response.status, error });
      return res.status(response.status).json({
        success: false,
        error: "Failed to fetch available currencies",
      });
    }

    const data = (await response.json()) as CurrenciesResponse;
    logDev("Currencies fetched successfully", {
      count: data.currencies?.length,
    });

    res.json({
      success: true,
      currencies: data.currencies,
    });
  } catch (error: any) {
    handleError(res, error, "currencies");
  }
});

/**
 * Get minimum payment amount for a currency
 * GET /api/nowpayments/min-amount/:currency
 */
router.get("/min-amount/:currency", safeAuth as any, async (req: any, res) => {
  try {
    const { currency } = req.params;
    logDev("Fetching minimum amount", { currency });

    const response = await fetch(
      `${NOWPAYMENTS_BASE_URL}/min-amount?currency_from=usd&currency_to=${currency}`,
      {
        headers: {
          "x-api-key": NOWPAYMENTS_API_KEY,
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      logDev("Failed to fetch minimum amount", {
        status: response.status,
        error,
      });
      return res.status(response.status).json({
        success: false,
        error: "Failed to fetch minimum amount",
      });
    }

    const data = (await response.json()) as MinAmountResponse;
    logDev("Minimum amount fetched", data);

    res.json({
      success: true,
      minAmount: data.min_amount,
      currency: currency.toUpperCase(),
    });
  } catch (error: any) {
    logDev("Error fetching minimum amount", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Get estimated crypto amount for USD price
 * GET /api/nowpayments/estimate?amount=100&currency=btc
 */
router.get("/estimate", async (req, res) => {
  try {
    const { amount, currency } = req.query;

    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        error: "Amount and currency are required",
      });
    }

    logDev("Fetching estimate", { amount, currency });

    const response = await fetch(
      `${NOWPAYMENTS_BASE_URL}/estimate?amount=${amount}&currency_from=usd&currency_to=${currency}`,
      {
        headers: {
          "x-api-key": NOWPAYMENTS_API_KEY,
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      logDev("Failed to fetch estimate", {
        status: response.status,
        error,
      });
      return res.status(response.status).json({
        success: false,
        error: "Failed to fetch estimate",
      });
    }

    const data = (await response.json()) as EstimateResponse;
    logDev("Estimate fetched", data);

    res.json({
      success: true,
      estimate: {
        amountFrom: data.amount_from,
        currencyFrom: data.currency_from.toUpperCase(),
        amountTo: data.estimated_amount,
        currencyTo: data.currency_to.toUpperCase(),
      },
    });
  } catch (error: any) {
    logDev("Error fetching estimate", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Create a crypto payment (two-step: invoice → payment)
 * POST /api/nowpayments/create-payment
 *
 * Flow:
 * 1. Create invoice with price and description
 * 2. Create payment on that invoice with selected crypto
 * 3. Return payment address and amount to user
 */
router.post("/create-payment", safeAuth as any, async (req: any, res) => {
  try {
    const {
      amount,
      currency,
      orderId,
      description,
      payoutAddress,
      payoutCurrency,
    } = req.body;
    const userId = req.user?.user_id;

    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        error: "Amount and currency are required",
      });
    }

    if (!NOWPAYMENTS_API_KEY || !NOWPAYMENTS_IPN_SECRET) {
      return res.status(503).json({
        success: false,
        error: "NOWPayments is not configured",
      });
    }

    const generatedOrderId = orderId || `NP-${Date.now()}-${userId}`;

    logDev("Step 1: Creating invoice", {
      amount,
      orderId: generatedOrderId,
      userId,
    });

    // STEP 1: Create Invoice
    const invoiceData = {
      price_amount: parseFloat(amount),
      price_currency: "usd",
      order_id: generatedOrderId,
      order_description: description || "Crypto payment",
      ipn_callback_url: `${
        process.env.BACKEND_URL || "http://localhost:4000"
      }/api/nowpayments/ipn`,
      success_url: `${process.env.FRONTEND_URL}/payments/success`,
      cancel_url: `${process.env.FRONTEND_URL}/payments/cancel`,
    };

    const invoiceResponse = await fetch(`${NOWPAYMENTS_BASE_URL}/invoice`, {
      method: "POST",
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoiceData),
    });

    if (!invoiceResponse.ok) {
      const error = await invoiceResponse.text();
      logDev("Invoice creation failed", {
        status: invoiceResponse.status,
        error,
      });
      return res.status(invoiceResponse.status).json({
        success: false,
        error: "Failed to create invoice",
        details: error,
      });
    }

    const invoice = (await invoiceResponse.json()) as InvoiceResponse;
    logDev("Invoice created", { invoiceId: invoice.id });

    // STEP 2: Create Payment on Invoice
    logDev("Step 2: Creating payment on invoice", {
      invoiceId: invoice.id,
      payCurrency: currency,
    });

    const paymentData: any = {
      iid: invoice.id,
      pay_currency: currency.toLowerCase(),
      purchase_id: generatedOrderId,
      order_description: description || "Crypto payment",
      customer_email: req.user?.email || "customer@example.com",
    };

    // Add payout details if provided (for instant conversion)
    if (payoutAddress && payoutCurrency) {
      paymentData.payout_address = payoutAddress;
      paymentData.payout_currency = payoutCurrency.toLowerCase();
    }

    const paymentResponse = await fetch(
      `${NOWPAYMENTS_BASE_URL}/invoice-payment`,
      {
        method: "POST",
        headers: {
          "x-api-key": NOWPAYMENTS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      },
    );

    if (!paymentResponse.ok) {
      const error = await paymentResponse.text();
      logDev("Payment creation failed", {
        status: paymentResponse.status,
        error,
      });
      return res.status(paymentResponse.status).json({
        success: false,
        error: "Failed to create payment",
        details: error,
      });
    }

    const payment = (await paymentResponse.json()) as PaymentResponse;
    logDev("Payment created successfully", {
      paymentId: payment.payment_id,
      invoiceId: invoice.id,
      payAddress: payment.pay_address,
    });

    // Save to database
    await prisma.cryptoPayments.create({
      data: {
        id: payment.payment_id.toString(),
        user_id: userId,
        invoice_id: invoice.id.toString(),
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        status: payment.payment_status || "waiting",
        payment_url: invoice.invoice_url,
        order_id: generatedOrderId,
        description: description || null,
        paymentProvider: "nowpayments",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    logDev("Payment saved to database", {
      paymentId: payment.payment_id,
      invoiceId: invoice.id,
    });

    res.json({
      success: true,
      payment: {
        paymentId: payment.payment_id,
        invoiceId: invoice.id,
        payAddress: payment.pay_address,
        payAmount: payment.pay_amount,
        payCurrency: payment.pay_currency?.toUpperCase(),
        priceAmount: payment.price_amount,
        priceCurrency: payment.price_currency?.toUpperCase(),
        invoiceUrl: invoice.invoice_url,
        status: payment.payment_status,
        orderId: generatedOrderId,
        network: payment.network,
        expiresAt: payment.expiration_estimate_date,
        createdAt: payment.created_at,
      },
    });
  } catch (error: any) {
    logDev("Error in payment flow", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * Get payment status
 * GET /api/nowpayments/payment/:paymentId
 */
router.get(
  "/payment/:paymentId",
  authenticateToken as any,
  async (req: any, res) => {
    try {
      const { paymentId } = req.params;
      logDev("Fetching payment status", { paymentId });

      const response = await fetch(
        `${NOWPAYMENTS_BASE_URL}/payment/${paymentId}`,
        {
          headers: {
            "x-api-key": NOWPAYMENTS_API_KEY,
          },
        },
      );

      if (!response.ok) {
        const error = await response.text();
        logDev("Failed to fetch payment status", {
          status: response.status,
          error,
        });
        return res.status(response.status).json({
          success: false,
          error: "Failed to fetch payment status",
        });
      }

      const payment = (await response.json()) as PaymentResponse;
      logDev("Payment status fetched", {
        paymentId,
        status: payment.payment_status,
      });

      res.json({
        success: true,
        payment: {
          id: payment.payment_id,
          status: payment.payment_status,
          payAddress: payment.pay_address,
          payAmount: payment.pay_amount,
          payCurrency: payment.pay_currency?.toUpperCase(),
          priceAmount: payment.price_amount,
          priceCurrency: payment.price_currency?.toUpperCase(),
          actuallyPaid: payment.actually_paid,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at,
        },
      });
    } catch (error: any) {
      logDev("Error fetching payment status", { error: error.message });
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },
);

/**
 * NOWPayments IPN (Instant Payment Notification) webhook
 * POST /api/nowpayments/ipn
 */
router.post("/ipn", async (req, res) => {
  try {
    const signature = req.headers["x-nowpayments-sig"] as string;
    const payload = JSON.stringify(req.body);

    logDev("IPN received", { signature: signature?.substring(0, 10) + "..." });

    // Verify signature
    if (!signature || !verifyIPNSignature(payload, signature)) {
      logDev("Invalid IPN signature");
      return res.status(401).json({
        success: false,
        error: "Invalid signature",
      });
    }

    const {
      payment_id,
      payment_status,
      pay_address,
      price_amount,
      price_currency,
      pay_amount,
      pay_currency,
      order_id,
      actually_paid,
      outcome_amount,
      outcome_currency,
    } = req.body;

    logDev("IPN verified", { payment_id, payment_status, order_id });

    // Update payment in database
    await prisma.cryptoPayments.update({
      where: { id: payment_id.toString() },
      data: {
        status: payment_status,
        paid_at: payment_status === "finished" ? new Date() : null,
        updated_at: new Date(),
      },
    });

    logDev("Payment updated in database", { payment_id, payment_status });

    // If payment is successful, credit user account
    if (payment_status === "finished" && actually_paid) {
      const payment = await prisma.cryptoPayments.findUnique({
        where: { id: payment_id.toString() },
      });

      if (payment) {
        logDev("Crediting user account", {
          userId: payment.user_id,
          amount: outcome_amount,
        });

        // TODO: Implement account crediting logic
        // This depends on your business logic
        // Example: Update user balance, create transaction record, etc.
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    logDev("IPN processing error", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * List all payments for authenticated user
 * GET /api/nowpayments/my-payments
 */
router.get("/my-payments", safeAuth as any, async (req: any, res) => {
  try {
    const userId = req.user?.user_id;
    logDev("Fetching user payments", { userId });

    const payments = await prisma.cryptoPayments.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 50, // Limit to last 50 payments
    });

    logDev("Payments fetched", { count: payments.length });

    res.json({
      success: true,
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        orderId: p.order_id,
        paymentUrl: p.payment_url,
        createdAt: p.created_at,
        paidAt: p.paid_at,
      })),
    });
  } catch (error: any) {
    logDev("Error fetching payments", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * ========================================
 * WITHDRAWAL / PAYOUT ENDPOINTS
 * ========================================
 */

/**
 * Get NOWPayments merchant balance
 * GET /api/nowpayments/balance
 * Admin only - shows available funds for payouts
 */
router.get("/balance", safeAuth as any, async (req: any, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "SUPERADMIN") {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
      });
    }

    logDev("Fetching merchant balance");

    const response = await fetch(`${NOWPAYMENTS_BASE_URL}/balance`, {
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logDev("Failed to fetch balance", { status: response.status, error });
      return res.status(response.status).json({
        success: false,
        error: "Failed to fetch merchant balance",
      });
    }

    const balance = (await response.json()) as Record<string, any>;
    logDev("Balance fetched successfully", {
      currencies: Object.keys(balance).length,
    });

    res.json({
      success: true,
      balance,
    });
  } catch (error: any) {
    logDev("Error fetching balance", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Process approved withdrawals (batch payout)
 * POST /api/nowpayments/process-withdrawals
 * Admin only - sends approved withdrawals to NOWPayments
 */
router.post(
  "/process-withdrawals",
  authenticateToken as any,
  async (req: any, res) => {
    try {
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { role: true, email: true },
      });

      if (user?.role !== "ADMIN" && user?.role !== "SUPERADMIN") {
        return res.status(403).json({
          success: false,
          error: "Admin access required",
        });
      }

      const { withdrawalIds } = req.body;

      if (
        !withdrawalIds ||
        !Array.isArray(withdrawalIds) ||
        withdrawalIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          error: "withdrawalIds array is required",
        });
      }

      logDev("Processing withdrawals", {
        count: withdrawalIds.length,
        adminEmail: user.email,
      });

      // Fetch approved withdrawals
      const withdrawals = await prisma.crypto_withdrawals.findMany({
        where: {
          id: { in: withdrawalIds },
          status: "approved",
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      if (withdrawals.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No approved withdrawals found with the provided IDs",
        });
      }

      // Build NOWPayments payout request
      const payoutRequest = {
        ipn_callback_url: `${
          process.env.BACKEND_URL || "http://localhost:4000"
        }/api/nowpayments/payout-ipn`,
        withdrawals: withdrawals.map((w) => ({
          address: w.destinationAddress,
          currency: w.currency.toLowerCase(),
          amount: Number(w.amount),
          ipn_callback_url: `${
            process.env.BACKEND_URL || "http://localhost:4000"
          }/api/nowpayments/payout-ipn`,
          unique_external_id: w.id, // Link back to our withdrawal record
        })),
      };

      logDev("Sending payout request to NOWPayments", {
        withdrawalCount: payoutRequest.withdrawals.length,
      });

      const response = await fetch(`${NOWPAYMENTS_BASE_URL}/payout`, {
        method: "POST",
        headers: {
          "x-api-key": NOWPAYMENTS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payoutRequest),
      });

      if (!response.ok) {
        const error = await response.text();
        logDev("Payout request failed", { status: response.status, error });

        // Mark withdrawals as failed
        await prisma.crypto_withdrawals.updateMany({
          where: { id: { in: withdrawalIds } },
          data: {
            status: "failed",
            adminNotes: `NOWPayments payout failed: ${error}`,
            updatedAt: new Date(),
          },
        });

        return res.status(response.status).json({
          success: false,
          error: "Payout request failed",
          details: error,
        });
      }

      const payoutResult = (await response.json()) as any;
      logDev("Payout created successfully", {
        batchId: payoutResult.id,
        withdrawalCount: payoutResult.withdrawals?.length,
      });

      // Update withdrawal statuses to "processing"
      const updatePromises = payoutResult.withdrawals.map(
        async (payoutWithdrawal: any) => {
          const matchingWithdrawal = withdrawals.find(
            (w) => w.id === payoutWithdrawal.unique_external_id,
          );

          if (matchingWithdrawal) {
            return prisma.crypto_withdrawals.update({
              where: { id: matchingWithdrawal.id },
              data: {
                status: "processing",
                adminNotes: `NOWPayments payout initiated. Batch ID: ${payoutResult.id}, Payout ID: ${payoutWithdrawal.id}`,
                updatedAt: new Date(),
              },
            });
          }
        },
      );

      await Promise.all(updatePromises);

      res.json({
        success: true,
        message: `${withdrawals.length} withdrawals sent to NOWPayments`,
        batchId: payoutResult.id,
        withdrawals: payoutResult.withdrawals.map((w: any) => ({
          id: w.id,
          address: w.address,
          currency: w.currency,
          amount: w.amount,
          status: w.status,
        })),
      });
    } catch (error: any) {
      logDev("Error processing withdrawals", { error: error.message });
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }
  },
);

/**
 * Payout IPN webhook
 * POST /api/nowpayments/payout-ipn
 * Receives notifications when payout status changes
 */
router.post("/payout-ipn", async (req, res) => {
  try {
    const signature = req.headers["x-nowpayments-sig"] as string;
    const payload = JSON.stringify(req.body);

    // Verify signature
    if (!verifyIPNSignature(payload, signature)) {
      logDev("Invalid payout IPN signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const ipnData = req.body;
    logDev("Payout IPN received", {
      id: ipnData.id,
      status: ipnData.status,
      externalId: ipnData.unique_external_id,
    });

    // Find withdrawal by unique_external_id
    if (ipnData.unique_external_id) {
      const withdrawal = await prisma.crypto_withdrawals.findUnique({
        where: { id: ipnData.unique_external_id },
      });

      if (withdrawal) {
        let status = withdrawal.status;
        let completedAt = withdrawal.completedAt;
        let txHash = withdrawal.txHash;

        // Map NOWPayments payout status to our status
        switch (ipnData.status) {
          case "FINISHED":
            status = "completed";
            completedAt = new Date();
            txHash = ipnData.hash || txHash;
            break;
          case "FAILED":
          case "EXPIRED":
          case "REFUNDED":
            status = "failed";
            break;
          case "WAITING":
          case "CONFIRMING":
          case "SENDING":
            status = "processing";
            break;
        }

        await prisma.crypto_withdrawals.update({
          where: { id: ipnData.unique_external_id },
          data: {
            status,
            txHash: txHash || ipnData.hash,
            completedAt,
            adminNotes: `NOWPayments status: ${ipnData.status}. ${
              ipnData.error || ""
            }`,
            updatedAt: new Date(),
          },
        });

        logDev("Withdrawal updated from payout IPN", {
          withdrawalId: ipnData.unique_external_id,
          newStatus: status,
        });
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    logDev("Error processing payout IPN", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Create a payment invoice (simplified endpoint for frontend)
 * POST /api/nowpayments/create-invoice
 */
router.post("/create-invoice", safeAuth as any, async (req: any, res) => {
  try {
    const {
      price_amount,
      price_currency = "USD",
      pay_currency = "btc",
      order_id,
      order_description = "Payment via NOWPayments",
    } = req.body;

    if (!price_amount || !pay_currency) {
      return res.status(400).json({
        success: false,
        error: "price_amount and pay_currency are required",
      });
    }

    if (!NOWPAYMENTS_API_KEY) {
      return res.status(503).json({
        success: false,
        error: "NOWPayments is not configured",
      });
    }

    const orderId = order_id || `invoice_${Date.now()}_${req.user?.user_id || 'anon'}`;

    logDev("Creating NOWPayments invoice", {
      price_amount,
      price_currency,
      pay_currency,
      order_id: orderId,
    });

    // Create invoice using NOWPayments API
    const invoiceData = {
      price_amount: parseFloat(price_amount),
      price_currency: price_currency.toLowerCase(),
      pay_currency: pay_currency.toLowerCase(),
      order_id: orderId,
      order_description,
      ipn_callback_url: `${process.env.BACKEND_URL || "http://localhost:4000"}/api/nowpayments/webhook`,
      success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payments/success`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payments/cancel`,
    };

    const response = await fetch(`${NOWPAYMENTS_BASE_URL}/invoice`, {
      method: "POST",
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
      const error = await response.text();
      logDev("Invoice creation failed", {
        status: response.status,
        error,
      });
      return res.status(response.status).json({
        success: false,
        error: "Failed to create payment invoice",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }

    const invoice = (await response.json()) as InvoiceResponse;
    logDev("Invoice created successfully", {
      invoice_id: invoice.id,
      invoice_url: invoice.invoice_url,
    });

    // Store invoice in database for tracking
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user?.user_id || null,
          action: "nowpayments_invoice_created",
          resource: "payment",
          details: JSON.stringify({
            invoice_id: invoice.id,
            order_id: orderId,
            amount: price_amount,
            currency: price_currency,
            pay_currency,
          }),
          ipAddress: req.ip,
          userAgent: req.get("User-Agent") || "",
        },
      });
    } catch (dbError) {
      logDev("Failed to log invoice creation", { error: dbError });
      // Don't fail the request if audit logging fails
    }

    res.json({
      success: true,
      invoice_id: invoice.id,
      invoice_url: invoice.invoice_url,
      order_id: orderId,
      pay_amount: invoice.pay_amount || null,
      pay_currency: pay_currency.toUpperCase(),
      price_amount,
      price_currency: price_currency.toUpperCase(),
      created_at: invoice.created_at,
    });
  } catch (error: any) {
    handleError(res, error, "create-invoice");
  }
});

export default router;
