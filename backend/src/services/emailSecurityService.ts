import validator from "validator";
import { winstonLogger as logger } from "../utils/winstonLogger";

/**
 * List of disposable/temporary email domains to block
 * Updated: November 2025
 */
const DISPOSABLE_EMAIL_DOMAINS = [
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "tempmail.com",
  "throwaway.email",
  "temp-mail.org",
  "yopmail.com",
  "fakeinbox.com",
  "trashmail.com",
  "maildrop.cc",
  "getnada.com",
  "sharklasers.com",
  "guerrillamail.info",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "spam4.me",
  "grr.la",
  "guerrillamailblock.com",
  "pokemail.net",
  "spambox.us",
  "emailondeck.com",
  "discard.email",
  "discardmail.com",
  "burnermail.io",
  "mintemail.com",
  "mytemp.email",
  "tempinbox.com",
  "tmail.ws",
  "mohmal.com",
  "inbox.lv",
  "mailnesia.com",
  "mailforspam.com",
  "anonymbox.com",
  "throwawaymail.com",
  "inboxbear.com",
  "getairmail.com",
  "fake-mail.com",
  "fakemailgenerator.com",
  "momentics.ru",
  "0clickemail.com",
  "0-mail.com",
  "027168.com",
];

/**
 * Suspicious email patterns that may indicate fraud
 */
const SUSPICIOUS_PATTERNS = [
  /^test@/i,
  /^admin@/i,
  /^noreply@/i,
  /^no-reply@/i,
  /^support@(?!advanciapayledger\.com)/i, // Allow our own support@
  /^\d+@/, // Starts with numbers only
  /^(.)\1{5,}@/, // Repeated characters (e.g., aaaaaa@)
  /[^\x00-\x7F]/, // Non-ASCII characters (potential phishing)
];

/**
 * Email validation and security service
 */
export class EmailSecurityService {
  /**
   * Validate email address format
   */
  static isValidFormat(email: string): boolean {
    if (!email || typeof email !== "string") {
      return false;
    }

    // Basic email validation
    return validator.isEmail(email, {
      allow_utf8_local_part: false, // Reject non-ASCII in local part
      require_tld: true, // Require top-level domain
      allow_ip_domain: false, // Reject IP addresses as domains
    });
  }

  /**
   * Check if email domain is disposable/temporary
   */
  static isDisposableEmail(email: string): boolean {
    if (!email || typeof email !== "string") {
      return false;
    }

    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) {
      return false;
    }

    return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
  }

  /**
   * Check if email matches suspicious patterns
   */
  static isSuspiciousEmail(email: string): boolean {
    if (!email || typeof email !== "string") {
      return false;
    }

    return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(email));
  }

  /**
   * Validate email for registration/signup
   */
  static validateForSignup(email: string): {
    valid: boolean;
    error?: string;
    reason?: string;
  } {
    // Check format
    if (!this.isValidFormat(email)) {
      return {
        valid: false,
        error: "Invalid email format",
        reason: "INVALID_FORMAT",
      };
    }

    // Check for disposable emails
    if (this.isDisposableEmail(email)) {
      logger.warn(`Disposable email blocked: ${email}`);
      return {
        valid: false,
        error: "Please use a permanent email address",
        reason: "DISPOSABLE_EMAIL",
      };
    }

    // Check for suspicious patterns
    if (this.isSuspiciousEmail(email)) {
      logger.warn(`Suspicious email pattern detected: ${email}`);
      return {
        valid: false,
        error: "Invalid email address",
        reason: "SUSPICIOUS_PATTERN",
      };
    }

    return { valid: true };
  }

  /**
   * Sanitize email address (lowercase, trim)
   */
  static sanitize(email: string): string {
    if (!email || typeof email !== "string") {
      return "";
    }

    return (
      validator.normalizeEmail(email, {
        all_lowercase: true,
        gmail_remove_dots: false, // Keep dots in Gmail addresses
        gmail_remove_subaddress: false, // Keep +tags in Gmail
        outlookdotcom_remove_subaddress: false,
        yahoo_remove_subaddress: false,
        icloud_remove_subaddress: false,
      }) || email.toLowerCase().trim()
    );
  }

  /**
   * Sanitize HTML content in emails (prevent XSS)
   */
  static sanitizeHTML(html: string): string {
    if (!html || typeof html !== "string") {
      return "";
    }

    // Remove potentially dangerous tags and attributes
    let sanitized = html;

    // Remove script tags
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "",
    );

    // Remove event handlers (onclick, onerror, etc.)
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "");

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, "");

    // Remove data: protocol (can be used for XSS)
    sanitized = sanitized.replace(/data:text\/html/gi, "");

    // Remove iframe tags
    sanitized = sanitized.replace(
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      "",
    );

    // Remove embed and object tags
    sanitized = sanitized.replace(
      /<(embed|object)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi,
      "",
    );

    return sanitized;
  }

  /**
   * Extract email from various formats
   */
  static extractEmail(input: string): string | null {
    if (!input || typeof input !== "string") {
      return null;
    }

    // Handle "Name <email@example.com>" format
    const match = input.match(
      /<?([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)>?/,
    );
    return match && typeof match[1] === "string" ? match[1] : null;
  }

  /**
   * Validate multiple email addresses
   */
  static validateMultiple(emails: string[]): {
    valid: string[];
    invalid: string[];
    errors: Array<{ email: string; reason: string }>;
  } {
    const valid: string[] = [];
    const invalid: string[] = [];
    const errors: Array<{ email: string; reason: string }> = [];

    for (const email of emails) {
      const validation = this.validateForSignup(email);
      if (validation.valid) {
        valid.push(this.sanitize(email));
      } else {
        invalid.push(email);
        errors.push({
          email,
          reason: validation.reason || "UNKNOWN",
        });
      }
    }

    return { valid, invalid, errors };
  }

  /**
   * Check if email domain has valid MX records (DNS check)
   * Note: This is a placeholder - real implementation would use dns.resolveMx
   */
  static async hasValidMXRecords(email: string): Promise<boolean> {
    try {
      const domain = email.split("@")[1];
      if (!domain) {
        return false;
      }

      // In production, use dns.resolveMx to check MX records
      // For now, just check if it's a known domain
      const knownDomains = [
        "gmail.com",
        "yahoo.com",
        "hotmail.com",
        "outlook.com",
        "icloud.com",
        "protonmail.com",
        "aol.com",
      ];

      return knownDomains.includes(domain.toLowerCase());
    } catch (error) {
      logger.error("MX record check failed:", error);
      return false; // Assume invalid if check fails
    }
  }

  /**
   * Rate limit check for email sending
   * (Placeholder - actual implementation in emailRateLimit middleware)
   */
  static checkRateLimit(
    email: string,
    userId?: string,
  ): {
    allowed: boolean;
    retryAfter?: number;
  } {
    // This would check Redis or database for rate limits
    // For now, just allow all
    return { allowed: true };
  }

  /**
   * Generate safe email template with XSS protection
   */
  static generateSafeEmailHTML(
    templateHTML: string,
    data: Record<string, any>,
  ): string {
    let html = templateHTML;

    // Replace placeholders with sanitized values
    for (const [key, value] of Object.entries(data)) {
      const sanitizedValue =
        typeof value === "string" ? validator.escape(value) : String(value);

      html = html.replace(
        new RegExp(`{{\\s*${key}\\s*}}`, "g"),
        sanitizedValue,
      );
    }

    return this.sanitizeHTML(html);
  }

  /**
   * Validate email content for spam triggers
   */
  static checkSpamTriggers(content: string): {
    score: number;
    triggers: string[];
  } {
    const triggers: string[] = [];
    let score = 0;

    const spamWords = [
      "viagra",
      "casino",
      "lottery",
      "winner",
      "click here now",
      "act now",
      "limited time",
      "free money",
      "make money fast",
      "work from home",
      "100% free",
      "dear friend",
      "congratulations",
      "you have been selected",
    ];

    const contentLower = content.toLowerCase();

    for (const word of spamWords) {
      if (contentLower.includes(word)) {
        triggers.push(word);
        score += 1;
      }
    }

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.3) {
      triggers.push("excessive_caps");
      score += 2;
    }

    // Check for excessive exclamation marks
    const exclamationCount = (content.match(/!/g) || []).length;
    if (exclamationCount > 5) {
      triggers.push("excessive_exclamation");
      score += 1;
    }

    // Check for suspicious URLs
    const urlCount = (content.match(/https?:\/\//g) || []).length;
    if (urlCount > 10) {
      triggers.push("excessive_urls");
      score += 2;
    }

    return { score, triggers };
  }
}

/**
 * Middleware function to validate email in request body
 */
export function validateEmailMiddleware(fieldName: string = "email") {
  return (req: any, res: any, next: any) => {
    const email = req.body[fieldName];

    if (!email) {
      return res.status(400).json({
        success: false,
        error: `${fieldName} is required`,
      });
    }

    const validation = EmailSecurityService.validateForSignup(email);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        code: validation.reason,
      });
    }

    // Sanitize and update request
    req.body[fieldName] = EmailSecurityService.sanitize(email);

    next();
  };
}

export default EmailSecurityService;
