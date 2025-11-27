import cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { config } from '../jobs/config';
import { EnvironmentInspector } from '../utils/envInspector';

// Lazy-load environment inspector to avoid validation errors during tests
let envInspector: EnvironmentInspector | null = null;
const getEnvInspector = () => {
  if (!envInspector) {
    envInspector = new EnvironmentInspector();
  }
  return envInspector;
};

// Dynamic import for Redis rate limiter (only in production)
let redisLimiter: any = null;
const initRedisLimiter = () => {
  if (getEnvInspector().isProduction() && process.env.REDIS_URL) {
    try {
      // Use rate-limiter-flexible with Redis for production
      const { RateLimiterRedis } = require('rate-limiter-flexible');
      const Redis = require('ioredis');

      const redisClient = new Redis(process.env.REDIS_URL);
      redisLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rate_limit',
        points: 300, // Number of requests
        duration: 60, // Per 60 seconds
      });
    } catch (error) {
      console.warn(
        '⚠️  Redis rate limiter failed to initialize, falling back to in-memory',
      );
    }
  }
};

// Fallback in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  message?: string; // Custom error message
}

/**
 * Rate limiting middleware
 * Uses Redis in production, in-memory fallback for development
 */
export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, message } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip rate limiting for admin users (prevents lockout)
      const user = (req as any).user;
      if (user && (user.role === 'admin' || user.isAdmin === true)) {
        return next();
      }

      const identifier = req.ip || req.socket.remoteAddress || 'unknown';

      if (redisLimiter) {
        // Use Redis-based rate limiting
        try {
          await redisLimiter.consume(identifier);
          next();
        } catch (rejRes: any) {
          const retryAfter = Math.ceil(rejRes.msBeforeNext / 1000);
          res.setHeader('Retry-After', retryAfter);
          res.setHeader('X-RateLimit-Limit', maxRequests);
          res.setHeader('X-RateLimit-Remaining', 0);
          res.setHeader(
            'X-RateLimit-Reset',
            new Date(Date.now() + rejRes.msBeforeNext).toISOString(),
          );

          return res.status(429).json({
            error: message || 'Too many requests, please try again later.',
            retryAfter: `${retryAfter} seconds`,
          });
        }
      } else {
        // Fallback to in-memory rate limiting
        const now = Date.now();

        // Get or create request count for this identifier
        let record = requestCounts.get(identifier);

        if (!record || now > record.resetTime) {
          // Create new record or reset expired one
          record = {
            count: 1,
            resetTime: now + windowMs,
          };
          requestCounts.set(identifier, record);
          return next();
        }

        // Increment count
        record.count++;

        // Check if limit exceeded
        if (record.count > maxRequests) {
          const retryAfter = Math.ceil((record.resetTime - now) / 1000);
          res.setHeader('Retry-After', retryAfter);
          res.setHeader('X-RateLimit-Limit', maxRequests);
          res.setHeader('X-RateLimit-Remaining', 0);
          res.setHeader(
            'X-RateLimit-Reset',
            new Date(record.resetTime).toISOString(),
          );

          return res.status(429).json({
            error: message || 'Too many requests, please try again later.',
            retryAfter: `${retryAfter} seconds`,
          });
        }

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', maxRequests - record.count);
        res.setHeader(
          'X-RateLimit-Reset',
          new Date(record.resetTime).toISOString(),
        );

        next();
      }
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Allow request on error to avoid blocking legitimate traffic
      next();
    }
  };
}

/**
 * Clean up expired entries periodically (only for in-memory fallback)
 */
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];

  requestCounts.forEach((record, key) => {
    if (now > record.resetTime) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => requestCounts.delete(key));
}, 60000); // Clean up every minute

// Don't run cleanup in test environment or when using Redis
if (process.env.NODE_ENV === 'test' || redisLimiter) {
  cleanupInterval.unref();
}
/**
 * Input validation middleware
 * Sanitizes and validates request inputs
 */
export function validateInput(req: Request, res: Response, next: NextFunction) {
  // Remove null bytes from inputs
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/\0/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
}

/**
 * CORS middleware configuration
 * Allows cross-origin requests from specified origins
 * Uses config.allowedOrigins as single source of truth
 */
export function corsMiddleware() {
  const corsOptions = {
    origin: function (origin: any, callback: any) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Use centralized allowed origins from config
      if (config.allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
    ],
  };

  return cors(corsOptions);
}

/**
 * Helmet middleware for security headers
 * Applies comprehensive security headers
 */
export function helmetMiddleware() {
  const isProd = process.env.NODE_ENV === 'production';

  // Allow self plus explicit allowed origins; include websockets
  const connectSrc = ['\'self\'', 'wss:', ...config.allowedOrigins];
  // In dev, permit localhost ranges to ease phone preview on LAN
  if (!isProd) {
    connectSrc.push(
      'http://localhost:*',
      'http://127.0.0.1:*',
      'ws://localhost:*',
      'ws://127.0.0.1:*',
    );
  }

  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['\'self\''],
        styleSrc: ['\'self\'', '\'unsafe-inline\''],
        scriptSrc: ['\'self\''],
        imgSrc: ['\'self\'', 'data:', 'https:'],
        connectSrc,
        fontSrc: ['\'self\''],
        objectSrc: ['\'none\''],
        mediaSrc: ['\'self\''],
        frameAncestors: ['\'none\''],
      },
    },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
  });
}
