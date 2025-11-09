import express from "express";
import cors from "cors";
import { securityHeaders } from "../src/middleware/security";
import { config } from "../src/config";
import authRouter from "../src/routes/auth";

// Create test app with routes
const app = express();

// Global security headers first
app.use(securityHeaders);

// CORS configuration
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "advancia-backend",
    version: "1.0.0",
  });
});

// Register routes
app.use("/api/auth", authRouter);

export default app;
