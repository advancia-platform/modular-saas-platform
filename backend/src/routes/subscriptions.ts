import express, { Request, Response } from "express";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// GET /api/subscriptions/me - returns current user's subscription (mock)
router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    // Placeholder: return a mock subscription until Prisma models exist
    const subscription = {
      id: "sub_mock_001",
      status: "ACTIVE",
      currentPeriodStart: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
      plan: {
        name: "Pro",
        price: "29.00",
        features: [
          "Priority support",
          "Advanced analytics",
          "Increased rate limits",
        ],
      },
      invoices: [
        {
          id: "inv_001",
          amount: "29.00",
          status: "paid",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      userId,
    };

    res.json({ subscription, success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

export default router;
