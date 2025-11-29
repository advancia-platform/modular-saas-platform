import express, { Request, Response } from "express";
import logger from "../logger";
import prisma from "../prismaClient";
import { checkR2Connection } from "../services/r2Client";
import { getRedis } from "../services/redisClient";
import { checkCosmosHealth } from "../services/cosmosClient";
import { poolMetrics } from "../config/pgPoolConfig";

const router = express.Router();

/**
 * GET /api/health
 * Lightweight health check - returns 200 if process is up
 * Use for load balancer health checks
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

/**
 * GET /api/live
 * Liveness probe - process is running
 * Returns 200 immediately without external checks
 */
router.get("/live", (req: Request, res: Response) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /api/ready
 * Readiness probe - service can accept traffic
 * Checks DB and Redis connectivity
 */
router.get("/ready", async (req: Request, res: Response) => {
  const checks: Record<string, string> = {};
  let ready = true;

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (err) {
    checks.database = "fail";
    ready = false;
  }

  // Check Redis if configured
  const redis = getRedis();
  if (redis) {
    try {
      await redis.ping();
      checks.redis = "ok";
    } catch (err) {
      checks.redis = "fail";
      ready = false;
    }
  } else {
    checks.redis = "not_configured";
  }

  if (ready) {
    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
      checks,
    });
  } else {
    res.status(503).json({
      status: "not_ready",
      timestamp: new Date().toISOString(),
      checks,
    });
  }
});

/**
 * GET /api/health/detailed
 * Extended health check including R2 connectivity
 * Use for monitoring dashboards and debugging
 */
router.get("/health/detailed", async (req: Request, res: Response) => {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      services: {
        database: {
          status: "unknown" as string,
          message: undefined as string | undefined,
        },
        redis: {
          status: "unknown" as string,
          message: undefined as string | undefined,
        },
        r2: {
          status: "unknown" as string,
          message: undefined as string | undefined,
        },
      },
    };

    // Check database
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = { status: "connected", message: undefined };
    } catch (error: any) {
      health.services.database = { status: "error", message: error.message };
      health.status = "degraded";
    }

    // Check Redis if configured
    const redis = getRedis();
    if (redis) {
      try {
        await redis.ping();
        health.services.redis = { status: "connected", message: undefined };
      } catch (error: any) {
        health.services.redis = { status: "error", message: error.message };
        health.status = "degraded";
      }
    } else {
      health.services.redis = { status: "not_configured", message: undefined };
    }

    // Check R2 (Cloudflare Object Storage)
    try {
      const r2Health = await checkR2Connection();
      health.services.r2 = r2Health.connected
        ? { status: "connected", message: undefined }
        : { status: "error", message: r2Health.error };

      if (!r2Health.connected) {
        health.status = "degraded";
      }
    } catch (error: any) {
      health.services.r2 = { status: "error", message: error.message };
      health.status = "degraded";
    }

    // Check Azure Cosmos DB (optional - for AI/Chat features)
    try {
      const cosmosHealth = await checkCosmosHealth();
      (health.services as any).cosmosDb = cosmosHealth.connected
        ? { status: "connected", database: cosmosHealth.database, containers: cosmosHealth.containers }
        : { status: "not_configured", message: cosmosHealth.error };
    } catch (error: any) {
      (health.services as any).cosmosDb = { status: "error", message: error.message };
    }

    // Add PostgreSQL pool metrics
    (health as any).poolMetrics = {
      queryCount: poolMetrics.queryCount,
      slowQueryCount: poolMetrics.slowQueryCount,
      avgQueryTimeMs: Math.round(poolMetrics.avgQueryTime),
      errorCount: poolMetrics.errorCount,
    };

    res.status(health.status === "healthy" ? 200 : 503).json(health);
  } catch (error: any) {
    logger.error("Detailed health check failed", { error: error.message });
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      message: error.message,
    });
  }
});

export default router;
