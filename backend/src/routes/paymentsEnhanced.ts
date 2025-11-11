import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";
import { config } from "../jobs/config";
import logger from "../logger";

const router = Router();
const prisma = new PrismaClient();

const stripeClient = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey, {
      apiVersion: "2023-10-16",
    })
  : null;

/**
 * POST /api/payments/save-method
 * Save a payment method to customer for future use
 */
router.post("/save-method", authenticateToken, async (req: Request, res: Response) => {
  if (!stripeClient) {
    return res.status(503).json({ error: "Stripe not configured" });
  }

  try {
    const userId = (req as any).user.id;
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({ error: "Payment method ID required" });
    }

    // Get or create Stripe customer
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripeClient.customers.create({
        email: user.email,
        name: user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
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
    });
  } catch (error) {
    logger.error("Save payment method error:", error);
    res.status(500).json({ error: "Failed to save payment method" });
  }
});

/**
 * GET /api/payments/methods
 * List saved payment methods
 */
router.get("/methods", authenticateToken, async (req: Request, res: Response) => {
  if (!stripeClient) {
    return res.status(503).json({ error: "Stripe not configured" });
  }

  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return res.json({ methods: [] });
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

    res.json({ success: true, methods });
  } catch (error) {
    logger.error("List payment methods error:", error);
    res.status(500).json({ error: "Failed to list payment methods" });
  }
});

/**
 * DELETE /api/payments/methods/:id
 * Remove a saved payment method
 */
router.delete("/methods/:id", authenticateToken, async (req: Request, res: Response) => {
  if (!stripeClient) {
    return res.status(503).json({ error: "Stripe not configured" });
  }

  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return res.status(404).json({ error: "No saved payment methods" });
    }

    // Verify payment method belongs to this customer
    const paymentMethod = await stripeClient.paymentMethods.retrieve(id);
    if (paymentMethod.customer !== user.stripeCustomerId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await stripeClient.paymentMethods.detach(id);

    res.json({ success: true, message: "Payment method removed" });
  } catch (error) {
    logger.error("Delete payment method error:", error);
    res.status(500).json({ error: "Failed to delete payment method" });
  }
});

/**
 * POST /api/payments/subscription/create
 * Create a recurring payment subscription
 */
router.post("/subscription/create", authenticateToken, async (req: Request, res: Response) => {
  if (!stripeClient) {
    return res.status(503).json({ error: "Stripe not configured" });
  }

  try {
    const userId = (req as any).user.id;
    const { priceId, paymentMethodId, planName, amount, interval = "month" } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid amount required" });
    }

    // Get or create customer
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripeClient.customers.create({
        email: user.email,
        name: user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
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
      currentPeriodEnd: subscription.current_period_end,
      amount,
      interval,
    });
  } catch (error) {
    logger.error("Create subscription error:", error);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

/**
 * GET /api/payments/subscriptions
 * List user's active subscriptions
 */
router.get("/subscriptions", authenticateToken, async (req: Request, res: Response) => {
  if (!stripeClient) {
    return res.status(503).json({ error: "Stripe not configured" });
  }

  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return res.json({ subscriptions: [] });
    }

    const subscriptions = await stripeClient.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "all",
    });

    const formatted = subscriptions.data.map((sub) => ({
      id: sub.id,
      status: sub.status,
      planName: sub.metadata?.planName || "Subscription",
      amount: sub.items.data[0]?.price.unit_amount ? sub.items.data[0].price.unit_amount / 100 : 0,
      interval: sub.items.data[0]?.price.recurring?.interval,
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      created: sub.created,
    }));

    res.json({ success: true, subscriptions: formatted });
  } catch (error) {
    logger.error("List subscriptions error:", error);
    res.status(500).json({ error: "Failed to list subscriptions" });
  }
});

/**
 * POST /api/payments/subscription/:id/cancel
 * Cancel a subscription
 */
router.post("/subscription/:id/cancel", authenticateToken, async (req: Request, res: Response) => {
  if (!stripeClient) {
    return res.status(503).json({ error: "Stripe not configured" });
  }

  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { immediately = false } = req.body;

    // Verify subscription belongs to user
    const subscription = await stripeClient.subscriptions.retrieve(id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId || subscription.customer !== user.stripeCustomerId) {
      return res.status(403).json({ error: "Unauthorized" });
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
    });
  } catch (error) {
    logger.error("Cancel subscription error:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

/**
 * POST /api/payments/charge-saved-method
 * Charge a saved payment method
 */
router.post("/charge-saved-method", authenticateToken, async (req: Request, res: Response) => {
  if (!stripeClient) {
    return res.status(503).json({ error: "Stripe not configured" });
  }

  try {
    const userId = (req as any).user.id;
    const { paymentMethodId, amount, description } = req.body;

    if (!paymentMethodId || !amount || amount <= 0) {
      return res.status(400).json({ error: "Payment method and amount required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true },
    });

    if (!user?.stripeCustomerId) {
      return res.status(404).json({ error: "No customer record" });
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
    });
  } catch (error: any) {
    logger.error("Charge saved method error:", error);

    if (error.type === "StripeCardError") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Payment failed" });
  }
});

export default router;
