import express from "express";
import prisma from "../prismaClient";
import { authenticateToken, requireAdmin } from "../middleware/auth";

const router = express.Router();

// Require admin authentication for all routes
router.use(authenticateToken, requireAdmin);

router.get("/", async (_req, res) => {
  try {
    const blocks = await prisma.ipBlock.findMany({
      orderBy: { updatedAt: "desc" },
    });
    res.json(blocks);
  } catch (error) {
    console.error("Failed to fetch IP blocks:", error);
    res.status(500).json({ error: "Failed to fetch IP blocks" });
  }
});

router.post("/unblock", async (req, res) => {
  if (!req.body.ip) {
    return res.status(400).json({ error: "IP address required" });
  }

  try {
    await prisma.ipBlock.deleteMany({
      where: { ip: req.body.ip },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to unblock IP:", error);
    res.status(500).json({ error: "Failed to unblock IP" });
  }
});

export default router;
