/**
 * Cloudflare Email Worker for Advancia Pay Ledger
 *
 * Handles inbound emails for:
 * - privacy@advanciapayledger.com (Privacy requests, GDPR/CCPA)
 * - legal@advanciapayledger.com (Legal inquiries, compliance)
 * - support@advanciapayledger.com (General support - already configured)
 *
 * Actions:
 * 1. Parse incoming email
 * 2. Forward to admin with metadata
 * 3. Send auto-reply acknowledgment via Resend
 * 4. Log to backend API for tracking
 */

import PostalMime from "postal-mime";
import { Resend } from "resend";

interface Env {
  RESEND_API_KEY: string;
  FORWARD_TO: string;
  DOMAIN: string;
  COMPANY_NAME: string;
  BACKEND_API_URL?: string;
  SLACK_WEBHOOK_URL?: string;
  ENVIRONMENT: string;
}

interface EmailMetadata {
  from: string;
  to: string;
  subject: string;
  receivedAt: string;
  category: "privacy" | "legal" | "support" | "unknown";
  messageId: string;
}

// Email category configuration
const EMAIL_CATEGORIES: Record<
  string,
  {
    category: EmailMetadata["category"];
    autoReplySubject: string;
    autoReplyTemplate: string;
    slackChannel?: string;
  }
> = {
  "privacy@advanciapayledger.com": {
    category: "privacy",
    autoReplySubject: "We received your privacy request - Advancia Pay Ledger",
    autoReplyTemplate: "privacy",
    slackChannel: "#privacy-requests",
  },
  "legal@advanciapayledger.com": {
    category: "legal",
    autoReplySubject: "Legal inquiry received - Advancia Pay Ledger",
    autoReplyTemplate: "legal",
    slackChannel: "#legal-inquiries",
  },
  "support@advanciapayledger.com": {
    category: "support",
    autoReplySubject: "Support request received - Advancia Pay Ledger",
    autoReplyTemplate: "support",
    slackChannel: "#support",
  },
};

export default {
  async email(
    message: ForwardableEmailMessage,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Parse the email
      const rawEmail = await streamToArrayBuffer(message.raw);
      const parser = new PostalMime();
      const parsed = await parser.parse(rawEmail);

      const toAddress = message.to.toLowerCase();
      const fromAddress = message.from;
      const subject = parsed.subject || "(No Subject)";
      const messageId =
        message.headers.get("message-id") || generateMessageId();

      // Determine email category
      const categoryConfig = EMAIL_CATEGORIES[toAddress] || {
        category: "unknown" as const,
        autoReplySubject: "We received your message - Advancia Pay Ledger",
        autoReplyTemplate: "general",
      };

      const metadata: EmailMetadata = {
        from: fromAddress,
        to: toAddress,
        subject,
        receivedAt: new Date().toISOString(),
        category: categoryConfig.category,
        messageId,
      };

      console.log(
        `[EMAIL] Processing ${metadata.category} email from ${fromAddress}`,
      );

      // Execute all actions concurrently
      await Promise.all([
        // 1. Forward to admin
        forwardToAdmin(message, metadata, env),

        // 2. Send auto-reply via Resend
        sendAutoReply(parsed, metadata, categoryConfig, env),

        // 3. Log to backend (if configured)
        env.BACKEND_API_URL
          ? logToBackend(metadata, parsed.text || "", env)
          : Promise.resolve(),

        // 4. Notify Slack (if configured)
        env.SLACK_WEBHOOK_URL && categoryConfig.slackChannel
          ? notifySlack(metadata, categoryConfig.slackChannel, env)
          : Promise.resolve(),
      ]);

      const duration = Date.now() - startTime;
      console.log(
        `[EMAIL] Processed ${metadata.category} email in ${duration}ms`,
      );
    } catch (error) {
      console.error("[EMAIL] Error processing email:", error);

      // Still try to forward the original email even if processing fails
      try {
        await message.forward(env.FORWARD_TO);
      } catch (forwardError) {
        console.error("[EMAIL] Failed to forward email:", forwardError);
        throw forwardError;
      }
    }
  },
};

/**
 * Convert ReadableStream to ArrayBuffer
 */
async function streamToArrayBuffer(
  stream: ReadableStream,
): Promise<ArrayBuffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}

/**
 * Forward email to admin
 */
async function forwardToAdmin(
  message: ForwardableEmailMessage,
  metadata: EmailMetadata,
  env: Env,
): Promise<void> {
  try {
    // Create headers for forwarding
    const forwardHeaders = new Headers();
    forwardHeaders.set("X-Original-To", metadata.to);
    forwardHeaders.set("X-Email-Category", metadata.category);
    forwardHeaders.set("X-Advancia-MessageId", metadata.messageId);
    forwardHeaders.set("X-Received-At", metadata.receivedAt);

    await message.forward(env.FORWARD_TO, forwardHeaders);
    console.log(`[EMAIL] Forwarded to ${env.FORWARD_TO}`);
  } catch (error) {
    console.error("[EMAIL] Forward failed:", error);
    throw error;
  }
}

/**
 * Send auto-reply via Resend SDK
 */
async function sendAutoReply(
  parsed: any,
  metadata: EmailMetadata,
  categoryConfig: (typeof EMAIL_CATEGORIES)[string],
  env: Env,
): Promise<void> {
  // Don't reply to no-reply addresses or automated emails
  if (isNoReplyAddress(metadata.from) || isAutomatedEmail(parsed)) {
    console.log("[EMAIL] Skipping auto-reply for automated/no-reply sender");
    return;
  }

  const htmlContent = generateAutoReplyHtml(metadata, categoryConfig, env);
  const textContent = generateAutoReplyText(metadata, categoryConfig, env);

  try {
    const resend = new Resend(env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: `${env.COMPANY_NAME} <noreply@advanciapayledger.com>`,
      to: [metadata.from],
      subject: categoryConfig.autoReplySubject,
      html: htmlContent,
      text: textContent,
      replyTo: metadata.to,
      headers: {
        "X-Auto-Response-Suppress": "All",
        "X-Advancia-MessageId": metadata.messageId,
      },
    });

    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }

    console.log(`[EMAIL] Auto-reply sent via Resend, ID: ${data?.id}`);
  } catch (error) {
    console.error("[EMAIL] Auto-reply failed:", error);
    // Don't throw - auto-reply failure shouldn't fail the whole process
  }
}

/**
 * Log email to backend API
 */
async function logToBackend(
  metadata: EmailMetadata,
  textContent: string,
  env: Env,
): Promise<void> {
  try {
    const response = await fetch(`${env.BACKEND_API_URL}/api/emails/inbound`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Worker-Secret": env.RESEND_API_KEY, // Use as shared secret
      },
      body: JSON.stringify({
        ...metadata,
        preview: textContent.substring(0, 500),
        source: "cloudflare-email-worker",
      }),
    });

    if (!response.ok) {
      console.warn("[EMAIL] Backend log failed:", response.status);
    }
  } catch (error) {
    console.warn("[EMAIL] Backend log error:", error);
    // Don't throw - logging failure shouldn't fail the process
  }
}

/**
 * Send Slack notification
 */
async function notifySlack(
  metadata: EmailMetadata,
  channel: string,
  env: Env,
): Promise<void> {
  try {
    await fetch(env.SLACK_WEBHOOK_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        username: "Advancia Email Bot",
        icon_emoji: ":email:",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*New ${metadata.category} email received*\n• From: ${metadata.from}\n• Subject: ${metadata.subject}`,
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `Received at: ${metadata.receivedAt} | ID: ${metadata.messageId}`,
              },
            ],
          },
        ],
      }),
    });
  } catch (error) {
    console.warn("[EMAIL] Slack notification failed:", error);
  }
}

/**
 * Check if address is a no-reply address
 */
function isNoReplyAddress(address: string): boolean {
  const noReplyPatterns = [
    "no-reply",
    "noreply",
    "do-not-reply",
    "donotreply",
    "mailer-daemon",
    "postmaster",
    "bounce",
  ];
  const lower = address.toLowerCase();
  return noReplyPatterns.some((pattern) => lower.includes(pattern));
}

/**
 * Check if email is automated (to prevent loops)
 */
function isAutomatedEmail(parsed: any): boolean {
  const autoHeaders = [
    "auto-submitted",
    "x-auto-response-suppress",
    "x-autoreply",
  ];
  // Check for common automation indicators
  const precedence = parsed.headers?.find(
    (h: any) => h.key.toLowerCase() === "precedence",
  );
  if (
    precedence &&
    ["bulk", "junk", "list"].includes(precedence.value.toLowerCase())
  ) {
    return true;
  }
  return false;
}

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}@advanciapayledger.com`;
}

/**
 * Generate HTML auto-reply content
 */
function generateAutoReplyHtml(
  metadata: EmailMetadata,
  config: (typeof EMAIL_CATEGORIES)[string],
  env: Env,
): string {
  const responseTime =
    metadata.category === "legal" ? "3-5 business days" : "24-48 hours";

  const categoryMessages: Record<string, string> = {
    privacy: `
      <p>We take your privacy seriously. Your request has been logged and assigned to our privacy team.</p>
      <p>Under GDPR/CCPA regulations, you have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Request data correction or deletion</li>
        <li>Export your data in a portable format</li>
        <li>Opt-out of data processing</li>
      </ul>
      <p>We will process your request and respond within <strong>${responseTime}</strong>.</p>
    `,
    legal: `
      <p>Your legal inquiry has been received and forwarded to our compliance team.</p>
      <p>For urgent legal matters, please include:</p>
      <ul>
        <li>Your full legal name and organization</li>
        <li>Case or reference numbers (if applicable)</li>
        <li>Jurisdiction and relevant legal framework</li>
      </ul>
      <p>Our legal team will respond within <strong>${responseTime}</strong>.</p>
    `,
    support: `
      <p>Thank you for contacting Advancia Pay Ledger support.</p>
      <p>Your request has been logged and our support team will assist you within <strong>${responseTime}</strong>.</p>
    `,
    general: `
      <p>Thank you for your message. We have received your inquiry and will respond shortly.</p>
    `,
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.autoReplySubject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Advancia Pay Ledger</h1>
  </div>

  <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
    <h2 style="color: #333; margin-top: 0;">${config.autoReplySubject}</h2>

    <p>Dear Customer,</p>

    ${categoryMessages[config.autoReplyTemplate] || categoryMessages.general}

    <div style="background: #e7f3ff; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0;">
      <strong>Reference Number:</strong> ${metadata.messageId}<br>
      <strong>Received:</strong> ${new Date(metadata.receivedAt).toLocaleString()}
    </div>

    <p>Please keep this reference number for future correspondence.</p>

    <p>Best regards,<br>
    <strong>${env.COMPANY_NAME} Team</strong></p>
  </div>

  <div style="background: #333; color: #999; padding: 20px; border-radius: 0 0 12px 12px; font-size: 12px; text-align: center;">
    <p style="margin: 0 0 10px 0;">This is an automated response. Please do not reply directly to this email.</p>
    <p style="margin: 0;">
      <a href="https://advanciapayledger.com" style="color: #8B5CF6;">Website</a> |
      <a href="https://advanciapayledger.com/privacy-policy" style="color: #8B5CF6;">Privacy Policy</a> |
      <a href="https://advanciapayledger.com/terms" style="color: #8B5CF6;">Terms of Service</a>
    </p>
    <p style="margin: 10px 0 0 0;">&copy; ${new Date().getFullYear()} Advancia Pay Ledger. All rights reserved.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text auto-reply content
 */
function generateAutoReplyText(
  metadata: EmailMetadata,
  config: (typeof EMAIL_CATEGORIES)[string],
  env: Env,
): string {
  const responseTime =
    metadata.category === "legal" ? "3-5 business days" : "24-48 hours";

  return `
${config.autoReplySubject}

Dear Customer,

Thank you for contacting ${env.COMPANY_NAME}.

Your ${metadata.category} request has been received and logged.

Reference Number: ${metadata.messageId}
Received: ${new Date(metadata.receivedAt).toLocaleString()}

Our team will review your request and respond within ${responseTime}.

Please keep this reference number for future correspondence.

Best regards,
${env.COMPANY_NAME} Team

---
This is an automated response. Please do not reply directly to this email.
Website: https://advanciapayledger.com
Privacy Policy: https://advanciapayledger.com/privacy-policy
Terms: https://advanciapayledger.com/terms

© ${new Date().getFullYear()} Advancia Pay Ledger. All rights reserved.
  `.trim();
}
