import express from "express";
import { config } from "../config";

const router = express.Router();

// GET /api/system/cors-origins - returns computed allowed CORS origins
router.get("/cors-origins", (req, res) => {
  return res.json({
    allowedOrigins: config.allowedOrigins,
    count: config.allowedOrigins.length,
    nodeEnv: config.nodeEnv,
  });
});

// Simple health extension (optional)
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "system",
    time: new Date().toISOString(),
  });
});

export default router;
