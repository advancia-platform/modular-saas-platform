import { Request, Response, NextFunction } from "express";

// Simple in-memory rate limiter
// In production, use Redis or a dedicated rate limiting service
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  message?: string; // Custom error message
}

/**
 * Rate limiting middleware
 * Limits the number of requests from a single IP address
 */
export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, message } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || req.socket.remoteAddress || "unknown";
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
      res.setHeader("Retry-After", retryAfter);
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", new Date(record.resetTime).toISOString());

      return res.status(429).json({
        error: message || "Too many requests, please try again later.",
        retryAfter: `${retryAfter} seconds`,
      });
    }

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", maxRequests - record.count);
    res.setHeader("X-RateLimit-Reset", new Date(record.resetTime).toISOString());

    next();
  };
}

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  requestCounts.forEach((record, key) => {
    if (now > record.resetTime) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => requestCounts.delete(key));
}, 60000); // Clean up every minute

/**
 * Input validation middleware
 * Sanitizes and validates request inputs
 */
export function validateInput(req: Request, res: Response, next: NextFunction) {
  // Remove null bytes from inputs
  const sanitize = (obj: any): any => {
    if (typeof obj === "string") {
      return obj.replace(/\0/g, "");
    }
    if (typeof obj === "object" && obj !== null) {
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
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // HTTP Strict Transport Security (force HTTPS)\n  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");\n  \n  // Remove X-Powered-By header\n  res.removeHeader("X-Powered-By");\n  \n  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );

  next();
}

