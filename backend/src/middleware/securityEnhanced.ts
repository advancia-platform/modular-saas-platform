/**
 * Security Middleware
 * Advanced security controls for production hardening
 */

import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { captureError } from "../utils/sentry.js";

/**
 * Validate request body against Zod schema
 */
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: err.issues,
        });
        return;
      }
      next(err);
    }
  };
}

/**
 * Sanitize input strings (prevent XSS)
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Sanitize query params
  Object.keys(req.query).forEach((key) => {
    if (typeof req.query[key] === "string") {
      req.query[key] = sanitizeString(req.query[key] as string);
    }
  });

  // Sanitize body
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }

  next();
}

function sanitizeString(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

function sanitizeObject(obj: any): void {
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "string") {
      obj[key] = sanitizeString(obj[key]);
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  });
}

/**
 * Enhanced security headers
 */
export function securityHeaders(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // Prevent MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Strict Transport Security (HTTPS only)
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://sentry.io"
  );

  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy (formerly Feature-Policy)
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );

  next();
}

/**
 * CSRF token validation middleware
 * Use with express-csrf or similar CSRF protection library
 */
export function validateCSRF(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }

  // In production, validate CSRF token
  if (process.env.NODE_ENV === "production") {
    const csrfToken = req.headers["x-csrf-token"];
    const sessionToken = req.session?.csrfToken;

    if (!csrfToken || csrfToken !== sessionToken) {
      res.status(403).json({
        success: false,
        error: "Invalid CSRF token",
      });
      return;
    }
  }

  next();
}

/**
 * Audit log for sensitive operations
 */
export function auditLog(operation: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    console.log(
      `[AUDIT] ${operation} by ${user?.email || "anonymous"} from ${req.ip}`
    );

    // Log to Sentry for critical operations
    if (
      operation.includes("delete") ||
      operation.includes("disable") ||
      operation.includes("superadmin")
    ) {
      captureError(new Error(`Audit: ${operation}`), {
        level: "info",
        tags: { type: "audit", operation },
        extra: {
          user: user?.email,
          userId: user?.id,
          role: user?.role,
          ip: req.ip,
          path: req.path,
          method: req.method,
        },
      });
    }

    next();
  };
}

/**
 * IP whitelist middleware (for admin endpoints)
 */
export function ipWhitelist(allowedIPs: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.socket.remoteAddress;

    if (
      process.env.NODE_ENV === "production" &&
      !allowedIPs.includes(clientIP || "")
    ) {
      captureError(new Error("Unauthorized IP access attempt"), {
        level: "warning",
        tags: { type: "security", event: "ip_blocked" },
        extra: { ip: clientIP, path: req.path },
      });

      res.status(403).json({
        success: false,
        error: "Access denied from this IP address",
      });
      return;
    }

    next();
  };
}

/**
 * Session timeout validation
 */
export function sessionTimeout(maxAgeMinutes: number = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = (req as any).session;
    const user = (req as any).user;

    if (!session || !user) {
      next();
      return;
    }

    const lastActivity = session.lastActivity || Date.now();
    const maxAge = maxAgeMinutes * 60 * 1000;

    if (Date.now() - lastActivity > maxAge) {
      // Session expired
      req.session?.destroy(() => {
        res.status(401).json({
          success: false,
          error: "Session expired",
          message: "Please log in again",
        });
      });
      return;
    }

    // Update last activity
    session.lastActivity = Date.now();
    next();
  };
}

/**
 * MFA enforcement for sensitive operations
 */
export function requireMFA(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Check if MFA is enabled and verified
  if (!user.totpEnabled || !user.totpVerified) {
    res.status(403).json({
      success: false,
      error: "MFA required",
      message: "Multi-factor authentication must be enabled for this operation",
    });
    return;
  }

  // Check if MFA was recently verified (within last 5 minutes)
  const session = (req as any).session;
  const mfaVerifiedAt = session?.mfaVerifiedAt;

  if (!mfaVerifiedAt || Date.now() - mfaVerifiedAt > 5 * 60 * 1000) {
    res.status(403).json({
      success: false,
      error: "MFA verification required",
      message: "Please re-verify your identity with MFA",
    });
    return;
  }

  next();
}
