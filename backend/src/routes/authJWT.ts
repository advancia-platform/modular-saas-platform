import { Role } from "@prisma/client";
import { Request, Response, Router } from "express";
import { authenticateToken } from "../middleware/authenticateToken";
import prisma from "../prismaClient";
import { generateTokenPair } from "../utils/jwt";
import { hashPassword, verifyPassword } from "../utils/password";

const router = Router();

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password, fullName } = req.body;

    // Validate required fields
    if (!email || !username || !password) {
      res
        .status(400)
        .json({ error: "Email, username, and password are required" });
      return;
    }

    // Validate password strength (optional, can add validation middleware)
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      res.status(409).json({ error: "Email or username already exists" });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        fullName: fullName || username,
        role: Role.USER,
        emailVerified: false,
      },
    });

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      tokens,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      res
        .status(400)
        .json({ error: "Email/username and password are required" });
      return;
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      tokens,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token required" });
      return;
    }

    // Import verifyRefreshToken here to avoid circular dependency
    const { verifyRefreshToken } = await import("../utils/jwt");
    const payload = verifyRefreshToken(refreshToken);

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // Generate new tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      tokens,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(403).json({ error: "Invalid or expired refresh token" });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile (protected)
 */
router.get(
  "/me",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          role: true,
          emailVerified: true,
          totpEnabled: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json({ success: true, user });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal, future: token blacklist)
 */
router.post(
  "/logout",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    // In a production system, you might want to:
    // 1. Blacklist the refresh token in Redis
    // 2. Log the logout event
    // 3. Clear any session data

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  },
);

export default router;
