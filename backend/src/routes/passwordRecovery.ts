import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { validateAccessJWT } from "../middleware/accessJWT";
import { adminAuth } from "../middleware/adminAuth";
import logger from "../logger";

const router = Router();
const prisma = new PrismaClient();

// ==========================================
// USER ENDPOINTS
// ==========================================

/**
 * POST /api/password-recovery/request
 * User requests password reset
 */
router.post("/request", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal if user exists - security best practice
      return res.json({
        success: true,
        message: "If this email exists, a reset request has been created",
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create reset request
    await prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        email: user.email,
        token,
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      },
    });

    // Log activity
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        email: user.email,
        action: "PASSWORD_RESET_REQUESTED",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        metadata: { timestamp: new Date() },
      },
    });

    // TODO: Send email with reset link (implement later)
    // await sendPasswordResetEmail(user.email, token);

    logger.info(`Password reset requested for user: ${user.email}`);

    res.json({
      success: true,
      message: "Password reset request created. Admin will be notified.",
      token: process.env.NODE_ENV === "development" ? token : undefined,
    });
  } catch (error) {
    logger.error("Password reset request error:", error);
    res.status(500).json({ error: "Failed to create reset request" });
  }
});

/**
 * POST /api/password-recovery/reset
 * User resets password with token
 */
router.post("/reset", async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password required" });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Find valid reset request
    const resetRequest = await prisma.passwordResetRequest.findFirst({
      where: {
        token,
        used: false,
        expiresAt: { gte: new Date() },
      },
    });

    if (!resetRequest) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: resetRequest.userId },
      data: { passwordHash },
    });

    // Mark reset request as used
    await prisma.passwordResetRequest.update({
      where: { id: resetRequest.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    // Log activity
    await prisma.userActivity.create({
      data: {
        userId: resetRequest.userId,
        email: resetRequest.email,
        action: "PASSWORD_RESET_COMPLETED",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      },
    });

    logger.info(`Password reset completed for user: ${resetRequest.email}`);

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    logger.error("Password reset error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

/**
 * GET /api/password-recovery/admin/requests
 * Admin views all password reset requests
 */
router.get("/admin/requests", adminAuth, async (req: Request, res: Response) => {
  try {
    const { status = "pending", limit = "50" } = req.query;

    const where: any = {};
    
    if (status === "pending") {
      where.used = false;
      where.expiresAt = { gte: new Date() };
    } else if (status === "used") {
      where.used = true;
    } else if (status === "expired") {
      where.used = false;
      where.expiresAt = { lt: new Date() };
    }

    const requests = await prisma.passwordResetRequest.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        email: true,
        token: true,
        expiresAt: true,
        used: true,
        usedAt: true,
        adminViewed: true,
        adminViewedBy: true,
        adminViewedAt: true,
        createdAt: true,
        ipAddress: true,
      },
    });

    res.json({ success: true, requests, total: requests.length });
  } catch (error) {
    logger.error("Admin fetch reset requests error:", error);
    res.status(500).json({ error: "Failed to fetch reset requests" });
  }
});

/**
 * GET /api/password-recovery/admin/user/:userId
 * Admin views specific user's reset requests and activity
 */
router.get("/admin/user/:userId", adminAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        createdAt: true,
        lastLogin: true,
        approved: true,
        active: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get reset requests
    const resetRequests = await prisma.passwordResetRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Get user activity
    const activities = await prisma.userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Get admin notes
    const notes = await prisma.adminUserNote.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      user,
      resetRequests,
      activities,
      notes,
    });
  } catch (error) {
    logger.error("Admin user lookup error:", error);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
});

/**
 * POST /api/password-recovery/admin/reset-user-password
 * Admin resets user password directly
 */
router.post("/admin/reset-user-password", adminAuth, async (req: Request, res: Response) => {
  try {
    const { userId, newPassword } = req.body;
    const adminUser = (req as any).user;

    if (!userId || !newPassword) {
      return res.status(400).json({ error: "User ID and new password required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Log activity
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        email: user.email,
        action: "PASSWORD_RESET_BY_ADMIN",
        metadata: {
          adminId: adminUser.id,
          adminEmail: adminUser.email,
          timestamp: new Date(),
        },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "ADMIN_RESET_USER_PASSWORD",
        resourceType: "User",
        resourceId: user.id,
        metadata: {
          targetUser: user.email,
          adminEmail: adminUser.email,
        },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      },
    });

    logger.info(`Admin ${adminUser.email} reset password for user ${user.email}`);

    res.json({
      success: true,
      message: `Password reset successfully for ${user.email}`,
      // Return password in development for testing
      password: process.env.NODE_ENV === "development" ? newPassword : undefined,
    });
  } catch (error) {
    logger.error("Admin password reset error:", error);
    res.status(500).json({ error: "Failed to reset user password" });
  }
});

/**
 * POST /api/password-recovery/admin/add-note
 * Admin adds note to user account
 */
router.post("/admin/add-note", adminAuth, async (req: Request, res: Response) => {
  try {
    const { userId, title, content, noteType, priority, tags } = req.body;
    const adminUser = (req as any).user;

    if (!userId || !title || !content) {
      return res.status(400).json({ error: "User ID, title, and content required" });
    }

    const note = await prisma.adminUserNote.create({
      data: {
        userId,
        adminId: adminUser.id,
        title,
        content,
        noteType: noteType || "general",
        priority: priority || "normal",
        tags,
        metadata: {
          adminEmail: adminUser.email,
          timestamp: new Date(),
        },
      },
    });

    logger.info(`Admin ${adminUser.email} added note for user ${userId}`);

    res.json({ success: true, note });
  } catch (error) {
    logger.error("Admin add note error:", error);
    res.status(500).json({ error: "Failed to add note" });
  }
});

/**
 * GET /api/password-recovery/admin/search
 * Admin searches for users by email, username, or name
 */
router.get("/admin/search", adminAuth, async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Search query required" });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { phoneNumber: { contains: query } },
        ],
      },
      take: 20,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        createdAt: true,
        lastLogin: true,
        active: true,
        approved: true,
        role: true,
      },
    });

    res.json({ success: true, users, total: users.length });
  } catch (error) {
    logger.error("Admin user search error:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
});

/**
 * GET /api/password-recovery/admin/user-activity/:userId
 * Get detailed activity log for a user
 */
router.get("/admin/user-activity/:userId", adminAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = "100" } = req.query;

    const activities = await prisma.userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit as string),
    });

    res.json({ success: true, activities, total: activities.length });
  } catch (error) {
    logger.error("Fetch user activity error:", error);
    res.status(500).json({ error: "Failed to fetch user activity" });
  }
});

export default router;
