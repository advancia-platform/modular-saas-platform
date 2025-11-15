/**
 * Sentry Error Tracking Integration
 * Captures errors with stack traces, context, and user information
 */

import * as Sentry from "@sentry/node";

/**
 * Initialize Sentry error tracking
 * Call this before any other app code
 */
export function initSentry() {
  // Skip if no DSN provided (e.g., local development)
  if (!process.env.SENTRY_DSN) {
    console.log("Sentry DSN not configured, error tracking disabled");
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Release tracking
    release: process.env.APP_VERSION || "1.0.0",

    // Filter out health check noise
    beforeSend(event, hint) {
      // Ignore health check requests
      if (event.request?.url?.includes("/api/health")) {
        return null;
      }

      // Ignore specific error types if needed
      const error = hint.originalException;
      if (error?.message?.includes("ECONNRESET")) {
        return null; // Client disconnected, not our problem
      }

      return event;
    },
  });

  console.log(`Sentry initialized for ${process.env.NODE_ENV} environment`);

  // Capture unhandled errors
  setupGlobalErrorHandlers();
}

/**
 * Setup global error handlers to catch unhandled exceptions
 */
function setupGlobalErrorHandlers() {
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    Sentry.captureException(err, {
      tags: { type: "uncaughtException" },
    });
    // Don't exit - let PM2 handle it
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    Sentry.captureException(reason, {
      tags: { type: "unhandledRejection" },
    });
    // Don't exit - let PM2 handle it
  });
}

/**
 * Express middleware to capture request context
 */
export const sentryRequestHandler = () => {
  if (!process.env.SENTRY_DSN) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.requestHandler();
};

/**
 * Express middleware to enable tracing
 */
export const sentryTracingHandler = () => {
  if (!process.env.SENTRY_DSN) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.tracingHandler();
};

/**
 * Express error handler middleware (must be last)
 */
export const sentryErrorHandler = () => {
  if (!process.env.SENTRY_DSN) {
    return (err, req, res, next) => next(err);
  }
  return Sentry.Handlers.errorHandler();
};

/**
 * Manually capture an exception with context
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context (user, tags, extra data)
 */
export function captureError(error, context = {}) {
  Sentry.captureException(error, {
    tags: context.tags || {},
    extra: context.extra || {},
    user: context.user || {},
    level: context.level || "error",
  });
}

/**
 * Capture a message (for non-error events)
 * @param {string} message - The message to capture
 * @param {string} level - Severity level (info, warning, error)
 */
export function captureMessage(message, level = "info") {
  Sentry.captureMessage(message, level);
}

/**
 * Add user context to Sentry events
 * @param {Object} user - User information
 */
export function setUser(user) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging context
 * @param {string} message - Breadcrumb message
 * @param {Object} data - Additional data
 */
export function addBreadcrumb(message, data = {}) {
  Sentry.addBreadcrumb({
    message,
    data,
    level: "info",
    timestamp: Date.now() / 1000,
  });
}

export default Sentry;
