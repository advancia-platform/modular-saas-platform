import * as Sentry from '@sentry/nextjs';
import { replayIntegration } from '@sentry/nextjs';

/**
 * Sentry Error Tracking Initialization for Next.js
 */

export function initSentry(): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.log('Sentry DSN not configured, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: process.env.NODE_ENV === 'development',

    replaysOnErrorSampleRate: 1.0,

    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    integrations: [
      replayIntegration({
        // Additional Replay configuration goes in here, for example:
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Release tracking
    release: process.env.npm_package_version || '1.0.0',
  });

  console.log('✅ Sentry initialized for frontend');
}

export function captureException(error: Error, context?: any): void {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: {
        component: 'frontend',
        ...context?.tags
      },
      extra: context?.extra
    });
  } else {
    console.error('Error (Sentry disabled):', error);
  }
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: any): void {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level,
      tags: {
        component: 'frontend',
        ...context?.tags
      },
      extra: context?.extra
    });
  } else {
    console.log(`Message (Sentry disabled):`, message);
  }
}

export function setUser(user: { id: string; email?: string; role?: string } | null): void {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        role: user.role
      });
    } else {
      Sentry.setUser(null);
    }
  } else {
    console.log('Set user context (Sentry disabled):', user?.id || 'null');
  }
}

// Helper to add breadcrumbs for debugging
export function addBreadcrumb(message: string, category?: string, level?: Sentry.SeverityLevel) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category: category || 'custom',
      level: level || 'info',
      timestamp: Date.now() / 1000
    });
  }
}




