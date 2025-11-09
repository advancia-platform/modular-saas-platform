import express, { Request, Response, NextFunction } from "express";
import { securityHeaders } from "./middleware/security";
import cors from "cors";
import { logger } from "./logger";

// Initialize express app
const app = express();

// Global security headers first
app.use(securityHeaders);

// CORS is configured in index.ts where config is available (deferred)

// Logging middleware - tracks all HTTP requests
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown'
    });
  });
  
  next();
});

// Register routes
// Route registration deferred to index.ts to ensure correct middleware order

// Root health check
app.get("/", (req: Request, res: Response) => {
  logger.debug('Root endpoint accessed');
  res.send("Backend running ✅");
});

// Health check route
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "advancia-backend",
    version: "1.0.0",
    uptime: process.uptime()
  });
});

// Note: 404 and error handlers are registered in index.ts or test-app.ts
// to ensure they come AFTER all route registrations

export default app;