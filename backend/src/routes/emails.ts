import { Request, Response, Router } from "express";
import prisma from "../prismaClient";
import emailService from "../services/emailService";
import { withDefaults } from "../utils/prismaHelpers";

const router = Router();

// POST /api/emails/send - Send transactional email
router.post("/send", async (req: Request, res: Response) => {
  try {
    const { to, subject, template, data, userId } = req.body;

    if (!to || !subject || !template) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let result;

    // Send based on template type
    switch (template) {
      case "welcome":
        result = await emailService.sendWelcomeEmail(to, data.username);
        break;
      case "transaction":
        result = await emailService.sendTransactionConfirmation(to, data);
        break;
      case "invoice":
        result = await emailService.sendInvoiceEmail(to, data, data.pdfUrl);
        break;
      case "reward":
        result = await emailService.sendRewardClaimedEmail(to, data);
        break;
      case "tier-upgrade":
        result = await emailService.sendTierUpgradeEmail(to, data);
        break;
      case "password-reset":
        result = await emailService.sendPasswordResetEmail(to, data.resetToken);
        break;
      default:
        return res.status(400).json({ error: "Invalid template type" });
    }

    // Log email
    await prisma.email_logs.create({
      data: withDefaults({
        userId,
        to,
        subject,
        template,
        status: result.success ? "sent" : "failed",
        providerId: result.id,
        error: result.error,
        sentAt: result.success ? new Date() : null,
        metadata: data,
      }),
    });

    res.json({
      success: result.success,
      message: result.success
        ? "Email sent successfully"
        : "Email failed to send",
      error: result.error,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// GET /api/emails/logs/:userId - Get user email history
router.get("/logs/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, template, status } = req.query;

    const where: any = { userId };
    if (template) where.template = template;
    if (status) where.status = status;

    const logs = await prisma.email_logs.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.email_logs.count({ where });

    res.json({
      logs,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error("Error fetching email logs:", error);
    res.status(500).json({ error: "Failed to fetch email logs" });
  }
});

// GET /api/emails/stats - Get email statistics (admin)
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const totalEmails = await prisma.email_logs.count();
    const sentEmails = await prisma.email_logs.count({
      where: { status: "sent" },
    });
    const failedEmails = await prisma.email_logs.count({
      where: { status: "failed" },
    });

    const emailsByTemplate = await prisma.email_logs.groupBy({
      by: ["template"],
      _count: true,
    });

    res.json({
      totalEmails,
      sentEmails,
      failedEmails,
      deliveryRate:
        totalEmails > 0 ? ((sentEmails / totalEmails) * 100).toFixed(2) : 0,
      byTemplate: emailsByTemplate,
    });
  } catch (error) {
    console.error("Error fetching email stats:", error);
    res.status(500).json({ error: "Failed to fetch email statistics" });
  }
});

export default router;
