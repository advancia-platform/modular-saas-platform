import { Request, Response, Router } from "express";
import Stripe from "stripe";
import { config } from "../jobs/config";
import logger from "../logger";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { rateLimit } from "../middleware/security";
import {
    paymentRateLimiter,
    requireEmailVerified
} from "../middleware/securityHardening";
import { validateSchema } from "../middleware/validateSchema";
import prisma from "../prismaClient";
import { withDefaults } from "../utils/prismaHelpers";
import {
    AdminRefundSchema,
    PaymentChargeSavedSchema,
    PaymentCreateIntentSchema,
    PaymentSaveMethodSchema,
    SubscriptionCancelSchema,
    SubscriptionCreateSchema,
} from "../validation/schemas";

const router = Router();

const stripeClient = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey)
  : null;

// Safe middleware wrappers to prevent undefined crashes
const safeAuth =
  typeof authenticateToken === "function"
    ? authenticateToken
    : (_req: any, _res: any, next: any) => next();
const safeAdmin =
  typeof requireAdmin === "function"
    ? requireAdmin
    : (_req: any, _res: any, next: any) => next();

/**
 * POST /api/payments/save-method
 * Save a payment method to customer for future use (secured)
 */
router.post(
  "/save-method",
  safeAuth,
  requireEmailVerified,
  paymentRateLimiter,
  validateSchema(PaymentSaveMethodSchema),
  async (req: Request, res: Response) => {
    if (!stripeClient) {
      return res.status(503).json({
        error: "Stripe not configured",
        code: "STRIPE_NOT_CONFIGURED",
      });
    }

    try {
      const userId = (req as any).user.id;
      const { paymentMethodId } = req.body;

      // Get or create Stripe customer
      let user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res
          .status(404)
          .json({ error: "User not found", code: "USER_NOT_FOUND" });
      }

      let customerId = user.stripeCustomerId;

      if (!customerId) {
        const customer = await stripeClient.customers.create({
          email: user.email,
          name: user.firstName
            ? `${user.firstName} ${user.lastName}`
            : user.email,
          metadata: { userId },
        });
        customerId = customer.id;

        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customerId },
        });
      }

      // Attach payment method to customer
      await stripeClient.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default if it's the first one
      const existingMethods = await stripeClient.paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      if (existingMethods.data.length === 1) {
        await stripeClient.customers.update(customerId, {
          invoice_settings: { default_payment_method: paymentMethodId },
        });
      }

      res.json({
        success: true,
        message: "Payment method saved successfully",
        paymentMethodId,
        code: "PAYMENT_METHOD_SAVED",
      });
    } catch (error) {
      logger.error("Save payment method error:", error);
      res.status(500).json({ error: "Failed to save payment method" });
    }
  },
);

/**
 * GET /api/payments/methods
 * List saved payment methods
 */
router.get("/methods", safeAuth, async (req: Request, res: Response) => {
  if (!stripeClient) {
    return res.status(503).json({
      error: "Stripe not configured",
      code: "STRIPE_NOT_CONFIGURED",
    });
  }

  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return res.json({
        success: true,
        methods: [],
        code: "PAYMENT_METHODS_LIST",
      });
    }

    const paymentMethods = await stripeClient.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: "card",
    });

    const methods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: pm.id === user.stripeCustomerId, // Would need customer data to check
    }));

    res.json({ success: true, methods, code: "PAYMENT_METHODS_LIST" });
  } catch (error) {
    logger.error("List payment methods error:", error);
    res.status(500).json({ error: "Failed to list payment methods" });
  }
});

/**
 * DELETE /api/payments/methods/:id
 * Remove a saved payment method
 */
router.delete("/methods/:id", safeAuth, async (req: Request, res: Response) => {
  if (!stripeClient) {
    return res.status(503).json({
      error: "Stripe not configured",
      code: "STRIPE_NOT_CONFIGURED",
    });
  }

  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Missing payment method id" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return res.status(404).json({
        error: "No saved payment methods",
        code: "NO_PAYMENT_METHODS",
      });
    }

    // Verify payment method belongs to this customer
    const paymentMethod = await stripeClient.paymentMethods.retrieve(id);
    if (paymentMethod.customer !== user.stripeCustomerId) {
      return res
        .status(403)
        .json({ error: "Unauthorized", code: "UNAUTHORIZED_PAYMENT_METHOD" });
    }

    await stripeClient.paymentMethods.detach(id);

    res.json({
      success: true,
      message: "Payment method removed",
      code: "PAYMENT_METHOD_REMOVED",
    });
  } catch (error) {
    logger.error("Delete payment method error:", error);
    res.status(500).json({ error: "Failed to delete payment method" });
  }
});

/**
 * POST /api/payments/subscription/create
 * Create a recurring payment subscription
 */
router.post(
  "/subscription/create",
  safeAuth,
  validateSchema(SubscriptionCreateSchema),
  async (req: Request, res: Response) => {
    if (!stripeClient) {
      return res.status(503).json({
        error: "Stripe not configured",
        code: "STRIPE_NOT_CONFIGURED",
      });
    }

    try {
      const userId = (req as any).user.id;
      const {
        priceId,
        paymentMethodId,
        planName,
        amount,
        interval = "month",
      } = req.body as any;

      // Get or create customer
      let user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res
          .status(404)
          .json({ error: "User not found", code: "USER_NOT_FOUND" });
      }

      let customerId = user.stripeCustomerId;

      if (!customerId) {
        const customer = await stripeClient.customers.create({
          email: user.email,
          name: user.firstName
            ? `${user.firstName} ${user.lastName}`
            : user.email,
          metadata: { userId },
          payment_method: paymentMethodId,
          invoice_settings: { default_payment_method: paymentMethodId },
        });
        customerId = customer.id;

        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customerId },
        });
      } else if (paymentMethodId) {
        // Attach payment method if provided
        await stripeClient.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });
        await stripeClient.customers.update(customerId, {
          invoice_settings: { default_payment_method: paymentMethodId },
        });
      }

      // Create or use existing price
      let finalPriceId = priceId;
      if (!priceId) {
        // Create a new price for this subscription
        const product = await stripeClient.products.create({
          name: planName || "Subscription Plan",
          metadata: { userId },
        });

        const price = await stripeClient.prices.create({
          product: product.id,
          currency: "usd",
          recurring: { interval: interval as any },
          unit_amount: Math.round(amount * 100),
        });

        finalPriceId = price.id;
      }

      // Create subscription
      const subscription = await stripeClient.subscriptions.create({
        customer: customerId,
        items: [{ price: finalPriceId }],
        metadata: { userId, planName: planName || "Custom Plan" },
      });

      res.json({
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: (subscription as any).current_period_end,
        amount,
        interval,
        code: "SUBSCRIPTION_CREATED",
      });
    } catch (error) {
      logger.error("Create subscription error:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  },
);

/**
 * GET /api/payments/subscriptions
 * List user's active subscriptions
 */
router.get("/subscriptions", safeAuth, async (req: Request, res: Response) => {
  if (!stripeClient) {
    return res.status(503).json({
      error: "Stripe not configured",
      code: "STRIPE_NOT_CONFIGURED",
    });
  }

  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return res.json({
        success: true,
        subscriptions: [],
        code: "SUBSCRIPTIONS_LIST",
      });
    }

    const subscriptions = await stripeClient.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "all",
    });

    const formatted = subscriptions.data.map((sub) => ({
      id: sub.id,
      status: sub.status,
      planName: sub.metadata?.planName || "Subscription",
      amount: sub.items.data[0]?.price.unit_amount
        ? sub.items.data[0].price.unit_amount / 100
        : 0,
      interval: sub.items.data[0]?.price.recurring?.interval,
      currentPeriodEnd: (sub as any).current_period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      created: sub.created,
    }));

    res.json({
      success: true,
      subscriptions: formatted,
      code: "SUBSCRIPTIONS_LIST",
    });
  } catch (error) {
    logger.error("List subscriptions error:", error);
    res.status(500).json({ error: "Failed to list subscriptions" });
  }
});

/**
 * POST /api/payments/subscription/:id/cancel
 * Cancel a subscription
 */
router.post(
  "/subscription/cancel",
  safeAuth,
  validateSchema(SubscriptionCancelSchema),
  async (req: Request, res: Response) => {
    if (!stripeClient) {
      return res.status(503).json({
        error: "Stripe not configured",
        code: "STRIPE_NOT_CONFIGURED",
      });
    }

    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "Missing subscription id" });
      }
      const { immediately = false } = req.body as any;

      // Verify subscription belongs to user
      const subscription = await stripeClient.subscriptions.retrieve(id);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true },
      });

      if (
        !user?.stripeCustomerId ||
        subscription.customer !== user.stripeCustomerId
      ) {
        return res
          .status(403)
          .json({ error: "Unauthorized", code: "UNAUTHORIZED_SUBSCRIPTION" });
      }

      if (immediately) {
        await stripeClient.subscriptions.cancel(id);
      } else {
        await stripeClient.subscriptions.update(id, {
          cancel_at_period_end: true,
        });
      }

      res.json({
        success: true,
        message: immediately
          ? "Subscription canceled immediately"
          : "Subscription will cancel at period end",
        code: immediately
          ? "SUBSCRIPTION_CANCELED_IMMEDIATE"
          : "SUBSCRIPTION_CANCEL_SCHEDULED",
      });
    } catch (error) {
      logger.error("Cancel subscription error:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  },
);

/**
 * POST /api/payments/charge-saved-method
 * Charge a saved payment method
 */
router.post(
  "/charge-saved-method",
  rateLimit({ windowMs: 5 * 60_000, maxRequests: 10 }),
  safeAuth,
  validateSchema(PaymentChargeSavedSchema),
  async (req: Request, res: Response) => {
    if (!stripeClient) {
      return res.status(503).json({
        error: "Stripe not configured",
        code: "STRIPE_NOT_CONFIGURED",
      });
    }

    try {
      const userId = (req as any).user.id;
      const { paymentMethodId, amount, description } = req.body as any;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true, email: true },
      });

      if (!user?.stripeCustomerId) {
        return res
          .status(404)
          .json({ error: "No customer record", code: "CUSTOMER_NOT_FOUND" });
      }

      // Create payment intent
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        customer: user.stripeCustomerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        description: description || "Payment",
        metadata: { userId },
      });

      res.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount,
        code: "PAYMENT_INTENT_OFF_SESSION_SUCCESS",
      });
    } catch (error: any) {
      logger.error("Charge saved method error:", error);

      if (error.type === "StripeCardError") {
        return res
          .status(400)
          .json({ error: error.message, code: "CARD_ERROR" });
      }

      res
        .status(500)
        .json({ error: "Payment failed", code: "OFF_SESSION_PAYMENT_FAILED" });
    }
  },
);

/**
 * POST /api/payments/create-intent
 * Create a Stripe PaymentIntent for on-session card collection (Stripe Elements)
 * Duplicate guard: if a pending intent with same (userId, amount, currency) exists in last 90s, reuse it.
 * Body: { amount: number, currency?: string, description?: string, metadata?: Record<string,string> }
 */
router.post(
  "/create-intent",
  rateLimit({ windowMs: 5 * 60_000, maxRequests: 15 }),
  safeAuth,
  validateSchema(PaymentCreateIntentSchema),
  async (req: Request, res: Response) => {
    if (!stripeClient) {
      return res.status(503).json({ error: "Stripe not configured" });
    }

    try {
      const userId = (req as any).user.id;
      let { amount, currency = "usd", description, metadata } = req.body as any;

      amount = Number(amount);
      currency = String(currency).toLowerCase();

      // Fetch user and ensure Stripe customer exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res
          .status(404)
          .json({ error: "User not found", code: "USER_NOT_FOUND" });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeClient.customers.create({
          email: user.email,
          name: user.firstName
            ? `${user.firstName} ${user.lastName}`
            : user.email,
          metadata: { userId },
        });
        customerId = customer.id;
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customerId },
        });
      }

      // Duplicate guard: look for existing pending transaction
      const duplicateWindowMs = Number(
        process.env.PAYMENT_INTENT_DUP_WINDOW_MS || 90_000,
      );
      const existing = await prisma.transactions.findFirst({
        where: {
          userId,
          amount,
          currency: currency.toUpperCase(),
          provider: "stripe",
          status: "pending",
          createdAt: { gte: new Date(Date.now() - duplicateWindowMs) },
        },
        orderBy: { createdAt: "desc" },
      });

      if (existing) {
        try {
          const reusedPI = await stripeClient.paymentIntents.retrieve(
            existing.orderId as string,
          );
          return res.json({
            success: true,
            reused: true,
            paymentIntentId: reusedPI.id,
            clientSecret: reusedPI.client_secret,
            amount: existing.amount,
            currency: existing.currency,
            transactionId: existing.id,
            code: "PAYMENT_INTENT_REUSED",
            duplicateWindowMs,
          });
        } catch (e) {
          logger.warn(
            "Failed to retrieve existing PaymentIntent, creating new",
            e,
          );
        }
      }

      // Generate idempotency key per (userId, amount, timestamp bucket) to avoid accidental duplicates
      const idempotencyKey = `${userId}-${amount}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;

      const paymentIntent = await stripeClient.paymentIntents.create(
        {
          amount: Math.round(amount * 100),
          currency,
          customer: customerId,
          automatic_payment_methods: { enabled: true },
          description: description || "Payment",
          metadata: { userId, ...(metadata || {}) },
        },
        { idempotencyKey },
      );

      // Record internal transaction with status pending until confirmation webhook updates it
      const transaction = await prisma.transactions.create({
        data: withDefaults({
          userId,
          amount,
          type: "payment_intent",
          description: description || "Stripe PaymentIntent",
          category: "card",
          status: "pending",
          currency: currency.toUpperCase(),
          orderId: paymentIntent.id,
          provider: "stripe",
        }),
      });

      res.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount,
        currency: currency.toUpperCase(),
        transactionId: transaction.id,
      });
    } catch (error) {
      logger.error("Create PaymentIntent error:", error);
      res.status(500).json({
        error: "Failed to create payment intent",
        code: "PAYMENT_INTENT_CREATE_FAILED",
      });
    }
  },
);

/**
 * POST /api/payments/admin/refund
 * Admin-only refund of a PaymentIntent (full or partial if amount provided)
 * Body: { paymentIntentId: string, amount?: number }
 */
router.post(
  "/admin/refund",
  safeAuth,
  safeAdmin,
  validateSchema(AdminRefundSchema),
  async (req: Request, res: Response) => {
    if (!stripeClient)
      return res.status(503).json({
        error: "Stripe not configured",
        code: "STRIPE_NOT_CONFIGURED",
      });
    const { paymentIntentId, amount } = req.body as any;
    try {
      const pi = await stripeClient.paymentIntents.retrieve(paymentIntentId, {
        expand: ["charges"],
      });
      const charges = pi.latest_charge
        ? [pi.latest_charge]
        : (pi as any).charges?.data || [];
      if (!charges.length)
        return res.status(404).json({
          error: "No charge found for intent",
          code: "CHARGE_NOT_FOUND",
        });
      const chargeId =
        typeof charges[0] === "string" ? charges[0] : charges[0].id;
      const refund = await stripeClient.refunds.create({
        charge: chargeId,
        amount: amount && amount > 0 ? Math.round(amount * 100) : undefined,
        metadata: { userId: (pi.metadata as any)?.userId || "unknown" },
      });

      const userId = (pi.metadata as any)?.userId;
      if (userId) {
        const refundAmount = amount && amount > 0 ? amount : pi.amount / 100;
        await prisma.$transaction(async (tx) => {
          // Decrement credited balance if previously incremented
          await tx.user.update({
            where: { id: userId },
            data: { usdBalance: { decrement: refundAmount } },
          });
          await tx.transactions.create({
            data: withDefaults({
              userId,
              type: "debit",
              amount: refundAmount,
              description: `Refund - PaymentIntent ${paymentIntentId}`,
              status: "completed",
              currency: (pi.currency || "usd").toUpperCase(),
              provider: "stripe",
            }),
          });
          await tx.audit_logs.create({
            data: withDefaults({
              userId,
              action: "refund",
              resourceType: "payment_intent",
              resourceId: paymentIntentId,
              metadata: {
                refundAmount,
                adminUserId: (req as any).user.id,
              },
              details: {
                paymentIntentId,
                partial: Boolean(amount && amount > 0),
              },
            }),
          });
        });
      }
      res.json({ success: true, refund, code: "REFUND_SUCCESS" });
    } catch (error) {
      logger.error("Admin refund error", error);
      res
        .status(500)
        .json({ error: "Failed to process refund", code: "REFUND_FAILED" });
    }
  },
);

export default router;
