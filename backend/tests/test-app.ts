/**
 * Test App Helper
 * Provides configured Express app with all routes for testing
 */

import cors from "cors";
import express from "express";
import app from "../src/app";
import { activityLogger } from "../src/middleware/activityLogger";
import { validateInput } from "../src/middleware/security";

// Import all routers
import { errorHandler, notFoundHandler } from "../src/middleware/errorHandler";
import adminRouter from "../src/routes/admin";
import analyticsRouter from "../src/routes/analytics";
import authRouter from "../src/routes/auth";
import authAdminRouter from "../src/routes/authAdmin";
import chatRouter from "../src/routes/chat";
import consultationRouter from "../src/routes/consultation";
import debitCardRouter from "../src/routes/debitCard";
import emailRouter from "../src/routes/email";
import healthRouter from "../src/routes/health";
import healthReadingsRouter from "../src/routes/health-readings";
import ipBlocksRouter from "../src/routes/ipBlocks";
import marketingRouter from "../src/routes/marketing";
import medbedsRouter from "../src/routes/medbeds";
import paymentsRouter from "../src/routes/paymentsEnhanced";
import { handleStripeWebhook } from "../src/routes/paymentsWebhook";
import rewardsRouter from "../src/routes/rewards";
import securityLevelRouter from "../src/routes/securityLevel";
import sessionsRouter from "../src/routes/sessions";
import subscribersRouter from "../src/routes/subscribers";
import supportRouter from "../src/routes/support";
import systemRouter from "../src/routes/system";
import tokensRouter from "../src/routes/tokens";
import transactionsRouter from "../src/routes/transactions";
import userApprovalRouter from "../src/routes/userApproval";
import withdrawalsRouter from "../src/routes/withdrawals";

// Configure CORS for testing
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

// Stripe webhook MUST use raw body
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
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
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/consultation", consultationRouter);
app.use("/api/system", systemRouter);
app.use("/api/marketing", marketingRouter);
app.use("/api/subscribers", subscribersRouter);
app.use("/api/admin/security", securityLevelRouter);
app.use("/api/admin/ip-blocks", ipBlocksRouter);
app.use("/api/admin/user-approval", userApprovalRouter);
app.use("/api/auth/admin", authAdminRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/withdrawals", withdrawalsRouter);
app.use("/api/tokens", tokensRouter);
app.use("/api/rewards", rewardsRouter);
app.use("/api/health-readings", healthReadingsRouter);
app.use("/api/email", emailRouter);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (MUST be last middleware)
app.use(errorHandler);

export default app;
