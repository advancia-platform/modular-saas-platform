import { Request } from "express";
import jwt from "jsonwebtoken";
import { config } from "../jobs/config";
import { logger } from "../logger";
import prisma from "../prismaClient";
import {
  generateJti,
  generateOpaqueToken,
  hashToken,
  verifyTokenHash,
} from "./crypto";

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  tenantId?: string;
  scopes?: string[];
  sessionId: string;
  jti: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  tokenVersion: number;
  jti: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface SessionData {
  id: string;
  userId: string;
  refreshTokenHash: string;
  tokenVersion: number;
  userAgent?: string;
  ip?: string;
  isRevoked: boolean;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
}

export class SessionManager {
  private readonly JWT_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRY = "15m";
  private readonly REFRESH_TOKEN_EXPIRY = "7d";
  private readonly JWT_ALGORITHM = "HS256";
  private readonly ISSUER = "advancia-pay";
  private readonly ACCESS_AUDIENCE = "api";
  private readonly REFRESH_AUDIENCE = "refresh";

  constructor() {
    this.JWT_SECRET = config.jwtSecret;
    if (!this.JWT_SECRET) {
      throw new Error("JWT_SECRET is required for session management");
    }
  }

  /**
   * Create a new session with refresh and access tokens
   */
  async createSession(
    userId: string,
    userEmail: string,
    userRole: string,
    req?: Request,
    tenantId?: string,
    scopes?: string[],
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

      // Calculate expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      // Extract device information
      const userAgent = req?.get("User-Agent");
      const ip = req?.ip || req?.connection?.remoteAddress;

      // Create session in database
      const session = await prisma.session.create({
        data: {
          userId,
          refreshTokenHash,
          tokenVersion: 1,
          userAgent,
          ip,
          expiresAt,
          isActive: true,
          lastActivity: new Date(),
        },
      });

      // Generate access token
      const accessToken = this.generateAccessToken({
        userId,
        email: userEmail,
        role: userRole,
        sessionId: session.id,
        tenantId,
        scopes,
      });

      logger.info(
        {
          userId,
          sessionId: session.id,
          ip,
          userAgent: userAgent?.substring(0, 100),
        },
        "New session created",
      );

      return {
        accessToken,
        refreshToken,
        sessionId: session.id,
        expiresAt,
      };
    } catch (error) {
      logger.error(
        {
          error: error.message,
          userId,
          userEmail,
        },
        "Failed to create session",
      );
      throw new Error("Failed to create session");
    }
  }

  /**
   * Generate a new access token
   */
  private generateAccessToken(payload: {
    userId: string;
    email: string;
    role: string;
    sessionId: string;
    tenantId?: string;
    scopes?: string[];
  }): string {
    const jti = generateJti();
    const now = Math.floor(Date.now() / 1000);

    const tokenPayload: AccessTokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
      tenantId: payload.tenantId,
      scopes: payload.scopes || [],
      jti,
      iat: now,
      exp: now + 15 * 60, // 15 minutes
      iss: this.ISSUER,
      aud: this.ACCESS_AUDIENCE,
    };

    return jwt.sign(tokenPayload, this.JWT_SECRET, {
      algorithm: this.JWT_ALGORITHM,
    });
  }

  /**
   * Refresh an access token using a refresh token
   */
  async refreshTokens(
    refreshToken: string,
    req?: Request,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  }> {
    try {
      // Find all active sessions to check the refresh token
      const sessions = await prisma.session.findMany({
        where: {
          isRevoked: false,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              active: true,
            },
          },
        },
      });

      // Find matching session by verifying refresh token
      let matchingSession: any = null;
      for (const session of sessions) {
        const isValid = await verifyTokenHash(
          refreshToken,
          session.refreshTokenHash,
        );
        if (isValid) {
          matchingSession = session;
          break;
        }
      }

      if (!matchingSession) {
        throw new Error("Invalid refresh token");
      }

      // Check if user is still active
      if (!matchingSession.user.active) {
        await this.revokeSession(
          matchingSession.id,
          "User account deactivated",
        );
        throw new Error("User account is deactivated");
      }

      // Generate new tokens with rotation
      const newRefreshToken = generateOpaqueToken(32);
      const newRefreshTokenHash = await hashToken(newRefreshToken);

      // Update session with new refresh token and increment version
      await prisma.session.update({
        where: { id: matchingSession.id },
        data: {
          refreshTokenHash: newRefreshTokenHash,
          tokenVersion: matchingSession.tokenVersion + 1,
          lastActivity: new Date(),
          // Update IP if changed
          ip: req?.ip || matchingSession.ip,
        },
      });

      // Generate new access token
      const accessToken = this.generateAccessToken({
        userId: matchingSession.user.id,
        email: matchingSession.user.email,
        role: matchingSession.user.role,
        sessionId: matchingSession.id,
      });

      logger.info(
        {
          userId: matchingSession.user.id,
          sessionId: matchingSession.id,
          tokenVersion: matchingSession.tokenVersion + 1,
        },
        "Tokens refreshed successfully",
      );

      return {
        accessToken,
        refreshToken: newRefreshToken,
        sessionId: matchingSession.id,
      };
    } catch (error) {
      logger.error(
        {
          error: error.message,
        },
        "Token refresh failed",
      );
      throw new Error("Token refresh failed");
    }
  }

  /**
   * Verify an access token
   */
  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET, {
        algorithms: [this.JWT_ALGORITHM],
        issuer: this.ISSUER,
        audience: this.ACCESS_AUDIENCE,
      }) as AccessTokenPayload;

      // Check if token is revoked
      const revokedToken = await prisma.revokedAccessToken.findUnique({
        where: { jti: payload.jti },
      });

      if (revokedToken) {
        throw new Error("Token has been revoked");
      }

      // Check if session is still valid
      const session = await prisma.session.findFirst({
        where: {
          id: payload.sessionId,
          isRevoked: false,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!session) {
        throw new Error("Session is invalid or expired");
      }

      return payload;
    } catch (error) {
      logger.warn(
        {
          error: error.message,
        },
        "Access token verification failed",
      );
      throw new Error("Invalid access token");
    }
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string, reason?: string): Promise<void> {
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          isRevoked: true,
          isActive: false,
        },
      });

      logger.info(
        {
          sessionId,
          reason: reason || "Manual revocation",
        },
        "Session revoked",
      );
    } catch (error) {
      logger.error(
        {
          error: error.message,
          sessionId,
        },
        "Failed to revoke session",
      );
      throw new Error("Failed to revoke session");
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(
    userId: string,
    reason?: string,
  ): Promise<number> {
    try {
      const result = await prisma.session.updateMany({
        where: {
          userId,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          isActive: false,
        },
      });

      logger.info(
        {
          userId,
          revokedCount: result.count,
          reason: reason || "Manual revocation",
        },
        "All user sessions revoked",
      );

      return result.count;
    } catch (error) {
      logger.error(
        {
          error: error.message,
          userId,
        },
        "Failed to revoke user sessions",
      );
      throw new Error("Failed to revoke user sessions");
    }
  }

  /**
   * Revoke an access token immediately
   */
  async revokeAccessToken(
    jti: string,
    userId: string,
    reason?: string,
  ): Promise<void> {
    try {
      // Get token expiration from JWT without verification (it might be expired)
      const decoded = jwt.decode(jti) as any;
      const exp = decoded?.exp || Math.floor(Date.now() / 1000) + 3600; // Default 1 hour if can't decode

      await prisma.revokedAccessToken.create({
        data: {
          jti,
          userId,
          reason,
          exp,
        },
      });

      logger.info(
        {
          jti,
          userId,
          reason: reason || "Manual revocation",
        },
        "Access token revoked",
      );
    } catch (error) {
      logger.error(
        {
          error: error.message,
          jti,
          userId,
        },
        "Failed to revoke access token",
      );
      throw new Error("Failed to revoke access token");
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const sessions = await prisma.session.findMany({
        where: {
          userId,
          isRevoked: false,
        },
        orderBy: {
          lastActivity: "desc",
        },
      });

      return sessions.map((session) => ({
        id: session.id,
        userId: session.userId,
        refreshTokenHash: session.refreshTokenHash,
        tokenVersion: session.tokenVersion,
        userAgent: session.userAgent,
        ip: session.ip,
        isRevoked: session.isRevoked,
        isActive: session.isActive,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      }));
    } catch (error) {
      logger.error(
        {
          error: error.message,
          userId,
        },
        "Failed to get user sessions",
      );
      throw new Error("Failed to get user sessions");
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string, req?: Request): Promise<void> {
    try {
      const updateData: any = {
        lastActivity: new Date(),
      };

      // Update IP if provided and different
      if (req?.ip) {
        updateData.ip = req.ip;
      }

      await prisma.session.update({
        where: { id: sessionId },
        data: updateData,
      });
    } catch (error) {
      // Don't throw error for activity updates to avoid breaking requests
      logger.warn(
        {
          error: error.message,
          sessionId,
        },
        "Failed to update session activity",
      );
    }
  }

  /**
   * Clean up expired sessions and revoked tokens
   */
  async cleanupExpiredSessions(): Promise<{
    sessionsDeleted: number;
    tokensDeleted: number;
  }> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Delete expired sessions
      const expiredSessions = await prisma.session.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            {
              AND: [{ isRevoked: true }, { updatedAt: { lt: oneDayAgo } }],
            },
          ],
        },
      });

      // Delete expired revoked tokens
      const expiredTokens = await prisma.revokedAccessToken.deleteMany({
        where: {
          exp: { lt: Math.floor(now.getTime() / 1000) },
        },
      });

      logger.info(
        {
          sessionsDeleted: expiredSessions.count,
          tokensDeleted: expiredTokens.count,
        },
        "Cleanup completed",
      );

      return {
        sessionsDeleted: expiredSessions.count,
        tokensDeleted: expiredTokens.count,
      };
    } catch (error) {
      logger.error(
        {
          error: error.message,
        },
        "Cleanup failed",
      );
      throw new Error("Cleanup failed");
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
