import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import logger from "../logger";
import prisma from "../prismaClient";

const router = Router();

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_EMAIL || "advanciapayledger@gmail.com",
      pass: process.env.GMAIL_APP_PASSWORD || "qmbk dljx rubt zihx",
    },
  });
};

/**
 * POST /api/auth/email-signup
 * User submits email for magic link signup
 */
router.post("/email-signup", async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      if (existingUser.approved) {
        return res.status(400).json({
          error: "Email already registered. Please use the login page.",
        });
      } else {
        return res.status(400).json({
          error:
            "Your account is pending admin approval. Please wait for confirmation.",
        });
      }
    }

    // Generate secure magic link token
    const signupToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Generate username from email
    const username =
      email.split("@")[0] + "_" + Math.random().toString(36).substring(7);

    // Create temporary password (user won't use this, it's for magic link)
    const tempPassword = crypto.randomBytes(16).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Create user with pending approval
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        emailSignupToken: signupToken,
        emailSignupTokenExpiry: tokenExpiry,
        signupMethod: "email_magic_link",
        approved: false,
        emailVerified: false,
        firstLoginCompleted: false,
      },
    });

    // Log activity
    await prisma.user_activities.create({
      data: {
        userId: user.id,
        email: user.email,
        action: "EMAIL_SIGNUP_INITIATED",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        metadata: {
          firstName,
          lastName,
          timestamp: new Date(),
        },
      },
    });

    // Send magic link email
    const magicLink = `${
      process.env.FRONTEND_URL || "https://www.advanciapayledger.com"
    }/auth/verify-signup?token=${signupToken}`;

    const transporter = createTransporter();
    await transporter.sendMail({
      from: "Advancia Pay <advanciapayledger@gmail.com>",
      to: email,
      subject: "🔐 Complete Your Advancia Pay Registration",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 8px;">
            <h1 style="color: #667eea; margin-bottom: 20px;">Welcome to Advancia Pay! 🎉</h1>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Thank you for signing up! Click the button below to complete your registration.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px 40px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        display: inline-block;">
                Complete Registration
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              <strong>⏰ This link expires in 24 hours</strong>
            </p>

            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              After verification, your account will be reviewed by our admin team.
              You'll receive a confirmation email once approved (usually within 24-48 hours).
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="font-size: 12px; color: #999;">
              If you didn't request this, please ignore this email.
            </p>

            <p style="font-size: 12px; color: #999;">
              Or copy this link: <br>
              <a href="${magicLink}" style="color: #667eea; word-break: break-all;">${magicLink}</a>
            </p>
          </div>
        </div>
      `,
    });

    logger.info(`Email signup initiated for: ${email}`);

    res.json({
      success: true,
      message: "Magic link sent! Check your email to complete registration.",
    });
  } catch (error) {
    logger.error("Email signup error:", error);
    res.status(500).json({ error: "Failed to process signup request" });
  }
});

/**
 * GET /api/auth/verify-signup/:token
 * Verify magic link and activate user for admin approval
 */
router.get("/verify-signup/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Find user with this token
    const user = await prisma.user.findUnique({
      where: { emailSignupToken: token },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired signup link" });
    }

    // Check if token expired
    if (
      user.emailSignupTokenExpiry &&
      user.emailSignupTokenExpiry < new Date()
    ) {
      return res
        .status(400)
        .json({ error: "Signup link has expired. Please register again." });
    }

    // Verify email and prepare for admin approval
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailSignupToken: null, // Clear token after use
        emailSignupTokenExpiry: null,
      },
    });

    // Log activity
    await prisma.user_activities.create({
      data: {
        userId: user.id,
        email: user.email,
        action: "EMAIL_VERIFIED_VIA_MAGIC_LINK",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        metadata: {
          verifiedAt: new Date(),
        },
      },
    });

    // Notify admin (create notification or send email)
    // You can integrate with existing admin notification system here

    logger.info(
      `Email verified for user: ${user.email} - Awaiting admin approval`,
    );

    res.json({
      success: true,
      message: "Email verified! Your account is now pending admin approval.",
      userId: user.id,
      email: user.email,
      approved: user.approved,
    });
  } catch (error) {
    logger.error("Email verification error:", error);
    res.status(500).json({ error: "Failed to verify email" });
  }
});

/**
 * POST /api/auth/login-with-approval-check
 * Enhanced login that checks admin approval status
 */
router.post(
  "/login-with-approval-check",
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      // Find user
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Check if approved
      if (!user.approved) {
        return res.status(403).json({
          error: "pending_approval",
          message:
            "Your account is pending admin approval. You will be notified when approved.",
          email: user.email,
          createdAt: user.createdAt,
        });
      }

      // Check if email verified
      if (!user.emailVerified) {
        return res.status(403).json({
          error: "email_not_verified",
          message: "Please verify your email address before logging in.",
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          username: user.username,
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" },
      );

      // Update last login and mark first login as completed
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          firstLoginCompleted: true,
        },
      });

      // Log activity
      await prisma.user_activities.create({
        data: {
          userId: user.id,
          email: user.email,
          action: "SUCCESSFUL_LOGIN",
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

      logger.info(`User logged in: ${user.email}`);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          approved: user.approved,
          emailVerified: user.emailVerified,
          firstLoginCompleted: user.firstLoginCompleted,
        },
      });
    } catch (error) {
      logger.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  },
);

/**
 * POST /api/auth/resend-magic-link
 * Resend magic link if user didn't receive it
 */
router.post("/resend-magic-link", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        error: "Email already verified. Please wait for admin approval.",
      });
    }

    // Generate new token
    const signupToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailSignupToken: signupToken,
        emailSignupTokenExpiry: tokenExpiry,
      },
    });

    // Send email
    const magicLink = `${
      process.env.FRONTEND_URL || "https://www.advanciapayledger.com"
    }/auth/verify-signup?token=${signupToken}`;

    const transporter = createTransporter();
    await transporter.sendMail({
      from: "Advancia Pay <advanciapayledger@gmail.com>",
      to: email,
      subject: "🔐 Your New Advancia Pay Magic Link",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Your new magic link is ready!</h2>
          <p>Click below to verify your email:</p>
          <a href="${magicLink}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            This link expires in 24 hours.
          </p>
        </div>
      `,
    });

    res.json({ success: true, message: "New magic link sent to your email" });
  } catch (error) {
    logger.error("Resend magic link error:", error);
    res.status(500).json({ error: "Failed to resend magic link" });
  }
});

export default router;
