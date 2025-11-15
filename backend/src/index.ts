// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { activityLogger } from "./middleware/activityLogger";
import { authenticateToken, requireAdmin } from "./middleware/auth";
import {
  helmetMiddleware,
  rateLimit,
  validateInput,
} from "./middleware/security";
import prisma from "./prismaClient";
import adminRouter from "./routes/admin";
import adminBulkActionsRouter from "./routes/adminBulkActions";
import adminDashboardRouter from "./routes/adminDashboard";
import aiAnalyticsRouter from "./routes/aiAnalytics";
import amplitudeAnalyticsRouter from "./routes/amplitudeAnalytics";
import analyticsRouter from "./routes/analytics";
import analyticsEnhancedRouter from "./routes/analyticsEnhanced";
import authRouter from "./routes/auth";
import authAdminRouter, {
  activeSessions,
  setBroadcastSessions as setAuthBroadcast,
} from "./routes/authAdmin";
import chatRouter, { setChatSocketIO } from "./routes/chat";
import consultationRouter from "./routes/consultation";
import cryptoEnhancedRouter from "./routes/cryptoEnhanced";
import cryptomusRouter from "./routes/cryptomus";
import debitCardRouter, { setDebitCardSocketIO } from "./routes/debitCard";
import debitCardEnhancedRouter from "./routes/debitCardEnhanced";
import emailRouter from "./routes/email"; // Email templates router
import emailTestRouter from "./routes/email-test"; // Email testing endpoints
import emailsRouter from "./routes/emails";
import emailSignupRouter from "./routes/emailSignup"; // Email magic link signup
import healthRouter from "./routes/health";
import healthReadingsRouter from "./routes/health-readings";
import invoicesRouter from "./routes/invoices";
import ipBlocksRouter from "./routes/ipBlocks";
import marketingRouter from "./routes/marketing";
import medbedsRouter, { setMedbedsSocketIO } from "./routes/medbeds";
import oalRouter, { setOALSocketIO } from "./routes/oal";
import passwordRecoveryRouter from "./routes/passwordRecovery"; // Password recovery & user details
import paymentsRouter, {
  handleStripeWebhook,
  setPaymentsSocketIO,
} from "./routes/payments";
import paymentsEnhancedRouter from "./routes/paymentsEnhanced";
import rewardsRouter from "./routes/rewards";
import securityLevelRouter from "./routes/securityLevel";
import sendEmailRouter from "./routes/send-email"; // Universal email sending
import sessionsRouter, {
  setBroadcastSessions as setSessionsBroadcast,
} from "./routes/sessions";
import subscribersRouter from "./routes/subscribers";
import supportRouter, { setSupportSocketIO } from "./routes/support";
import systemRouter from "./routes/system";
import tokenRefreshRouter from "./routes/tokenRefresh";
import tokensRouter, { setTokenSocketIO } from "./routes/tokens";
import tokensEnhancedRouter from "./routes/tokensEnhanced";
import transactionsRouter, {
  setTransactionSocketIO,
} from "./routes/transactions";
import twoFactorRouter from "./routes/twoFactor";
import userApprovalRouter from "./routes/userApproval";
import adminUsersRouter, { setAdminUsersSocketIO } from "./routes/users";
import webhooksRouter from "./routes/webhooks"; // Resend webhook handlers
import withdrawalsRouter, { setWithdrawalSocketIO } from "./routes/withdrawals";
import { setSocketIO as setNotificationSocket } from "./services/notificationService";
import { dataMasker } from "./utils/dataMasker";
import { envInspector } from "./utils/envInspector";
import { initSentry } from "./utils/sentry";
import { sanitizeInput } from "./validation/middleware";

// Import configuration
import { config } from "./jobs/config";

// Initialize Sentry for error tracking and monitoring
initSentry();

// Create HTTP server (CloudFlare handles SSL termination)
const server = http.createServer(app);

// Trust proxy (needed when behind Cloudflare/NGINX for correct IPs and HTTPS)
app.set("trust proxy", 1);

// Configure CORS with allowed origins
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (config.allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

// Stripe webhook MUST use raw body, so register it BEFORE express.json()
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// JSON parser and common middlewares AFTER webhook
app.use(express.json());
app.use(helmetMiddleware());
app.use(sanitizeInput);
app.use(dataMasker.createResponseSanitizer());
app.use(validateInput);
app.use(activityLogger);
app.use("/api", rateLimit({ windowMs: 60_000, maxRequests: 300 }));

// Health check endpoint (critical for production monitoring)
app.use("/api", healthRouter);
app.use("/api", statusRouter);

// Auth routes (public)
app.use("/api/auth", tokenRefreshRouter); // Token refresh endpoint

// Regular routes
app.use("/api/payments", paymentsRouter);
app.use("/api/payments", authenticateToken, paymentsEnhancedRouter); // Enhanced payment features
app.use("/api/debit-card", debitCardRouter);
app.use("/api/debit-cards", authenticateToken, debitCardEnhancedRouter); // Enhanced card management
app.use("/api/medbeds", medbedsRouter);
app.use("/api/support", supportRouter);
app.use("/api/ai-analytics", aiAnalyticsRouter);
app.use("/api/auth", authRouter);

// Admin routes - PROTECTED with requireAdmin middleware
app.use(
  "/api/admin/analytics",
  authenticateToken,
  requireAdmin,
  analyticsRouter
);
app.use("/api/analytics", authenticateToken, analyticsEnhancedRouter); // Enhanced analytics with export
app.use("/api/analytics", authenticateToken, amplitudeAnalyticsRouter); // Amplitude-style analytics
app.use(
  "/api/admin/security",
  authenticateToken,
  requireAdmin,
  securityLevelRouter
);
app.use(
  "/api/admin/ip-blocks",
  authenticateToken,
  requireAdmin,
  ipBlocksRouter
);
app.use(
  "/api/admin/user-approval",
  authenticateToken,
  requireAdmin,
  userApprovalRouter
);
app.use("/api/admin", authenticateToken, requireAdmin, adminUsersRouter);
app.use("/api/admin", authenticateToken, requireAdmin, adminDashboardRouter);
app.use("/api/admin", authenticateToken, requireAdmin, adminRouter);
app.use(
  "/api/admin/bulk",
  authenticateToken,
  requireAdmin,
  adminBulkActionsRouter
); // Bulk user actions

// Admin auth (public - for login)
app.use("/api/auth/admin", authAdminRouter);

// User routes
app.use("/api/transactions", transactionsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/consultation", consultationRouter);
app.use("/api/system", systemRouter);
app.use("/api/marketing", marketingRouter);
app.use("/api/subscribers", subscribersRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/withdrawals", withdrawalsRouter);
app.use("/api/oal", oalRouter);
app.use("/api/tokens", tokensRouter);
app.use("/api/tokens", authenticateToken, tokensEnhancedRouter); // Enhanced token features
app.use("/api/crypto", authenticateToken, cryptoEnhancedRouter); // Crypto charts & swap (RE-ENABLED)
app.use("/api/cryptomus", cryptomusRouter); // Cryptomus payment processing
app.use("/api/invoices", invoicesRouter);
app.use("/api/emails", emailsRouter);
app.use("/api/email", emailRouter); // New email templates endpoint
app.use("/api", emailTestRouter); // Email testing endpoints
app.use("/api", sendEmailRouter); // Universal email sending (Gmail SMTP)
app.use("/api/webhooks", webhooksRouter); // Resend webhook handlers
app.use("/api/rewards", rewardsRouter);
app.use("/api/auth/2fa", twoFactorRouter);
app.use("/api/health-readings", healthReadingsRouter);
app.use("/api/password-recovery", passwordRecoveryRouter); // Password recovery & admin user lookup
app.use("/api/auth", emailSignupRouter); // Email magic link signup

const io = new SocketIOServer(server, {
  cors: {
    origin: config.allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO connection handling
// JWT auth for Socket.IO handshake
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
    const payload = jwt.verify(cleaned, config.jwtSecret) as {
      userId: string;
      email?: string;
    };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, active: true },
    });
    if (!user || user.active === false)
      return next(new Error("Account disabled"));
    (socket as any).data = { userId: user.id, role: user.role };
    next();
  } catch (e) {
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

// Broadcast sessions update helper
export function broadcastSessions() {
  io.to("admins").emit("sessions:update", activeSessions);
}

// Inject Socket.IO into services/routers that need it
setNotificationSocket(io);
setTransactionSocketIO(io);
setAdminUsersSocketIO(io);
setDebitCardSocketIO(io);
setMedbedsSocketIO(io);
setChatSocketIO(io);
setSupportSocketIO(io);
setPaymentsSocketIO(io);
setWithdrawalSocketIO(io);
setOALSocketIO(io);
setTokenSocketIO(io);

// Import and inject Socket.IO into rate limiter for real-time monitoring
import { setRateLimiterSocketIO } from "./middleware/rateLimiterRedis";
setRateLimiterSocketIO(io);

import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// Wire up session broadcasting
setAuthBroadcast(broadcastSessions);
setSessionsBroadcast(broadcastSessions);

// 404 handler for undefined routes (before error handler)
app.use(notFoundHandler);

// Global error handler (MUST be last middleware)
app.use(errorHandler);

// Start server
const PORT = config.port || process.env.PORT || 5000;

// Run environment inspection
envInspector.logInspection();

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Socket.IO enabled for real-time notifications`);
  console.log(`🔒 Security middleware active`);
});
