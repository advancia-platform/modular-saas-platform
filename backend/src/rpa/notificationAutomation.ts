// RPA Module - Email/SMS Notifications
// RPA can automate outgoing notifications for OTPs, recoveries, and med-bed alerts

import prisma from "../prismaClient";
import { rpaConfig } from "./config";
import nodemailer from "nodemailer";
// SMS/Twilio removed to save costs

interface NotificationPayload {
  userId: string;
  type: "email" | "sms" | "both";
  template: string;
  data: Record<string, any>;
  priority?: "low" | "normal" | "high";
}

interface NotificationResult {
  success: boolean;
  emailSent?: boolean;
  smsSent?: boolean;
  errors: string[];
}

export class NotificationAutomation {
  private emailTransporter: nodemailer.Transporter | null = null;
  private twilioClient: any = null; // SMS removed
  private notificationQueue: NotificationPayload[] = [];
  private rateLimitCounter = {
    perMinute: 0,
    perHour: 0,
  };

  constructor() {
    this.initializeServices();
    this.startRateLimitReset();
  }

  /**
   * Initialize email and SMS services
   */
  private async initializeServices(): Promise<void> {
    // Initialize Email
    if (rpaConfig.notifications.email.enabled) {
      try {
        this.emailTransporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        });
        console.log("✅ Email service initialized");
      } catch (error) {
        console.error("❌ Failed to initialize email service:", error);
      }
    }

    // SMS/Twilio service disabled to save costs
  }

  /**
   * Reset rate limit counters periodically
   */
  private startRateLimitReset(): void {
    // Reset per-minute counter every minute
    setInterval(() => {
      this.rateLimitCounter.perMinute = 0;
    }, 60000);

    // Reset per-hour counter every hour
    setInterval(() => {
      this.rateLimitCounter.perHour = 0;
    }, 3600000);
  }

  /**
   * Check if rate limit allows sending
   */
  private canSend(): boolean {
    const config = rpaConfig.notifications.throttle;
    return (
      this.rateLimitCounter.perMinute < config.maxPerMinute &&
      this.rateLimitCounter.perHour < config.maxPerHour
    );
  }

  /**
   * Get email template
   */
  private getEmailTemplate(template: string, data: Record<string, any>): { subject: string; html: string } {
    const templates: Record<string, any> = {
      otp: {
        subject: "Your One-Time Password",
        html: `
          <h2>Your OTP Code</h2>
          <p>Your one-time password is: <strong>${data.otp}</strong></p>
          <p>This code will expire in ${data.expiryMinutes || 10} minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      },
      recovery: {
        subject: "Crypto Recovery Request Processed",
        html: `
          <h2>Crypto Recovery Update</h2>
          <p>Your crypto recovery request has been ${data.status}.</p>
          <p><strong>Amount:</strong> ${data.amount} ${data.cryptoType}</p>
          <p><strong>Status:</strong> ${data.status}</p>
          ${data.message ? `<p>${data.message}</p>` : ""}
        `,
      },
      medbed_alert: {
        subject: "Med-Bed Session Alert",
        html: `
          <h2>Med-Bed Session Alert</h2>
          <p>${data.message}</p>
          <p><strong>Session Type:</strong> ${data.sessionType}</p>
          <p><strong>Time:</strong> ${data.time}</p>
        `,
      },
      transaction: {
        subject: "Transaction Notification",
        html: `
          <h2>Transaction ${data.status}</h2>
          <p>Your transaction has been ${data.status}.</p>
          <p><strong>Amount:</strong> $${data.amount}</p>
          <p><strong>Type:</strong> ${data.type}</p>
          <p><strong>Date:</strong> ${data.date}</p>
        `,
      },
      welcome: {
        subject: "Welcome to Advancia Pay",
        html: `
          <h2>Welcome ${data.name}!</h2>
          <p>Thank you for joining Advancia Pay.</p>
          <p>Your account has been successfully created.</p>
          <p>Start exploring our platform now!</p>
        `,
      },
    };

    return templates[template] || { subject: "Notification", html: data.message || "" };
  }

  /**
   * Get SMS template
   */
  private getSMSTemplate(template: string, data: Record<string, any>): string {
    const templates: Record<string, string> = {
      otp: `Your OTP code is: ${data.otp}. Valid for ${data.expiryMinutes || 10} minutes.`,
      recovery: `Crypto Recovery: ${data.status}. Amount: ${data.amount} ${data.cryptoType}.`,
      medbed_alert: `Med-Bed Alert: ${data.message}. Session: ${data.sessionType} at ${data.time}.`,
      transaction: `Transaction ${data.status}: $${data.amount} (${data.type})`,
      welcome: `Welcome to Advancia Pay, ${data.name}! Your account is ready.`,
    };

    return templates[template] || data.message || "Notification";
  }

  /**
   * Send email notification
   */
  private async sendEmail(userEmail: string, template: string, data: Record<string, any>): Promise<boolean> {
    if (!this.emailTransporter) {
      console.error("❌ Email transporter not initialized");
      return false;
    }

    try {
      const { subject, html } = this.getEmailTemplate(template, data);

      await this.emailTransporter.sendMail({
        from: rpaConfig.notifications.email.from,
        to: userEmail,
        subject,
        html,
      });

      console.log(`✅ Email sent to ${userEmail} (template: ${template})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send email to ${userEmail}:`, error);
      return false;
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(userPhone: string, template: string, data: Record<string, any>): Promise<boolean> {
    if (!this.twilioClient) {
      console.error("❌ Twilio client not initialized");
      return false;
    }

    try {
      const message = this.getSMSTemplate(template, data);

      await this.twilioClient.messages.create({
        body: message,
        from: rpaConfig.notifications.sms.twilioPhoneNumber,
        to: userPhone,
      });

      console.log(`✅ SMS sent to ${userPhone} (template: ${template})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send SMS to ${userPhone}:`, error);
      return false;
    }
  }

  /**
   * Send notification to user
   */
  async sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: false,
      errors: [],
    };

    try {
      // Check rate limit
      if (!this.canSend()) {
        result.errors.push("Rate limit exceeded");
        console.warn("⚠️  Notification rate limit exceeded, queuing...");
        this.notificationQueue.push(payload);
        return result;
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { email: true, firstName: true },
      });

      if (!user) {
        result.errors.push("User not found");
        return result;
      }

      // Send email
      if (payload.type === "email" || payload.type === "both") {
        result.emailSent = await this.sendEmail(user.email, payload.template, payload.data);
        if (result.emailSent) {
          this.rateLimitCounter.perMinute++;
          this.rateLimitCounter.perHour++;
        }
      }

      // Send SMS
      if (payload.type === "sms" || payload.type === "both") {
        // In production, fetch user's phone number from database
        const userPhone = payload.data.phone || process.env.ADMIN_PHONE;
        if (userPhone) {
          result.smsSent = await this.sendSMS(userPhone, payload.template, payload.data);
          if (result.smsSent) {
            this.rateLimitCounter.perMinute++;
            this.rateLimitCounter.perHour++;
          }
        } else {
          result.errors.push("User phone number not found");
        }
      }

      result.success = !!(result.emailSent || result.smsSent);

      // Log notification
      await prisma.auditLog.create({
        data: {
          userId: payload.userId,
          action: "NOTIFICATION_SENT",
          resourceType: "Notification",
          resourceId: "rpa-notification",
          metadata: JSON.stringify({
            template: payload.template,
            type: payload.type,
            emailSent: result.emailSent,
            smsSent: result.smsSent,
          }),
          ipAddress: "SYSTEM-RPA",
          userAgent: "RPA-NotificationAutomation",
          timestamp: new Date(),
        },
      });
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "Unknown error");
      console.error("❌ Notification error:", error);
    }

    return result;
  }

  /**
   * Process queued notifications
   */
  async processQueue(): Promise<void> {
    if (this.notificationQueue.length === 0) {
      return;
    }

    console.log(`📬 Processing ${this.notificationQueue.length} queued notifications...`);

    while (this.notificationQueue.length > 0 && this.canSend()) {
      const payload = this.notificationQueue.shift();
      if (payload) {
        await this.sendNotification(payload);
      }
    }

    console.log(`✅ Queue processed. ${this.notificationQueue.length} remaining.`);
  }

  /**
   * Send OTP notification
   */
  async sendOTP(userId: string, otp: string, type: "email" | "sms" = "email"): Promise<NotificationResult> {
    return this.sendNotification({
      userId,
      type,
      template: "otp",
      data: { otp, expiryMinutes: 10 },
      priority: "high",
    });
  }

  /**
   * Send recovery notification
   */
  async sendRecoveryUpdate(userId: string, recoveryData: Record<string, any>): Promise<NotificationResult> {
    return this.sendNotification({
      userId,
      type: "email",
      template: "recovery",
      data: recoveryData,
      priority: "normal",
    });
  }

  /**
   * Send med-bed alert
   */
  async sendMedbedAlert(userId: string, alertData: Record<string, any>): Promise<NotificationResult> {
    return this.sendNotification({
      userId,
      type: "both",
      template: "medbed_alert",
      data: alertData,
      priority: "high",
    });
  }

  /**
   * Send transaction notification
   */
  async sendTransactionNotification(userId: string, transactionData: Record<string, any>): Promise<NotificationResult> {
    return this.sendNotification({
      userId,
      type: "email",
      template: "transaction",
      data: transactionData,
      priority: "normal",
    });
  }
}

export default new NotificationAutomation();



