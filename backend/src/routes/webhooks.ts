import crypto from "crypto";
import { Request, Response, Router } from "express";
import EmailMonitoringService, {
  EmailEventType,
} from "../services/emailMonitoringService";
import { winstonLogger as logger } from "../utils/winstonLogger";

const router = Router();

/**
 * Verify Resend webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  } catch (error) {
    logger.error("Webhook signature verification failed:", error);
    return false;
  }
}

/**
 * Resend Webhook Handler
 * Handles email events: delivered, bounced, complained, opened, clicked
 *
 * Setup in Resend Dashboard:
 * 1. Go to https://resend.com/webhooks
 * 2. Add endpoint: https://api.advanciapayledger.com/api/webhooks/resend
 * 3. Select events: email.sent, email.delivered, email.bounced, email.complained, email.opened, email.clicked
 * 4. Copy webhook secret to environment: RESEND_WEBHOOK_SECRET
 */
router.post("/resend", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["resend-signature"] as string;
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    // Verify webhook signature (if secret is configured)
    if (webhookSecret) {
      const payload = JSON.stringify(req.body);

      if (
        !signature ||
        !verifyWebhookSignature(payload, signature, webhookSecret)
      ) {
        logger.warn("Invalid webhook signature");
        return res.status(401).json({
          success: false,
          error: "Invalid signature",
        });
      }
    }

    const event = req.body;
    const eventType = event.type;

    logger.info(`Resend webhook received: ${eventType}`, {
      emailId: event.data?.email_id,
      recipient: event.data?.to,
    });

    // Process different event types
    switch (eventType) {
      case "email.sent":
        await handleEmailSent(event.data);
        break;

      case "email.delivered":
        await handleEmailDelivered(event.data);
        break;

      case "email.delivery_delayed":
        await handleEmailDelayed(event.data);
        break;

      case "email.bounced":
        await handleEmailBounced(event.data);
        break;

      case "email.complained":
        await handleEmailComplained(event.data);
        break;

      case "email.opened":
        await handleEmailOpened(event.data);
        break;

      case "email.clicked":
        await handleEmailClicked(event.data);
        break;

      default:
        logger.warn(`Unknown webhook event type: ${eventType}`);
    }

    // Acknowledge receipt
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error("Webhook processing error:", error);
    res.status(500).json({
      success: false,
      error: "Webhook processing failed",
    });
  }
});

/**
 * Handle email sent event
 */
async function handleEmailSent(data: any): Promise<void> {
  await EmailMonitoringService.trackEvent({
    emailId: data.email_id,
    type: EmailEventType.SENT,
    recipient: data.to[0] || data.to,
    subject: data.subject,
    metadata: {
      from: data.from,
      tags: data.tags,
    },
  });
}

/**
 * Handle email delivered event
 */
async function handleEmailDelivered(data: any): Promise<void> {
  await EmailMonitoringService.trackEvent({
    emailId: data.email_id,
    type: EmailEventType.DELIVERED,
    recipient: data.to[0] || data.to,
    metadata: {
      deliveredAt: data.delivered_at,
    },
  });
}

/**
 * Handle email delayed event
 */
async function handleEmailDelayed(data: any): Promise<void> {
  logger.warn(`Email delivery delayed: ${data.email_id}`, {
    recipient: data.to,
    reason: data.response,
  });

  await EmailMonitoringService.logSuspiciousActivity({
    type: "DELIVERY_DELAYED",
    email: data.to[0] || data.to,
    reason: data.response || "Unknown delay reason",
    timestamp: new Date(),
    metadata: { emailId: data.email_id },
  });
}

/**
 * Handle email bounced event
 */
async function handleEmailBounced(data: any): Promise<void> {
  const bounceType = data.bounce_type; // "hard" or "soft"
  const recipient = data.to[0] || data.to;

  logger.warn(`Email bounced (${bounceType}): ${recipient}`, {
    emailId: data.email_id,
    reason: data.response,
  });

  await EmailMonitoringService.trackEvent({
    emailId: data.email_id,
    type: EmailEventType.BOUNCED,
    recipient,
    metadata: {
      bounceType,
      reason: data.response,
      bouncedAt: data.bounced_at,
    },
  });

  // Log suspicious activity for hard bounces
  if (bounceType === "hard") {
    await EmailMonitoringService.logSuspiciousActivity({
      type: "HARD_BOUNCE",
      email: recipient,
      reason: `Hard bounce: ${data.response}`,
      timestamp: new Date(),
      metadata: { emailId: data.email_id },
    });
  }
}

/**
 * Handle spam complaint event
 */
async function handleEmailComplained(data: any): Promise<void> {
  const recipient = data.to[0] || data.to;

  logger.error(`Spam complaint received: ${recipient}`, {
    emailId: data.email_id,
  });

  await EmailMonitoringService.trackEvent({
    emailId: data.email_id,
    type: EmailEventType.COMPLAINED,
    recipient,
    metadata: {
      complainedAt: data.complained_at,
      feedbackType: data.feedback_type,
    },
  });

  // This is critical - log and alert
  await EmailMonitoringService.logSuspiciousActivity({
    type: "SPAM_COMPLAINT",
    email: recipient,
    reason: "User marked email as spam",
    timestamp: new Date(),
    metadata: {
      emailId: data.email_id,
      feedbackType: data.feedback_type,
    },
  });
}

/**
 * Handle email opened event
 */
async function handleEmailOpened(data: any): Promise<void> {
  await EmailMonitoringService.trackEvent({
    emailId: data.email_id,
    type: EmailEventType.OPENED,
    recipient: data.to[0] || data.to,
    metadata: {
      openedAt: data.opened_at,
      userAgent: data.user_agent,
      ipAddress: data.ip_address,
    },
  });
}

/**
 * Handle email clicked event
 */
async function handleEmailClicked(data: any): Promise<void> {
  await EmailMonitoringService.trackEvent({
    emailId: data.email_id,
    type: EmailEventType.CLICKED,
    recipient: data.to[0] || data.to,
    metadata: {
      clickedAt: data.clicked_at,
      link: data.link,
      userAgent: data.user_agent,
      ipAddress: data.ip_address,
    },
  });
}

/**
 * Test webhook endpoint (for development)
 */
router.post("/resend/test", async (req: Request, res: Response) => {
  try {
    logger.info("Test webhook received:", req.body);

    res.status(200).json({
      success: true,
      message: "Test webhook received",
      data: req.body,
    });
  } catch (error) {
    logger.error("Test webhook error:", error);
    res.status(500).json({
      success: false,
      error: "Test webhook failed",
    });
  }
});

/**
 * Get webhook status and statistics
 */
router.get("/resend/status", async (req: Request, res: Response) => {
  try {
    const metrics = EmailMonitoringService.getMetrics();
    const blocklistStats = EmailMonitoringService.getBlocklistStats();
    const healthReport = await EmailMonitoringService.getHealthReport();

    res.status(200).json({
      success: true,
      data: {
        webhookConfigured: !!process.env.RESEND_WEBHOOK_SECRET,
        metrics,
        blocklistStats,
        healthReport,
      },
    });
  } catch (error) {
    logger.error("Webhook status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get webhook status",
    });
  }
});

/**
 * NOWPayments Webhook Handler
 * Handles payout status updates from NOWPayments
 *
 * Setup in NOWPayments Dashboard:
 * 1. Go to https://dashboard.nowpayments.io/settings/api
 * 2. Set IPN URL: https://api.advanciapayledger.com/api/webhooks/nowpayments
 * 3. Enable payout notifications
 * 4. Copy IPN secret to environment: NOWPAYMENTS_IPN_SECRET
 */
router.post("/nowpayments", async (req: Request, res: Response) => {
  try {
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;

    // Verify webhook signature (if secret is configured)
    if (ipnSecret) {
      const signature = req.headers["x-nowpayments-sig"] as string;
      const payload = JSON.stringify(req.body);

      if (!signature) {
        logger.warn("NOWPayments webhook missing signature");
        return res.status(401).json({ error: "Missing signature" });
      }

      // Verify HMAC signature
      const expectedSignature = crypto
        .createHmac("sha512", ipnSecret)
        .update(payload)
        .digest("hex");

      if (signature !== expectedSignature) {
        logger.warn(
          {
            expectedSignature,
            receivedSignature: signature,
          },
          "NOWPayments webhook signature verification failed",
        );
        return res.status(401).json({ error: "Invalid signature" });
      }
    }

    const webhookData = req.body;
    logger.info(
      {
        payoutId: webhookData.payout_id,
        status: webhookData.status,
        currency: webhookData.currency,
        amount: webhookData.amount,
      },
      "Received NOWPayments webhook",
    );

    // Import here to avoid circular dependencies
    const { handleNOWPaymentsWebhook } = await import(
      "../services/nowpaymentsService.js"
    );

    // Process the webhook
    const result = await handleNOWPaymentsWebhook(webhookData);

    if (result.success) {
      logger.info(
        {
          payoutId: webhookData.payout_id,
          status: webhookData.status,
        },
        "NOWPayments webhook processed successfully",
      );

      res.status(200).json({ success: true, message: result.message });
    } else {
      logger.error(
        {
          payoutId: webhookData.payout_id,
          error: result.message,
        },
        "NOWPayments webhook processing failed",
      );

      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error: any) {
    logger.error(
      {
        error: error.message,
        stack: error.stack,
        body: req.body,
      },
      "NOWPayments webhook error",
    );

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
