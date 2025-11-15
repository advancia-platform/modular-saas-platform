/**
 * Multi-Channel Alert Service (Database-Backed)
 *
 * Sends alerts via multiple channels: email, SMS, Slack, Teams, WebSocket, Sentry
 * Integrates with database-backed alert policies for dynamic threshold configuration
 * Supports RBAC-protected policy management via admin UI
 */

import nodemailer from "nodemailer";
import { getAlertPolicy } from "../config/alertPolicy.js";
import { redis } from "../middleware/rateLimiterRedis.js";
import prisma from "../prismaClient.js";
import { captureError } from "../utils/sentry.js";

/**
 * Policy cache for performance (refresh every 60 seconds)
 */
let policyCache: Map<string, any> = new Map();
let lastCacheRefresh = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * Alert data structure
 */
export interface AlertData {
  identifier: string;
  group: string;
  count: number;
  path?: string;
  method?: string;
  timestamp?: number;
  userAgent?: string;
}

/**
 * Alert history for deduplication
 * Tracks recent alerts to prevent alert spam
 * NOTE: This in-memory map is kept for backward compatibility,
 * but Redis-backed cooldowns are preferred for distributed systems
 */
const alertCooldowns = new Map<string, number>();

// Periodic cleanup of in-memory cooldowns (runs every hour)
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  let cleaned = 0;

  for (const [key, timestamp] of Array.from(alertCooldowns.entries())) {
    if (now - timestamp > oneHour) {
      alertCooldowns.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} expired alert cooldowns from memory`);
  }
}, 60 * 60 * 1000); // Every hour

/**
 * Check if alert is in cooldown period (Redis-backed)
 * Falls back to in-memory map if Redis fails
 */
async function isInCooldown(key: string, cooldownMs: number): Promise<boolean> {
  try {
    // Try Redis first (distributed-safe)
    const cooldownKey = `alert:cooldown:${key}`;
    const exists = await redis.exists(cooldownKey);

    if (exists) {
      console.log(`⏱️ Alert cooldown active for ${key} (Redis)`);
      return true;
    }

    return false;
  } catch (err) {
    console.warn(
      `⚠️ Redis cooldown check failed, falling back to memory:`,
      err
    );

    // Fallback to in-memory map
    const lastAlert = alertCooldowns.get(key);
    if (!lastAlert) return false;
    return Date.now() - lastAlert < cooldownMs;
  }
}

/**
 * Set alert cooldown (Redis-backed)
 * Falls back to in-memory map if Redis fails
 */
async function setAlertCooldown(
  key: string,
  cooldownMs: number
): Promise<void> {
  try {
    // Set in Redis (distributed-safe)
    const cooldownKey = `alert:cooldown:${key}`;
    const cooldownSeconds = Math.ceil(cooldownMs / 1000);

    await redis.setex(cooldownKey, cooldownSeconds, Date.now().toString());
    console.log(
      `✓ Alert cooldown set for ${key} (${cooldownSeconds}s in Redis)`
    );
  } catch (err) {
    console.warn(`⚠️ Redis cooldown set failed, using memory fallback:`, err);

    // Fallback to in-memory map
    alertCooldowns.set(key, Date.now());
  }
}

/**
 * Send email alert via SMTP
 */
async function sendEmailAlert(data: AlertData): Promise<void> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const policy = getAlertPolicy(data.group);
    const severity = policy?.severity || "medium";
    const emoji = {
      low: "⚠️",
      medium: "🚨",
      high: "🔴",
      critical: "💀",
    }[severity];

    await transporter.sendMail({
      from: process.env.ALERT_FROM_EMAIL || process.env.EMAIL_USER,
      to: process.env.ALERT_EMAIL || process.env.EMAIL_USER,
      subject: `${emoji} [Rate Limit Alert] ${data.group.toUpperCase()} - ${severity.toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">${emoji} Rate Limit Alert</h2>
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;">
            <h3 style="margin: 0 0 12px 0;">Threshold Exceeded</h3>
            <p style="margin: 8px 0;"><strong>Route Group:</strong> ${
              data.group
            }</p>
            <p style="margin: 8px 0;"><strong>Identifier:</strong> ${
              data.identifier
            }</p>
            <p style="margin: 8px 0;"><strong>Request Count:</strong> ${
              data.count
            }</p>
            <p style="margin: 8px 0;"><strong>Severity:</strong> ${severity.toUpperCase()}</p>
            ${
              data.path
                ? `<p style="margin: 8px 0;"><strong>Path:</strong> ${data.path}</p>`
                : ""
            }
            ${
              data.method
                ? `<p style="margin: 8px 0;"><strong>Method:</strong> ${data.method}</p>`
                : ""
            }
            <p style="margin: 8px 0;"><strong>Timestamp:</strong> ${new Date(
              data.timestamp || Date.now()
            ).toISOString()}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            This alert was triggered because the request count exceeded the configured threshold for the ${
              data.group
            } route group.
            Please investigate this activity in the admin dashboard.
          </p>
        </div>
      `,
    });

    console.log(`✓ Email alert sent for ${data.identifier} in ${data.group}`);
  } catch (err) {
    console.error("Failed to send email alert:", err);
    if (process.env.SENTRY_DSN) {
      captureError(err as Error, {
        tags: { component: "alert-service", channel: "email" },
        extra: data,
      });
    }
  }
}

/**
 * Send SMS alert via Twilio
 */
async function sendSMSAlert(data: AlertData): Promise<void> {
  // Only send SMS if Twilio is configured
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log("⚠️ Twilio not configured, skipping SMS alert");
    return;
  }

  try {
    // Dynamically import Twilio to avoid requiring it if not configured
    // @ts-ignore - Twilio is optional dependency
    const twilio = await import("twilio");
    const client = twilio.default(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const policy = getAlertPolicy(data.group);
    const severity = policy?.severity || "medium";

    await client.messages.create({
      body: `🚨 ALERT: ${data.identifier} exceeded threshold in ${
        data.group
      } with ${data.count} requests (${severity.toUpperCase()})`,
      from: process.env.ALERT_FROM_PHONE,
      to: process.env.ALERT_TO_PHONE,
    });

    console.log(`✓ SMS alert sent for ${data.identifier} in ${data.group}`);
  } catch (err) {
    console.error("Failed to send SMS alert:", err);
    if (process.env.SENTRY_DSN) {
      captureError(err as Error, {
        tags: { component: "alert-service", channel: "sms" },
        extra: data,
      });
    }
  }
}

/**
 * Send Slack alert via webhook
 */
async function sendSlackAlert(data: AlertData): Promise<void> {
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.log("⚠️ Slack webhook not configured, skipping Slack alert");
    return;
  }

  try {
    const policy = getAlertPolicy(data.group);
    const severity = policy?.severity || "medium";
    const emoji = {
      low: ":warning:",
      medium: ":rotating_light:",
      high: ":red_circle:",
      critical: ":skull:",
    }[severity];

    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `${emoji} *Rate Limit Alert*`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `${emoji} Rate Limit Alert - ${data.group.toUpperCase()}`,
            },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Identifier:*\n${data.identifier}` },
              { type: "mrkdwn", text: `*Request Count:*\n${data.count}` },
              { type: "mrkdwn", text: `*Route Group:*\n${data.group}` },
              {
                type: "mrkdwn",
                text: `*Severity:*\n${severity.toUpperCase()}`,
              },
            ],
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `Timestamp: <!date^${Math.floor(
                  (data.timestamp || Date.now()) / 1000
                )}^{date_num} {time_secs}|${new Date(
                  data.timestamp || Date.now()
                ).toISOString()}>`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    console.log(`✓ Slack alert sent for ${data.identifier} in ${data.group}`);
  } catch (err) {
    console.error("Failed to send Slack alert:", err);
    if (process.env.SENTRY_DSN) {
      captureError(err as Error, {
        tags: { component: "alert-service", channel: "slack" },
        extra: data,
      });
    }
  }
}

/**
 * Send Teams alert via webhook
 */
async function sendTeamsAlert(data: AlertData): Promise<void> {
  if (!process.env.TEAMS_WEBHOOK_URL) {
    console.log("⚠️ Teams webhook not configured, skipping Teams alert");
    return;
  }

  try {
    const policy = getAlertPolicy(data.group);
    const severity = policy?.severity || "medium";
    const color = {
      low: "warning",
      medium: "attention",
      high: "attention",
      critical: "attention",
    }[severity];

    const response = await fetch(process.env.TEAMS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "message",
        attachments: [
          {
            contentType: "application/vnd.microsoft.card.adaptive",
            content: {
              type: "AdaptiveCard",
              body: [
                {
                  type: "TextBlock",
                  size: "large",
                  weight: "bolder",
                  text: `🚨 Rate Limit Alert - ${data.group.toUpperCase()}`,
                },
                {
                  type: "FactSet",
                  facts: [
                    { title: "Identifier:", value: data.identifier },
                    { title: "Request Count:", value: String(data.count) },
                    { title: "Route Group:", value: data.group },
                    { title: "Severity:", value: severity.toUpperCase() },
                    {
                      title: "Timestamp:",
                      value: new Date(
                        data.timestamp || Date.now()
                      ).toISOString(),
                    },
                  ],
                },
              ],
              $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
              version: "1.4",
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Teams API error: ${response.statusText}`);
    }

    console.log(`✓ Teams alert sent for ${data.identifier} in ${data.group}`);
  } catch (err) {
    console.error("Failed to send Teams alert:", err);
    if (process.env.SENTRY_DSN) {
      captureError(err as Error, {
        tags: { component: "alert-service", channel: "teams" },
        extra: data,
      });
    }
  }
}

/**
 * Send Sentry alert
 */
function sendSentryAlert(data: AlertData): void {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  const policy = getAlertPolicy(data.group);
  const severity = policy?.severity || "medium";

  captureError(new Error("Rate limit threshold exceeded"), {
    level:
      severity === "critical"
        ? "fatal"
        : severity === "high"
        ? "error"
        : "warning",
    tags: {
      type: "security",
      event: "rate_limit_alert",
      severity,
      routeGroup: data.group,
    },
    extra: data,
  });

  console.log(`✓ Sentry alert logged for ${data.identifier} in ${data.group}`);
}

/**
 * Get alert policy from database with caching
 * Falls back to config/alertPolicy.ts if database is unavailable
 */
async function getPolicyFromDB(group: string): Promise<any | null> {
  try {
    // Check cache first
    const now = Date.now();
    if (now - lastCacheRefresh < CACHE_TTL && policyCache.has(group)) {
      return policyCache.get(group);
    }

    // Refresh cache if stale
    if (now - lastCacheRefresh >= CACHE_TTL) {
      const policies = await prisma.alertPolicy.findMany({
        where: { enabled: true },
      });

      policyCache.clear();
      policies.forEach((p) => {
        policyCache.set(p.routeGroup, p);
      });

      lastCacheRefresh = now;
      console.log(`✓ Refreshed policy cache (${policies.length} policies)`);
    }

    // Return from cache
    const policy = policyCache.get(group);
    if (policy) {
      return policy;
    }

    // Fallback to config file
    console.warn(
      `⚠️ Policy not found in DB for ${group}, using config fallback`
    );
    return getAlertPolicy(group);
  } catch (err) {
    console.error("Failed to fetch policy from database:", err);

    // Fallback to config file
    return getAlertPolicy(group);
  }
}

/**
 * Store alert in Redis for history tracking
 */
async function storeAlertHistory(data: AlertData): Promise<void> {
  try {
    const alertKey = `alert_history:${data.group}`;
    const alertData = JSON.stringify({
      ...data,
      timestamp: data.timestamp || Date.now(),
    });

    await redis.lpush(alertKey, alertData);
    await redis.ltrim(alertKey, 0, 99); // Keep last 100 alerts
    await redis.expire(alertKey, 86400 * 7); // 7 days retention

    console.log(
      `✓ Alert stored in history for ${data.identifier} in ${data.group}`
    );
  } catch (err) {
    console.error("Failed to store alert history:", err);
  }
}

/**
 * Main alert sending function (Database-Backed)
 * Sends alerts via all configured channels based on database alert policy
 */
export async function sendAlert(data: AlertData): Promise<void> {
  const policy = await getPolicyFromDB(data.group);
  if (!policy) {
    console.log(`⚠️ No alert policy found for group: ${data.group}`);
    return;
  }

  // Check if policy is disabled
  if (policy.enabled === false) {
    console.log(`⏸ Alert policy disabled for group: ${data.group}`);
    return;
  }

  // Check cooldown to prevent alert spam
  const cooldownKey = `${data.group}:${data.identifier}`;
  const cooldownMs = policy.cooldown || 5 * 60 * 1000;

  if (await isInCooldown(cooldownKey, cooldownMs)) {
    console.log(
      `⏱️ Alert suppressed for ${data.identifier} in ${data.group} (cooldown active)`
    );

    // Log suppressed alert for visibility (but don't send notifications)
    if (process.env.SENTRY_DSN && policy.severity === "critical") {
      captureError(new Error("Alert suppressed due to cooldown"), {
        level: "info",
        tags: {
          type: "alert_suppressed",
          routeGroup: data.group,
          severity: policy.severity,
        },
        extra: { ...data, reason: "cooldown" },
      });
    }
    return;
  }

  console.log(
    `🚨 Triggering alert for ${data.identifier} in ${data.group} (${data.count} requests, severity: ${policy.severity})`
  );

  // Set cooldown (async, but don't block alert sending)
  setAlertCooldown(cooldownKey, cooldownMs).catch((err) => {
    console.error(`Failed to set alert cooldown:`, err);
  });

  // Store in history
  await storeAlertHistory(data);

  // Send via all configured channels in parallel
  const promises: Promise<void>[] = [];

  policy.channels.forEach((channel) => {
    switch (channel) {
      case "email":
        promises.push(sendEmailAlert(data));
        break;
      case "sms":
        promises.push(sendSMSAlert(data));
        break;
      case "slack":
        promises.push(sendSlackAlert(data));
        break;
      case "teams":
        promises.push(sendTeamsAlert(data));
        break;
      case "sentry":
        sendSentryAlert(data); // Synchronous
        break;
      // WebSocket is handled separately in the rate limiter
      case "websocket":
        break;
    }
  });

  await Promise.allSettled(promises);
}

/**
 * Get alert history for a route group
 */
export async function getAlertHistory(group: string, limit: number = 50) {
  try {
    const alertKey = `alert_history:${group}`;
    const alerts = await redis.lrange(alertKey, 0, limit - 1);

    return alerts.map((alert) => JSON.parse(alert));
  } catch (err) {
    console.error("Failed to fetch alert history:", err);
    return [];
  }
}
