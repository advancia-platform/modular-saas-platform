// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

// Prometheus monitoring setup
import client from "prom-client";
import gcStats from "prometheus-gc-stats";
import { setupSwagger } from "./utils/swagger";

// Sentry setup
import * as Sentry from "@sentry/node";
Sentry.init({
  dsn: "https://41dbdb2c446534ac933de22ca5c2778c@o4510400768573440.ingest.us.sentry.io/4510400800096256",
  integrations: [
    // Send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
  // Enable logs to be sent to Sentry
  _experiments: {
    enableLogs: true,
  },
});

// Log server startup to Sentry
Sentry.logger.info("Backend server initializing", {
  action: "server_init",
  timestamp: new Date().toISOString(),
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || "development",
});

// Initialize Prometheus metrics collection
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// Initialize GC stats collection
gcStats(client.register)();

// Custom metrics for monitoring
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const notificationPreferencesOpsTotal = new client.Counter({
  name: "notification_preferences_operations_total",
  help: "Total notification preferences operations",
  labelNames: ["operation", "status"],
});

const activeUsersGauge = new client.Gauge({
  name: "active_users_current",
  help: "Current number of active users",
});

const databaseConnectionsGauge = new client.Gauge({
  name: "database_connections_current",
  help: "Current number of database connections",
});

// Register custom metrics
client.register.registerMetric(httpRequestDuration);
client.register.registerMetric(httpRequestsTotal);
client.register.registerMetric(notificationPreferencesOpsTotal);
client.register.registerMetric(activeUsersGauge);
client.register.registerMetric(databaseConnectionsGauge);

// Example AI SDK usage (must be inside an async function)
const { generateText } = require("ai");
const { openai } = require("@ai-sdk/openai");

async function getJoke() {
  const result = await generateText({
    model: openai("gpt-4o"),
    prompt: "Tell me a joke",
    experimental_telemetry: {
      isEnabled: true,
      recordInputs: true,
      recordOutputs: true,
    },
  });
  console.log(result.text);
}
// You can call getJoke() somewhere in your app logic if needed

// ---------------------------------------------------------------------------
// Firm safe defaults for local/dev runs to prevent import-time exits
// These can be overridden explicitly via the environment.
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV !== "production") {
  if (!process.env.SKIP_DATABASE_VALIDATION)
    process.env.SKIP_DATABASE_VALIDATION = "1";
  if (!process.env.OTEL_TRACING_ENABLED)
    process.env.OTEL_TRACING_ENABLED = "false";
  if (typeof process.env.SENTRY_DSN === "undefined")
    process.env.SENTRY_DSN = "";
  if (!process.env.ENABLE_CRON) process.env.ENABLE_CRON = "false";
  if (!process.env.DIAG_INTERCEPT_EXIT) process.env.DIAG_INTERCEPT_EXIT = "1"; // convert process.exit to throw for visibility
  console.log("[DIAG] Applied dev-safe defaults:", {
    SKIP_DATABASE_VALIDATION: process.env.SKIP_DATABASE_VALIDATION,
    OTEL_TRACING_ENABLED: process.env.OTEL_TRACING_ENABLED,
    SENTRY_DSN: process.env.SENTRY_DSN ? "set" : "",
    ENABLE_CRON: process.env.ENABLE_CRON,
    DIAG_INTERCEPT_EXIT: process.env.DIAG_INTERCEPT_EXIT,
  });
}

// ---------------------------------------------------------------------------
// Diagnostic exit interception (set DIAG_INTERCEPT_EXIT=1 to convert exits
// into visible errors for startup root-cause analysis)
// ---------------------------------------------------------------------------
if (process.env.DIAG_INTERCEPT_EXIT === "1") {
  const originalExit = process.exit;
  (process as any).__originalExit = originalExit;
  process.exit = ((code?: number) => {
    throw new Error(`[EXIT_INTERCEPT] process.exit(${code ?? 0}) intercepted`);
  }) as any;
  console.log("[DIAG] process.exit interception active");
}

// ---------------------------------------------------------------------------
// Conditional tracing: allow disabling via OTEL_TRACING_ENABLED env toggle
// ---------------------------------------------------------------------------
if (process.env.OTEL_TRACING_ENABLED === "true") {
  try {
    require("./tracing");
    console.log("[DIAG] Tracing initialized");
  } catch (e) {
    console.error("[DIAG] Tracing init failed", e);
  }
} else {
  console.log("[DIAG] Tracing disabled (OTEL_TRACING_ENABLED != true)");
}

console.log("🚀 Backend starting...");
console.log("📍 Working directory:", process.cwd());
console.log("🔧 Node version:", process.version);

// EARLY DIAGNOSTIC INSTRUMENTATION
let __earlyFailureTop = false;
process.on("uncaughtException", (err) => {
  console.error("[FATAL-TOP] Uncaught Exception early:", err);
  console.error("[FATAL-TOP] Stack:", err.stack);
  __earlyFailureTop = true;

  // Don't exit in development unless it's critical
  if (
    process.env.NODE_ENV === "production" &&
    !err.message.includes("ECONNREFUSED")
  ) {
    console.error("[FATAL-TOP] Exiting due to uncaught exception");
    process.exit(1);
  } else {
    console.error(
      "[FATAL-TOP] Continuing despite exception (development mode)",
    );
  }
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("[FATAL-TOP] Unhandled Rejection early:", reason);
  console.error("[FATAL-TOP] Promise:", promise);
  __earlyFailureTop = true;

  // Log but don't exit on unhandled rejections in development
  if (process.env.NODE_ENV !== "production") {
    console.error(
      "[FATAL-TOP] Continuing despite rejection (development mode)",
    );
  }
});
process.on("beforeExit", (code) => {
  console.log(
    `[DIAG-TOP] beforeExit code=${code} earlyFailure=${__earlyFailureTop}`,
  );
});
process.on("exit", (code) => {
  console.log(`[DIAG-TOP] exit code=${code} earlyFailure=${__earlyFailureTop}`);
});
console.log("[DIAG-TOP] Beginning phased route import (Phase 1 minimal)");
if (process.env.ENABLE_CRON === "true") {
  console.log("[DIAG] Cron jobs enabled (ENABLE_CRON=true)");
} else {
  console.log("[DIAG] Cron jobs disabled (ENABLE_CRON!=true)");
}

import cors from "cors";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { activityLogger } from "./middleware/activityLogger";
import { authenticateToken, requireAdmin } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { setRateLimiterSocketIO } from "./middleware/rateLimiterRedis";
import {
  helmetMiddleware,
  rateLimit,
  validateInput,
} from "./middleware/security";
import prisma from "./prismaClient";
import authRouter from "./routes/auth";
import authAdminRouter, {
  activeSessions,
  setBroadcastSessions as setAuthBroadcast,
} from "./routes/authAdmin";
console.log("[DIAG] About to import prismaClient...");
console.log("[DIAG] prismaClient imported successfully");
// import adminWalletsRouter from "./routes/adminWallets"; // Disabled for crash isolation
import adminWalletsRouter from "./routes/adminWallets";
// import adminBulkActionsRouter from "./routes/adminBulkActions";
// import aiAnalyticsRouter from "./routes/aiAnalytics";
// import amplitudeAnalyticsRouter from "./routes/amplitudeAnalytics";
// import analyticsRouter from "./routes/analytics";
// import analyticsEnhancedRouter from "./routes/analyticsEnhanced";
console.log("[DIAG] About to import authRouter...");
console.log("[DIAG] authRouter imported successfully");
// import chatRouter, { setChatSocketIO } from "./routes/chat";
// import consultationRouter from "./routes/consultation";
// import cryptoEnhancedRouter from "./routes/cryptoEnhanced";
import cryptomusRouter from "./routes/cryptomus"; // Cryptomus crypto payments
// import debitCardRouter, { setDebitCardSocketIO } from "./routes/debitCard";
// import debitCardEnhancedRouter from "./routes/debitCardEnhanced";
// import emailRouter from "./routes/email"; // Email templates router
// import emailTestRouter from "./routes/email-test"; // Email testing endpoints
// import emailsRouter from "./routes/emails";
// import authEnhancedRouter from "./routes/authEnhanced"; // Enhanced authentication with session management - TEMP DISABLED
import emailSignupRouter from "./routes/emailSignup"; // Email magic link signup
import emailVerificationRouter from "./routes/emailVerification"; // Email verification with Resend
import gitopsRouter from "./routes/gitops"; // GitOps integration for ArgoCD, Prometheus, Grafana
import healthRouter from "./routes/health";
import inboundEmailsRouter from "./routes/inboundEmails"; // Inbound email webhook from Cloudflare
// import invoicesRouter from "./routes/invoices";
// import ipBlocksRouter from "./routes/ipBlocks"; // TEMP DISABLED to unblock startup
// import marketingRouter from "./routes/marketing";
// import medbedsRouter, { setMedbedsSocketIO } from "./routes/medbeds";
// import oalRouter, { setOALSocketIO } from "./routes/oal";
import handleStripeWebhook, {
  setPaymentsSocketIO,
} from "./routes/paymentsWebhook";
// import paymentsRouter, {
//   handleStripeWebhook,
//   setPaymentsSocketIO,
// } from "./routes/payments";
import nowpaymentsRouter from "./routes/nowpayments"; // NOWPayments crypto integration
import paymentsEnhancedRouter from "./routes/paymentsEnhanced";
// import rewardsRouter from "./routes/rewards";
// import securityLevelRouter from "./routes/securityLevel"; // Disabled to isolate middleware crash
// import sendEmailRouter from "./routes/send-email"; // Universal email sending
import sessionsRouter, {
  setBroadcastSessions as setSessionsBroadcast,
} from "./routes/sessions";
import subscribersRouter from "./routes/subscribers";
import supportRouter, { setSupportSocketIO } from "./routes/support"; // Re-enabled after middleware hardening
import systemRouter from "./routes/system";
import tokenRefreshRouter from "./routes/tokenRefresh";
import tokensRouter, { setTokenSocketIO } from "./routes/tokens";
import trustRouter from "./routes/trust"; // Scam Adviser & trust verification
// import trustpilotRouter from "./routes/trustpilot"; // Removed - using simple widget embed instead
// import trustScoreRouter from "./routes/trustScore"; // User trust & reputation system (TEMPORARILY DISABLED)
import cashflowRouter from "./routes/cashflow";
import pricesRouter from "./routes/prices";
import securityRouter from "./routes/security"; // Breach monitoring & IP protection
import storageRouter from "./routes/storage";
import telegramRouter from "./routes/telegram";
import telegramWebhookRouter from "./routes/telegramWebhook";
import transactionsRouter, {
  setTransactionSocketIO,
} from "./routes/transactions";
import twoFactorRouter from "./routes/twoFactor";
import uploadsRouter from "./routes/uploads"; // R2 file uploads with authentication
// import adminUsersRouter, { setAdminUsersSocketIO } from "./routes/users"; // File not in active codebase
// import walletsRouter from "./routes/wallets"; // File not in active codebase
import withdrawalsRouter from "./routes/withdrawals";
// Project Management routes
import milestonesRouter, { setMilestoneSocketIO } from "./routes/milestones";
import projectsRouter, { setProjectSocketIO } from "./routes/projects";
import tasksRouter, { setTaskSocketIO } from "./routes/tasks";
import teamsRouter, { setTeamSocketIO } from "./routes/teams";
// Notification management
import adminNotificationLogsRouter from "./routes/adminNotificationLogs";
import notificationPreferencesRouter from "./routes/notificationPreferences";
import notificationsRouter from "./routes/notifications";
// Email services
import preferencesRouter from "./routes/preferences";
import resendRouter from "./routes/resend";
// JWT Authentication v2
import adminRouter from "./routes/admin";
import adminDashboardRouter from "./routes/adminDashboard";
import authJWTRouter from "./routes/authJWT";
import authSecureRouter from "./routes/authSecure";
import complianceRouter, { setComplianceSocketIO } from "./routes/compliance"; // GitOps compliance monitoring
// Demo and additional routes
import adminCreditsRouter from "./routes/admin/credits"; // Admin promotional credits system
import alchemypayRouter from "./routes/alchemypay"; // Alchemy Pay crypto payments
import analyticsRouter from "./routes/analytics";
import blockchainRouter from "./routes/blockchain"; // Alchemy blockchain API for onchain transactions
import demoRouter from "./routes/demo";
import phoneRouter from "./routes/phone"; // Virtual phone number services
import reportsRouter from "./routes/reports"; // Admin reports for dashboard charts
import smsRouter from "./routes/sms"; // SMS verification and notifications
import subscriptionsRouter from "./routes/subscriptions";
import whatsappRouter from "./routes/whatsapp"; // WhatsApp Business messaging
// import { setSocketIO as setNotificationSocket } from "./services/notificationService"; // Keep commented for now
// import "./tracing";
import { dataMasker } from "./utils/dataMasker";
import { closeQueue, initQueue } from "./utils/queue";
import { initSentry } from "./utils/sentry";
import { sanitizeInput } from "./validation/middleware";
// Global fatal error handlers to expose startup issues clearly
// (Legacy instrumentation removed; using EARLY DIAGNOSTIC INSTRUMENTATION above)

import { config } from "./config";
import { setupGlobalProxy } from "./utils/globalProxyAgent";

// Setup global proxy configuration for all outbound HTTP/HTTPS requests
try {
  setupGlobalProxy();
} catch (e) {
  console.error("[DIAG] Global proxy setup failed", e);
}

// Safe middleware wrappers (prevent undefined crashes during partial builds)
const safeAuth: any =
  typeof authenticateToken === "function"
    ? authenticateToken
    : (_req: any, _res: any, next: any) => next();
const safeAdmin: any =
  typeof requireAdmin === "function"
    ? requireAdmin
    : (_req: any, _res: any, next: any) => next();

// Initialize Sentry only if DSN provided (blank SENTRY_DSN disables)
if (process.env.SENTRY_DSN) {
  try {
    initSentry();
    console.log("[DIAG] Sentry initialized");
  } catch (e) {
    console.error("[DIAG] Sentry init failed", e);
  }
} else {
  console.log("[DIAG] Sentry disabled (SENTRY_DSN not set)");
}

// Create HTTP server (CloudFlare handles SSL termination)
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: config.allowedOrigins, credentials: true },
});
setPaymentsSocketIO(io);

// Trust proxy (needed when behind Cloudflare/NGINX for correct IPs and HTTPS)
app.set("trust proxy", 1);
// Telegram webhook (no auth; Telegram posts updates here). Keep before error handlers.
app.use("/api/telegram/webhook", telegramWebhookRouter);
// Stripe webhook BEFORE express.json (raw body needed for signature verification)
if (config.stripeWebhookSecret) {
  app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook,
  );
}

// Configure CORS with allowed origins
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (config.allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

// Enrich tracing spans with route + user info early
// app.use(enrichRequestSpan);

// CRITICAL: Stripe webhook needs raw body BEFORE express.json()
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);

// Then apply JSON parser for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmetMiddleware());
app.use(sanitizeInput);
app.use(dataMasker.createResponseSanitizer());
app.use(validateInput);
app.use(activityLogger);
app.use("/api", rateLimit({ windowMs: 60_000, maxRequests: 300 }));

// API documentation (Swagger) available at /api-docs
setupSwagger(app);

// Prometheus metrics endpoint
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

// Enhanced health check endpoint with detailed status
app.get("/health", async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Update active users metric
    const activeUsers = activeSessions.size;
    activeUsersGauge.set(activeUsers);

    // Database connection pool status
    // Note: Prisma metrics API might not be available in all versions
    try {
      // Check if $metrics is available
      if (
        "$metrics" in prisma &&
        typeof (prisma as any).$metrics === "object"
      ) {
        const dbMetrics = await (prisma as any).$metrics.histogram();
        databaseConnectionsGauge.set(
          Array.isArray(dbMetrics) ? dbMetrics.length : 0,
        );
      } else {
        // Fallback: assume 1 connection if metrics not available
        databaseConnectionsGauge.set(1);
      }
    } catch (_metricsError) {
      // Fallback if metrics are not available
      databaseConnectionsGauge.set(1);
    }

    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      activeUsers,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || "1.0.0",
    };

    res.status(200).json(healthData);
  } catch (error: any) {
    console.error("[HEALTH] Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error:
        process.env.NODE_ENV === "development"
          ? error?.message || "Unknown error"
          : "Service unavailable",
    });
  }
});

// Root health check endpoint (for load balancers/monitoring - no /api prefix)
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Health check endpoint (critical for production monitoring)
app.use("/api", healthRouter);

// GitOps integration routes (ArgoCD, Prometheus, Grafana)
app.use("/api/gitops", gitopsRouter);
app.use("/api/compliance", safeAuth, safeAdmin, complianceRouter); // Compliance monitoring (admin only)

// Auth routes (public)
app.use("/api/auth", tokenRefreshRouter); // Token refresh endpoint (legacy)
app.use("/api/auth", authRouter); // Legacy auth routes
// app.use("/api/auth/enhanced", authRefreshRouter); // Enhanced auth with refresh token support - TEMP DISABLED
app.use("/api/auth/v2", authJWTRouter); // Modern JWT-based auth with RBAC
app.use("/api/auth/secure", authSecureRouter); // Secure auth with bcrypt password hashing and reset
// app.use("/api/auth-enhanced", authEnhancedRouter); // Enhanced auth with session management and TOTP - TEMP DISABLED

// Demo and test routes for enhanced authentication
app.use("/api/test", demoRouter); // Permission-based access control demo routes

// Regular routes (minimal set enabled)
// app.use("/api/debit-cards", authenticateToken, debitCardEnhancedRouter); // Enhanced card management
app.use("/api/support", supportRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/analytics", analyticsRouter); // Analytics dashboard with JWT auth + rate limiting
// app.use("/api/ai-analytics", aiAnalyticsRouter);
app.use("/api/payments", paymentsEnhancedRouter); // Stripe payment intents & methods

// Crypto payment providers
app.use("/api/cryptomus", cryptomusRouter); // Cryptomus crypto payments
app.use("/api/nowpayments", nowpaymentsRouter); // NOWPayments crypto payments - NOW ENABLED
app.use("/api/alchemypay", alchemypayRouter); // Alchemy Pay - crypto on/off ramp
app.use("/api/blockchain", blockchainRouter); // Alchemy blockchain API - gas, balances, NFTs, transactions

// Business phone management
app.use("/api/phone", phoneRouter); // Virtual phone number services
app.use("/api/sms", smsRouter); // SMS verification and notifications
app.use("/api/whatsapp", whatsappRouter); // WhatsApp Business messaging

// Admin routes - PROTECTED with requireAdmin middleware
// app.use(
//   "/api/admin/analytics",
//   authenticateToken,
//   requireAdmin,
//   analyticsRouter
// );
// app.use("/api/analytics", authenticateToken, analyticsEnhancedRouter); // Enhanced analytics with export
// app.use("/api/analytics", authenticateToken, amplitudeAnalyticsRouter); // Amplitude-style analytics
// app.use(
//   "/api/admin/security",
//   authenticateToken,
//   requireAdmin,
//   securityLevelRouter
// );
// Admin ip-blocks route temporarily fully disabled to avoid middleware init crash
// app.use(
//   "/api/admin/ip-blocks",
//   safeAuth,
//   safeAdmin,
//   ipBlocksRouter
// );
// app.use(
//   "/api/admin/user-approval",
//   authenticateToken,
//   requireAdmin,
//   userApprovalRouter
// );
app.use("/api/admin/telegram", safeAuth, safeAdmin, telegramRouter);
// Admin wallets route
app.use("/api/admin/wallets", safeAuth, safeAdmin, adminWalletsRouter);
// app.use("/api/admin", authenticateToken, requireAdmin, adminUsersRouter); // Routes not available
app.use("/api/admin", authenticateToken, requireAdmin, adminDashboardRouter);
app.use("/api/admin", authenticateToken, requireAdmin, adminRouter);
app.use("/api/admin", adminNotificationLogsRouter); // Admin notification logs with built-in auth
app.use(
  "/api/admin/credits",
  authenticateToken,
  requireAdmin,
  adminCreditsRouter,
); // Promotional credits with limits
// app.use(
//   "/api/admin/bulk",
//   authenticateToken,
//   requireAdmin,
//   adminBulkActionsRouter
// ); // Bulk user actions

// Admin reports for dashboard charts (revenue, users, payments, subscriptions)
app.use("/api/reports", reportsRouter);

// Trust and reputation routes
app.use("/api/trust", trustRouter); // Trust scoring, reviews, reputation
app.use("/api/uploads", uploadsRouter); // R2 file uploads (authenticated)

// Admin auth (public - for login)
app.use("/api/auth/admin", authAdminRouter);

// User routes
app.use("/api/transactions", transactionsRouter);
app.use("/api/cashflow", cashflowRouter); // Cash flow analytics, forecasting & export
// app.use("/api/chat", chatRouter);
// app.use("/api/consultation", consultationRouter);
app.use("/api/system", systemRouter);
// app.use("/api/marketing", marketingRouter);
app.use("/api/subscribers", subscribersRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/withdrawals", withdrawalsRouter);
// app.use("/api/oal", oalRouter);
app.use("/api/tokens", tokensRouter);
// app.use("/api/wallets", walletsRouter); // Route file not available
app.use("/api/prices", pricesRouter); // Multi-provider price service (CoinGecko + Binance)
// app.use("/api/trust-score", trustScoreRouter); // User trust & reputation system (TEMPORARILY DISABLED - import issue)
// app.use("/api/trustpilot", trustpilotRouter); // Removed - using simple widget embed instead
app.use("/api/trust", trustRouter); // Scam Adviser & trust verification
app.use("/api/security", securityRouter); // Breach monitoring & IP protection
app.use("/api/storage", storageRouter); // Cloudflare R2 object storage operations
// app.use("/api/tokens", authenticateToken, tokensEnhancedRouter); // Enhanced token features
// app.use("/api/crypto", authenticateToken, cryptoEnhancedRouter); // Crypto charts & swap (RE-ENABLED)
// app.use("/api/invoices", invoicesRouter);
// app.use("/api/emails", emailsRouter);
// app.use("/api/email", emailRouter); // New email templates endpoint
// app.use("/api", emailTestRouter); // Email testing endpoints
// app.use("/api", sendEmailRouter); // Universal email sending (Gmail SMTP)
// app.use("/api/webhooks", webhooksRouter); // Resend webhook handlers
// app.use("/api/rewards", rewardsRouter);
app.use("/api/auth/2fa", twoFactorRouter);
// app.use("/api/health-readings", healthReadingsRouter);
// app.use("/api/password-recovery", passwordRecoveryRouter); // Password recovery & admin user lookup
app.use("/api/auth", emailSignupRouter); // Email magic link signup
app.use("/api/email", emailVerificationRouter); // Email verification with Resend
app.use("/api/emails", inboundEmailsRouter); // Inbound email webhook from Cloudflare Worker

// Project Management routes
app.use("/api/teams", teamsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/milestones", milestonesRouter);

// Notification management routes
app.use("/api/notifications", authenticateToken, notificationsRouter);
app.use(
  "/api/notification-preferences",
  authenticateToken,
  notificationPreferencesRouter,
);

// Email service routes (Resend integration)
app.use("/api/resend", authenticateToken, resendRouter);
app.use("/api/preferences", authenticateToken, preferencesRouter);

// Socket.IO connection handling
// Module-level references for export functions
let ioRef: any = null;
const socketActiveSessions = new Map<string, any>();

// JWT auth for Socket.IO handshake
if (process.env.NODE_ENV !== "test") {
  ioRef = io; // Store reference for broadcastSessions
  io.use(async (socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string) ||
        (socket.handshake.query?.token as string);
      const guestSessionId =
        (socket.handshake.auth?.guestSessionId as string) ||
        (socket.handshake.query?.guestSessionId as string);
      if (!token) {
        // Allow unauthenticated chat listeners for guest chat sessions
        if (
          guestSessionId &&
          typeof guestSessionId === "string" &&
          guestSessionId.length >= 6
        ) {
          (socket as any).data = { guestSessionId };
          return next();
        }
        return next(new Error("Auth token or guestSessionId required"));
      }
      const cleaned = token.startsWith("Bearer ") ? token.split(" ")[1] : token;

      if (!cleaned) {
        return next(new Error("Invalid token format"));
      }

      interface JWTPayload {
        userId: string;
        email?: string;
      }

      const payload = jwt.verify(
        cleaned,
        config.jwtSecret!,
      ) as unknown as JWTPayload;
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, role: true, active: true },
      });
      if (!user || user.active === false)
        return next(new Error("Account disabled"));
      (socket as any).data = { userId: user.id, role: user.role };
      next();
    } catch (_e) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, role, guestSessionId } = (socket as any).data || {};
    if (userId) socket.join(`user-${userId}`);
    if (role === "ADMIN") socket.join("admins");
    if (guestSessionId) socket.join(`chat-session-${guestSessionId}`);

    // Optional: clients may request to join again with validation
    socket.on("join-room", (reqUserId: string) => {
      if (reqUserId && reqUserId === userId) socket.join(`user-${userId}`);
    });

    // Broadcast session updates to admins
    socket.emit("sessions:update", activeSessions);
  });

  // Broadcast sessions update helper (moved outside conditional)
  // See bottom of file for broadcastSessions function

  // Inject Socket.IO into services/routers that need it
  // setNotificationSocket(io); // Service import commented
  setTransactionSocketIO(io);
  // setAdminUsersSocketIO(io); // Route not available
  // setDebitCardSocketIO(io); // Keep disabled if debit cards route disabled
  // setMedbedsSocketIO(io); // Keep disabled if medbeds route disabled
  // setChatSocketIO(io); // Keep disabled if chat route disabled
  setSupportSocketIO(io);
  setPaymentsSocketIO(io);
  // setWithdrawalSocketIO(io); // Function may not be exported
  // setOALSocketIO(io); // Keep disabled if OAL route disabled
  setTokenSocketIO(io);
  setComplianceSocketIO(io); // Compliance monitoring real-time updates
  // Project Management Socket.IO injection
  setTeamSocketIO(io);
  setProjectSocketIO(io);
  setTaskSocketIO(io);
  setMilestoneSocketIO(io);
  // Project Management Socket.IO injection
  setTeamSocketIO(io);
  setProjectSocketIO(io);
  setTaskSocketIO(io);
  setMilestoneSocketIO(io);

  setRateLimiterSocketIO(io);

  // Wire up session broadcasting
  setAuthBroadcast(broadcastSessions);
  setSessionsBroadcast(broadcastSessions);
} // End of Socket.IO initialization (skipped in test mode)

// 404 handler for undefined routes (before error handler)
app.use(notFoundHandler);

// Global error handler (MUST be last middleware)
app.use(errorHandler);

// New /joke route
app.get("/joke", async (req, res) => {
  try {
    await getJoke(); // This will log the joke to the console
    res.json({ success: true, message: "Joke generated and logged!" });
  } catch (error) {
    console.error("Error generating joke:", error);
    res.status(500).json({ success: false, error: "Failed to generate joke" });
  }
});

// Start server (moved into async bootstrap below)
const PORT = config.port || process.env.PORT || 5000;

// Async bootstrap to allow awaiting service initializers (e.g. RabbitMQ)
async function bootstrap() {
  console.log("[DIAG] Bootstrap function called");

  try {
    console.log("[DIAG] Initializing RabbitMQ queue...");
    await initQueue();
    console.log("[INIT] RabbitMQ queues initialized");
  } catch (e) {
    console.error(
      "[INIT] RabbitMQ initialization failed (continuing without queue)",
      e,
    );
  }

  // Initialize digest cron jobs
  if (process.env.ENABLE_CRON === "true") {
    try {
      const cron = require("node-cron");
      const {
        generateDailyDigests,
        generateWeeklyDigests,
      } = require("./services/digestService");
      const {
        generateWeeklyComplianceReport,
        generateMonthlyComplianceReport,
      } = require("./services/complianceReporting");

      // Run daily digests at midnight
      cron.schedule("0 0 * * *", async () => {
        console.log("[CRON] Running daily digest generation...");
        try {
          await generateDailyDigests();
          console.log("[CRON] Daily digest generation completed");
        } catch (error) {
          console.error("[CRON] Daily digest generation failed:", error);
        }
      });

      // Run weekly compliance reports every Monday at 8 AM
      cron.schedule("0 8 * * MON", async () => {
        console.log("[CRON] Running weekly compliance report generation...");
        try {
          await generateWeeklyComplianceReport();
          console.log("[CRON] Weekly compliance report generation completed");
        } catch (error) {
          console.error(
            "[CRON] Weekly compliance report generation failed:",
            error,
          );
        }
      });

      // Run monthly compliance reports on the 1st of each month at 9 AM
      cron.schedule("0 9 1 * *", async () => {
        console.log("[CRON] Running monthly compliance report generation...");
        try {
          await generateMonthlyComplianceReport();
          console.log("[CRON] Monthly compliance report generation completed");
        } catch (error) {
          console.error(
            "[CRON] Monthly compliance report generation failed:",
            error,
          );
        }
      });

      // Run weekly digests on Sunday at midnight
      cron.schedule("0 0 * * 0", async () => {
        console.log("[CRON] Running weekly digest generation...");
        try {
          await generateWeeklyDigests();
          console.log("[CRON] Weekly digest generation completed");
        } catch (error) {
          console.error("[CRON] Weekly digest generation failed:", error);
        }
      });

      console.log("[INIT] Digest cron jobs scheduled");
    } catch (e) {
      console.error("[INIT] Failed to initialize digest cron jobs:", e);
    }
  } else {
    console.log("[INIT] Cron jobs disabled, skipping digest scheduler");
  }

  // Initialize enhanced authentication cleanup service
  try {
    // const { cleanupService } = await import("./services/cleanupService");
    // if (process.env.SESSION_CLEANUP_ENABLED !== "false") {
    //   cleanupService.start();
    //   console.log("[INIT] Enhanced authentication cleanup service started");
    // } else {
    //   console.log(
    //     "[INIT] Session cleanup disabled (SESSION_CLEANUP_ENABLED=false)",
    //   );
    // }
    console.log("[INIT] Cleanup service temporarily disabled");
  } catch (e) {
    console.error("[INIT] Failed to start cleanup service:", e);
  }

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

bootstrap();

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  console.log(`\n[SHUTDOWN] ${signal} received, starting graceful shutdown...`);

  try {
    // Global error handler (must be after all routes)
    app.use(
      (
        err: Error,
        req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
      ) => {
        console.error("[ERROR] Unhandled error:", err);
        console.error("[ERROR] Stack:", err.stack);

        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error:
              process.env.NODE_ENV === "production"
                ? "Internal server error"
                : err.message,
            stack:
              process.env.NODE_ENV === "development" ? err.stack : undefined,
          });
        }
      },
    );

    // Close queue connection
    await closeQueue();
    console.log("[SHUTDOWN] RabbitMQ connection closed");
  } catch (e) {
    console.error("[SHUTDOWN] Error closing RabbitMQ", e);
  }

  try {
    // Shutdown tracing
    if (process.env.OTEL_TRACING_ENABLED === "true") {
      const { shutdownTracing } = require("./tracing");
      await shutdownTracing();
    }
  } catch (e) {
    console.error("[SHUTDOWN] Error shutting down tracing", e);
  }

  try {
    // Close server
    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log("[SHUTDOWN] HTTP server closed");
        resolve();
      });
      // Force close after 10 seconds
      setTimeout(() => resolve(), 10000);
    });
  } catch (e) {
    console.error("[SHUTDOWN] Error closing server", e);
  }

  try {
    // Close database connection
    await prisma.$disconnect();
    console.log("[SHUTDOWN] Database connection closed");
  } catch (e) {
    console.error("[SHUTDOWN] Error closing database", e);
  }

  console.log("[SHUTDOWN] Graceful shutdown complete");

  // Use original exit if intercept is active, otherwise normal exit
  if ((process as any).__originalExit) {
    (process as any).__originalExit(0);
  } else {
    process.exit(0);
  }
} // Track active requests to prevent shutdown during processing
let activeRequests = 0;
let shutdownInitiated = false;
let sigintCount = 0; // Track consecutive SIGINT signals
let sigintTimer: NodeJS.Timeout | null = null;

app.use((req: any, res: any, next: any) => {
  activeRequests++;
  res.on("finish", () => {
    activeRequests--;
  });
  next();
});

// Handle shutdown signals - require double Ctrl+C in development to prevent accidental shutdowns
function handleShutdownSignal(signal: string) {
  if (shutdownInitiated) {
    console.log(`[SHUTDOWN] Already shutting down, ignoring ${signal}`);
    return;
  }

  // In development, require double SIGINT (double Ctrl+C) within 3 seconds
  if (signal === "SIGINT" && process.env.NODE_ENV !== "production") {
    sigintCount++;
    console.log(
      `\n⚠️  Received SIGINT (${sigintCount}/2) - Press Ctrl+C again within 3 seconds to shutdown, or it will be ignored`,
    );

    if (sigintCount === 1) {
      // Reset counter after 3 seconds
      if (sigintTimer) clearTimeout(sigintTimer);
      sigintTimer = setTimeout(() => {
        console.log("✅  Shutdown cancelled - server continues running");
        sigintCount = 0;
      }, 3000);
      return;
    }

    // Second SIGINT within 3 seconds - proceed with shutdown
    if (sigintTimer) clearTimeout(sigintTimer);
    console.log("🛑  Double SIGINT confirmed - shutting down...");
  }

  if (activeRequests > 0) {
    console.log(
      `[SHUTDOWN] ${signal} received but ${activeRequests} requests active, forcing shutdown in 2s...`,
    );
    setTimeout(() => {
      shutdownInitiated = true;
      gracefulShutdown(signal);
    }, 2000);
    return;
  }

  shutdownInitiated = true;
  gracefulShutdown(signal);
}

process.on("SIGINT", () => handleShutdownSignal("SIGINT"));
process.on("SIGTERM", () => handleShutdownSignal("SIGTERM"));

// Initialize Telegram bot for trust analysis
import { initializeTelegramBot } from "./services/telegramTrustBot";
initializeTelegramBot();

// Broadcast sessions update helper (exported for admin usage)
export function broadcastSessions() {
  if (ioRef) {
    ioRef.to("admins").emit("sessions:update", socketActiveSessions);
  }
}

// Export app for testing
export default app;
