/**
 * Redis-Backed Rate Limiter with Per-User + IP Tracking
 *
 * Features:
 * - Scales horizontally across multiple backend instances
 * - Tracks by authenticated user ID or fallback to IP
 * - Records offenders in Redis sorted sets for monitoring
 * - Integrates with Sentry for abuse pattern logging
 * - Gracefully degrades if Redis is unavailable
 */

import { NextFunction, Response } from "express";
import { Redis } from "ioredis";
import { shouldAlert } from "../config/alertPolicy";
import { sendAlert } from "../services/alertServiceMinimal";
import { captureError } from "../utils/sentry";

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  retryStrategy: (times) => {
    // Exponential backoff: reconnect after delay
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false, // Don't queue commands if Redis is down
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
  if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
    captureError(err, {
      tags: { component: "rate-limiter", error_type: "redis_connection" },
      extra: { message: err.message },
    });
  }
});

redis.on("connect", () => {
  console.log("✓ Redis connected for rate limiting");
});

/**
 * Rate Limiter Options
 */
interface RateLimiterOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  group: string; // Route group identifier (admin, auth, payments, etc.)
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
}

/**
 * Get identifier from request (user ID or IP)
 */
function getIdentifier(req: any): string {
  // Prefer authenticated user ID
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }

  // Fallback to IP address
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor) {
    const firstIp = forwardedFor.split(",")[0];
    return `ip:${firstIp?.trim() || "unknown"}`;
  }

  const realIp = req.headers["x-real-ip"] as string;
  if (realIp) {
    return `ip:${realIp}`;
  }

  return `ip:${req.ip || req.socket.remoteAddress || "unknown"}`;
}

/**
 * Get route group from request path
 */
function getRouteGroup(path: string): string {
  if (path.startsWith("/api/admin")) return "admin";
  if (path.startsWith("/api/payments")) return "payments";
  if (path.startsWith("/api/crypto")) return "crypto";
  if (path.startsWith("/api/transactions")) return "transactions";
  if (path.startsWith("/api/auth")) return "auth";
  if (path.startsWith("/api/users")) return "users";
  return "other";
}

/**
 * Redis-backed rate limiter middleware
 *
 * @param options - Rate limiter configuration
 * @returns Express middleware function
 */
export function rateLimiter(options: RateLimiterOptions) {
  const {
    windowMs = 60000, // Default: 1 minute
    max = 5, // Default: 5 requests
    group = "general",
    message = "Too many requests, please try again later.",
    skipSuccessfulRequests = false,
  } = options;

  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const identifier = getIdentifier(req);
      const routeGroup = getRouteGroup(req.originalUrl);
      const key = `rate:${group}:${identifier}`;
      const ttl = Math.floor(windowMs / 1000); // Convert to seconds

      // Increment counter in Redis
      const count = await redis.incr(key);

      if (count === 1) {
        // First hit, set expiry
        await redis.expire(key, ttl);
      }

      // Get remaining TTL for retryAfter header
      const ttlRemaining = await redis.ttl(key);
      const retryAfter = ttlRemaining > 0 ? ttlRemaining : ttl;

      // Broadcast rate event for real-time monitoring
      broadcastRateEvent(group, identifier, count, count > max);

      // Check if alert should be triggered (independent of rate limit)
      if (shouldAlert(group, count)) {
        // Send multi-channel alert (email, SMS, Slack, Teams, etc.)
        sendAlert({
          identifier,
          group,
          count,
          path: req.originalUrl,
          method: req.method,
          timestamp: Date.now(),
          userAgent: req.get("user-agent"),
        }).catch((err) => {
          console.error("Failed to send alert:", err);
        });
      }

      if (count > max) {
        // Rate limit exceeded - track offender
        await redis.zincrby(`offenders:${group}`, 1, identifier);
        await redis.expire(`offenders:${group}`, 86400); // 24 hour retention

        // Track trends by minute bucket for analytics
        const minuteBucket = Math.floor(Date.now() / 60000);
        await redis.hincrby(
          `offender_trends:${group}:${identifier}`,
          minuteBucket.toString(),
          1,
        );
        await redis.expire(`offender_trends:${group}:${identifier}`, 86400); // 24 hour retention

        // Track global trends for system-wide monitoring
        await redis.hincrby(
          `global_trends:${group}`,
          minuteBucket.toString(),
          1,
        );
        await redis.expire(`global_trends:${group}`, 86400); // 24 hour retention

        // Log to Sentry
        if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
          captureError(new Error("Rate limit exceeded"), {
            level: "warning",
            tags: {
              type: "security",
              event: "rate_limit_exceeded",
              severity: "medium",
              routeGroup,
              limitGroup: group,
            },
            extra: {
              identifier,
              path: req.originalUrl,
              method: req.method,
              attemptsCount: count,
              windowMs,
              maxAllowed: max,
              retryAfter,
            },
            user: req.user
              ? {
                  id: String(req.user.id),
                  email: req.user.email,
                  role: req.user.role,
                }
              : undefined,
          });
        }

        // Return 429 Too Many Requests
        return res.status(429).json({
          error: message,
          retryAfter,
          limit: max,
          windowMs,
        });
      }

      // Track successful request count
      res.on("finish", () => {
        if (skipSuccessfulRequests && res.statusCode < 400) {
          // Decrement counter if request was successful
          redis.decr(key).catch((err) => {
            console.error("Failed to decrement rate limit counter:", err);
          });
        }
      });

      next();
    } catch (err) {
      // Redis failure - fail open (allow request but log error)
      console.error("Rate limiter error:", err);

      if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
        captureError(err as Error, {
          tags: {
            component: "rate-limiter",
            error_type: "middleware_failure",
            routeGroup: getRouteGroup(req.originalUrl),
          },
          extra: {
            path: req.originalUrl,
            method: req.method,
            identifier: getIdentifier(req),
          },
        });
      }

      // Don't block request if Redis is down
      next();
    }
  };
}

/**
 * Get rate limit statistics for monitoring dashboard
 *
 * @param group - Route group to get stats for
 * @param limit - Maximum number of offenders to return
 * @returns Array of offenders with counts
 */
export async function getRateLimitStats(
  group: string = "admin",
  limit: number = 10,
) {
  try {
    // Get top offenders from sorted set
    const offenders = await redis.zrevrange(
      `offenders:${group}`,
      0,
      limit - 1,
      "WITHSCORES",
    );

    // Format into [{ identifier, count }]
    const formatted: Array<{
      identifier: string;
      count: number;
      type: "user" | "ip";
    }> = [];
    for (let i = 0; i < offenders.length; i += 2) {
      const identifier = offenders[i];
      const countStr = offenders[i + 1];
      if (!identifier || !countStr) continue;
      const count = parseInt(countStr, 10);
      const type = identifier.startsWith("user:") ? "user" : "ip";

      formatted.push({
        identifier: identifier.replace(/^(user:|ip:)/, ""), // Remove prefix for display
        count,
        type,
      });
    }

    return formatted;
  } catch (err) {
    console.error("Failed to fetch rate limit stats:", err);
    throw err;
  }
}

/**
 * Get all available route groups with offender counts
 */
export async function getAllRateLimitGroups() {
  try {
    const groups = [
      "admin",
      "auth",
      "payments",
      "crypto",
      "transactions",
      "users",
      "general",
    ];
    const groupStats = await Promise.all(
      groups.map(async (group) => {
        const count = await redis.zcard(`offenders:${group}`);
        return { group, offenderCount: count };
      }),
    );

    return groupStats.filter((stat) => stat.offenderCount > 0);
  } catch (err) {
    console.error("Failed to fetch rate limit groups:", err);
    throw err;
  }
}

/**
 * Clear rate limit for a specific identifier (admin action)
 */
export async function clearRateLimit(group: string, identifier: string) {
  try {
    const key = `rate:${group}:${identifier}`;
    await redis.del(key);
    await redis.zrem(`offenders:${group}`, identifier);
    return { success: true, message: "Rate limit cleared" };
  } catch (err) {
    console.error("Failed to clear rate limit:", err);
    throw err;
  }
}

/**
 * Get rate limit trends for a specific offender
 *
 * @param group - Route group
 * @param identifier - User ID or IP address
 * @param minutesBack - Number of minutes of history to retrieve (default: 60)
 * @returns Array of trend data points
 */
export async function getOffenderTrends(
  group: string,
  identifier: string,
  minutesBack: number = 60,
) {
  try {
    const trendData = await redis.hgetall(
      `offender_trends:${group}:${identifier}`,
    );

    if (!trendData || Object.keys(trendData).length === 0) {
      return [];
    }

    // Format and filter to recent minutes
    const currentMinute = Math.floor(Date.now() / 60000);
    const cutoff = currentMinute - minutesBack;

    const formatted = Object.entries(trendData)
      .map(([minute, count]) => ({
        minute: parseInt(minute),
        timestamp: parseInt(minute) * 60000,
        count: parseInt(count as string),
      }))
      .filter((item) => item.minute >= cutoff)
      .sort((a, b) => a.minute - b.minute);

    return formatted;
  } catch (err) {
    console.error("Failed to fetch offender trends:", err);
    throw err;
  }
}

/**
 * Get global rate limit trends for a route group
 *
 * @param group - Route group
 * @param minutesBack - Number of minutes of history to retrieve (default: 60)
 * @returns Array of global trend data points
 */
export async function getGlobalTrends(group: string, minutesBack: number = 60) {
  try {
    const trendData = await redis.hgetall(`global_trends:${group}`);

    if (!trendData || Object.keys(trendData).length === 0) {
      return [];
    }

    // Format and filter to recent minutes
    const currentMinute = Math.floor(Date.now() / 60000);
    const cutoff = currentMinute - minutesBack;

    const formatted = Object.entries(trendData)
      .map(([minute, count]) => ({
        minute: parseInt(minute),
        timestamp: parseInt(minute) * 60000,
        count: parseInt(count as string),
      }))
      .filter((item) => item.minute >= cutoff)
      .sort((a, b) => a.minute - b.minute);

    return formatted;
  } catch (err) {
    console.error("Failed to fetch global trends:", err);
    throw err;
  }
}

/**
 * WebSocket broadcasting support
 * Store Socket.IO instance for real-time updates
 */
let ioInstance: any = null;

export function setRateLimiterSocketIO(io: any) {
  ioInstance = io;
  console.log("✓ Rate limiter WebSocket broadcasting enabled");
}

/**
 * Broadcast rate limit event to connected clients
 */
export function broadcastRateEvent(
  group: string,
  identifier: string,
  count: number,
  exceeded: boolean = false,
) {
  if (ioInstance) {
    ioInstance.emit("rateEvent", {
      group,
      identifier,
      count,
      exceeded,
      timestamp: Date.now(),
    });
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */

// Strict rate limiter for authentication endpoints (5 attempts per 15 minutes)
export const strictRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  group: "auth-strict",
  message: "Too many login attempts, please try again in 15 minutes.",
});

// Admin rate limiter for admin endpoints (20 requests per minute)
export const adminRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  group: "admin",
  message: "Too many admin requests, please slow down.",
});

// API rate limiter for general API endpoints (100 requests per minute)
export const apiRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  group: "api",
  message: "API rate limit exceeded, please try again later.",
});

// Export Redis client for testing/monitoring
export { redis };
