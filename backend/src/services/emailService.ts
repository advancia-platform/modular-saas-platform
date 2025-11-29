// backend/src/services/emailService.ts
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { logger } from "../logger";
import {
  resetPasswordTemplate,
  verificationTemplate,
  welcomeTemplate,
} from "./emailTemplates";
import { emailTheme } from "./emailTheme";
import { notificationTemplate } from "./notificationTemplate";

// Initialize Resend (if API key is provided)
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Fallback to SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    logger.error("SMTP configuration error", {
      error: error.message,
      stack: error.stack,
    });
  } else {
    logger.info("SMTP server is ready to send emails");
  }
});

// Check if Resend is configured
if (resend) {
  logger.info("Resend email service is configured and ready");
} else {
  logger.info("Using SMTP fallback for email delivery");
}

// Unified email sending function with Resend primary, SMTP fallback
async function sendEmailUnified(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  attachments?: any[];
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const from =
    options.from ||
    `"${emailTheme.brandName} Support" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`;

  // Try Resend first if configured
  if (resend) {
    try {
      const result = await resend.emails.send({
        from,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      });

      logger.info("Email sent via Resend", {
        to: options.to,
        subject: options.subject,
        messageId: result.data?.id,
      });
      return { success: true, messageId: result.data?.id };
    } catch (resendError: any) {
      logger.warn("Resend failed, falling back to SMTP", {
        to: options.to,
        error: resendError.message,
      });

      // Fall back to SMTP
      try {
        const info = await transporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          attachments: options.attachments,
        });

        logger.info("Email sent via SMTP fallback", {
          to: options.to,
          subject: options.subject,
          messageId: info.messageId,
        });
        return { success: true, messageId: info.messageId };
      } catch (smtpError: any) {
        logger.error("Both Resend and SMTP failed", {
          to: options.to,
          resendError: resendError.message,
          smtpError: smtpError.message,
        });
        return {
          success: false,
          error: `Resend: ${resendError.message}, SMTP: ${smtpError.message}`,
        };
      }
    }
  } else {
    // Use SMTP only
    try {
      const info = await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      });

      logger.info("Email sent via SMTP", {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
      });
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      logger.error("SMTP email failed", {
        to: options.to,
        error: error.message,
      });
      return { success: false, error: error.message };
    }
  }
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<void> {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    const template = resetPasswordTemplate(resetUrl);

    const result = await sendEmailUnified({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send email");
    }

    logger.info("Password reset email sent", {
      to,
      token: token.substring(0, 8) + "...",
    });
  } catch (error: any) {
    logger.error("Failed to send password reset email", {
      to,
      error: error.message,
    });
    throw new Error("Failed to send password reset email");
  }
}

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  try {
    const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify?token=${token}`;
    const template = verificationTemplate(verifyUrl);

    const result = await sendEmailUnified({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send email");
    }

    logger.info("Verification email sent", { to });
  } catch (error: any) {
    logger.error("Failed to send verification email", {
      to,
      error: error.message,
    });
    throw new Error("Failed to send verification email");
  }
}

export async function sendWelcomeEmail(to: string): Promise<void> {
  try {
    const dashboardUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard`;
    const template = welcomeTemplate(dashboardUrl);

    const result = await sendEmailUnified({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send email");
    }

    logger.info("Welcome email sent", { to });
  } catch (error: any) {
    logger.error("Failed to send welcome email", { to, error: error.message });
    throw new Error("Failed to send welcome email");
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  message: string,
  template?: string,
  attachments?: any[],
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const htmlMessage =
      template === "html"
        ? message
        : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #3B82F6; margin-top: 0;">${subject}</h2>
          <p style="color: #374151; line-height: 1.6; font-size: 16px;">${message}</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6B7280;">
            This is an automated message from Advancia Pay Ledger.
          </p>
        </div>
      </div>
    `;

    return await sendEmailUnified({
      to,
      subject,
      html: htmlMessage,
      text: message.replace(/<[^>]*>/g, ""),
      attachments,
    });
  } catch (error: any) {
    logger.error("Failed to send email", { to, subject, error: error.message });
    return { success: false, error: error.message };
  }
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  message: string,
  actionUrl?: string,
): Promise<void> {
  try {
    const template = notificationTemplate(subject, message, actionUrl);

    const result = await sendEmailUnified({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to send email");
    }

    logger.info("Notification email sent", { to, subject });
  } catch (error: any) {
    logger.error("Failed to send notification email", {
      to,
      subject,
      error: error.message,
    });
    throw new Error("Failed to send notification email");
  }
}

// Specific notification functions for different use cases
export async function notifyWithdrawal(
  userEmail: string,
  amount: number,
  txId: string,
): Promise<void> {
  await sendNotificationEmail(
    userEmail,
    "Withdrawal Processed",
    `Your withdrawal of $${amount.toFixed(2)} has been processed successfully.`,
    `${process.env.FRONTEND_URL}/transactions/${txId}`,
  );
}

export async function notifyComplianceIssue(
  userEmail: string,
  issue: string,
): Promise<void> {
  await sendNotificationEmail(
    userEmail,
    "Compliance Alert",
    `A compliance issue was detected: ${issue}. Please review immediately.`,
    `${process.env.FRONTEND_URL}/compliance`,
  );
}

export async function notifyAuditEvent(
  adminEmail: string,
  event: string,
): Promise<void> {
  await sendNotificationEmail(
    adminEmail,
    "Audit Event Logged",
    `An audit event occurred: ${event}.`,
    `${process.env.FRONTEND_URL}/audit`,
  );
}

export async function notifySecurityAlert(
  userEmail: string,
  alertType: string,
  details: string,
): Promise<void> {
  await sendNotificationEmail(
    userEmail,
    "Security Alert",
    `Security alert: ${alertType}. ${details}`,
    `${process.env.FRONTEND_URL}/security`,
  );
}

// Legacy EmailService class for backward compatibility
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class EmailService {
  private from: string;

  constructor() {
    this.from = process.env.EMAIL_FROM || "noreply@advancia.com";
  }

  async sendEmail(
    options: EmailOptions,
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn(
          "EMAIL_USER or EMAIL_PASSWORD not configured. Email not sent.",
        );
        return { success: false, error: "Email service not configured" };
      }

      if (!transporter) {
        throw new Error("Email transporter not initialized");
      }

      const result = await transporter.sendMail({
        from: options.from || this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      logger.info("Legacy email sent", {
        to: options.to,
        messageId: result.messageId,
      });
      return { success: true, id: result.messageId };
    } catch (error: any) {
      logger.error("Failed to send legacy email", {
        error: error.message,
        to: options.to,
      });
      return { success: false, error: error.message };
    }
  }

  // Email Templates

  async sendWelcomeEmail(to: string, username: string): Promise<any> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Advancia Pay Ledger! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hi ${username},</h2>
            <p>Thank you for joining Advancia Pay Ledger - your self-hosted financial platform!</p>
            <p>Your account has been successfully created. Here's what you can do:</p>
            <ul>
              <li>💰 Manage your USD balance</li>
              <li>🪙 Earn and use tokens</li>
              <li>🏆 Unlock rewards and achievements</li>
              <li>📊 Track all your transactions</li>
              <li>💳 Generate and manage invoices</li>
            </ul>
            <a href="http://localhost:3000/dashboard" class="button">Go to Dashboard</a>
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>© 2025 Advancia Pay Ledger. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: "Welcome to Advancia Pay Ledger! 🎉",
      html,
    });
  }

  async sendTransactionConfirmation(
    to: string,
    transactionData: any,
  ): Promise<any> {
    const { type, amount, description, transactionId } = transactionData;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${
            type === "credit" ? "#10b981" : "#ef4444"
          }; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .transaction-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${
            type === "credit" ? "#10b981" : "#ef4444"
          }; }
          .amount { font-size: 32px; font-weight: bold; color: ${
            type === "credit" ? "#10b981" : "#ef4444"
          }; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Transaction ${type === "credit" ? "Received" : "Sent"} ✅</h1>
          </div>
          <div class="content">
            <div class="transaction-box">
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p><strong>Type:</strong> ${type.toUpperCase()}</p>
              <p><strong>Amount:</strong> <span class="amount">${
                type === "credit" ? "+" : "-"
              }$${amount}</span></p>
              <p><strong>Description:</strong> ${description || "N/A"}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p>You can view all your transactions in your dashboard.</p>
          </div>
          <div class="footer">
            <p>© 2025 Advancia Pay Ledger. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Transaction Confirmation - ${
        type === "credit" ? "Received" : "Sent"
      } $${amount}`,
      html,
    });
  }

  async sendInvoiceEmail(
    to: string,
    invoiceData: any,
    pdfUrl?: string,
  ): Promise<any> {
    const { invoiceNumber, amount, dueDate } = invoiceData;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .invoice-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Invoice - ${invoiceNumber}</h1>
          </div>
          <div class="content">
            <div class="invoice-box">
              <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
              <p><strong>Amount Due:</strong> $${amount}</p>
              <p><strong>Due Date:</strong> ${new Date(
                dueDate,
              ).toLocaleDateString()}</p>
            </div>
            <p>Please find your invoice attached ${
              pdfUrl ? "or download it using the link below" : ""
            }.</p>
            ${
              pdfUrl
                ? `<a href="${pdfUrl}" class="button">Download Invoice PDF</a>`
                : ""
            }
            <p>If you have any questions about this invoice, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>© 2025 Advancia Pay Ledger. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Invoice ${invoiceNumber} - $${amount} Due`,
      html,
    });
  }

  async sendRewardClaimedEmail(to: string, rewardData: any): Promise<any> {
    const { amount, title, description } = rewardData;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .reward-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .amount { font-size: 48px; font-weight: bold; color: #f59e0b; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 Reward Claimed!</h1>
          </div>
          <div class="content">
            <div class="reward-box">
              <h2>${title}</h2>
              <p>${description}</p>
              <div class="amount">+${amount} tokens</div>
            </div>
            <p>Congratulations! Your reward has been added to your token wallet.</p>
            <p>Keep earning more rewards by staying active on the platform!</p>
          </div>
          <div class="footer">
            <p>© 2025 Advancia Pay Ledger. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `🎁 You claimed ${amount} tokens!`,
      html,
    });
  }

  async sendTierUpgradeEmail(to: string, tierData: any): Promise<any> {
    const { newTier, points } = tierData;

    const tierEmojis: any = {
      bronze: "🥉",
      silver: "🥈",
      gold: "🥇",
      platinum: "💎",
      diamond: "👑",
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .tier-badge { font-size: 80px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Tier Upgrade!</h1>
          </div>
          <div class="content">
            <div class="tier-badge">${tierEmojis[newTier] || "⭐"}</div>
            <h2 style="text-align: center;">Congratulations!</h2>
            <p style="text-align: center; font-size: 18px;">You've been upgraded to <strong>${newTier.toUpperCase()}</strong> tier!</p>
            <p style="text-align: center;">You now have <strong>${points} points</strong></p>
            <p>Keep up the great work! Higher tiers unlock more benefits and exclusive rewards.</p>
          </div>
          <div class="footer">
            <p>© 2025 Advancia Pay Ledger. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `🎉 You've been upgraded to ${newTier.toUpperCase()} tier!`,
      html,
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<any> {
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>We received a request to reset your password for your Advancia Pay Ledger account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              This link will expire in 1 hour. If you didn't request this reset, please ignore this email and your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>© 2025 Advancia Pay Ledger. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: "Password Reset Request - Advancia Pay Ledger",
      html,
    });
  }
}

export default new EmailService();
