import express from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { sendWebhook } from "../utils/webhookNotifier";
import prisma from "../prismaClient";

const router = express.Router();

// Require admin auth for all routes
router.use(authenticateToken, requireAdmin);

router.post("/webhook", async (req, res) => {
  const { message, level } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    await sendWebhook(message, level);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to send security webhook:", error);
    res.status(500).json({ error: "Failed to send webhook notification" });
  }
});

// Get current security level
router.get("/current", async (_req, res) => {
  try {
    const sinceHour = new Date(Date.now() - 60 * 60 * 1000);
    const blocksHour = await prisma.ipBlock.count({
      where: { updatedAt: { gt: sinceHour } },
    });

    // Compute security level
    let level: "green" | "orange" | "red" = "green";
    if (blocksHour > 15) level = "red";
    else if (blocksHour > 5) level = "orange";

    res.json({
      level,
      metrics: {
        lastHourIpBlocks: blocksHour,
      },
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to get security level:", error);
    res.status(500).json({ error: "Failed to compute security level" });
  }
});

export default router;
