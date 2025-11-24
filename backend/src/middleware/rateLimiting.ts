/**
 * Advanced Rate Limiting Middleware for Advancia Pay
 *
 * Implements multiple rate limiting algorithms:
 * 1. Token Bucket - Allows bursts, refills gradually (bursty traffic)
 * 2. Leaky Bucket - Smooth fixed rate, no bursts (fixed flow)
 * 3. Fixed Window - Simple counter per time window
 * 4. Sliding Window Log - Precise rate limiting
 *
 * Use cases:
 * - Token Bucket: API endpoints that can handle occasional bursts
 * - Leaky Bucket: Payment processing, steady flow required
 * - Fixed Window: Simple request counting
 * - Sliding Window: Precise rate control for sensitive operations
 */

import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import logger from "../logger";

const prisma = new PrismaClient();

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests/tokens
  message?: string; // Custom error message
  statusCode?: number; // HTTP status code (default: 429)
  keyGenerator?: (req: Request) => string; // Custom key function
  skip?: (req: Request) => boolean; // Skip rate limiting
  handler?: (req: Request, res: Response) => void; // Custom handler
}

interface TokenBucketConfig extends RateLimitConfig {
  refillRate: number; // Tokens added per second
  bucketSize: number; // Maximum bucket capacity
}

interface LeakyBucketConfig extends RateLimitConfig {
  leakRate: number; // Requests processed per second
  bucketSize: number; // Maximum queue size
}

interface RateLimitStore {
  get(key: string): Promise<RateLimitData | null>;
  set(key: string, data: RateLimitData): Promise<void>;
  increment(key: string): Promise<number>;
  reset(key: string): Promise<void>;
}

interface RateLimitData {
  count: number;
  resetTime: number;
  tokens?: number; // For token bucket
  lastRefill?: number; // For token bucket
  queue?: number[]; // For leaky bucket (timestamps)
  requests?: number[]; // For sliding window log
}

// ============================================================================
// IN-MEMORY STORE (For development/testing)
// ============================================================================

class MemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitData>();

  async get(key: string): Promise<RateLimitData | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, data: RateLimitData): Promise<void> {
    this.store.set(key, data);
  }

  async increment(key: string): Promise<number> {
    const data = await this.get(key);
    const newCount = (data?.count || 0) + 1;
    await this.set(key, { ...data, count: newCount } as RateLimitData);
    return newCount;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  // Cleanup old entries periodically
  cleanup(maxAge: number): void {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (data.resetTime < now) {
        this.store.delete(key);
      }
    }
  }
}

// ============================================================================
// REDIS STORE (For production)
// ============================================================================

class RedisStore implements RateLimitStore {
  private client: any; // Redis client

  constructor(redisClient: any) {
    this.client = redisClient;
  }

  async get(key: string): Promise<RateLimitData | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, data: RateLimitData): Promise<void> {
    const ttl = Math.ceil((data.resetTime - Date.now()) / 1000);
    if (ttl > 0) {
      await this.client.setex(key, ttl, JSON.stringify(data));
    }
  }

  async increment(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async reset(key: string): Promise<void> {
    await this.client.del(key);
  }
}

// ============================================================================
// TOKEN BUCKET ALGORITHM (Allows Bursts)
// ============================================================================

/**
 * Token Bucket Rate Limiter
 *
 * Allows bursts of traffic while maintaining average rate
 * Perfect for: API endpoints, file uploads, batch operations
 *
 * How it works:
 * - Bucket starts with X tokens
 * - Each request consumes 1 token
 * - Tokens refill at steady rate
 * - Allows bursts up to bucket capacity
 *
 * Example: 100 tokens, refill 10/second
 * - Can handle burst of 100 requests instantly
 * - Then 10 requests per second sustained
 */
export class TokenBucketRateLimiter {
  private store: RateLimitStore;
  private config: TokenBucketConfig;

  constructor(config: TokenBucketConfig, store?: RateLimitStore) {
    this.config = {
      message: "Too many requests, please slow down",
      statusCode: 429,
      keyGenerator: (req) => req.ip || "unknown",
      ...config,
    };
    this.store = store || new MemoryStore();
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Skip if configured
      if (this.config.skip?.(req)) {
        return next();
      }

      const key = `ratelimit:tokenbucket:${this.config.keyGenerator!(req)}`;
      const now = Date.now();

      try {
        let data = await this.store.get(key);

        // Initialize bucket
        if (!data) {
          data = {
            count: 0,
            resetTime: now + this.config.windowMs,
            tokens: this.config.bucketSize,
            lastRefill: now,
          };
        }

        // Calculate tokens to add based on time elapsed
        const timeSinceLastRefill = now - (data.lastRefill || now);
        const tokensToAdd =
          (timeSinceLastRefill / 1000) * this.config.refillRate;
        data.tokens = Math.min(
          this.config.bucketSize,
          (data.tokens || 0) + tokensToAdd,
        );
        data.lastRefill = now;

        // Check if token available
        if (data.tokens >= 1) {
          // Consume token
          data.tokens -= 1;
          data.count += 1;
          await this.store.set(key, data);

          // Add rate limit headers
          res.setHeader("X-RateLimit-Limit", this.config.bucketSize);
          res.setHeader("X-RateLimit-Remaining", Math.floor(data.tokens));
          res.setHeader("X-RateLimit-Reset", data.resetTime);

          return next();
        } else {
          // No tokens available
          const retryAfter = Math.ceil(1 / this.config.refillRate);

          res.setHeader("X-RateLimit-Limit", this.config.bucketSize);
          res.setHeader("X-RateLimit-Remaining", 0);
          res.setHeader("X-RateLimit-Reset", data.resetTime);
          res.setHeader("Retry-After", retryAfter);

          logger.warn("Rate limit exceeded (Token Bucket)", {
            key,
            ip: req.ip,
            path: req.path,
            remainingTokens: data.tokens,
          });

          if (this.config.handler) {
            return this.config.handler(req, res);
          }

          return res.status(this.config.statusCode!).json({
            error: "Rate limit exceeded",
            message: this.config.message,
            retryAfter,
            type: "token_bucket",
          });
        }
      } catch (error) {
        logger.error("Token bucket rate limiter error", error);
        // Fail open - allow request on error
        return next();
      }
    };
  }
}

// ============================================================================
// LEAKY BUCKET ALGORITHM (Fixed Flow)
// ============================================================================

/**
 * Leaky Bucket Rate Limiter
 *
 * Enforces smooth, steady flow of requests
 * Perfect for: Payment processing, database writes, external API calls
 *
 * How it works:
 * - Requests added to queue (bucket)
 * - Processed at fixed rate (leak)
 * - Excess requests overflow and are rejected
 * - No bursts allowed - strictly rate limited
 *
 * Example: Leak 5/second, capacity 20
 * - Processes exactly 5 requests per second
 * - Can queue up to 20 requests
 * - 21st request is rejected
 */
export class LeakyBucketRateLimiter {
  private store: RateLimitStore;
  private config: LeakyBucketConfig;

  constructor(config: LeakyBucketConfig, store?: RateLimitStore) {
    this.config = {
      message: "Request queue full, please try again later",
      statusCode: 429,
      keyGenerator: (req) => req.ip || "unknown",
      ...config,
    };
    this.store = store || new MemoryStore();
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (this.config.skip?.(req)) {
        return next();
      }

      const key = `ratelimit:leakybucket:${this.config.keyGenerator!(req)}`;
      const now = Date.now();

      try {
        let data = await this.store.get(key);

        if (!data) {
          data = {
            count: 0,
            resetTime: now + this.config.windowMs,
            queue: [],
          };
        }

        // Process leaks (remove old requests from queue)
        const leakInterval = 1000 / this.config.leakRate; // ms between leaks
        data.queue = (data.queue || []).filter(
          (timestamp) => now - timestamp < this.config.windowMs,
        );

        // Remove requests that have "leaked"
        const leakedCount = Math.floor(
          (now - (data.queue[0] || now)) / leakInterval,
        );
        data.queue = data.queue.slice(leakedCount);

        // Check if bucket has space
        if (data.queue.length < this.config.bucketSize) {
          // Add request to queue
          data.queue.push(now);
          data.count += 1;
          await this.store.set(key, data);

          const remaining = this.config.bucketSize - data.queue.length;

          res.setHeader("X-RateLimit-Limit", this.config.bucketSize);
          res.setHeader("X-RateLimit-Remaining", remaining);
          res.setHeader("X-RateLimit-Reset", data.resetTime);

          return next();
        } else {
          // Bucket full
          const retryAfter = Math.ceil(leakInterval / 1000);

          res.setHeader("X-RateLimit-Limit", this.config.bucketSize);
          res.setHeader("X-RateLimit-Remaining", 0);
          res.setHeader("X-RateLimit-Reset", data.resetTime);
          res.setHeader("Retry-After", retryAfter);

          logger.warn("Rate limit exceeded (Leaky Bucket)", {
            key,
            ip: req.ip,
            path: req.path,
            queueSize: data.queue.length,
          });

          if (this.config.handler) {
            return this.config.handler(req, res);
          }

          return res.status(this.config.statusCode!).json({
            error: "Rate limit exceeded",
            message: this.config.message,
            retryAfter,
            type: "leaky_bucket",
            queueFull: true,
          });
        }
      } catch (error) {
        logger.error("Leaky bucket rate limiter error", error);
        return next();
      }
    };
  }
}

// ============================================================================
// FIXED WINDOW ALGORITHM (Simple Counter)
// ============================================================================

/**
 * Fixed Window Rate Limiter
 *
 * Simple counter that resets at fixed intervals
 * Perfect for: Basic rate limiting, simple APIs, public endpoints
 *
 * How it works:
 * - Count requests in fixed time window
 * - Reset counter when window expires
 * - Fast and memory efficient
 *
 * Example: 100 requests per minute
 * - Allows 100 requests between 10:00:00 - 10:01:00
 * - Counter resets at 10:01:00
 * - Can burst all 100 at start of window
 *
 * Note: Has edge case - user can send 100 at 10:00:59 and 100 at 10:01:00
 */
export class FixedWindowRateLimiter {
  private store: RateLimitStore;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = {
      message: "Too many requests",
      statusCode: 429,
      keyGenerator: (req) => req.ip || "unknown",
      ...config,
    };
    this.store = store || new MemoryStore();
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (this.config.skip?.(req)) {
        return next();
      }

      const key = `ratelimit:fixedwindow:${this.config.keyGenerator!(req)}`;
      const now = Date.now();

      try {
        let data = await this.store.get(key);

        // Create new window if expired or doesn't exist
        if (!data || data.resetTime <= now) {
          data = {
            count: 0,
            resetTime: now + this.config.windowMs,
          };
        }

        // Check limit
        if (data.count < this.config.max) {
          data.count += 1;
          await this.store.set(key, data);

          const remaining = this.config.max - data.count;
          const resetInSeconds = Math.ceil((data.resetTime - now) / 1000);

          res.setHeader("X-RateLimit-Limit", this.config.max);
          res.setHeader("X-RateLimit-Remaining", remaining);
          res.setHeader("X-RateLimit-Reset", Math.floor(data.resetTime / 1000));

          return next();
        } else {
          // Limit exceeded
          const resetInSeconds = Math.ceil((data.resetTime - now) / 1000);

          res.setHeader("X-RateLimit-Limit", this.config.max);
          res.setHeader("X-RateLimit-Remaining", 0);
          res.setHeader("X-RateLimit-Reset", Math.floor(data.resetTime / 1000));
          res.setHeader("Retry-After", resetInSeconds);

          logger.warn("Rate limit exceeded (Fixed Window)", {
            key,
            ip: req.ip,
            path: req.path,
            count: data.count,
          });

          if (this.config.handler) {
            return this.config.handler(req, res);
          }

          return res.status(this.config.statusCode!).json({
            error: "Rate limit exceeded",
            message: this.config.message,
            retryAfter: resetInSeconds,
            type: "fixed_window",
          });
        }
      } catch (error) {
        logger.error("Fixed window rate limiter error", error);
        return next();
      }
    };
  }
}

// ============================================================================
// SLIDING WINDOW LOG ALGORITHM (Precise)
// ============================================================================

/**
 * Sliding Window Log Rate Limiter
 *
 * Most precise rate limiting, no edge cases
 * Perfect for: Critical operations, precise control needed
 *
 * How it works:
 * - Store timestamp of each request
 * - Count requests in sliding time window
 * - Remove requests older than window
 * - Memory intensive but very accurate
 *
 * Example: 100 requests per minute
 * - At any moment, counts requests in last 60 seconds
 * - No edge cases like fixed window
 * - Uses more memory to store all timestamps
 */
export class SlidingWindowLogRateLimiter {
  private store: RateLimitStore;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = {
      message: "Rate limit exceeded",
      statusCode: 429,
      keyGenerator: (req) => req.ip || "unknown",
      ...config,
    };
    this.store = store || new MemoryStore();
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (this.config.skip?.(req)) {
        return next();
      }

      const key = `ratelimit:slidingwindow:${this.config.keyGenerator!(req)}`;
      const now = Date.now();
      const windowStart = now - this.config.windowMs;

      try {
        let data = await this.store.get(key);

        if (!data) {
          data = {
            count: 0,
            resetTime: now + this.config.windowMs,
            requests: [],
          };
        }

        // Remove requests outside current window
        data.requests = (data.requests || []).filter(
          (timestamp) => timestamp > windowStart,
        );

        // Check limit
        if (data.requests.length < this.config.max) {
          data.requests.push(now);
          data.count += 1;
          data.resetTime = now + this.config.windowMs;
          await this.store.set(key, data);

          const remaining = this.config.max - data.requests.length;
          const oldestRequest = data.requests[0] || now;
          const resetTime = oldestRequest + this.config.windowMs;

          res.setHeader("X-RateLimit-Limit", this.config.max);
          res.setHeader("X-RateLimit-Remaining", remaining);
          res.setHeader("X-RateLimit-Reset", Math.floor(resetTime / 1000));

          return next();
        } else {
          // Limit exceeded
          const oldestRequest = data.requests[0] || now;
          const resetTime = oldestRequest + this.config.windowMs;
          const retryAfter = Math.ceil((resetTime - now) / 1000);

          res.setHeader("X-RateLimit-Limit", this.config.max);
          res.setHeader("X-RateLimit-Remaining", 0);
          res.setHeader("X-RateLimit-Reset", Math.floor(resetTime / 1000));
          res.setHeader("Retry-After", retryAfter);

          logger.warn("Rate limit exceeded (Sliding Window Log)", {
            key,
            ip: req.ip,
            path: req.path,
            requestCount: data.requests.length,
          });

          if (this.config.handler) {
            return this.config.handler(req, res);
          }

          return res.status(this.config.statusCode!).json({
            error: "Rate limit exceeded",
            message: this.config.message,
            retryAfter,
            type: "sliding_window_log",
          });
        }
      } catch (error) {
        logger.error("Sliding window log rate limiter error", error);
        return next();
      }
    };
  }
}

// ============================================================================
// ADAPTIVE RATE LIMITER (Smart)
// ============================================================================

/**
 * Adaptive Rate Limiter
 *
 * Adjusts limits based on user behavior and system load
 * Perfect for: Production systems, DDoS protection
 *
 * Features:
 * - Lower limits for suspicious behavior
 * - Higher limits for trusted users
 * - Adjusts based on error rates
 * - Considers system load
 */
export class AdaptiveRateLimiter {
  private store: RateLimitStore;
  private baseConfig: RateLimitConfig;

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.baseConfig = {
      message: "Rate limit exceeded",
      statusCode: 429,
      keyGenerator: (req) => req.ip || "unknown",
      ...config,
    };
    this.store = store || new MemoryStore();
  }

  async getAdaptiveLimit(req: Request): Promise<number> {
    let limit = this.baseConfig.max;

    // Check user reputation
    const userKey = this.baseConfig.keyGenerator!(req);
    const reputation = await this.getUserReputation(userKey);

    if (reputation === "trusted") {
      limit *= 2; // Double limit for trusted users
    } else if (reputation === "suspicious") {
      limit = Math.floor(limit * 0.5); // Half limit for suspicious
    }

    // Check authentication status
    if ((req as any).user) {
      limit = Math.floor(limit * 1.5); // 50% more for authenticated
    }

    // Check system load
    const systemLoad = await this.getSystemLoad();
    if (systemLoad > 0.8) {
      limit = Math.floor(limit * 0.7); // Reduce during high load
    }

    return Math.max(limit, 1); // At least 1 request
  }

  async getUserReputation(
    key: string,
  ): Promise<"trusted" | "normal" | "suspicious"> {
    // Check error rate, failed attempts, etc.
    const errorKey = `ratelimit:errors:${key}`;
    const errorData = await this.store.get(errorKey);

    if (!errorData) return "normal";

    const errorRate = errorData.count / (errorData.count + 100);

    if (errorRate > 0.5) return "suspicious";
    if (errorRate < 0.1) return "trusted";
    return "normal";
  }

  async getSystemLoad(): Promise<number> {
    // In production, check CPU, memory, active connections
    // For now, return mock value
    return 0.5; // 50% load
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (this.baseConfig.skip?.(req)) {
        return next();
      }

      const key = `ratelimit:adaptive:${this.baseConfig.keyGenerator!(req)}`;
      const now = Date.now();

      try {
        const adaptiveLimit = await this.getAdaptiveLimit(req);
        let data = await this.store.get(key);

        if (!data || data.resetTime <= now) {
          data = {
            count: 0,
            resetTime: now + this.baseConfig.windowMs,
          };
        }

        if (data.count < adaptiveLimit) {
          data.count += 1;
          await this.store.set(key, data);

          res.setHeader("X-RateLimit-Limit", adaptiveLimit);
          res.setHeader("X-RateLimit-Remaining", adaptiveLimit - data.count);
          res.setHeader("X-RateLimit-Reset", Math.floor(data.resetTime / 1000));

          return next();
        } else {
          const retryAfter = Math.ceil((data.resetTime - now) / 1000);

          res.setHeader("X-RateLimit-Limit", adaptiveLimit);
          res.setHeader("X-RateLimit-Remaining", 0);
          res.setHeader("Retry-After", retryAfter);

          logger.warn("Adaptive rate limit exceeded", {
            key,
            ip: req.ip,
            path: req.path,
            limit: adaptiveLimit,
          });

          return res.status(this.baseConfig.statusCode!).json({
            error: "Rate limit exceeded",
            message: this.baseConfig.message,
            retryAfter,
            type: "adaptive",
            limit: adaptiveLimit,
          });
        }
      } catch (error) {
        logger.error("Adaptive rate limiter error", error);
        return next();
      }
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { MemoryStore, RedisStore };
export type {
  LeakyBucketConfig,
  RateLimitConfig,
  RateLimitStore,
  TokenBucketConfig,
};
