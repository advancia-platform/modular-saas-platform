/**
 * File upload routes using Cloudflare R2
 * Per Advancia Pay: Secure file storage with authentication
 */

import express, { Request, Response } from "express";
import multer from "multer";
import logger from "../logger";
import { authenticateToken } from "../middleware/auth";
import {
  deleteFromR2,
  getR2PresignedUrl,
  uploadToR2,
} from "../services/r2Client";

const router = express.Router();

// Configure multer for memory storage (no local disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per PCI-DSS
  },
  fileFilter: (req, file, cb) => {
    // Whitelist allowed file types
    const allowed = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

/**
 * Upload file to R2
 * POST /api/uploads
 */
router.post(
  "/",
  authenticateToken,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const userId = (req as any).user.userId;

      // Generate unique key with user isolation
      const timestamp = Date.now();
      const sanitizedName = req.file.originalname.replace(
        /[^a-zA-Z0-9.-]/g,
        "_",
      );
      const key = `uploads/${userId}/${timestamp}-${sanitizedName}`;

      // Upload to R2
      const result = await uploadToR2(key, req.file.buffer, req.file.mimetype);

      // Audit log per Advancia Pay patterns
      logger.info("File uploaded", {
        userId,
        key: result.key,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });

      res.json({
        success: true,
        file: {
          key: result.key,
          url: result.url,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    } catch (error: any) {
      logger.error("File upload failed", { error: error.message });
      res.status(500).json({ error: "File upload failed" });
    }
  },
);

/**
 * Get presigned URL for file download
 * GET /api/uploads/:key
 */
router.get(
  "/:key(*)",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const userId = (req as any).user.userId;

      // Verify user owns the file
      if (!key.startsWith(`uploads/${userId}/`)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const url = await getR2PresignedUrl(key, 3600); // 1 hour expiry

      res.json({ success: true, url });
    } catch (error: any) {
      logger.error("Failed to generate download URL", { error: error.message });
      res.status(500).json({ error: "Failed to generate download URL" });
    }
  },
);

/**
 * Delete file from R2
 * DELETE /api/uploads/:key
 */
router.delete(
  "/:key(*)",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const userId = (req as any).user.userId;

      // Verify user owns the file
      if (!key.startsWith(`uploads/${userId}/`)) {
        return res.status(403).json({ error: "Access denied" });
      }

      await deleteFromR2(key);

      logger.info("File deleted", { userId, key });

      res.json({ success: true, message: "File deleted" });
    } catch (error: any) {
      logger.error("File deletion failed", { error: error.message });
      res.status(500).json({ error: "File deletion failed" });
    }
  },
);

export default router;
