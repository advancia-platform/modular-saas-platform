import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../jobs/config";
import prisma from "../prismaClient";
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

export interface JWTPayload {
  userId: string;
  email?: string;
  role?: string;
  type: string;
  active?: boolean;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
  body?: any;
  query?: any;
  params?: any;
}

/**
 * Middleware to verify JWT token and check account status
 */
export const authenticateToken = async (
  req: any,
  res: Response,
  next: NextFunction
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

    // Check if user is approved (skip for admin users)
    if (user.role !== "ADMIN" && user.approved === false) {
      if (user.rejectedAt) {
        return res.status(403).json({
          error: "Account rejected",
          reason:
            user.rejectionReason ||
            "Your account application was not approved. Please contact support.",
        });
      }
      return res.status(403).json({
        error: "Account pending approval",
        message:
          "Your account is awaiting admin approval. You will be notified via email once approved.",
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
          `Unauthorized access attempt - required roles: ${roles.join(", ")}`
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
        }
      );

      return res.status(403).json({
        error: "Access denied",
        message: `This resource requires one of the following roles: ${roles.join(
          ", "
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
  next: NextFunction
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
