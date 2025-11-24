import { Request, Response } from "express";
import { Server as SocketIOServer } from "socket.io";
import Stripe from "stripe";
import { config } from "../jobs/config";
import logger from "../logger";
import prisma from "../prismaClient";
import { withDefaults } from "../utils/prismaHelpers";

// Initialize a lightweight Stripe client for webhook verification
const stripeClient = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey)
  : null;

let paymentsIO: SocketIOServer | null = null;
export const setPaymentsSocketIO = (io: SocketIOServer) => {
  paymentsIO = io;
};

/**
 * Stripe webhook handler
 * Mount BEFORE express.json():
 * app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook)
 */
export const handleStripeWebhook = async (req: Request, res: Response) => {
  if (!stripeClient || !config.stripeWebhookSecret) {
    logger.warn("Stripe webhook received but Stripe not fully configured");
    return res.status(400).send("Webhook config error");
  }

  const sig = req.headers["stripe-signature"] as string | undefined;
  if (!sig) {
    return res.status(400).send("Missing signature");
  }

  try {
    const rawBody: Buffer = Buffer.isBuffer(req.body)
      ? (req.body as Buffer)
      : Buffer.from(
          typeof req.body === "string" ? req.body : JSON.stringify(req.body),
        );

    const event = stripeClient.webhooks.constructEvent(
      rawBody,
      sig,
      config.stripeWebhookSecret,
    );

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.id;
        // Attempt fee/net retrieval
        let feeInfo: { fee: number; net: number } | null = null;
        try {
          const chargeId =
            pi.latest_charge || (pi as any).charges?.data?.[0]?.id;
          if (chargeId) {
            const charge = await stripeClient!.charges.retrieve(
              typeof chargeId === "string" ? chargeId : chargeId.id,
              { expand: ["balance_transaction"] },
            );
            if (
              charge.balance_transaction &&
              typeof charge.balance_transaction !== "string"
            ) {
              const bt = charge.balance_transaction;
              feeInfo = { fee: bt.fee / 100, net: bt.net / 100 };
            }
          }
        } catch (e) {
          logger.warn("Balance transaction fetch failed", e);
        }
        const updated = await prisma.transactions.updateMany({
          where: { orderId, provider: "stripe", status: "pending" },
          data: {
            status: "completed",
            description: pi.description || "Payment succeeded",
          },
        });
        if (feeInfo) {
          const tx = await prisma.transactions.findFirst({
            where: { orderId },
          });
          if (tx) {
            await prisma.fee_revenues.create({
              data: withDefaults({
                transactionId: tx.id,
                transactionType: tx.type,
                userId: tx.userId,
                baseCurrency: tx.currency,
                baseAmount: tx.amount,
                feePercent: 0,
                flatFee: feeInfo.fee,
                totalFee: feeInfo.fee,
                netAmount: feeInfo.net,
                revenueUSD: feeInfo.fee,
              }),
            });
          }
        }
        if (updated) {
          const txRecord = await prisma.transactions.findFirst({
            where: { orderId },
          });
          if (txRecord) {
            await prisma.audit_logs.create({
              data: withDefaults({
                userId: txRecord.userId,
                action: "payment_intent_completed",
                resourceType: "payment_intent",
                resourceId: orderId,
                metadata: {
                  amount: txRecord.amount,
                  currency: txRecord.currency,
                },
                details: { status: "completed" },
              }),
            });
          }
        }
        if (paymentsIO && updated) {
          const tx = await prisma.transactions.findFirst({
            where: { orderId },
          });
          if (tx) {
            paymentsIO.to(`user-${tx.userId}`).emit("payment-status", {
              orderId,
              status: "completed",
              amount: tx.amount,
              currency: tx.currency,
            });
          }
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.id;
        const updated = await prisma.transactions.updateMany({
          where: { orderId, provider: "stripe", status: "pending" },
          data: {
            status: "failed",
            description: pi.last_payment_error?.message || "Payment failed",
          },
        });
        if (updated) {
          const txRecord = await prisma.transactions.findFirst({
            where: { orderId },
          });
          if (txRecord) {
            await prisma.audit_logs.create({
              data: withDefaults({
                userId: txRecord.userId,
                action: "payment_intent_failed",
                resourceType: "payment_intent",
                resourceId: orderId,
                metadata: { error: pi.last_payment_error?.message },
                details: { status: "failed" },
              }),
            });
          }
        }
        if (paymentsIO && updated) {
          const tx = await prisma.transactions.findFirst({
            where: { orderId },
          });
          if (tx) {
            paymentsIO.to(`user-${tx.userId}`).emit("payment-status", {
              orderId,
              status: "failed",
              amount: tx.amount,
              currency: tx.currency,
            });
          }
        }
        break;
      }
      case "payment_intent.canceled": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.id;
        const updated = await prisma.transactions.updateMany({
          where: { orderId, provider: "stripe", status: "pending" },
          data: { status: "canceled", description: "Payment canceled" },
        });
        if (updated) {
          const txRecord = await prisma.transactions.findFirst({
            where: { orderId },
          });
          if (txRecord) {
            await prisma.audit_logs.create({
              data: withDefaults({
                userId: txRecord.userId,
                action: "payment_intent_canceled",
                resourceType: "payment_intent",
                resourceId: orderId,
                metadata: {},
                details: { status: "canceled" },
              }),
            });
          }
        }
        if (paymentsIO && updated) {
          const tx = await prisma.transactions.findFirst({
            where: { orderId },
          });
          if (tx) {
            paymentsIO.to(`user-${tx.userId}`).emit("payment-status", {
              orderId,
              status: "canceled",
              amount: tx.amount,
              currency: tx.currency,
            });
          }
        }
        break;
      }
      default:
        // Ignore other event types for now
        break;
    }

    res.json({ received: true });
  } catch (err: any) {
    logger.error("Stripe webhook error", { error: err.message });
    res.status(400).send("Webhook Error");
  }
};

export default handleStripeWebhook;
