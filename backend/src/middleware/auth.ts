import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AccessTokenPayload, sessionManager } from "../auth/sessionManager";
import { config } from "../jobs/config";
import { logger } from "../logger";
import prisma from "../prismaClient";
import { JWTPayload } from "../utils/jwt";
import { captureError } from "../utils/sentry";

/**
 * Helper to determine route group from URL path for Sentry tagging
 */
function getRouteGroup(path: string): string {
  if (path.includes("/api/admin")) return "admin";
  if (path.includes("/api/payments")) return "payments";
  if (path.includes("/api/crypto")) return "crypto";
  if (path.includes("/api/transactions")) return "transactions";
  if (path.includes("/api/auth")) return "auth";
  if (path.includes("/api/users")) return "users";
  return "other";
}

export interface AuthRequest extends Request {
  user?: AccessTokenPayload;
}

/**
 * Enhanced authentication middleware using session management
 */
export const authenticateTokenWithSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && typeof authHeader === "string"
      ? authHeader.split(" ")[1]
      : undefined;

  if (!token) {
    captureError(new Error("Missing authentication token"), {
      tags: {
        type: "security",
        event: "missing_auth_token",
        severity: "info",
        routeGroup: getRouteGroup(req.originalUrl),
      },
      extra: {
        attemptedRoute: `${req.method} ${req.originalUrl}`,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip || req.connection?.remoteAddress,
        authHeaderProvided: !!authHeader,
        timestamp: new Date().toISOString(),
      },
    });

    return res.status(401).json({
      error: "Access token required",
      code: "NO_TOKEN",
    });
  }

  try {
    // Verify token using session manager
    const payload = await sessionManager.verifyAccessToken(token);

    // Update session activity
    await sessionManager.updateSessionActivity(payload.sessionId, req);

    // Attach user data to request
    req.user = payload;

    logger.info(
      {
        userId: payload.userId,
        sessionId: payload.sessionId,
        role: payload.role,
        path: req.path,
        ip: req.ip,
      },
      "User authenticated with session",
    );

    next();
  } catch (error) {
    captureError(error as Error, {
      tags: {
        type: "security",
        event: "authentication_failure",
        severity: "warning",
        routeGroup: getRouteGroup(req.originalUrl),
      },
      extra: {
        attemptedRoute: `${req.method} ${req.originalUrl}`,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip || req.connection?.remoteAddress,
        tokenProvided: !!req.headers["authorization"],
        timestamp: new Date().toISOString(),
        errorMessage: (error as Error).message,
      },
    });

    return res.status(403).json({
      error: "Invalid or expired token",
      code: "INVALID_TOKEN",
    });
  }
};

/**
 * Middleware to verify JWT token and check account status
 */
export const authenticateToken = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && typeof authHeader === "string"
      ? authHeader.split(" ")[1]
      : undefined;

  if (!token) {
    // Log missing authentication attempt to Sentry
    captureError(new Error("Missing authentication token"), {
      tags: {
        type: "security",
        event: "missing_auth_token",
        severity: "info",
        routeGroup: getRouteGroup(req.originalUrl),
      },
      extra: {
        attemptedRoute: `${req.method} ${req.originalUrl}`,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip || req.connection?.remoteAddress,
        authHeaderProvided: !!authHeader,
        timestamp: new Date().toISOString(),
      },
    });

    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JWTPayload;

    // Check if account is active and approved in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        active: true,
        role: true,
        approved: true,
        rejectedAt: true,
        rejectionReason: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.active === false) {
      return res.status(403).json({ error: "Account disabled" });
    }

    // ✅ Approval check removed - free users get immediate access
    // Only block if account was explicitly rejected
    if (user.rejectedAt && user.role !== "ADMIN") {
      return res.status(403).json({
        error: "Account rejected",
        reason:
          user.rejectionReason ||
          "Your account was suspended. Please contact support.",
      });
    }

    // Update payload with fresh role from database
    payload.role = user.role;
    payload.active = user.active;

    req.user = payload;
    next();
  } catch (error) {
    // Log authentication failure to Sentry
    captureError(error as Error, {
      tags: {
        type: "security",
        event: "authentication_failure",
        severity: "warning",
        routeGroup: getRouteGroup(req.originalUrl),
      },
      extra: {
        attemptedRoute: `${req.method} ${req.originalUrl}`,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip || req.connection?.remoteAddress,
        tokenProvided: !!req.headers["authorization"],
        timestamp: new Date().toISOString(),
        errorMessage: (error as Error).message,
      },
    });

    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
/**
 * Middleware to check if user is admin
 */
export const requireAdmin = (req: any, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const isAdmin = req.user.role === "ADMIN";

  if (!isAdmin) {
    // Log unauthorized admin access attempt to Sentry
    captureError(new Error("Unauthorized admin access attempt"), {
      tags: {
        type: "security",
        event: "unauthorized_admin_access",
        severity: "warning",
        routeGroup: getRouteGroup(req.originalUrl),
      },
      extra: {
        userId: req.user.userId,
        userEmail: req.user.email,
        userRole: req.user.role,
        attemptedRoute: `${req.method} ${req.originalUrl}`,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip || req.connection?.remoteAddress,
        timestamp: new Date().toISOString(),
      },
      user: {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role,
      },
    });

    return res.status(403).json({
      error: "Access denied: Admin privileges required",
      message: "You do not have permission to access this resource",
    });
  }

  next();
};

/**
 * Flexible role-based access middleware
 * Usage: allowRoles("ADMIN", "STAFF")
 */
export const allowRoles = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      // Log unauthorized role-based access attempt to Sentry
      captureError(
        new Error(
          `Unauthorized access attempt - required roles: ${roles.join(", ")}`,
        ),
        {
          tags: {
            type: "security",
            event: "unauthorized_role_access",
            severity: "warning",
            routeGroup: getRouteGroup(req.originalUrl),
          },
          extra: {
            userId: req.user.userId,
            userEmail: req.user.email,
            userRole: req.user.role,
            requiredRoles: roles,
            attemptedRoute: `${req.method} ${req.originalUrl}`,
            userAgent: req.headers["user-agent"],
            ipAddress: req.ip || req.connection?.remoteAddress,
            timestamp: new Date().toISOString(),
          },
          user: {
            id: req.user.userId,
            email: req.user.email,
            role: req.user.role,
          },
        },
      );

      return res.status(403).json({
        error: "Access denied",
        message: `This resource requires one of the following roles: ${roles.join(
          ", ",
        )}`,
      });
    }

    next();
  };
};

/**
 * Middleware to restrict regular users from backend access
 */
export const restrictBackendAccess = (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  // Allow public routes
  const publicRoutes = [
    "/health",
    "/auth/send-otp",
    "/auth/verify-otp",
    "/auth/forgot-password",
    "/auth/reset-password",
  ];
  if (publicRoutes.some((route) => req.path.startsWith(route))) {
    return next();
  }

  // Require authentication for all other routes
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && typeof authHeader === "string"
      ? authHeader.split(" ")[1]
      : undefined;

  if (!token) {
    return res.status(401).json({
      error: "Access denied",
      message: "Backend access requires authentication",
    });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JWTPayload;
    req.user = payload;

    // Admin routes require admin role
    if (req.path.startsWith("/admin")) {
      return requireAdmin(req, res, next);
    }

    // Regular authenticated users can proceed
    next();
  } catch (error) {
    return res.status(403).json({
      error: "Invalid token",
      message: "Your session has expired. Please login again.",
    });
  }
};

/**
 * Middleware to log admin actions
 */
export const logAdminAction = (req: any, res: Response, next: NextFunction) => {
  if (req.user) {
    console.log(`[ADMIN ACTION] ${req.method} ${req.path}`, {
      admin: req.user.email,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }
  next();
};

// Lightweight API key middleware usable by routes/tests
export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const API_KEY = process.env.API_KEY || "dev-api-key-123";
  const apiKey = (req.headers["x-api-key"] || req.headers["X-API-Key"]) as
    | string
    | undefined;

  // In development/test we allow skipping the key to ease local work
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test"
  ) {
    return next();
  }

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  next();
}

// Simple bearer JWT guard — a small wrapper around jwt.verify that attaches `user` to req
export function requireAuth(req: any, res: Response, next: NextFunction) {
  const JWT_SECRET =
    process.env.JWT_SECRET ||
    ("test-jwt-secret-key-for-testing-only" as string);
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }
  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    // Attach user info to request for downstream handlers
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// JWT configuration
const JWT_ALGORITHM = "RS256";

// Generate access token with scopes
export function generateAccessToken(payload: {
  userId: string;
  email: string;
  role: string;
  tenantId?: string;
  scopes?: string[];
  sessionId?: string;
}): string {
  return jwt.sign(payload, config.jwtSecret, {
    algorithm: JWT_ALGORITHM,
    expiresIn: "15m", // Short-lived access token
    issuer: "advancia-pay",
    audience: "api",
  });
}

// Generate refresh token
export function generateRefreshToken(payload: {
  userId: string;
  sessionId: string;
}): string {
  return jwt.sign(payload, config.jwtSecret, {
    algorithm: JWT_ALGORITHM,
    expiresIn: "7d", // Long-lived refresh token
    issuer: "advancia-pay",
    audience: "refresh",
  });
}

// Verify JWT token
export function verifyToken(
  token: string,
  audience: "api" | "refresh" = "api",
): any {
  try {
    return jwt.verify(token, config.jwtSecret, {
      algorithms: [JWT_ALGORITHM],
      issuer: "advancia-pay",
      audience,
    });
  } catch (error) {
    logger.error(
      { error: (error as Error).message },
      "JWT verification failed",
    );
    throw new Error("Invalid token");
  }
}

// Scope-based authorization
export function requireScope(scopes: string | string[]) {
  return (req: any, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "Authentication required.",
        code: "AUTH_REQUIRED",
      });
      return;
    }

    const requiredScopes = Array.isArray(scopes) ? scopes : [scopes];
    const userScopes = req.user.scopes || [];

    const hasRequiredScope = requiredScopes.every(
      (scope) => userScopes.includes(scope) || userScopes.includes("*"),
    );

    if (!hasRequiredScope) {
      logger.warn(
        {
          userId: req.user.userId,
          userScopes,
          requiredScopes,
          path: req.path,
        },
        "Insufficient scopes",
      );

      res.status(403).json({
        error: "Insufficient scopes.",
        code: "INSUFFICIENT_SCOPES",
        required: requiredScopes,
        current: userScopes,
      });
      return;
    }

    next();
  };
}

// Multi-tenant isolation middleware
export function requireTenant(
  req: any,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({
      error: "Authentication required.",
      code: "AUTH_REQUIRED",
    });
    return;
  }

  // Super admin can access all tenants
  if (req.user.role === "SUPER_ADMIN") {
    next();
    return;
  }

  const tenantId =
    req.params.tenantId || req.body.tenantId || req.query.tenantId;

  if (!tenantId) {
    res.status(400).json({
      error: "Tenant ID is required.",
      code: "MISSING_TENANT_ID",
    });
    return;
  }

  if (req.user.tenantId && req.user.tenantId !== tenantId) {
    logger.warn(
      {
        userId: req.user.userId,
        userTenant: req.user.tenantId,
        requestedTenant: tenantId,
        path: req.path,
      },
      "Tenant isolation violation attempt",
    );

    res.status(403).json({
      error: "Access denied for this tenant.",
      code: "TENANT_ACCESS_DENIED",
    });
    return;
  }

  next();
}

// Session validation middleware
export async function validateSession(
  req: any,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user?.sessionId) {
    next();
    return;
  }

  try {
    const session = await prisma.userSession.findFirst({
      where: {
        id: req.user.sessionId,
        userId: req.user.userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
      logger.warn(
        {
          userId: req.user.userId,
          sessionId: req.user.sessionId,
        },
        "Invalid or expired session",
      );

      res.status(401).json({
        error: "Session expired. Please login again.",
        code: "SESSION_EXPIRED",
      });
      return;
    }

    // Update session last activity
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastActivity: new Date() },
    });

    next();
  } catch (error) {
    logger.error(
      {
        error: error.message,
        userId: req.user.userId,
        sessionId: req.user.sessionId,
      },
      "Session validation error",
    );

    res.status(500).json({
      error: "Session validation failed.",
      code: "SESSION_VALIDATION_ERROR",
    });
  }
}

// API key authentication for service-to-service communication
export function authenticateApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    res.status(401).json({
      error: "API key required.",
      code: "API_KEY_REQUIRED",
    });
    return;
  }

  const validApiKey = process.env.API_KEY;

  if (!validApiKey || apiKey !== validApiKey) {
    logger.warn(
      {
        ip: req.ip,
        path: req.path,
        providedKey: apiKey?.substring(0, 8) + "...",
      },
      "Invalid API key",
    );

    res.status(403).json({
      error: "Invalid API key.",
      code: "INVALID_API_KEY",
    });
    return;
  }

  next();
}
