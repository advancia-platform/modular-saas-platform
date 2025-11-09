import * as Sentry from "@sentry/node";
import { httpIntegration, consoleIntegration, onUncaughtExceptionIntegration, onUnhandledRejectionIntegration } from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Initialize Sentry for error tracking and performance monitoring
export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.log("Sentry DSN not configured, skipping Sentry initialization");
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    integrations: [
      // Add profiling integration for performance monitoring
      nodeProfilingIntegration(),
      // Add other integrations as needed
      httpIntegration(),
      consoleIntegration(),
      onUncaughtExceptionIntegration(),
      onUnhandledRejectionIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0, // 10% in production, 100% in development
    profilesSampleRate: 1.0, // Profile 100% of transactions

    // Release tracking
    release: process.env.npm_package_version || "1.0.0",

    // Error filtering
    beforeSend(event, hint) {
      // Filter out common non-errors
      if (event.exception) {
        const error = hint.originalException;
        if (error && error instanceof Error && typeof error.message === "string") {
          // Filter out network errors that are expected
          if (
            error.message.includes("ECONNREFUSED") ||
            error.message.includes("ENOTFOUND") ||
            error.message.includes("timeout")
          ) {
            return null;
          }
        }
      }
      return event;
    },
  });

  console.log("✅ Sentry initialized for backend");
}

// Helper function to capture custom errors
export function captureError(error: Error, context?: any) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: {
        component: "backend",
        ...context?.tags,
      },
      extra: context?.extra,
    });
  } else {
    console.error("Error (Sentry disabled):", error);
  }
}

// Helper function to capture messages
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: any
) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level,
      tags: {
        component: "backend",
        ...context?.tags,
      },
      extra: context?.extra,
    });
  } else {
    console.log(`Message (Sentry disabled) [${level}]:`, message);
  }
}

// Helper to set user context
export function setUserContext(user: {
  id: string;
  email?: string;
  role?: string;
}) {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } else {
    console.log("Set user context (Sentry disabled):", user.id);
  }
}

// Helper to add breadcrumbs for debugging
export function addBreadcrumb(
  message: string,
  category?: string,
  level?: Sentry.SeverityLevel
) {
  if (process.env.SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category: category || "custom",
      level: level || "info",
      timestamp: Date.now() / 1000,
    });
  }
}








