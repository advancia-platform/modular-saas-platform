import { Router, Request, Response } from "express";
import prisma from "../../prismaClient";
import { authenticateToken, requireAdmin } from "../../middleware/auth";

const router = Router();

/**
 * GET /api/admin/config/silent-mode
 * Returns the current silent mode status
 */
router.get(
  "/silent-mode",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const isRender = process.env.RENDER === "true";
      const isProduction = process.env.NODE_ENV === "production";

      let silentMode = false;

      // Auto-enable Silent Mode on Render production
      if (isRender && isProduction) {
        silentMode = true;
      } else {
        // Check database configuration
        const config = await prisma.systemConfig.findUnique({
          where: { key: "silent_mode" },
        });
        silentMode = config?.value === "true";
      }

      res.json({
        silentMode,
        autoEnabled: isRender && isProduction,
        environment: process.env.NODE_ENV,
        platform: isRender ? "render" : "local",
      });
    } catch (error) {
      console.error("Error fetching silent mode config:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch configuration",
      });
    }
  }
);

/**
 * POST /api/admin/config/silent-mode
 * Updates the silent mode configuration
 */
router.post(
  "/silent-mode",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { enabled } = req.body;

      if (typeof enabled !== "boolean") {
        res.status(400).json({
          success: false,
          message: "Invalid 'enabled' value. Must be boolean.",
        });
        return;
      }

      const isRender = process.env.RENDER === "true";
      const isProduction = process.env.NODE_ENV === "production";

      // Prevent disabling in Render production
      if (isRender && isProduction && !enabled) {
        res.status(403).json({
          success: false,
          message:
            "Cannot disable Silent Mode in production on Render. This is enforced for security.",
        });
        return;
      }

      // Update or create configuration
      await prisma.systemConfig.upsert({
        where: { key: "silent_mode" },
        update: { value: String(enabled) },
        create: { key: "silent_mode", value: String(enabled) },
      });

      res.json({
        success: true,
        enabled,
        message: `Silent Mode ${enabled ? "activated" : "deactivated"}`,
      });
    } catch (error) {
      console.error("Error updating silent mode config:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update configuration",
      });
    }
  }
);

/**
 * GET /api/admin/config/all
 * Returns all system configuration keys (admin only)
 */
router.get(
  "/all",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const configs = await prisma.systemConfig.findMany({
        orderBy: { key: "asc" },
      });

      res.json({
        success: true,
        configs,
      });
    } catch (error) {
      console.error("Error fetching system configs:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch configurations",
      });
    }
  }
);

export default router;
