import express from "express";
import jwt from "jsonwebtoken";
import { logger } from "../logger";
import {
  authRateLimiter,
  logAdminAction,
  sanitizeError,
  sanitizeObject,
  trackLoginAttempt,
} from "../middleware/securityHardening";
import prisma from "../prismaClient";
import { logAdminLogin } from "../utils/logger";
import { sendAlert } from "../utils/mailer";

const router = express.Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@advancia.com";
const ADMIN_PASS = process.env.ADMIN_PASS || "Admin@123";
const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh_secret_key";

// Temporary OTP store (in production, use Redis)
const otpStore: Record<string, { code: string; expires: number }> = {};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store active sessions (in production, use Redis)
export const activeSessions: Record<string, any> = {};

// Broadcast helper (will be set from index.ts)
let broadcastSessionsFn: (() => void) | null = null;
export function setBroadcastSessions(fn: () => void) {
  broadcastSessionsFn = fn;
}

// Generate access and refresh tokens
function generateTokens(basePayload: any) {
  const accessToken = jwt.sign({ ...basePayload, type: "access" }, JWT_SECRET, {
    expiresIn: "1d",
  });
  const refreshToken = jwt.sign(
    { ...basePayload, type: "refresh" },
    REFRESH_SECRET,
    { expiresIn: "7d" },
  );
  return { accessToken, refreshToken };
}

// Register session
export function registerSession(token: string, user: any) {
  activeSessions[token] = {
    email: user.email,
    role: user.role,
    createdAt: new Date().toISOString(),
  };
  if (broadcastSessionsFn) broadcastSessionsFn();
}

// POST /api/auth/admin/login - Step 1: Verify credentials and send OTP (HARDENED)
router.post("/login", authRateLimiter, async (req, res) => {
  try {
    const { email, password, phone } = req.body;
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "unknown";

    // Check IP-based rate limiting (100 req/min)
    // Note: trackIPRequests is a middleware, not called directly here
    // IP rate limiting is applied at route level instead

    // Check account lockout for admin email
    const lockoutCheck = await trackLoginAttempt(email, false);
    if (!lockoutCheck.allowed) {
      logger.warn(`Admin account locked: ${email} from ${ipAddress}`);
      await sendAlert(
        "🚨 Advancia: Admin Account Locked",
        `Email: ${email}\nIP: ${ipAddress}\nTime: ${new Date().toISOString()}\nReason: Multiple failed login attempts`,
      );
      return res.status(429).json({
        success: false,
        error: `Account temporarily locked. Try again in ${lockoutCheck.remainingMinutes} minutes.`,
        code: "ACCOUNT_LOCKED",
      });
    }

    // Verify credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASS) {
      // Track failed attempt
      await trackLoginAttempt(email, false);
      await logAdminLogin(req, email, "FAILED_PASSWORD", phone);

      // Create audit log
      // TODO: Fix AuditLog schema mismatch
      // await prisma.auditLog.create({
      //   data: {
      //     userId: null,
      //     action: "ADMIN_LOGIN_FAILED",
      //     details: `Failed admin login: invalid credentials`,
      //     ipAddress,
      //     userAgent: req.get("user-agent") || "unknown",
      //   },
      // });

      // Send alert on failed login
      await sendAlert(
        "🚫 Advancia: Failed Admin Login",
        `Email: ${email}\nTime: ${new Date().toISOString()}\nIP: ${ipAddress}`,
      );

      logger.warn(`Failed admin login: ${email} from ${ipAddress}`);
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Generate and send OTP (console-based, no SMS)
    const code = generateOTP();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore[email] = { code, expires };

    // Log OTP to console (no Twilio SMS)
    logger.info(
      `🔐 [ADMIN OTP] Email: ${email} | Code: ${code} | Expires in 5 minutes`,
    );
    await logAdminLogin(req, email, "OTP_SENT", phone || "console");

    // Create audit log
    // TODO: Fix AuditLog schema mismatch
    // await prisma.auditLog.create({
    //   data: {
    //     userId: null,
    //     action: 'ADMIN_OTP_SENT',
    //     details: `Admin OTP sent to ${email}`,
    //     ipAddress,
    //     userAgent: req.get('user-agent') || 'unknown',
    //   },
    // });

    res.json({
      success: true,
      step: "verify_otp",
      message: "OTP generated (check server console)",
      ...(process.env.NODE_ENV === "development" && { code }),
    });
  } catch (error: any) {
    logger.error("Admin login error:", error);
    res.status(500).json(sanitizeError(error));
  }
});

// POST /api/auth/admin/verify-otp - Step 2: Verify OTP and issue JWT (HARDENED)
router.post("/verify-otp", authRateLimiter, async (req, res) => {
  try {
    const { email, code } = req.body;
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "unknown";

    const entry = otpStore[email];
    if (!entry) {
      await logAdminLogin(req, email, "FAILED_OTP");
      // TODO: Fix AuditLog schema mismatch
      // await prisma.auditLog.create({
      //   data: {
      //     userId: null,
      //     action: 'ADMIN_OTP_FAILED',
      //     details: 'OTP verification failed: no OTP requested',
      //     ipAddress,
      //     userAgent: req.get('user-agent') || 'unknown',
      //   },
      // });
      logger.warn(`Admin OTP verification failed: no OTP for ${email}`);
      return res.status(400).json({
        success: false,
        error: "No OTP requested",
      });
    }

    if (Date.now() > entry.expires) {
      delete otpStore[email];
      // TODO: Fix AuditLog schema mismatch
      // await prisma.auditLog.create({
      //   data: {
      //     userId: null,
      //     action: 'ADMIN_OTP_EXPIRED',
      //     details: `OTP expired for ${email}`,
      //     ipAddress,
      //     userAgent: req.get('user-agent') || 'unknown',
      //   },
      // });
      logger.warn(`Admin OTP expired: ${email}`);
      await logAdminLogin(req, email, "FAILED_OTP");
      return res.status(400).json({
        success: false,
        error: "OTP expired",
      });
    }

    if (entry.code !== code) {
      await trackLoginAttempt(email, false);
      await logAdminLogin(req, email, "FAILED_OTP");
      // TODO: Fix AuditLog schema mismatch
      // await prisma.auditLog.create({
      //   data: {
      //     userId: null,
      //     action: 'ADMIN_OTP_INVALID',
      //     details: `Invalid OTP code for ${email}`,
      //     ipAddress,
      //     userAgent: req.get('user-agent') || 'unknown',
      //   },
      // });
      logger.warn(`Invalid admin OTP: ${email}`);
      return res.status(400).json({
        success: false,
        error: "Invalid code",
      });
    }

    // OTP verified successfully - reset lockout
    await trackLoginAttempt(email, true);
    delete otpStore[email];

    // Locate an ADMIN user so downstream auth middleware can validate userId
    let adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", active: true },
      select: { id: true, email: true, role: true },
    });
    if (!adminUser) {
      const fallback = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL },
        select: { id: true, email: true, role: true, active: true },
      });
      if (fallback && fallback.active !== false) {
        adminUser = {
          id: fallback.id,
          email: fallback.email,
          role: fallback.role,
        } as any;
      }
    }
    if (!adminUser) {
      return res.status(500).json({
        error: "No admin user found in database",
        message:
          "Seed or create an ADMIN user to enable admin API access (e.g., npm run db:seed)",
      });
    }

    const payload = {
      userId: adminUser.id,
      email: adminUser.email,
      role: "ADMIN",
      iss: process.env.JWT_ISSUER || "advancia-saas",
      aud: process.env.JWT_AUDIENCE || "advancia-api",
    };
    const { accessToken, refreshToken } = generateTokens(payload);

    // Register session
    registerSession(accessToken, payload);

    // Log successful login with audit
    await logAdminLogin(req, email, "SUCCESS");
    await logAdminAction(
      adminUser.id,
      "ADMIN_LOGIN_SUCCESS",
      `Admin ${email} logged in successfully`,
      req,
      null,
    );

    logger.info(
      `Admin login successful: ${email} (${adminUser.id}) from ${ipAddress}`,
    );

    // Send success alert
    await sendAlert(
      "🔐 Advancia: Admin Login",
      `Admin logged in: ${email}\nTime: ${new Date().toISOString()}\nIP: ${ipAddress}`,
    );

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: sanitizeObject({
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      }),
    });
  } catch (error: any) {
    logger.error("Admin OTP verification error:", error);
    res.status(500).json(sanitizeError(error));
  }
});

// DEV ONLY: Peek current OTP for a given email to facilitate automated tests
router.get("/dev/get-otp", (req, res) => {
  try {
    if (process.env.NODE_ENV !== "development") {
      return res
        .status(403)
        .json({ error: "Forbidden in non-development env" });
    }
    const email = (req.query.email as string) || "";
    if (!email) return res.status(400).json({ error: "email required" });
    const entry = otpStore[email];
    if (!entry) return res.status(404).json({ error: "No OTP for email" });
    return res.json({ code: entry.code, expires: entry.expires });
  } catch (e) {
    console.error("/dev/get-otp failed", e);
    return res.status(500).json({ error: "Internal error" });
  }
});

// GET /api/auth/admin/logs - Get admin login history (HARDENED)
router.get("/logs", async (req, res) => {
  try {
    // Get both old and new audit logs
    const [oldLogs, auditLogs] = await Promise.all([
      prisma.admin_login_logs.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.auditLog.findMany({
        where: {
          action: {
            in: [
              "ADMIN_LOGIN_FAILED",
              "ADMIN_OTP_SENT",
              "ADMIN_OTP_FAILED",
              "ADMIN_LOGIN_SUCCESS",
            ],
          },
        },
        orderBy: { timestamp: "desc" },
        take: 50,
      }),
    ]);

    // Sanitize sensitive data
    const sanitizedLogs = {
      admin_login_logs: oldLogs.map((log) => sanitizeObject(log)),
      audit_logs: auditLogs.map((log) => sanitizeObject(log)),
    };

    res.json({
      success: true,
      logs: sanitizedLogs,
    });
  } catch (error: any) {
    logger.error("Failed to fetch admin logs:", error);
    res.status(500).json(sanitizeError(error));
  }
});

// POST /api/auth/admin/refresh (HARDENED)
router.post("/refresh", authRateLimiter, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Refresh token required",
      });
    }

    const decoded: any = jwt.verify(token, REFRESH_SECRET);
    const { accessToken, refreshToken } = generateTokens({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      iss: process.env.JWT_ISSUER || "advancia-saas",
      aud: process.env.JWT_AUDIENCE || "advancia-api",
    });

    // Register new session
    registerSession(accessToken, {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    // Log token refresh
    // TODO: Fix AuditLog schema mismatch - details field doesn't exist, userId required
    // await prisma.auditLog.create({
    //   data: {
    //     userId: decoded.userId || null,
    //     action: "ADMIN_TOKEN_REFRESHED",
    //     details: `Admin token refreshed for ${decoded.email}`,
    //     ipAddress:
    //       (req.headers["x-forwarded-for"] as string) ||
    //       req.socket.remoteAddress ||
    //       "unknown",
    //     userAgent: req.get("user-agent") || "unknown",
    //   },
    // });

    logger.info(`Admin token refreshed: ${decoded.email}`);

    res.json({
      success: true,
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    logger.error("Admin token refresh error:", error);
    res.status(403).json({
      success: false,
      error: "Invalid refresh token",
    });
  }
});

export default router;
