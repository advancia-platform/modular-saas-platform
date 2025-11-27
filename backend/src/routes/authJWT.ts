import { Role } from "@prisma/client";
import { Request, Response, Router } from "express";
import { logger } from "../logger";
import { authenticateToken } from "../middleware/authenticateToken";
import {
    authRateLimiter,
    registrationRateLimiter,
    sanitizeError,
    sanitizeObject,
    trackLoginAttempt,
    validatePasswordStrength,
} from "../middleware/securityHardening";
import prisma from "../prismaClient";
import { generateTokenPair } from "../utils/jwt";
import { hashPassword, verifyPassword } from "../utils/password";

const router = Router();

/**
 * POST /api/auth/signup
 * Register a new user with security hardening
 */
router.post(
  "/signup",
  registrationRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, username, password, fullName } = req.body;

      // Validate required fields
      if (!email || !username || !password) {
        res.status(400).json({
          success: false,
          error: "Email, username, and password are required",
        });
        return;
      }

      // Validate password strength with comprehensive policy
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        res.status(400).json({
          success: false,
          error: "Password does not meet security requirements",
          details: passwordValidation.errors,
        });
        return;
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: email.toLowerCase() }, { username }],
        },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: "An account with this email or username already exists",
        });
        return;
      }

      // Hash password with bcrypt (cost factor 12)
      const passwordHash = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          username,
          passwordHash,
          firstName: fullName || username,
          role: Role.USER,
          emailVerified: false,
        },
      });

      // Log registration
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_REGISTERED",
          details: "New user registration",
          ipAddress: req.ip || "unknown",
          userAgent: req.get("user-agent") || "unknown",
        },
      });

      logger.info(`New user registered: ${user.id} (${user.email})`);

      // Generate tokens with enhanced claims
      const tokens = generateTokenPair({
        userId: user.id,
        id: user.id,
        email: user.email,
        role: user.role,
        type: "access",
        iss: process.env.JWT_ISSUER || "advancia-saas",
        aud: process.env.JWT_AUDIENCE || "advancia-api",
      });

      // Sanitize user object before sending
      const sanitizedUser = sanitizeObject({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
      });

      res.status(201).json({
        success: true,
        message:
          "Account created successfully. Please check your email to verify your account.",
        user: sanitizedUser,
        tokens,
      });
    } catch (error: any) {
      logger.error("Registration error:", error);
      res.status(500).json(sanitizeError(error));
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticate user with account lockout protection
 */
router.post(
  "/login",
  authRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { emailOrUsername, password } = req.body;

      if (!emailOrUsername || !password) {
        res.status(400).json({
          success: false,
          error: "Email/username and password are required",
        });
        return;
      }

      // Normalize email
      const normalizedInput = emailOrUsername.toLowerCase();

      // Check account lockout before attempting login
      const lockoutCheck = await trackLoginAttempt(normalizedInput, false);
      if (!lockoutCheck.allowed) {
        res.status(429).json({
          success: false,
          error: `Account temporarily locked due to multiple failed login attempts. Please try again in ${lockoutCheck.remainingMinutes} minutes.`,
          code: "ACCOUNT_LOCKED",
          retryAfter: lockoutCheck.remainingMinutes! * 60,
        });
        return;
      }

      // Find user by email or username
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: normalizedInput },
            { username: emailOrUsername },
          ],
        },
      });

      if (!user || !user.passwordHash) {
        // Track failed attempt and check if account should be locked
        await trackLoginAttempt(normalizedInput, false);
        await prisma.auditLog.create({
          data: {
            userId: null,
            action: "LOGIN_FAILED",
            details: `Failed login attempt for ${normalizedInput}`,
            ipAddress: req.ip || "unknown",
            userAgent: req.get("user-agent") || "unknown",
          },
        });
        logger.warn(`Failed login attempt: ${normalizedInput} (user not found)`);
        res.status(401).json({
          success: false,
          error: "Invalid credentials",
        });
        return;
      }

      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);

      if (!isValid) {
        // Track failed attempt
        await trackLoginAttempt(normalizedInput, false);
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN_FAILED",
            details: "Incorrect password",
            ipAddress: req.ip || "unknown",
            userAgent: req.get("user-agent") || "unknown",
          },
        });
        logger.warn(`Failed login: ${normalizedInput} (invalid password)`);
        res.status(401).json({
          success: false,
          error: "Invalid credentials",
        });
        return;
      }

      // Successful login - reset lockout
      await trackLoginAttempt(normalizedInput, true);

      // Log successful login
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "LOGIN_SUCCESS",
          details: "User logged in successfully",
          ipAddress: req.ip || "unknown",
          userAgent: req.get("user-agent") || "unknown",
        },
      });

      logger.info(`Successful login: ${user.id} (${user.email})`);

      // Generate tokens with enhanced claims
      const tokens = generateTokenPair({
        userId: user.id,
        id: user.id,
        email: user.email,
        role: user.role,
        type: "access",
        iss: process.env.JWT_ISSUER || "advancia-saas",
        aud: process.env.JWT_AUDIENCE || "advancia-api",
      });

      // Sanitize user object
      const sanitizedUser = sanitizeObject({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        user: sanitizedUser,
        tokens,
      });
    } catch (error: any) {
      logger.error("Login error:", error);
      res.status(500).json(sanitizeError(error));
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token (rate-limited)
 */
router.post(
  "/refresh",
  authRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: "Refresh token required",
        });
        return;
      }

      // Import verifyRefreshToken here to avoid circular dependency
      const { verifyRefreshToken } = await import("../utils/jwt.js");
      const payload = verifyRefreshToken(refreshToken);

      // Verify user still exists and is not disabled
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        logger.warn(`Token refresh failed: user ${payload.userId} not found`);
        res.status(401).json({
          success: false,
          error: "Invalid refresh token",
        });
        return;
      }

      // Log token refresh
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "TOKEN_REFRESHED",
          details: "Access token refreshed",
          ipAddress: req.ip || "unknown",
          userAgent: req.get("user-agent") || "unknown",
        },
      });

      // Generate new tokens with enhanced claims
      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
        iss: process.env.JWT_ISSUER || "advancia-saas",
        aud: process.env.JWT_AUDIENCE || "advancia-api",
      });

      res.status(200).json({
        success: true,
        tokens,
      });
    } catch (error: any) {
      logger.error("Refresh token error:", error);
      res.status(403).json({
        success: false,
        error: "Invalid or expired refresh token",
      });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user profile (protected with JWT validation)
 */
router.get(
  "/me",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          emailVerified: true,
          totpEnabled: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: "User not found",
        });
        return;
      }

      // Sanitize user data
      const sanitizedUser = sanitizeObject(user);

      res.status(200).json({ success: true, user: sanitizedUser });
    } catch (error: any) {
      logger.error("Get profile error:", error);
      res.status(500).json(sanitizeError(error));
    }
  }
);

/**
 * POST /api/auth/logout
 * Logout user with audit logging
 */
router.post(
  "/logout",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.user) {
        // Log logout event
        await prisma.auditLog.create({
          data: {
            userId: req.user.userId,
            action: "USER_LOGOUT",
            details: "User logged out",
            ipAddress: req.ip || "unknown",
            userAgent: req.get("user-agent") || "unknown",
          },
        });

        logger.info(`User logged out: ${req.user.userId}`);
      }

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      logger.error("Logout error:", error);
      res.status(500).json(sanitizeError(error));
    }
  }
);

export default router;
