/**
 * Job Queue Management API
 *
 * Admin routes for monitoring and managing background jobs
 */

import express, { Request, Response } from "express";
import logger from "../logger";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { JobPriority, jobQueue, JobType } from "../services/jobQueue";

const router = express.Router();

// ============================================================================
// ADMIN ROUTES - Job Queue Monitoring
// ============================================================================

/**
 * GET /api/jobs/metrics
 * Get queue metrics (waiting, active, completed, failed)
 */
router.get(
  "/metrics",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const metrics = await jobQueue.getQueueMetrics();

      res.json({
        success: true,
        metrics,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error("Failed to get job metrics", error);
      res.status(500).json({ error: "Failed to retrieve job metrics" });
    }
  },
);

/**
 * GET /api/jobs/:jobId/status
 * Get status of specific job
 */
router.get(
  "/:jobId/status",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const { priority } = req.query;

      if (!priority || !Object.values(JobPriority).includes(Number(priority))) {
        return res.status(400).json({ error: "Valid priority required (1-5)" });
      }

      const status = await jobQueue.getJobStatus(
        jobId || "unknown",
        Number(priority) as JobPriority,
      );

      if (!status) {
        return res.status(404).json({ error: "Job not found" });
      }

      res.json({
        success: true,
        job: status,
      });
    } catch (error: any) {
      logger.error("Failed to get job status", error);
      res.status(500).json({ error: "Failed to retrieve job status" });
    }
  },
);

/**
 * POST /api/jobs/pause
 * Pause queue processing for specific priority
 */
router.post(
  "/pause",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { priority } = req.body;

      if (!priority || !Object.values(JobPriority).includes(Number(priority))) {
        return res.status(400).json({ error: "Valid priority required (1-5)" });
      }

      await jobQueue.pauseQueue(Number(priority) as JobPriority);

      logger.info("Queue paused by admin", {
        priority,
        adminId: (req as any).user.userId,
      });

      res.json({
        success: true,
        message: `Queue paused for priority ${JobPriority[priority]}`,
      });
    } catch (error: any) {
      logger.error("Failed to pause queue", error);
      res.status(500).json({ error: "Failed to pause queue" });
    }
  },
);

/**
 * POST /api/jobs/resume
 * Resume queue processing for specific priority
 */
router.post(
  "/resume",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { priority } = req.body;

      if (!priority || !Object.values(JobPriority).includes(Number(priority))) {
        return res.status(400).json({ error: "Valid priority required (1-5)" });
      }

      await jobQueue.resumeQueue(Number(priority) as JobPriority);

      logger.info("Queue resumed by admin", {
        priority,
        adminId: (req as any).user.userId,
      });

      res.json({
        success: true,
        message: `Queue resumed for priority ${JobPriority[priority]}`,
      });
    } catch (error: any) {
      logger.error("Failed to resume queue", error);
      res.status(500).json({ error: "Failed to resume queue" });
    }
  },
);

/**
 * POST /api/jobs/test/otp
 * Test OTP job (dev/staging only)
 */
router.post(
  "/test/otp",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      if (process.env.NODE_ENV === "production") {
        return res
          .status(403)
          .json({ error: "Test endpoints not available in production" });
      }

      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ error: "Email and code required" });
      }

      const job = await jobQueue.addJob(
        JobType.SEND_OTP,
        JobPriority.CRITICAL,
        { email, code },
      );

      res.json({
        success: true,
        jobId: job.id,
        message: "OTP job queued",
      });
    } catch (error: any) {
      logger.error("Failed to queue test OTP job", error);
      res.status(500).json({ error: "Failed to queue job" });
    }
  },
);

/**
 * POST /api/jobs/test/report
 * Test report generation job (dev/staging only)
 */
router.post(
  "/test/report",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      if (process.env.NODE_ENV === "production") {
        return res
          .status(403)
          .json({ error: "Test endpoints not available in production" });
      }

      const job = await jobQueue.addJob(
        JobType.GENERATE_REPORT,
        JobPriority.LOW,
        { userId: (req as any).user.userId },
      );

      res.json({
        success: true,
        jobId: job.id,
        message: "Report job queued",
      });
    } catch (error: any) {
      logger.error("Failed to queue test report job", error);
      res.status(500).json({ error: "Failed to queue job" });
    }
  },
);

export default router;
