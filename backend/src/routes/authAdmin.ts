import express from "express";
import jwt from "jsonwebtoken";
import { sendAlert } from "../utils/mailer";
import { logAdminLogin } from "../utils/logger";
import twilio from "twilio";
import prisma from "../prismaClient";

const router = express.Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@advancia.com";
const ADMIN_PASS = process.env.ADMIN_PASS || "Admin@123";
const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh_secret_key";

// Twilio client for SMS OTP
function getTwilioClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return null;
}

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
    { expiresIn: "7d" }
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

// POST /api/auth/admin/login - Step 1: Verify credentials and send OTP
router.post("/login", async (req, res) => {
  const { email, password, phone } = req.body;

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASS) {
    // Log failed password attempt
    await logAdminLogin(req, email, "FAILED_PASSWORD", phone);

    // Send alert on failed login
    await sendAlert(
      "🚫 Advancia: Failed Admin Login",
      `Email: ${email}\nTime: ${new Date().toISOString()}\nIP: ${
        req.headers["x-forwarded-for"] || req.socket.remoteAddress
      }`
    );
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Generate and send OTP
  const code = generateOTP();
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore[email] = { code, expires };

  // Send SMS OTP
  const client = getTwilioClient();
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (client && from && phone) {
    try {
      await client.messages.create({
        body: `Your Advancia admin login code is ${code}. Valid for 5 minutes.`,
        from,
        to: phone,
      });

      await logAdminLogin(req, email, "OTP_SENT", phone);
      console.log(`📱 Admin OTP sent to ${phone}: ${code}`);

      res.json({
        step: "verify_otp",
        message: "OTP sent to your phone",
      });
    } catch (smsError) {
      console.error("❌ Failed to send SMS:", smsError);

      // Fallback: log code to console for development
      console.log(`[DEV] Admin OTP for ${email}: ${code}`);
      await logAdminLogin(req, email, "OTP_SENT", phone);

      res.json({
        step: "verify_otp",
        message: "OTP generated (check server logs in dev mode)",
        ...(process.env.NODE_ENV === "development" && { code }),
      });
    }
  } else {
    // Development mode or missing Twilio config
    console.log(`[DEV] Admin OTP for ${email}: ${code}`);
    await logAdminLogin(req, email, "OTP_SENT", phone);

    res.json({
      step: "verify_otp",
      message: "OTP generated (check server logs)",
      ...(process.env.NODE_ENV === "development" && { code }),
    });
  }
});

// POST /api/auth/admin/verify-otp - Step 2: Verify OTP and issue JWT
router.post("/verify-otp", async (req, res) => {
  const { email, code } = req.body;

  const entry = otpStore[email];
  if (!entry) {
    await logAdminLogin(req, email, "FAILED_OTP");
    return res.status(400).json({ error: "No OTP requested" });
  }

  if (Date.now() > entry.expires) {
    delete otpStore[email];
    await logAdminLogin(req, email, "FAILED_OTP");
    return res.status(400).json({ error: "OTP expired" });
  }

  if (entry.code !== code) {
    await logAdminLogin(req, email, "FAILED_OTP");
    return res.status(400).json({ error: "Invalid code" });
  }

  // OTP verified successfully
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
  };
  const { accessToken, refreshToken } = generateTokens(payload);

  // Register session
  registerSession(accessToken, payload);

  // Log successful login
  await logAdminLogin(req, email, "SUCCESS");

  // Send success alert
  await sendAlert(
    "🔐 Advancia: Admin Login",
    `Admin logged in: ${email}\nTime: ${new Date().toISOString()}\nIP: ${
      req.headers["x-forwarded-for"] || req.socket.remoteAddress
    }`
  );

  res.json({ accessToken, refreshToken });
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

// GET /api/auth/admin/logs - Get admin login history
router.get("/logs", async (req, res) => {
  try {
    const logs = await prisma.adminLoginLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100, // Last 100 login attempts
    });

    res.json({ logs });
  } catch (error) {
    console.error("❌ Failed to fetch admin logs:", error);
    res.status(500).json({ error: "Failed to fetch login logs" });
  }
});

// POST /api/auth/admin/refresh
router.post("/refresh", (req, res) => {
  const { token } = req.body;
  try {
    const decoded: any = jwt.verify(token, REFRESH_SECRET);
    const { accessToken, refreshToken } = generateTokens({
      email: decoded.email,
      role: decoded.role,
    });

    // Register new session
    registerSession(accessToken, { email: decoded.email, role: decoded.role });

    res.json({ accessToken, refreshToken });
  } catch {
    res.status(403).json({ error: "Invalid refresh token" });
  }
});

export default router;
