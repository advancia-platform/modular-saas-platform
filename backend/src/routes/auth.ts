import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import * as nodemailer from "nodemailer";
import { z } from "zod";
import { config } from "../config";
import { authenticateToken, requireApiKey } from "../middleware/auth";
import { rateLimit } from "../middleware/security";
import prisma from "../prismaClient";
import {
  createNotification,
  notifyAllAdmins,
} from "../services/notificationService";
import { getRedis } from "../services/redisClient";

const router = express.Router();

// POST /api/auth/register - WITH ADMIN APPROVAL WORKFLOW
router.post("/register", requireApiKey, async (req, res) => {
  try {
    const { email, password, username, firstName, lastName } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, ...(username ? [{ username }] : [])] },
      select: { id: true },
    });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        username: username || email.split("@")[0],
        passwordHash,
        firstName: firstName || "",
        lastName: lastName || "",
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        active: true, // Account is active but...
        approved: false, // ...requires admin approval before access
        emailVerified: false,
      },
    });

    // Create user profile
    await prisma.userProfile.create({
      data: {
        id: `profile-${user.id}`, // Use prefixed ID to avoid conflicts
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create admin notification
    await prisma.adminNotification.create({
      data: {
        type: "NEW_USER",
        title: "🎉 New User Registration",
        message: `${firstName || email} just signed up and is waiting for approval!`,
        userId: user.id,
        metadata: { email, firstName, lastName, username },
        actionUrl: `/admin/users/${user.id}`,
      },
    });

    // Notify admins via push notifications
    try {
      await notifyAllAdmins({
        type: "all",
        category: "admin",
        title: "New User Registration - Pending Approval",
        message: `User ${email} (${firstName} ${lastName}) has registered and is awaiting approval.`,
        priority: "high",
        data: { userId: user.id, email, firstName, lastName },
      });
    } catch (notifyErr) {
      console.error("Failed to notify admins of registration:", notifyErr);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    return res.status(201).json({
      message: "Registration submitted. Awaiting admin approval.",
      status: "pending_approval",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        approved: false,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Failed to register user" });
  }
});

// POST /api/auth/login
router.post("/login", requireApiKey, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email }, { username: email }] },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        usdBalance: true,
        active: true,
        emailVerified: true,
      },
    });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: "Email not verified. Please verify your email to continue.",
        status: "email_unverified",
      });
    }

    if (!user.active) {
      return res.status(403).json({
        error: "Account pending admin approval.",
        status: "pending_approval",
      });
    }

    // Update last login (best effort)
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    } catch {}

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        usdBalance: (user as any).usdBalance?.toString?.() ?? "0",
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Failed to login" });
  }
});

// ============================================
// DOCTOR REGISTRATION (Invite-Only)
// ============================================

const registerDoctorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  specialization: z.string().min(1),
  licenseNumber: z.string().min(1),
  phoneNumber: z.string().optional(),
  inviteCode: z.string().min(1, "Invite code is required"),
});

// POST /api/auth/register-doctor
router.post("/register-doctor", requireApiKey, async (req, res) => {
  try {
    const data = registerDoctorSchema.parse(req.body);

    // Verify invite code
    const expectedCode = process.env.DOCTOR_INVITE_CODE;
    if (!expectedCode) {
      return res.status(500).json({
        error: "Server configuration error: DOCTOR_INVITE_CODE not set",
      });
    }

    if (data.inviteCode !== expectedCode) {
      return res.status(403).json({ error: "Invalid invite code" });
    }

    // Check if doctor already exists
    const existing = await prisma.doctor.findFirst({
      where: { email: data.email },
      select: { id: true },
    });
    if (existing) {
      return res
        .status(400)
        .json({ error: "Doctor with this email already exists" });
    }

    // Check license number uniqueness
    const existingLicense = await prisma.doctor.findFirst({
      where: { licenseNumber: data.licenseNumber },
      select: { id: true },
    });
    if (existingLicense) {
      return res
        .status(400)
        .json({ error: "License number already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create doctor (status: PENDING by default)
    const doctor = await prisma.doctor.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        specialization: data.specialization,
        licenseNumber: data.licenseNumber,
        phoneNumber: data.phoneNumber || null,
        inviteCode: data.inviteCode,
        status: "PENDING",
      },
    });

    // Generate JWT for doctor
    const token = jwt.sign(
      { doctorId: doctor.id, email: doctor.email, type: "doctor" },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    // Notify all admins about new doctor registration
    try {
      await notifyAllAdmins({
        type: "all",
        category: "admin",
        title: "New Doctor Registration",
        message: `Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialization}) has registered. Review their credentials and verify their account.`,
        priority: "high",
        data: {
          doctorId: doctor.id,
          email: doctor.email,
          specialization: doctor.specialization,
          licenseNumber: doctor.licenseNumber,
        },
      });
    } catch (e) {
      console.error("Admin notify failed (doctor registered):", e);
    }

    return res.status(201).json({
      message: "Doctor registered successfully. Awaiting admin verification.",
      token,
      doctor: {
        id: doctor.id,
        email: doctor.email,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization,
        status: doctor.status,
      },
    });
  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("Doctor registration error:", err);
    return res.status(500).json({ error: "Failed to register doctor" });
  }
});

// POST /api/auth/login-doctor
router.post("/login-doctor", requireApiKey, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const doctor = await prisma.doctor.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        specialization: true,
        status: true,
        passwordHash: true,
      },
    });

    if (!doctor || !doctor.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, doctor.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { doctorId: doctor.id, email: doctor.email, type: "doctor" },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Doctor login successful",
      token,
      doctor: {
        id: doctor.id,
        email: doctor.email,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization,
        status: doctor.status,
      },
    });
  } catch (err) {
    console.error("Doctor login error:", err);
    return res.status(500).json({ error: "Failed to login doctor" });
  }
});

// ------- OTP (Email Only) Flows (Redis-backed) ------- //
const otpLimiter = rateLimit({ windowMs: 60_000, maxRequests: 5 });

const sendOtpSchema = z.object({
  email: z.string().email({ message: "Valid email required" }),
});

const verifyOtpSchema = z.object({
  email: z.string().email({ message: "Valid email required" }),
  code: z.string().length(6),
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Valid email required" }),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: "Reset token is required" }),
  newPassword: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

// Simple SMTP test payload
const testSmtpSchema = z.object({
  to: z.string().email(),
  subject: z.string().optional(),
  message: z.string().optional(),
});

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateResetToken(): string {
  return require("crypto").randomBytes(32).toString("hex");
}

// POST /api/auth/send-otp
router.post("/send-otp", otpLimiter, async (req, res) => {
  try {
    const { email } = sendOtpSchema.parse(req.body || {});

    const user = await prisma.user.findFirst({
      where: { email },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const code = generateCode();
    const key = email;

    const redis = getRedis();
    const ttlSeconds = 5 * 60;
    const maxAttemptsWindow = 10 * 60; // 10 minutes
    const maxSendPerWindow = 5;
    const countKey = `otp:cnt:${key}`;
    const lockKey = `otp:lock:${key}`;

    // Fallback in-memory store when Redis not configured
    const mem: any =
      (global as any).__otpMem ||
      ((global as any).__otpMem = new Map<string, any>());

    if (redis) {
      const locked = await redis.get(lockKey);
      if (locked)
        return res.status(429).json({ error: "Too many attempts. Try later." });
      const cnt = await redis.incr(countKey);
      if (cnt === 1) await redis.expire(countKey, maxAttemptsWindow);
      if (cnt > maxSendPerWindow) {
        await redis.set(lockKey, "1", "EX", 30 * 60); // 30 min lockout
        return res
          .status(429)
          .json({ error: "Too many OTP requests. Try again later." });
      }
      await redis.setex(`otp:${key}`, ttlSeconds, code);
    } else {
      const now = Date.now();
      const entry = mem.get(key) || { count: 0, windowStart: now };
      if (now - entry.windowStart > maxAttemptsWindow * 1000) {
        entry.count = 0;
        entry.windowStart = now;
      }
      entry.count += 1;
      if (entry.count > maxSendPerWindow) {
        return res
          .status(429)
          .json({ error: "Too many OTP requests. Try again later." });
      }
      mem.set(key, { ...entry, code, exp: now + ttlSeconds * 1000 });
    }

    // Send via nodemailer if configured, else log
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your verification code",
        text: `Your Advancia verification code is ${code}`,
      });
    } else {
      console.log(`[DEV] OTP for ${email}: ${code}`);
    }

    return res.json({ message: "OTP sent" });
  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("send-otp error:", err);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});

// POST /api/auth/test-smtp
// Sends a direct SMTP email using configured Gmail credentials; does NOT require DB
router.post("/test-smtp", requireApiKey, async (req, res) => {
  try {
    const { to, subject, message } = testSmtpSchema.parse(req.body || {});

    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
    const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
    const EMAIL_REPLY_TO =
      process.env.EMAIL_REPLY_TO || EMAIL_USER || undefined;

    if (!EMAIL_USER || !EMAIL_PASSWORD) {
      return res.status(500).json({
        error:
          "SMTP not configured. Set EMAIL_USER and EMAIL_PASSWORD (Gmail App Password) in backend/.env",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
    });

    await transporter.sendMail({
      from: EMAIL_FROM,
      replyTo: EMAIL_REPLY_TO,
      to,
      subject: subject || "SMTP Test from Advancia",
      text:
        message ||
        "This is a direct SMTP test using Gmail. If you see this, your EMAIL_USER/EMAIL_PASSWORD work.",
    });

    return res.json({ message: "SMTP test email sent", to });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: err.issues });
    }
    console.error("test-smtp error:", err);
    return res.status(500).json({ error: "Failed to send SMTP test email" });
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", otpLimiter, async (req, res) => {
  try {
    const { email, code } = verifyOtpSchema.parse(req.body || {});
    const key = email;

    const redis = getRedis();
    let stored: string | null = null;
    if (redis) {
      stored = await redis.get(`otp:${key}`);
      if (!stored)
        return res
          .status(400)
          .json({ error: "No OTP requested or OTP expired" });
      if (String(code) !== stored)
        return res.status(400).json({ error: "Invalid OTP" });
      await redis.del(`otp:${key}`);
    } else {
      const mem: any =
        (global as any).__otpMem ||
        ((global as any).__otpMem = new Map<string, any>());
      const entry = mem.get(key);
      if (!entry || Date.now() > entry.exp)
        return res
          .status(400)
          .json({ error: "No OTP requested or OTP expired" });
      if (String(code) !== entry.code)
        return res.status(400).json({ error: "Invalid OTP" });
      mem.delete(key);
    }

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    try {
      await notifyAllAdmins({
        type: "all",
        category: "admin",
        title: "User Email Verified",
        message: `User ${user.email} has verified their email and is awaiting approval.`,
        priority: "normal",
        data: { userId: user.id, email: user.email },
      });
    } catch (e) {
      console.error("Admin notify failed (email verified):", e);
    }

    return res.json({
      message: "OTP verified",
      status: "pending_approval",
      token,
    });
  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("verify-otp error:", err);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", otpLimiter, async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body || {});

    const user = await prisma.user.findFirst({
      where: { email },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const resetToken = generateResetToken();
    const key = `reset:${user.id}`;

    const redis = getRedis();
    const ttlSeconds = 60 * 60; // 1 hour
    const maxAttemptsWindow = 10 * 60; // 10 minutes
    const maxRequestsPerWindow = 3;
    const countKey = `reset:cnt:${email}`;
    const lockKey = `reset:lock:${email}`;

    // Fallback in-memory store when Redis not configured
    const mem: any =
      (global as any).__resetMem ||
      ((global as any).__resetMem = new Map<string, any>());

    if (redis) {
      const locked = await redis.get(lockKey);
      if (locked)
        return res.status(429).json({ error: "Too many attempts. Try later." });
      const cnt = await redis.incr(countKey);
      if (cnt === 1) await redis.expire(countKey, maxAttemptsWindow);
      if (cnt > maxRequestsPerWindow) {
        await redis.set(lockKey, "1", "EX", 30 * 60); // 30 min lockout
        return res.status(429).json({
          error: "Too many password reset requests. Try again later.",
        });
      }
      await redis.setex(key, ttlSeconds, resetToken);
    } else {
      const now = Date.now();
      const entry = mem.get(key) || { count: 0, windowStart: now };
      if (now - entry.windowStart > maxAttemptsWindow * 1000) {
        entry.count = 0;
        entry.windowStart = now;
      }
      entry.count += 1;
      if (entry.count > maxRequestsPerWindow) {
        return res.status(429).json({
          error: "Too many password reset requests. Try again later.",
        });
      }
      mem.set(key, {
        ...entry,
        token: resetToken,
        exp: now + ttlSeconds * 1000,
      });
    }

    // Send reset email
    const resetLink = `http://localhost:3000/auth/reset-password?token=${resetToken}`;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Reset your Advancia password",
        html: `<p>Hi ${user.firstName || "there"},</p><p>You requested a password reset for your Advancia account.</p><p>Click the link below to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p><p>This link will expire in 1 hour.</p><p>If you didn't request this reset, please ignore this email.</p><p>Best,<br>The Advancia Team</p>`,
      });
    } else {
      console.log(`[DEV] Password reset for ${email}: ${resetLink}`);
    }

    return res.json({ message: "Password reset email sent" });
  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("forgot-password error:", err);
    return res.status(500).json({ error: "Failed to send reset email" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body || {});

    const redis = getRedis();
    const mem: any =
      (global as any).__resetMem ||
      ((global as any).__resetMem = new Map<string, any>());

    let userId: string | null = null;
    let storedToken: string | null = null;

    if (redis) {
      // Find the user ID by scanning all reset:* keys
      const keys = await redis.keys("reset:*");
      for (const key of keys) {
        if (
          key.startsWith("reset:") &&
          !key.includes(":cnt:") &&
          !key.includes(":lock:")
        ) {
          const stored = await redis.get(key);
          if (stored === token) {
            userId = key.replace("reset:", "");
            storedToken = stored;
            break;
          }
        }
      }
    } else {
      // Check in-memory store
      for (const [key, entry] of mem.entries()) {
        if (
          key.startsWith("reset:") &&
          entry.token === token &&
          entry.exp > Date.now()
        ) {
          userId = key.replace("reset:", "");
          storedToken = entry.token;
          break;
        }
      }
    }

    if (!userId || !storedToken) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Update user password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    // Clean up the token
    if (redis) {
      await redis.del(`reset:${userId}`);
    } else {
      mem.delete(`reset:${userId}`);
    }

    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("reset-password error:", err);
    return res.status(500).json({ error: "Failed to reset password" });
  }
});

// POST /api/auth/test-email// POST /api/auth/test-email
// Sends a simple email notification to the authenticated user to verify SMTP configuration
router.post(
  "/test-email",
  requireApiKey,
  authenticateToken,
  async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const subject = req.body?.subject || "Test Email from Advancia";
      const message =
        req.body?.message ||
        "This is a test email sent from the Advancia backend to verify SMTP settings.";

      await createNotification({
        userId: user.userId,
        type: "email",
        category: "system",
        title: subject,
        message,
      });

      return res.json({ message: "Test email enqueued" });
    } catch (err) {
      console.error("test-email error:", err);
      return res.status(500).json({ error: "Failed to send test email" });
    }
  }
);

// GET /api/auth/me - Get current user data from token
router.get("/me", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user });
  } catch (err) {
    console.error("auth/me error:", err);
    return res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// PUT /api/auth/me - Update current user profile
router.put("/me", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { firstName, lastName, username } = req.body;

    // Validate input
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId },
        },
      });
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(username !== undefined && { username }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json(updatedUser);
  } catch (err) {
    console.error("auth/me PUT error:", err);
    return res.status(500).json({ error: "Failed to update user profile" });
  }
});

// ===== PASSWORD RESET ROUTES =====

async function sendPasswordResetEmail(email: string, token: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset - Advancia PayLedger",
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your Advancia PayLedger account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this reset, please ignore this email.</p>
    `,
  });
}

// Password reset routes removed - use Redis-based implementation

// GET /api/auth/check-approval - Check if user is approved
router.get("/check-approval", authenticateToken, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        approved: true,
        rejectedAt: true,
        rejectionReason: true,
        approvedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      approved: user.approved,
      rejected: !!user.rejectedAt,
      reason: user.rejectionReason,
      approvedAt: user.approvedAt,
    });
  } catch (error) {
    console.error("Error checking approval:", error);
    return res.status(500).json({ error: "Failed to check approval status" });
  }
});

export default router;
