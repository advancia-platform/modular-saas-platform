import { Router } from "express";
import {
  generateAccessToken,
  generateRefreshToken,
  refreshSession,
} from "../auth/sessionManager";
import { logger } from "../logger";

const router = Router();

/**
 * Refresh endpoint — exchanges a valid refresh token for new tokens
 */
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    logger.warn("Token refresh failed: missing refresh token", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    return res.status(400).json({ error: "Refresh token required" });
  }

  try {
    const session = await refreshSession(refreshToken);

    if (!session) {
      logger.warn("Token refresh failed: invalid or expired refresh token", {
        ip: req.ip,
        tokenLength: refreshToken.length,
      });
      return res
        .status(401)
        .json({ error: "Invalid or expired refresh token" });
    }

    logger.info("Token refresh successful", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    return res.json({
      success: true,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
  } catch (error) {
    logger.error("Token refresh error", {
      error: error.message,
      ip: req.ip,
    });
    return res
      .status(500)
      .json({ error: "Internal server error during token refresh" });
  }
});

/**
 * Signin endpoint with enhanced JWT response
 */
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    logger.warn("Signin failed: missing credentials", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // TODO: Replace with real database lookup and password verification
    // This is a demo implementation
    if (email === "admin@advancia.com" && password === "admin123") {
      const userId = "1";
      const role = "ADMIN";
      const sessionId = require("crypto").randomBytes(16).toString("hex");

      const accessToken = generateAccessToken({
        userId: parseInt(userId),
        role,
        sessionId,
      });
      const refreshToken = generateRefreshToken(userId, sessionId);

      logger.info("Signin successful", {
        userId,
        email,
        role,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      return res.json({
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: userId,
          email,
          role,
        },
      });
    }

    logger.warn("Signin failed: invalid credentials", {
      email,
      ip: req.ip,
    });

    return res.status(401).json({ error: "Invalid credentials" });
  } catch (error) {
    logger.error("Signin error", {
      error: error.message,
      email,
      ip: req.ip,
    });
    return res
      .status(500)
      .json({ error: "Internal server error during signin" });
  }
});

/**
 * Signout endpoint - invalidates current session
 */
router.post("/signout", (req, res) => {
  // TODO: Add token blacklisting/session invalidation
  logger.info("User signed out", {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  return res.json({
    success: true,
    message: "Signed out successfully",
  });
});

export default router;
