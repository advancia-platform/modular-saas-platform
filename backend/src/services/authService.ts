// backend/src/services/authService.ts
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { logger } from "../logger";
import prisma from "../prismaClient";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  success: boolean;
  tokens?: AuthTokens;
  user?: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  error?: string;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Authenticate user with email/password
 */
export async function authenticateUser(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<LoginResult> {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        role: true,
        active: true,
        emailVerified: true,
      },
    });

    if (!user) {
      logger.warn("Login attempt with non-existent email", {
        email,
        ipAddress,
      });
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

    if (!user.active) {
      logger.warn("Login attempt with inactive account", { email, ipAddress });
      return {
        success: false,
        error: "Account is deactivated",
      };
    }

    if (!user.emailVerified) {
      logger.warn("Login attempt with unverified email", { email, ipAddress });
      return {
        success: false,
        error: "Please verify your email address first",
      };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn("Login attempt with invalid password", { email, ipAddress });
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

    // Generate tokens
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    logger.info("User login successful", {
      userId: user.id,
      email: user.email,
      role: user.role,
      ipAddress,
    });

    return {
      success: true,
      tokens: { accessToken, refreshToken },
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        role: user.role,
      },
    };
  } catch (error) {
    logger.error("Authentication error", {
      error: error.message,
      email,
      ipAddress,
    });
    return {
      success: false,
      error: "Authentication failed",
    };
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(
  email: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<PasswordResetResult> {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, active: true },
    });

    // Always return success to prevent email enumeration
    if (!user || !user.active) {
      logger.warn("Password reset requested for non-existent/inactive user", {
        email,
        ipAddress,
      });
      return {
        success: true,
        message:
          "If this email is registered, a password reset link will be sent.",
      };
    }

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create password reset request
    await prisma.password_reset_requests.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        email: user.email,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    logger.info("Password reset requested", {
      userId: user.id,
      email: user.email,
      ipAddress,
    });

    // Send password reset email
    try {
      const { sendPasswordResetEmail } = await import("./emailService.js");
      await sendPasswordResetEmail(email, token);
      logger.info("Password reset email sent successfully", { email });
    } catch (emailError: any) {
      logger.error("Failed to send password reset email", {
        error: emailError.message,
        email,
      });
      // Continue execution - the token is still valid even if email fails
    }

    return {
      success: true,
      message:
        "Password reset instructions have been sent to your email address.",
    };
  } catch (error) {
    logger.error("Password reset request error", {
      error: error.message,
      email,
      ipAddress,
    });
    return {
      success: false,
      message: "Failed to process password reset request",
      error: "Failed to process password reset request",
    };
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(
  token: string,
  newPassword: string,
  ipAddress?: string,
): Promise<PasswordResetResult> {
  try {
    // Find valid reset request
    const resetRequest = await prisma.password_reset_requests.findUnique({
      where: { token },
    });

    if (
      !resetRequest ||
      resetRequest.used ||
      resetRequest.expiresAt < new Date()
    ) {
      logger.warn("Invalid or expired password reset token used", {
        token: token.substring(0, 8) + "...",
        ipAddress,
      });
      return {
        success: false,
        message: "Invalid or expired reset token",
        error: "Invalid or expired reset token",
      };
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and mark reset as used
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRequest.userId },
        data: { passwordHash },
      });

      await tx.password_reset_requests.update({
        where: { id: resetRequest.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      });
    });

    logger.info("Password reset completed", {
      userId: resetRequest.userId,
      email: resetRequest.email,
      ipAddress,
    });

    return {
      success: true,
      message: "Password has been reset successfully",
    };
  } catch (error) {
    logger.error("Password reset error", {
      error: error.message,
      token: token.substring(0, 8) + "...",
      ipAddress,
    });
    return {
      success: false,
      message: "Failed to reset password",
      error: "Failed to reset password",
    };
  }
}

/**
 * 2FA Verification (existing stub updated)
 */
export async function verify2FACode(
  userId: string,
  code: string,
): Promise<boolean> {
  // Implementation would verify TOTP code against user's secret
  console.warn("verify2FACode called but not fully implemented");
  return false;
}

/**
 * Validate password reset token
 */
export async function validateResetToken(token: string): Promise<boolean> {
  try {
    const resetRequest = await prisma.password_reset_requests.findUnique({
      where: { token },
      select: {
        expiresAt: true,
        used: true,
      },
    });

    const isValid =
      resetRequest && !resetRequest.used && resetRequest.expiresAt > new Date();

    return !!isValid;
  } catch (error) {
    logger.error("Token validation error:", error);
    return false;
  }
}

/**
 * Hash password for storage
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
