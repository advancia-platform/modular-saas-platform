import express, { Request, Response } from "express";
import { config } from "../jobs/config/index";
import logger from "../logger";
import { testDatabaseConnection } from "../utils/testDatabaseConnection";

const router = express.Router();

// GET /api/system/cors-origins - returns computed allowed CORS origins
router.get("/cors-origins", (req, res) => {
  return res.json({
    allowedOrigins: config.allowedOrigins,
    count: config.allowedOrigins.length,
    nodeEnv: config.nodeEnv,
  });
});

// Simple health extension (optional)
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "system",
    time: new Date().toISOString(),
  });
});

/**
 * Database connection health check
 * GET /api/system/db-health
 */
router.get("/db-health", async (req: Request, res: Response) => {
  try {
    const result = await testDatabaseConnection();

    res.status(result.success ? 200 : 503).json({
      status: result.success ? "healthy" : "unhealthy",
      database: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("Database health check failed", { error: error.message });
    res.status(503).json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
