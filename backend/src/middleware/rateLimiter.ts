import { NextFunction, Request, Response } from "express";
import { captureError } from "../utils/sentry.js";

interface RateLimitEntry {
  count: number;
  lastAttempt: number;
  firstAttempt: number;
}

interface RateLimiterOptions {
  windowMs?: number; // Time window in milliseconds
  max?: number; // Max requests per window
  group?: string; // Route group for Sentry tagging
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
}

// In-memory store (use Redis in production for distributed systems)
const attempts = new Map<string, RateLimitEntry>();

/**
 * Helper to determine route group from URL path for rate limiting
 */
function getRouteGroup(path: string): string {
  if (path.includes("/api/admin")) return "admin";
  if (path.includes("/api/payments")) return "payments";
  if (path.includes("/api/crypto")) return "crypto";
  if (path.includes("/api/transactions")) return "transactions";
  if (path.includes("/api/auth")) return "auth";
  if (path.includes("/api/users")) return "users";
  return "general";
}

/**
 * Get client IP address from request
 */
function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.ip ||
    req.connection?.remoteAddress ||
    "unknown"
  );
}

/**
 * Rate limiting middleware with Sentry logging
 *
 * @param options - Rate limiter configuration
 * @returns Express middleware function
 *
 * @example
 * // Protect admin routes: 10 requests per minute
 * router.use('/api/admin', rateLimiter({ windowMs: 60000, max: 10, group: 'admin' }));
 *
 * // Protect auth routes: 5 login attempts per 15 minutes
 * router.post('/api/auth/login', rateLimiter({ windowMs: 900000, max: 5, group: 'auth' }));
 */
export function rateLimiter(options: RateLimiterOptions = {}) {
  const {
    windowMs = 60000, // Default: 1 minute
    max = 10, // Default: 10 requests
    group,
    message = "Too many requests, please try again later",
    skipSuccessfulRequests = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIp(req);
    const routeGroup = group || getRouteGroup(req.originalUrl);
    const key = `${ip}:${routeGroup}`;
    const now = Date.now();

    // Get or create entry
    let entry = attempts.get(key);

    if (!entry) {
      entry = { count: 1, lastAttempt: now, firstAttempt: now };
      attempts.set(key, entry);
      return next();
    }

    // Check if window has expired
    if (now - entry.firstAttempt > windowMs) {
      // Reset window
      entry.count = 1;
      entry.firstAttempt = now;
      entry.lastAttempt = now;
      return next();
    }

    // Increment counter
    entry.count++;
    entry.lastAttempt = now;

    // Check if limit exceeded
    if (entry.count > max) {
      // Log to Sentry in production
      captureError(new Error(`Rate limit exceeded: ${ip} on ${routeGroup}`), {
        tags: {
          type: "security",
          event: "rate_limit_exceeded",
          severity: "warning",
          routeGroup,
        },
        extra: {
          ip,
          path: req.originalUrl,
          method: req.method,
          userAgent: req.headers["user-agent"],
          attemptsCount: entry.count,
          windowMs,
          maxAllowed: max,
          timeInWindow: now - entry.firstAttempt,
          timestamp: new Date().toISOString(),
        },
      });

      // Return 429 Too Many Requests
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((windowMs - (now - entry.firstAttempt)) / 1000),
      });
    }

    // If skipSuccessfulRequests is true, decrement on successful response
    if (skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function (data) {
        if (res.statusCode < 400) {
          entry.count = Math.max(0, entry.count - 1);
        }
        return originalSend.call(this, data);
      };
    }

    next();
  };
}

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  const maxWindowMs = 3600000; // 1 hour

  for (const [key, entry] of Array.from(attempts.entries())) {
    if (now - entry.lastAttempt > maxWindowMs) {
      attempts.delete(key);
    }
  }
}, 300000); // Clean up every 5 minutes

/**
 * Strict rate limiter for sensitive endpoints (e.g., login, password reset)
 */
export const strictRateLimiter = rateLimiter({
  windowMs: 900000, // 15 minutes
  max: 5, // 5 attempts
  message: "Too many failed attempts. Please try again in 15 minutes.",
});

/**
 * Moderate rate limiter for admin endpoints
 */
export const adminRateLimiter = rateLimiter({
  windowMs: 60000, // 1 minute
  max: 20, // 20 requests
  group: "admin",
});

/**
 * Lenient rate limiter for general API endpoints
 */
export const apiRateLimiter = rateLimiter({
  windowMs: 60000, // 1 minute
  max: 100, // 100 requests
});
