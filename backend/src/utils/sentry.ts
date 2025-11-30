import * as Sentry from "@sentry/node";
import {
  consoleIntegration,
  consoleLoggingIntegration,
  httpIntegration,
  onUncaughtExceptionIntegration,
  onUnhandledRejectionIntegration,
} from "@sentry/node";
import { dataMasker } from "./dataMasker";
// @ts-ignore - Optional profiling package
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
      // Send console.log, console.warn, and console.error calls as logs to Sentry
      consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
      onUncaughtExceptionIntegration(),
      onUnhandledRejectionIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0, // 10% in production, 100% in development
    profilesSampleRate: 1.0, // Profile 100% of transactions
    // Enable logs to be sent to Sentry
    _experiments: {
      enableLogs: true,
    },

    // Release tracking
    release: process.env.npm_package_version || "1.0.0",

    // Error filtering and data sanitization
    beforeSend(event, hint) {
      // Filter out sensitive data from requests
      if (event.request) {
        // Remove cookies
        delete event.request.cookies;

        // Remove authorization headers
        if (event.request.headers) {
          delete event.request.headers["authorization"];
          delete event.request.headers["Authorization"];
          delete event.request.headers["cookie"];
          delete event.request.headers["Cookie"];
        }

        // Remove sensitive query params (support string or key/value tuples)
        const qs: any = (event.request as any).query_string;
        if (typeof qs === "string") {
          (event.request as any).query_string = qs
            .replace(/token=[^&]*/gi, "token=[REDACTED]")
            .replace(/api[_-]?key=[^&]*/gi, "apiKey=[REDACTED]")
            .replace(/password=[^&]*/gi, "password=[REDACTED]");
        } else if (Array.isArray(qs)) {
          // Query params as [key, value][]
          (event.request as any).query_string = qs.map(
            ([k, v]: [string, any]) => {
              const kl = (k || "").toLowerCase();
              if (/(token|api[_-]?key|password)/i.test(kl))
                return [k, "[REDACTED]"];
              return [k, v];
            },
          );
        } else if (qs && typeof qs === "object") {
          // Query params as object
          const redacted: Record<string, any> = {};
          for (const [k, v] of Object.entries(qs)) {
            if (/(token|api[_-]?key|password)/i.test(k))
              redacted[k] = "[REDACTED]";
            else redacted[k] = v;
          }
          (event.request as any).query_string = redacted;
        }
      }

      // Filter out sensitive data from extra context
      if (event.extra) {
        const sensitiveKeys = [
          "password",
          "token",
          "apiKey",
          "secret",
          "privateKey",
          "seedPhrase",
        ];
        Object.keys(event.extra).forEach((key) => {
          if (
            sensitiveKeys.some((sk) =>
              key.toLowerCase().includes(sk.toLowerCase()),
            )
          ) {
            event.extra![key] = "[REDACTED]";
          }
        });
      }

      // Filter out common non-errors
      if (event.exception) {
        const error = hint.originalException;
        if (
          error &&
          error instanceof Error &&
          typeof error.message === "string"
        ) {
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
  context?: any,
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
  level?: Sentry.SeverityLevel,
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

// Redact sensitive fields for manual Sentry extras
export function redactSensitiveData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const clone: Record<string, unknown> = { ...data };
  // Generic token-like keys
  const sensitiveKeys = [
    "token",
    "authorization",
    "auth",
    "apiKey",
    "secret",
    "password",
  ];
  for (const key of Object.keys(clone)) {
    const lower = key.toLowerCase();
    if (sensitiveKeys.some((k) => lower.includes(k.toLowerCase()))) {
      clone[key] = "[REDACTED]";
    }
  }

  // Mask email-like fields
  if (typeof clone.email === "string") {
    clone.email = dataMasker.maskEmail(clone.email as string);
  }

  return clone;
}

// Sentry Logger helpers - use these for structured logging to Sentry
export const sentryLogger = {
  /**
   * Log info level message to Sentry
   */
  info(message: string, data?: Record<string, unknown>) {
    if (process.env.SENTRY_DSN) {
      Sentry.logger.info(message, redactSensitiveData(data || {}));
    } else {
      console.log(`[Sentry Info] ${message}`, data || {});
    }
  },

  /**
   * Log warning level message to Sentry
   */
  warn(message: string, data?: Record<string, unknown>) {
    if (process.env.SENTRY_DSN) {
      Sentry.logger.warn(message, redactSensitiveData(data || {}));
    } else {
      console.warn(`[Sentry Warn] ${message}`, data || {});
    }
  },

  /**
   * Log error level message to Sentry
   */
  error(message: string, data?: Record<string, unknown>) {
    if (process.env.SENTRY_DSN) {
      Sentry.logger.error(message, redactSensitiveData(data || {}));
    } else {
      console.error(`[Sentry Error] ${message}`, data || {});
    }
  },

  /**
   * Log debug level message to Sentry
   */
  debug(message: string, data?: Record<string, unknown>) {
    if (process.env.SENTRY_DSN) {
      Sentry.logger.debug(message, redactSensitiveData(data || {}));
    } else {
      console.debug(`[Sentry Debug] ${message}`, data || {});
    }
  },

  /**
   * Log trace level message to Sentry
   */
  trace(message: string, data?: Record<string, unknown>) {
    if (process.env.SENTRY_DSN) {
      Sentry.logger.trace(message, redactSensitiveData(data || {}));
    } else {
      console.trace(`[Sentry Trace] ${message}`, data || {});
    }
  },
};
