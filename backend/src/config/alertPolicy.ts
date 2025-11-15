/**
 * Alert Policy Configuration
 *
 * Defines thresholds and notification channels for each route group.
 * When a threshold is exceeded, alerts are sent via specified channels.
 */

export type AlertChannel =
  | "email"
  | "sms"
  | "slack"
  | "teams"
  | "websocket"
  | "sentry";

export interface AlertPolicy {
  threshold: number; // Number of requests before triggering alert
  channels: AlertChannel[]; // Notification channels to use
  cooldown?: number; // Cooldown period in milliseconds (default: 5 minutes)
  severity?: "low" | "medium" | "high" | "critical"; // Alert severity
}

export interface AlertPolicies {
  [routeGroup: string]: AlertPolicy;
}

/**
 * Default alert policies for route groups
 */
export const alertPolicies: AlertPolicies = {
  // Authentication routes - very strict (potential brute force)
  auth: {
    threshold: 10,
    channels: ["email", "sms", "slack", "websocket", "sentry"],
    cooldown: 5 * 60 * 1000, // 5 minutes
    severity: "critical",
  },
  "auth-strict": {
    threshold: 8,
    channels: ["email", "sms", "slack", "teams", "websocket", "sentry"],
    cooldown: 3 * 60 * 1000, // 3 minutes
    severity: "critical",
  },

  // Admin routes - strict (unauthorized access attempts)
  admin: {
    threshold: 20,
    channels: ["email", "sms", "slack", "websocket", "sentry"],
    cooldown: 10 * 60 * 1000, // 10 minutes
    severity: "high",
  },

  // Payment routes - very strict (financial security)
  payments: {
    threshold: 15,
    channels: ["email", "sms", "slack", "teams", "websocket", "sentry"],
    cooldown: 5 * 60 * 1000, // 5 minutes
    severity: "critical",
  },

  // Crypto routes - strict (financial security)
  crypto: {
    threshold: 15,
    channels: ["email", "slack", "websocket", "sentry"],
    cooldown: 10 * 60 * 1000, // 10 minutes
    severity: "high",
  },

  // Transaction routes - moderate
  transactions: {
    threshold: 30,
    channels: ["email", "slack", "websocket", "sentry"],
    cooldown: 15 * 60 * 1000, // 15 minutes
    severity: "medium",
  },

  // User routes - moderate
  users: {
    threshold: 50,
    channels: ["email", "websocket", "sentry"],
    cooldown: 15 * 60 * 1000, // 15 minutes
    severity: "medium",
  },

  // General API routes - lenient
  api: {
    threshold: 100,
    channels: ["email", "websocket", "sentry"],
    cooldown: 30 * 60 * 1000, // 30 minutes
    severity: "low",
  },

  // Other routes - lenient
  general: {
    threshold: 80,
    channels: ["email", "sentry"],
    cooldown: 30 * 60 * 1000, // 30 minutes
    severity: "low",
  },
};

/**
 * Get alert policy for a route group
 */
export function getAlertPolicy(group: string): AlertPolicy | undefined {
  return alertPolicies[group];
}

/**
 * Check if a group should trigger an alert
 */
export function shouldAlert(group: string, count: number): boolean {
  const policy = getAlertPolicy(group);
  return policy ? count > policy.threshold : false;
}

/**
 * Get all route groups with alert policies
 */
export function getAlertGroups(): string[] {
  return Object.keys(alertPolicies);
}
