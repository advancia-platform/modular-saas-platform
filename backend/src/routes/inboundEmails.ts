/**
 * Inbound Email Webhook Route
 *
 * Receives email metadata from Cloudflare Email Worker
 * Logs and tracks inbound privacy/legal/support emails
 */

import { Request, Response, Router } from "express";
import logger from "../logger";
import prisma from "../prismaClient";

const router = Router();

interface InboundEmailPayload {
  from: string;
  to: string;
  subject: string;
  receivedAt: string;
  category: "privacy" | "legal" | "support" | "unknown";
  messageId: string;
  preview?: string;
  source?: string;
}

/**
 * POST /api/emails/inbound
 * Webhook endpoint for Cloudflare Email Worker
 */
router.post("/inbound", async (req: Request, res: Response) => {
  try {
    // Validate worker secret (use RESEND_API_KEY as shared secret)
    const workerSecret = req.headers["x-worker-secret"];
    const expectedSecret = process.env.RESEND_API_KEY;

    if (!workerSecret || workerSecret !== expectedSecret) {
      logger.warn("Unauthorized inbound email webhook attempt", {
        ip: req.ip,
        headers: Object.keys(req.headers),
      });
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payload: InboundEmailPayload = req.body;

    // Validate required fields
    if (!payload.from || !payload.to || !payload.messageId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    logger.info("Inbound email received", {
      from: payload.from,
      to: payload.to,
      category: payload.category,
      messageId: payload.messageId,
    });

    // Log to database (using AuditLog or create new EmailLog table)
    try {
      await prisma.auditLog.create({
        data: {
          action: "INBOUND_EMAIL",
          entityType: "Email",
          entityId: payload.messageId,
          details: {
            from: payload.from,
            to: payload.to,
            subject: payload.subject,
            category: payload.category,
            receivedAt: payload.receivedAt,
            preview: payload.preview?.substring(0, 200),
            source: payload.source || "cloudflare-email-worker",
          },
          ipAddress: req.ip || "unknown",
          userAgent: req.headers["user-agent"] || "cloudflare-worker",
        },
      });
    } catch (dbError) {
      // Log error but don't fail the webhook
      logger.error("Failed to log inbound email to database", {
        error: dbError,
        messageId: payload.messageId,
      });
    }

    // Track metrics by category
    const categoryMetrics: Record<string, number> = {
      privacy: 0,
      legal: 0,
      support: 0,
      unknown: 0,
    };
    categoryMetrics[payload.category] = 1;

    logger.info("Inbound email logged successfully", {
      messageId: payload.messageId,
      category: payload.category,
    });

    return res.status(200).json({
      success: true,
      messageId: payload.messageId,
      logged: true,
    });
  } catch (error) {
    logger.error("Error processing inbound email webhook", { error });
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/emails/inbound/stats
 * Get inbound email statistics (admin only)
 */
router.get("/inbound/stats", async (req: Request, res: Response) => {
  try {
    // Get stats from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await prisma.auditLog.findMany({
      where: {
        action: "INBOUND_EMAIL",
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        details: true,
        createdAt: true,
      },
    });

    // Aggregate by category
    const stats = {
      total: logs.length,
      byCategory: {
        privacy: 0,
        legal: 0,
        support: 0,
        unknown: 0,
      },
      last7Days: 0,
      last24Hours: 0,
    };

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    logs.forEach((log) => {
      const details = log.details as { category?: string };
      const category = details.category || "unknown";

      if (category in stats.byCategory) {
        stats.byCategory[category as keyof typeof stats.byCategory]++;
      }

      if (log.createdAt >= sevenDaysAgo) {
        stats.last7Days++;
      }
      if (log.createdAt >= oneDayAgo) {
        stats.last24Hours++;
      }
    });

    return res.json(stats);
  } catch (error) {
    logger.error("Error fetching inbound email stats", { error });
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
