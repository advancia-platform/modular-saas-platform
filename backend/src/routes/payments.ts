import { Router } from "express";
import { Server } from "socket.io";
import Stripe from "stripe";
import { config } from "../config";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";

const router = Router();

let io: Server | null = null;
export const setPaymentsSocketIO = (ioServer: Server) => {
  io = ioServer;
};

const stripeClient = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey, {
      apiVersion: "2023-10-16",
    })
  : null;

// Quick health endpoint to verify Stripe wiring
router.get("/health", (req, res) => {
  return res.json({ stripeConfigured: Boolean(stripeClient) });
});

// Create a Checkout Session, requiring auth; attach userId to metadata server-side
router.post(
  "/checkout-session",
  authenticateToken as any,
  async (req: any, res) => {
    if (!stripeClient) {
      return res
        .status(503)
        .json({
          error: "Stripe is not configured. Please provide STRIPE_SECRET_KEY.",
        });
    }

    const { amount, currency = "usd", metadata } = req.body || {};
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: "A positive amount is required." });
    }

    try {
      const userId = req.user?.userId;
      const mergedMetadata = {
        ...(metadata ?? {}),
        ...(userId ? { userId } : {}),
      } as Record<string, string>;
      const session = await stripeClient.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: Math.round(Number(amount) * 100),
              product_data: { name: "Account Top-Up" },
            },
            quantity: 1,
          },
        ],
        metadata: mergedMetadata,
        success_url: `${config.frontendUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.frontendUrl}/payments/cancel`,
      });

      return res.json({ url: session.url, id: session.id });
    } catch (error) {
      console.error("Stripe checkout session error", error);
      return res
        .status(500)
        .json({ error: "Unable to create checkout session." });
    }
  }
);

// Retrieve a Checkout Session by id for the authenticated user
router.get("/session/:id", authenticateToken as any, async (req: any, res) => {
  if (!stripeClient) {
    return res.status(503).json({ error: "Stripe is not configured." });
  }
  const sessionId = req.params.id;
  if (!sessionId) return res.status(400).json({ error: "session id required" });

  try {
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);
    const metaUserId = (session.metadata?.userId as string) || undefined;
    if (metaUserId && metaUserId !== req.user?.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return res.json({
      id: session.id,
      amount_total: session.amount_total,
      currency: session.currency,
      status: session.status,
      payment_status: session.payment_status,
      metadata: session.metadata || {},
    });
  } catch (err: any) {
    console.error("Error retrieving session", err?.message || err);
    return res.status(404).json({ error: "Session not found" });
  }
});

// Admin: List payments
router.get(
  "/admin/payments",
  authenticateToken as any,
  requireAdmin as any,
  async (req: any, res) => {
    if (!stripeClient)
      return res.status(503).json({ error: "Stripe not configured" });

    try {
      const { limit = 10, starting_after } = req.query;

      const payments = await stripeClient.paymentIntents.list({
        limit: Number(limit),
        starting_after: starting_after as string,
      });

      return res.json(payments);
    } catch (error) {
      console.error("Admin payments list error", error);
      return res.status(500).json({ error: "Failed to list payments" });
    }
  }
);

// Admin: Refund payment
router.post(
  "/admin/refund/:paymentId",
  authenticateToken as any,
  requireAdmin as any,
  async (req: any, res) => {
    if (!stripeClient)
      return res.status(503).json({ error: "Stripe not configured" });

    try {
      const refund = await stripeClient.refunds.create({
        payment_intent: req.params.paymentId,
      });

      // Update user balance and create refund transaction
      const payment = await stripeClient.paymentIntents.retrieve(
        req.params.paymentId
      );
      const userId = payment.metadata?.userId;

      if (userId) {
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: userId },
            data: {
              usdBalance: {
                decrement: Number(payment.amount) / 100,
              },
            },
          });

          await tx.transaction.create({
            data: {
              userId,
              type: "debit",
              amount: Number(payment.amount) / 100,
              description: `Refund - Payment ${payment.id}`,
              status: "completed",
            },
          });
        });

        if (io) {
          io.to(`user-${userId}`).emit("transaction-created", {
            type: "DEBIT",
            amount: payment.amount / 100,
          });
        }
      }

      return res.json(refund);
    } catch (error) {
      console.error("Admin refund error", error);
      return res.status(500).json({ error: "Failed to process refund" });
    }
  }
);

// Webhook handler (to be mounted before express.json in index.ts)
export const handleStripeWebhook = async (req: any, res: any) => {
  const sig = req.headers["stripe-signature"];

  if (!stripeClient || !config.stripeWebhookSecret) {
    console.warn("Stripe webhook received but Stripe is not fully configured");
    return res.status(400).send("Webhook Error");
  }

  try {
    const rawBody: Buffer = Buffer.isBuffer(req.body)
      ? (req.body as Buffer)
      : Buffer.from(
          typeof req.body === "string" ? req.body : JSON.stringify(req.body)
        );

    const event = stripeClient.webhooks.constructEvent(
      rawBody,
      sig as string,
      config.stripeWebhookSecret
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error("No userId in session metadata", session.id);
          return res.status(400).send("Missing userId in metadata");
        }

        // Begin transaction
        await prisma.$transaction(async (tx) => {
          // Credit user's balance
          await tx.user.update({
            where: { id: userId },
            data: {
              usdBalance: {
                increment: Number(session.amount_total) / 100,
              },
            },
          });

          // Record the transaction
          await tx.transaction.create({
            data: {
              userId,
              type: "credit",
              amount: Number(session.amount_total) / 100,
              description: `Stripe payment - Session ${session.id}`,
              status: "completed",
            },
          });
        });

        // Emit socket events
        if (io) {
          io.to(`user-${userId}`).emit("transaction-created", {
            type: "CREDIT",
            amount: Number(session.amount_total || 0) / 100,
          });
        }

        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(400).send("Webhook Error");
  }
};

export default router;
