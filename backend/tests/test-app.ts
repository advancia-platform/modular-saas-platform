/**
 * Test App Helper
 * Provides configured Express app with all routes for testing
 */

import express from "express";
import cors from "cors";
import app from "../src/app";
import { validateInput } from "../src/middleware/security";
import { activityLogger } from "../src/middleware/activityLogger";

// Import all routers
import paymentsRouter, { handleStripeWebhook } from "../src/routes/payments";
import debitCardRouter from "../src/routes/debitCard";
import medbedsRouter from "../src/routes/medbeds";
import supportRouter from "../src/routes/support";
import analyticsRouter from "../src/routes/analytics";
import aiAnalyticsRouter from "../src/routes/aiAnalytics";
import authRouter from "../src/routes/auth";
import adminUsersRouter from "../src/routes/users";
import transactionsRouter from "../src/routes/transactions";
import chatRouter from "../src/routes/chat";
import adminRouter from "../src/routes/admin";
import consultationRouter from "../src/routes/consultation";
import systemRouter from "../src/routes/system";
import marketingRouter from "../src/routes/marketing";
import subscribersRouter from "../src/routes/subscribers";
import securityLevelRouter from "../src/routes/securityLevel";
import ipBlocksRouter from "../src/routes/ipBlocks";
import authAdminRouter from "../src/routes/authAdmin";
import sessionsRouter from "../src/routes/sessions";
import withdrawalsRouter from "../src/routes/withdrawals";
import healthRouter from "../src/routes/health";
import tokensRouter from "../src/routes/tokens";
import rewardsRouter from "../src/routes/rewards";
import healthReadingsRouter from "../src/routes/health-readings";
import oalRouter from "../src/routes/oal";
import emailRouter from "../src/routes/email";
import { errorHandler, notFoundHandler } from "../src/middleware/errorHandler";

// Configure CORS for testing
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Stripe webhook MUST use raw body
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// JSON parser and common middlewares AFTER webhook
app.use(express.json());
app.use(validateInput);
app.use(activityLogger);

// Health check endpoint
app.use("/api", healthRouter);

// Regular routes
app.use("/api/payments", paymentsRouter);
app.use("/api/debit-card", debitCardRouter);
app.use("/api/medbeds", medbedsRouter);
app.use("/api/support", supportRouter);
app.use("/api/admin/analytics", analyticsRouter);
app.use("/api/ai-analytics", aiAnalyticsRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminUsersRouter);
app.use("/api/admin", adminRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/consultation", consultationRouter);
app.use("/api/system", systemRouter);
app.use("/api/marketing", marketingRouter);
app.use("/api/subscribers", subscribersRouter);
app.use("/api/admin/security", securityLevelRouter);
app.use("/api/admin/ip-blocks", ipBlocksRouter);
app.use("/api/auth/admin", authAdminRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/withdrawals", withdrawalsRouter);
app.use("/api/oal", oalRouter);
app.use("/api/tokens", tokensRouter);
app.use("/api/rewards", rewardsRouter);
app.use("/api/health-readings", healthReadingsRouter);
app.use("/api/email", emailRouter);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (MUST be last middleware)
app.use(errorHandler);

export default app;
