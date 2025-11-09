import nodemailer from "nodemailer";
import validator from "validator";

// Validate SMTP config exists
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn("[Email Service] Email credentials not configured.");
}

const transporter = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
  : null;

/**
 * Sanitize metadata to avoid leaking sensitive data
 */
export function sanitizeMetadata(metadata: any): any {
  if (!metadata) return {};
  
  const sanitized = { ...metadata };
  const sensitiveKeys = ["password", "token", "secret", "apikey", "privatekey", "ssn", "creditcard", "cvv", "pin"];
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((k: string) => key.toLowerCase().includes(k))) {
      sanitized[key] = "[REDACTED]";
    }
  }
  
  return sanitized;
}

/**
 * Validate email addresses
 */
export function validateEmails(emailString: string): string[] {
  const emails = emailString.split(",").map((e: string) => e.trim());
  return emails.filter((email: string) => validator.isEmail(email));
}

/**
 * Send email with validation and sanitization
 */
export async function sendSecureEmail(options: {
  to: string;
  subject: string;
  html: string;
  metadata?: any;
}): Promise<boolean> {
  try {
    const validEmails = validateEmails(options.to);
    
    if (validEmails.length === 0) {
      console.error("[Email Service] No valid email recipients");
      return false;
    }

    if (!transporter) {
      console.warn("[Email Service] Email not configured. Would have sent to:", validEmails.join(", "));
      return false;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: validEmails.join(","),
      subject: options.subject,
      html: options.html,
    });

    console.log(`[Email Service] Email sent to ${validEmails.join(", ")}`);
    return true;
  } catch (error) {
    console.error("[Email Service] Error sending email:", error);
    return false;
  }
}
