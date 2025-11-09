import express, { Request, Response } from "express";
import prisma from "../prismaClient";

const router = express.Router();

/**
 * Health check endpoint for monitoring and deployment validation
 * GET /api/health
 *
 * Returns:
 * - 200: Service healthy, database connected
 * - 503: Service unhealthy, database disconnected
 */
router.get("/health", async (req: Request, res: Response) => {
  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      database: "connected",
      version: "1.0.0",
    });
  } catch (error: any) {
    console.error("[HEALTH CHECK] Database connection failed:", error.message);

    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: "disconnected",
      error:
        process.env.NODE_ENV === "production"
          ? "Service unavailable"
          : error.message,
    });
  }
});

export default router;
