// backend/src/routes/authSecure.ts
import { Router } from "express";
import { logger } from "../logger";
import { validateInput } from "../middleware/security";
import {
  authenticateUser,
  requestPasswordReset,
  resetPassword,
} from "../services/authService";

const router = Router();

/**
 * Secure signin with bcrypt password verification
 */
router.post("/signin", validateInput, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Email and password are required",
    });
  }

  try {
    const result = await authenticateUser(
      email,
      password,
      req.ip,
      req.get("User-Agent"),
    );

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.error,
      });
    }

    logger.info("Secure login successful", {
      email,
      role: result.user?.role,
      ip: req.ip,
    });

    return res.json({
      success: true,
      accessToken: result.tokens?.accessToken,
      refreshToken: result.tokens?.refreshToken,
      user: result.user,
    });
  } catch (error) {
    logger.error("Secure login error", {
      error: error.message,
      email,
      ip: req.ip,
    });
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Request password reset
 */
router.post("/password-reset-request", validateInput, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: "Email is required",
    });
  }

  try {
    const result = await requestPasswordReset(
      email,
      req.ip,
      req.get("User-Agent"),
    );

    return res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    logger.error("Password reset request error", {
      error: error.message,
      email,
      ip: req.ip,
    });
    return res.status(500).json({
      success: false,
      error: "Failed to process request",
    });
  }
});

/**
 * Reset password with token
 */
router.post("/password-reset", validateInput, async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      error: "Token and new password are required",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: "Password must be at least 8 characters long",
    });
  }

  try {
    const result = await resetPassword(token, newPassword, req.ip);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error("Password reset error", {
      error: error.message,
      ip: req.ip,
    });
    return res.status(500).json({
      success: false,
      error: "Failed to reset password",
    });
  }
});

/**
 * Check password reset token validity
 */
router.get("/password-reset/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const isValid = await validateResetToken(token);

    return res.json({
      valid: isValid,
      message: isValid ? "Token is valid" : "Token is invalid or expired",
    });
  } catch (error) {
    logger.error("Token validation error", {
      error: error.message,
      token: token.substring(0, 8) + "...",
    });
    return res.status(500).json({
      valid: false,
      message: "Failed to validate token",
    });
  }
});
export default router;
