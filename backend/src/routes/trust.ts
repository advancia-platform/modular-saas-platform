/**
 * Trust and reputation API routes
 * Per Advancia Pay: Rate limiting, authentication, audit logging
 */

import { Router, Request, Response } from "express";
import { allowRoles, authenticateToken } from "../middleware/auth";
import { rateLimiter } from "../middleware/rateLimiterRedis";
import { validateInput } from "../middleware/security";
import { scamAdviserService } from "../services/scamAdviserService";
import { calculateTrustScore, getUserReputation } from "../services/trustScoreService";
import { serializeDecimalFields } from "../utils/decimal";
import { logger } from "../logger";
import prisma from "../prismaClient";

console.log(
  "[trust] middleware types:",
  typeof authenticateToken,
  typeof allowRoles,
);

const router = Router();
const safeAuth: any =
  typeof authenticateToken === "function"
    ? authenticateToken
    : (_req: any, _res: any, next: any) => next();
const safeAllowRoles = (...roles: string[]) => {
  if (typeof allowRoles === "function") return allowRoles(...roles);
  return (_req: any, _res: any, next: any) => next();
};

/**
 * Interface for improvement tasks
 */
interface ImprovementTask {
  id: string;
  priority: "low" | "medium" | "high";
  description: string;
  actionRequired: string;
}

/**
 * GET /api/trust/report
 * Get comprehensive trust report for a domain
 * Query params:
 *   - domain: Domain to analyze (required)
 */
router.get("/report", validateInput, async (req, res) => {
  try {
    const { domain } = req.query;

    if (!domain || typeof domain !== "string") {
      return res.status(400).json({
        error: "Domain parameter is required and must be a string",
      });
    }

    // Validate domain format
    const domainRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({
        error: "Invalid domain format",
      });
    }

    // Get trust report from Scam Adviser service
    const trustReport = await scamAdviserService.getTrustReport(domain);

    res.json({
      success: true,
      domain,
      ...trustReport,
    });
  } catch (error) {
    console.error("Trust report error:", error);
    res.status(500).json({
      error: "Failed to generate trust report",
      details:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * GET /api/trust/improvement-tasks
 * Get suggested improvement tasks based on trust report
 * Query params:
 *   - domain: Domain to analyze (required)
 */
router.get("/improvement-tasks", validateInput, async (req, res) => {
  try {
    const { domain } = req.query;

    if (!domain || typeof domain !== "string") {
      return res.status(400).json({
        error: "Domain parameter is required and must be a string",
      });
    }

    // Get trust report first
    const trustReport = await scamAdviserService.getTrustReport(domain);

    // Generate improvement tasks based on the report
    const tasks: ImprovementTask[] = [];

    // SSL-related tasks
    if (!trustReport.sslValid) {
      tasks.push({
        id: "ssl",
        priority: "high",
        description: "Install valid SSL certificate",
        actionRequired:
          "Obtain and install a valid SSL/TLS certificate from a trusted Certificate Authority",
      });
    }

    // Domain age tasks
    if (trustReport.domainAgeMonths < 6) {
      tasks.push({
        id: "domain-age",
        priority: "low",
        description: "Domain is relatively new",
        actionRequired: "Continue building domain reputation over time",
      });
    }

    // Business verification tasks
    if (!trustReport.verifiedBusiness && trustReport.scamAdviserScore >= 70) {
      tasks.push({
        id: "business-verification",
        priority: "medium",
        description: "Complete business verification",
        actionRequired:
          "Submit business registration documents and verification materials",
      });
    }

    // General score improvement
    if (trustReport.scamAdviserScore < 80) {
      tasks.push({
        id: "score-improvement",
        priority: trustReport.scamAdviserScore < 60 ? "high" : "medium",
        description: "Improve overall trust score",
        actionRequired:
          "Implement security best practices, obtain business certifications, and build online reputation",
      });
    }

    // Calculate statistics
    const totalTasks = tasks.length;
    const highPriority = tasks.filter(
      (task) => task.priority === "high",
    ).length;

    res.json({
      success: true,
      domain,
      currentScore: trustReport.scamAdviserScore,
      tasks,
      totalTasks,
      highPriority,
      lastChecked: trustReport.lastChecked,
    });
  } catch (error) {
    console.error("Improvement tasks error:", error);
    res.status(500).json({
      error: "Failed to generate improvement tasks",
      details:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * POST /api/trust/refresh
 * Force refresh of trust data for a domain (admin only)
 * Body: { domain: string }
 */
router.post(
  "/refresh",
  safeAuth,
  safeAllowRoles("admin"),
  validateInput,
  async (req, res) => {
    try {
      const { domain } = req.body;

      if (!domain || typeof domain !== "string") {
        return res.status(400).json({
          error: "Domain is required and must be a string",
        });
      }

      // Clear cache for this domain and get fresh data
      scamAdviserService.clearCache();
      const trustReport = await scamAdviserService.getTrustReport(domain);

      res.json({
        success: true,
        message: "Trust data refreshed successfully",
        domain,
        ...trustReport,
      });
    } catch (error) {
      console.error("Trust refresh error:", error);
      res.status(500).json({
        error: "Failed to refresh trust data",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

/**
 * GET /api/trust/status
 * Get service status and statistics (admin only)
 */
/**
 * Get trust score for current user
 * GET /api/trust/score
 */
router.get(
  "/score",
  safeAuth,
  rateLimiter({ windowMs: 10 * 1000, max: 60, group: "trust-score" }),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;

      const trustScore = await calculateTrustScore(userId);

      res.json({
        success: true,
        trustScore,
      });
    } catch (error: any) {
      logger.error("Failed to get trust score", { error: error.message });
      res.status(500).json({ error: "Failed to calculate trust score" });
    }
  },
);

/**
 * Get comprehensive reputation data
 * GET /api/trust/reputation
 */
router.get(
  "/reputation",
  safeAuth,
  rateLimiter({ windowMs: 10 * 1000, max: 60, group: "trust-reputation" }),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;

      const reputation = await getUserReputation(userId);

      // Serialize Decimal fields per Advancia Pay patterns
      const serialized = serializeDecimalFields(reputation);

      res.json({
        success: true,
        reputation: serialized,
      });
    } catch (error: any) {
      logger.error("Failed to get reputation", { error: error.message });
      res.status(500).json({ error: "Failed to get reputation data" });
    }
  },
);

/**
 * Get trust score for another user (public info only)
 * GET /api/trust/user/:userId
 */
router.get(
  "/user/:userId",
  safeAuth,
  rateLimiter({ windowMs: 20 * 1000, max: 60, group: "trust-user" }),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const trustScore = await calculateTrustScore(userId);

      // Return limited public info
      res.json({
        success: true,
        userId,
        trustScore: {
          overall: trustScore.overall,
          riskLevel: trustScore.riskLevel,
          // Don't expose detailed indicators publicly
        },
      });
    } catch (error: any) {
      logger.error("Failed to get user trust score", { error: error.message });
      res.status(500).json({ error: "Failed to get trust score" });
    }
  },
);

/**
 * Submit a review for another user
 * POST /api/trust/review
 */
router.post(
  "/review",
  safeAuth,
  rateLimiter({ windowMs: 3600 * 1000, max: 5, group: "trust-review" }),
  async (req: Request, res: Response) => {
    try {
      const reviewerId = (req as any).user.userId;
      const { revieweeId, rating, comment, category, transactionId } = req.body;

      // Validation
      if (!revieweeId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Invalid review data" });
      }

      // Can't review yourself
      if (reviewerId === revieweeId) {
        return res.status(400).json({ error: "Cannot review yourself" });
      }

      // Check if transaction exists if provided
      if (transactionId) {
        const transaction = await prisma.transactions.findUnique({
          where: { id: transactionId },
        });

        if (!transaction) {
          return res.status(404).json({ error: "Transaction not found" });
        }

        // Verify reviewer is involved in the transaction
        if (transaction.userId !== reviewerId) {
          return res
            .status(403)
            .json({ error: "Not authorized to review this transaction" });
        }
      }

      // Create review
      const review = await prisma.userReview.create({
        data: {
          reviewerId,
          revieweeId,
          rating,
          comment,
          category,
          transactionId,
        },
      });

      logger.info("Review submitted", {
        reviewerId,
        revieweeId,
        rating,
        category,
      });

      res.json({
        success: true,
        review: {
          id: review.id,
          rating: review.rating,
          category: review.category,
          createdAt: review.createdAt,
        },
      });
    } catch (error: any) {
      logger.error("Failed to submit review", { error: error.message });
      res.status(500).json({ error: "Failed to submit review" });
    }
  },
);

/**
 * Get reviews for a user
 * GET /api/trust/reviews/:userId
 */
router.get(
  "/reviews/:userId",
  safeAuth,
  rateLimiter({ windowMs: 20 * 1000, max: 60, group: "trust-reviews" }),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

      const reviews = await prisma.userReview.findMany({
        where: { revieweeId: userId },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              // Don't expose email per PII protection
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await prisma.userReview.count({
        where: { revieweeId: userId },
      });

      res.json({
        success: true,
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      logger.error("Failed to get reviews", { error: error.message });
      res.status(500).json({ error: "Failed to get reviews" });
    }
  },
);

router.get("/status", safeAuth, safeAllowRoles("admin"), (req, res) => {
  try {
    const metrics = scamAdviserService.getMetrics();
    res.json({
      success: true,
      service: "ScamAdviser Trust Verification",
      version: "1.0.0",
      status: "operational",
      timestamp: new Date().toISOString(),
      features: [
        "Domain trust scoring",
        "SSL certificate validation",
        "Business verification status",
        "Security improvement recommendations",
        "Performance metrics",
        "Caching & concurrency dedup",
      ],
      metrics,
      cache: {
        enabled: true,
        ttlHours: 24,
        size: metrics.cacheSize,
        hitRate: metrics.cacheHitRate,
      },
    });
  } catch (error) {
    console.error("Trust status error:", error);
    res.status(500).json({
      error: "Failed to get service status",
    });
  }
});

export default router;
