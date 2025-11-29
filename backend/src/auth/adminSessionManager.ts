/**
 * Admin Session Manager
 * Enhanced session management for admin users with:
 * - Extended session lifetime (30 days vs 7 days for users)
 * - Persistent "remember me" sessions
 * - Activity-based expiry extension
 * - No automatic logout on inactivity for admins
 */

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { generateOpaqueToken, hashToken } from "../auth/crypto";
import { logger } from "../logger";
import prisma from "../prismaClient";

// Admin session configuration
const ADMIN_CONFIG = {
  ACCESS_TOKEN_EXPIRY: "1h", // Longer access token for admins
  REFRESH_TOKEN_EXPIRY_DAYS: 30, // 30 days for admin refresh tokens
  REMEMBER_ME_EXPIRY_DAYS: 90, // 90 days for "remember me"
  ACTIVITY_EXTENSION_HOURS: 24, // Extend session on activity
  MAX_CONCURRENT_SESSIONS: 5, // Max admin sessions per user
};

interface AdminSessionPayload {
  userId: string;
  email: string;
  role: "admin" | "superadmin";
  sessionId: string;
  persistent: boolean;
  jti: string;
  iat: number;
  exp: number;
}

/**
 * Create an admin session with extended lifetime
 */
export async function createAdminSession(
  userId: string,
  email: string,
  role: "admin" | "superadmin",
  req: Request,
  rememberMe: boolean = false,
): Promise<{
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresAt: Date;
}> {
  try {
    // Generate tokens
    const refreshToken = generateOpaqueToken(32);
    const refreshTokenHash = await hashToken(refreshToken);
    const sessionId = generateOpaqueToken(16);
    const jti = generateOpaqueToken(8);

    // Calculate expiry based on remember me
    const expiryDays = rememberMe
      ? ADMIN_CONFIG.REMEMBER_ME_EXPIRY_DAYS
      : ADMIN_CONFIG.REFRESH_TOKEN_EXPIRY_DAYS;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Extract device info
    const userAgent = req.get("User-Agent") || "Unknown";
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "Unknown";

    // Check concurrent session limit
    const activeSessions = await prisma.session.count({
      where: {
        userId,
        isActive: true,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (activeSessions >= ADMIN_CONFIG.MAX_CONCURRENT_SESSIONS) {
      // Revoke oldest session
      const oldestSession = await prisma.session.findFirst({
        where: {
          userId,
          isActive: true,
          isRevoked: false,
        },
        orderBy: { createdAt: "asc" },
      });

      if (oldestSession) {
        await prisma.session.update({
          where: { id: oldestSession.id },
          data: { isRevoked: true, isActive: false },
        });
        logger.info("Revoked oldest admin session", {
          userId,
          revokedSessionId: oldestSession.id,
        });
      }
    }

    // Create session in database
    const session = await prisma.session.create({
      data: {
        id: sessionId,
        userId,
        refreshTokenHash,
        tokenVersion: 1,
        userAgent,
        ip,
        isActive: true,
        isRevoked: false,
        lastActivity: new Date(),
        expiresAt,
      },
    });

    // Generate access token with admin-specific claims
    const accessTokenPayload: Omit<AdminSessionPayload, "iat" | "exp"> = {
      userId,
      email,
      role,
      sessionId,
      persistent: rememberMe,
      jti,
    };

    const accessToken = jwt.sign(accessTokenPayload, process.env.JWT_SECRET!, {
      expiresIn: ADMIN_CONFIG.ACCESS_TOKEN_EXPIRY,
      algorithm: "HS256",
      issuer: "advancia-pay-admin",
      audience: "admin-api",
    });

    logger.info("Admin session created", {
      userId,
      sessionId,
      rememberMe,
      expiresAt,
      ip,
    });

    return {
      accessToken,
      refreshToken,
      sessionId,
      expiresAt,
    };
  } catch (error) {
    logger.error("Failed to create admin session", { error, userId });
    throw error;
  }
}

/**
 * Extend admin session on activity
 */
export async function extendAdminSession(sessionId: string): Promise<boolean> {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.isRevoked || !session.isActive) {
      return false;
    }

    // Only extend if within extension window
    const extensionThreshold = new Date();
    extensionThreshold.setHours(
      extensionThreshold.getHours() + ADMIN_CONFIG.ACTIVITY_EXTENSION_HOURS,
    );

    if (session.expiresAt < extensionThreshold) {
      // Extend by activity extension hours
      const newExpiry = new Date();
      newExpiry.setHours(
        newExpiry.getHours() + ADMIN_CONFIG.ACTIVITY_EXTENSION_HOURS * 2,
      );

      await prisma.session.update({
        where: { id: sessionId },
        data: {
          expiresAt: newExpiry,
          lastActivity: new Date(),
        },
      });

      logger.debug("Admin session extended", { sessionId, newExpiry });
      return true;
    }

    // Update last activity
    await prisma.session.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    });

    return true;
  } catch (error) {
    logger.error("Failed to extend admin session", { error, sessionId });
    return false;
  }
}

/**
 * Middleware to keep admin sessions alive
 * Unlike regular user sessions, admin sessions don't timeout on inactivity
 */
export function adminSessionKeepAlive(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const user = (req as any).user;

  if (
    user &&
    (user.role === "admin" || user.role === "superadmin") &&
    user.sessionId
  ) {
    // Extend session in background (don't wait)
    extendAdminSession(user.sessionId).catch(() => {});
  }

  next();
}

/**
 * Check if admin session is valid and not expired
 */
export async function validateAdminSession(
  sessionId: string,
): Promise<boolean> {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: { id: true, role: true, active: true },
        },
      },
    });

    if (!session) return false;
    if (session.isRevoked) return false;
    if (!session.isActive) return false;
    if (session.expiresAt < new Date()) return false;
    if (!session.user?.active) return false;
    if (session.user?.role !== "admin" && session.user?.role !== "superadmin") {
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Failed to validate admin session", { error, sessionId });
    return false;
  }
}

/**
 * Revoke all admin sessions for a user
 */
export async function revokeAllAdminSessions(userId: string): Promise<number> {
  try {
    const result = await prisma.session.updateMany({
      where: {
        userId,
        isActive: true,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        isActive: false,
      },
    });

    logger.info("Revoked all admin sessions", { userId, count: result.count });
    return result.count;
  } catch (error) {
    logger.error("Failed to revoke admin sessions", { error, userId });
    throw error;
  }
}

/**
 * Get active admin sessions for a user
 */
export async function getActiveAdminSessions(userId: string): Promise<
  Array<{
    id: string;
    userAgent: string | null;
    ip: string | null;
    lastActivity: Date;
    createdAt: Date;
    expiresAt: Date;
    isCurrent?: boolean;
  }>
> {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      isActive: true,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      userAgent: true,
      ip: true,
      lastActivity: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { lastActivity: "desc" },
  });

  return sessions;
}

export default {
  createAdminSession,
  extendAdminSession,
  adminSessionKeepAlive,
  validateAdminSession,
  revokeAllAdminSessions,
  getActiveAdminSessions,
  ADMIN_CONFIG,
};
