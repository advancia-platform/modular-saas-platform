import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { winstonLogger as logger } from "../utils/winstonLogger";

const prisma = new PrismaClient();

interface EmailRateLimitConfig {
  perUserHourly: number; // Emails per user per hour
  perIPDaily: number; // Emails per IP per day
  globalDaily: number; // Total emails per day
  enabled: boolean;
}

const DEFAULT_CONFIG: EmailRateLimitConfig = {
  perUserHourly: 10, // 10 emails per hour per user
  perIPDaily: 100, // 100 emails per day per IP
  globalDaily: 10000, // 10,000 emails per day total
  enabled: true,
};

// In-memory rate limit tracking (use Redis in production for distributed systems)
interface RateLimitEntry {
  count: number;
  resetAt: Date;
}

const userRateLimits = new Map<string, RateLimitEntry>();
const ipRateLimits = new Map<string, RateLimitEntry>();
let globalRateLimit: RateLimitEntry = {
  count: 0,
  resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
};

/**
 * Email rate limiting middleware
 * Prevents spam and abuse by limiting email sending rates
 */
export const emailRateLimit = (config: Partial<EmailRateLimitConfig> = {}) => {
  const finalConfig: EmailRateLimitConfig = { ...DEFAULT_CONFIG, ...config };

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!finalConfig.enabled) {
      return next();
    }

    try {
      const userId = (req as any).user?.id;
      const userEmail = (req as any).user?.email || req.body.email;
      const forwardedFor = req.headers["x-forwarded-for"];
      const ipAddress =
        (typeof forwardedFor === "string"
          ? forwardedFor.split(",")[0].trim()
          : null) ||
        req.socket.remoteAddress ||
        "unknown";

      // Check global rate limit
      if (isRateLimitExceeded(globalRateLimit)) {
        resetRateLimitIfExpired(globalRateLimit, () => {
          globalRateLimit = {
            count: 0,
            resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          };
        });
      }

      if (globalRateLimit.count >= finalConfig.globalDaily) {
        logger.warn(
          `Global email rate limit exceeded: ${globalRateLimit.count}/${finalConfig.globalDaily}`,
        );
        return res.status(429).json({
          success: false,
          error:
            "Email service temporarily unavailable. Please try again later.",
          code: "GLOBAL_RATE_LIMIT_EXCEEDED",
          retryAfter: getRetryAfterSeconds(globalRateLimit.resetAt),
        });
      }

      // Check per-user hourly limit
      if (userId) {
        const userKey = `user:${userId}`;
        let userLimit = userRateLimits.get(userKey);

        if (!userLimit || isRateLimitExpired(userLimit)) {
          userLimit = {
            count: 0,
            resetAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          };
          userRateLimits.set(userKey, userLimit);
        }

        if (userLimit.count >= finalConfig.perUserHourly) {
          logger.warn(
            `User email rate limit exceeded: ${userEmail} - ${userLimit.count}/${finalConfig.perUserHourly}`,
          );

          // Log suspicious activity
          await logSuspiciousActivity(
            userId,
            userEmail,
            ipAddress,
            "USER_RATE_LIMIT_EXCEEDED",
          );

          return res.status(429).json({
            success: false,
            error: `You can only send ${finalConfig.perUserHourly} emails per hour. Please try again later.`,
            code: "USER_RATE_LIMIT_EXCEEDED",
            retryAfter: getRetryAfterSeconds(userLimit.resetAt),
          });
        }

        userLimit.count++;
      }

      // Check per-IP daily limit
      const ipKey = `ip:${ipAddress}`;
      let ipLimit = ipRateLimits.get(ipKey);

      if (!ipLimit || isRateLimitExpired(ipLimit)) {
        ipLimit = {
          count: 0,
          resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        };
        ipRateLimits.set(ipKey, ipLimit);
      }

      if (ipLimit.count >= finalConfig.perIPDaily) {
        logger.warn(
          `IP email rate limit exceeded: ${ipAddress} - ${ipLimit.count}/${finalConfig.perIPDaily}`,
        );

        // Log suspicious activity
        await logSuspiciousActivity(
          userId,
          userEmail,
          ipAddress,
          "IP_RATE_LIMIT_EXCEEDED",
        );

        return res.status(429).json({
          success: false,
          error:
            "Too many email requests from this location. Please try again tomorrow.",
          code: "IP_RATE_LIMIT_EXCEEDED",
          retryAfter: getRetryAfterSeconds(ipLimit.resetAt),
        });
      }

      ipLimit.count++;
      globalRateLimit.count++;

      // Add rate limit info to response headers
      res.setHeader(
        "X-RateLimit-Limit-User",
        finalConfig.perUserHourly.toString(),
      );
      res.setHeader("X-RateLimit-Limit-IP", finalConfig.perIPDaily.toString());
      res.setHeader(
        "X-RateLimit-Limit-Global",
        finalConfig.globalDaily.toString(),
      );

      if (userId) {
        const userLimit = userRateLimits.get(`user:${userId}`)!;
        res.setHeader(
          "X-RateLimit-Remaining-User",
          (finalConfig.perUserHourly - userLimit.count).toString(),
        );
        res.setHeader(
          "X-RateLimit-Reset-User",
          userLimit.resetAt.toISOString(),
        );
      }

      res.setHeader(
        "X-RateLimit-Remaining-IP",
        (finalConfig.perIPDaily - ipLimit.count).toString(),
      );
      res.setHeader("X-RateLimit-Reset-IP", ipLimit.resetAt.toISOString());
      res.setHeader(
        "X-RateLimit-Remaining-Global",
        (finalConfig.globalDaily - globalRateLimit.count).toString(),
      );
      res.setHeader(
        "X-RateLimit-Reset-Global",
        globalRateLimit.resetAt.toISOString(),
      );

      next();
    } catch (error) {
      logger.error("Email rate limit middleware error:", error);
      // Don't block requests if rate limiting fails
      next();
    }
  };
};

/**
 * Check if rate limit has been exceeded
 */
function isRateLimitExceeded(limit: RateLimitEntry): boolean {
  return new Date() < limit.resetAt;
}

/**
 * Check if rate limit has expired
 */
function isRateLimitExpired(limit: RateLimitEntry): boolean {
  return new Date() >= limit.resetAt;
}

/**
 * Reset rate limit if it has expired
 */
function resetRateLimitIfExpired(
  limit: RateLimitEntry,
  resetCallback: () => void,
): void {
  if (isRateLimitExpired(limit)) {
    resetCallback();
  }
}

/**
 * Calculate seconds until rate limit resets
 */
function getRetryAfterSeconds(resetAt: Date): number {
  return Math.ceil((resetAt.getTime() - Date.now()) / 1000);
}

/**
 * Log suspicious email activity to database
 */
async function logSuspiciousActivity(
  userId: string | undefined,
  email: string,
  ipAddress: string,
  reason: string,
): Promise<void> {
  try {
    // This would typically log to a security/audit table
    logger.warn("Suspicious email activity detected", {
      userId,
      email,
      ipAddress,
      reason,
      timestamp: new Date().toISOString(),
    });

    // TODO: Add to database audit log when table exists
    // await prisma.emailSecurityLog.create({
    //   data: {
    //     userId,
    //     email,
    //     ipAddress,
    //     reason,
    //     timestamp: new Date(),
    //   },
    // });
  } catch (error) {
    logger.error("Failed to log suspicious activity:", error);
  }
}

/**
 * Get current rate limit stats
 */
export function getRateLimitStats() {
  return {
    global: {
      count: globalRateLimit.count,
      resetAt: globalRateLimit.resetAt,
      remaining: DEFAULT_CONFIG.globalDaily - globalRateLimit.count,
    },
    users: Array.from(userRateLimits.entries()).map(([key, limit]) => ({
      userId: key.replace("user:", ""),
      count: limit.count,
      resetAt: limit.resetAt,
      remaining: DEFAULT_CONFIG.perUserHourly - limit.count,
    })),
    ips: Array.from(ipRateLimits.entries()).map(([key, limit]) => ({
      ip: key.replace("ip:", ""),
      count: limit.count,
      resetAt: limit.resetAt,
      remaining: DEFAULT_CONFIG.perIPDaily - limit.count,
    })),
  };
}

/**
 * Reset all rate limits (for testing or emergency)
 */
export function resetAllRateLimits() {
  userRateLimits.clear();
  ipRateLimits.clear();
  globalRateLimit = {
    count: 0,
    resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
  logger.info("All email rate limits have been reset");
}

/**
 * Cleanup expired rate limit entries (run periodically)
 */
export function cleanupExpiredRateLimits() {
  const now = new Date();
  let cleaned = 0;

  // Clean user limits
  for (const [key, limit] of userRateLimits.entries()) {
    if (now >= limit.resetAt) {
      userRateLimits.delete(key);
      cleaned++;
    }
  }

  // Clean IP limits
  for (const [key, limit] of ipRateLimits.entries()) {
    if (now >= limit.resetAt) {
      ipRateLimits.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info(`Cleaned up ${cleaned} expired rate limit entries`);
  }
}

// Cleanup expired entries every 15 minutes
setInterval(cleanupExpiredRateLimits, 15 * 60 * 1000).unref();

export default emailRateLimit;
