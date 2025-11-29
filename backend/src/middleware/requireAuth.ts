import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../auth/sessionManager";
import { logger } from "../logger";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    sessionId: string;
  };
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    logger.warn("Authentication failed: missing or invalid auth header", {
      ip: req.ip,
      path: req.path,
      userAgent: req.get("User-Agent"),
    });
    return res
      .status(401)
      .json({ error: "Unauthorized: Bearer token required" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = await verifyAccessToken(token);

    if (!payload) {
      logger.warn("Authentication failed: invalid token", {
        ip: req.ip,
        path: req.path,
        tokenLength: token.length,
      });
      return res
        .status(401)
        .json({ error: "Unauthorized: Invalid or expired token" });
    }

    // Attach user data to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    };

    logger.debug("Authentication successful", {
      userId: payload.userId,
      role: payload.role,
      sessionId: payload.sessionId?.substring(0, 8) + "...",
      path: req.path,
    });

    next();
  } catch (error) {
    logger.error("Authentication error", {
      error: error.message,
      ip: req.ip,
      path: req.path,
    });
    return res
      .status(401)
      .json({ error: "Unauthorized: Token verification failed" });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn("Role check failed: no user in request", {
        ip: req.ip,
        path: req.path,
      });
      return res
        .status(401)
        .json({ error: "Unauthorized: Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn("Role check failed: insufficient permissions", {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
      });
      return res
        .status(403)
        .json({ error: "Forbidden: Insufficient permissions" });
    }

    logger.debug("Role check passed", {
      userId: req.user.userId,
      userRole: req.user.role,
      requiredRoles: allowedRoles,
      path: req.path,
    });

    next();
  };
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  return requireRole(["ADMIN", "SUPER_ADMIN"])(req, res, next);
}

export type { AuthRequest };
