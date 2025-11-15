import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { runMigrations } from "./db.js";
import { swaggerSpec } from "./config/swagger.js";
import {
  errorHandler,
  initMonitoring,
  requestMetrics,
  securityHeaders,
} from "./middleware/protection.js";
import authRoutes from "./routes/auth.js";
import healthRoutes from "./routes/health.js";
import { seedAdmin } from "./seed.js";
import {
  initSentry,
  sentryErrorHandler,
  sentryRequestHandler,
  sentryTracingHandler,
} from "./utils/sentry.js";

dotenv.config();

// Initialize Sentry FIRST (before any other code)
initSentry();

// Initialize monitoring
initMonitoring();

const app = express();
const PORT = process.env.PORT || 4000;

// Sentry request handler must be first middleware
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

// Apply security headers globally
securityHeaders(app);

// Apply request metrics
requestMetrics(app);

app.use(cors({ origin: "*" }));
app.use(express.json());

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Advancia Pay API Docs",
}));

// Swagger JSON endpoint
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);

app.get("/api/me", (req, res) =>
  res.json({ service: "advvancia-backend", version: "1.0.0" })
);

// Sentry error handler must be before other error handlers
app.use(sentryErrorHandler());

// Global error handler (last middleware)
app.use(errorHandler);

// Run migrations at startup
runMigrations()
  .then(() => seedAdmin())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Startup error:", err);
    process.exit(1);
  });
