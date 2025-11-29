/**
 * Backend Form Validation & Security Middleware
 *
 * Server-side validation, CSRF verification, rate limiting
 */

import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import "express-session";
import { body, ValidationChain, validationResult } from "express-validator";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      sessionID?: string;
      rateLimit?: { resetTime?: Date };
      // file is already declared by multer types
    }
  }
}

// ============================================
// 1. VALIDATION RULES
// ============================================

/**
 * Common validation rules for forms
 */
export const ValidationRules = {
  // Email validation
  email: () =>
    body("email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),

  // Password validation
  password: () =>
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[a-z]/)
      .withMessage("Password must contain lowercase letter")
      .matches(/[A-Z]/)
      .withMessage("Password must contain uppercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain number"),

  // Name validation
  name: (fieldName: string = "name") =>
    body(fieldName)
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage(`${fieldName} must be 2-100 characters`)
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage(`${fieldName} contains invalid characters`),

  // Phone validation
  phone: () =>
    body("phone")
      .optional()
      .trim()
      .isMobilePhone("any")
      .withMessage("Valid phone number is required"),

  // Amount validation (for financial transactions)
  amount: () =>
    body("amount")
      .isFloat({ min: 0.01 })
      .withMessage("Amount must be greater than 0")
      .toFloat(),

  // URL validation
  url: (fieldName: string = "url") =>
    body(fieldName)
      .optional()
      .trim()
      .isURL({ protocols: ["http", "https"] })
      .withMessage(`${fieldName} must be a valid URL`),

  // Date validation
  date: (fieldName: string = "date") =>
    body(fieldName)
      .optional()
      .isISO8601()
      .toDate()
      .withMessage(`${fieldName} must be a valid date`),

  // Boolean validation
  boolean: (fieldName: string) =>
    body(fieldName)
      .optional()
      .isBoolean()
      .toBoolean()
      .withMessage(`${fieldName} must be true or false`),

  // Alphanumeric validation
  alphanumeric: (fieldName: string) =>
    body(fieldName)
      .trim()
      .isAlphanumeric()
      .withMessage(`${fieldName} must be alphanumeric`),

  // Integer validation
  integer: (fieldName: string, min?: number, max?: number) => {
    let chain = body(fieldName).isInt();
    if (min !== undefined) chain = chain.isInt({ min });
    if (max !== undefined) chain = chain.isInt({ max });
    return chain.toInt().withMessage(`${fieldName} must be an integer`);
  },
};

// ============================================
// 2. VALIDATION MIDDLEWARE
// ============================================

/**
 * Middleware to check validation results
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.type === "field" ? (err as any).path : "unknown",
        message: err.msg,
      })),
    });
  }

  next();
};

/**
 * Create validation chain for specific form
 */
export const createValidation = (rules: ValidationChain[]) => {
  return [...rules, validate];
};

// ============================================
// 3. CSRF PROTECTION MIDDLEWARE
// ============================================

export class CSRFProtection {
  private static tokens = new Map<string, { token: string; expiry: number }>();
  private static readonly TOKEN_EXPIRY = 3600000; // 1 hour

  /**
   * Generate CSRF token
   */
  static generateToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + this.TOKEN_EXPIRY;

    this.tokens.set(sessionId, { token, expiry });

    // Clean old tokens
    this.cleanExpiredTokens();

    return token;
  }

  /**
   * Verify CSRF token
   */
  static verifyToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId);

    if (!stored) {
      return false;
    }

    // Check expiry
    if (Date.now() > stored.expiry) {
      this.tokens.delete(sessionId);
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(stored.token),
      Buffer.from(token),
    );
  }

  /**
   * Clean expired tokens
   */
  private static cleanExpiredTokens(): void {
    const now = Date.now();
    for (const [sessionId, data] of this.tokens.entries()) {
      if (now > data.expiry) {
        this.tokens.delete(sessionId);
      }
    }
  }

  /**
   * Middleware to verify CSRF token
   */
  static middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip for GET requests
      if (
        req.method === "GET" ||
        req.method === "HEAD" ||
        req.method === "OPTIONS"
      ) {
        return next();
      }

      const token = (req.headers["x-csrf-token"] as string) || req.body._csrf;
      const sessionId = req.sessionID || req.ip || "anonymous";

      if (!token) {
        return res.status(403).json({
          success: false,
          error: "CSRF token missing",
        });
      }

      if (!this.verifyToken(sessionId, token)) {
        return res.status(403).json({
          success: false,
          error: "Invalid CSRF token",
        });
      }

      next();
    };
  }

  /**
   * Generate token endpoint
   */
  static getTokenHandler() {
    return (req: Request, res: Response) => {
      const sessionId = req.sessionID || req.ip;
      const token = this.generateToken(sessionId || "anonymous");

      res.json({
        success: true,
        csrfToken: token,
      });
    };
  }
}

// ============================================
// 4. FORM RATE LIMITING
// ============================================

/**
 * Rate limiter for form submissions
 */
export const formRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: {
    success: false,
    error: "Too many form submissions. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const resetTime = req.rateLimit?.resetTime?.getTime() || Date.now();
    res.status(429).json({
      success: false,
      error: "Too many form submissions. Please try again later.",
      retryAfter: Math.ceil(resetTime / 1000),
    });
  },
});

/**
 * Strict rate limiter for sensitive operations
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per 15 minutes
  message: {
    success: false,
    error: "Too many attempts. Please try again later.",
  },
});

// ============================================
// 5. INPUT SANITIZATION MIDDLEWARE
// ============================================

/**
 * Sanitize request body
 */
export const sanitizeBody = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Recursively sanitize object
 */
function sanitizeObject(obj: any): any {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      // Remove null bytes
      sanitized[key] = value.replace(/\0/g, "");
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// ============================================
// 6. FORM VALIDATION SCHEMAS
// ============================================

/**
 * Login form validation
 */
export const loginValidation = createValidation([
  ValidationRules.email(),
  ValidationRules.password(),
]);

/**
 * Registration form validation
 */
export const registrationValidation = createValidation([
  ValidationRules.name("firstName"),
  ValidationRules.name("lastName"),
  ValidationRules.email(),
  ValidationRules.password(),
  body("confirmPassword")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),
]);

/**
 * Profile update validation
 */
export const profileUpdateValidation = createValidation([
  ValidationRules.name("name").optional(),
  ValidationRules.email().optional(),
  ValidationRules.phone().optional(),
]);

/**
 * Transaction validation
 */
export const transactionValidation = createValidation([
  ValidationRules.amount(),
  body("description")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Description is required (max 500 characters)"),
  body("type")
    .isIn(["credit", "debit"])
    .withMessage("Type must be credit or debit"),
]);

/**
 * Contact form validation
 */
export const contactFormValidation = createValidation([
  ValidationRules.name(),
  ValidationRules.email(),
  body("subject")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Subject must be 5-200 characters"),
  body("message")
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage("Message must be 10-5000 characters"),
]);

/**
 * Password reset validation
 */
export const passwordResetValidation = createValidation([
  ValidationRules.email(),
]);

/**
 * Change password validation
 */
export const changePasswordValidation = createValidation([
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  ValidationRules.password(),
  body("confirmPassword")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),
]);

// ============================================
// 7. FILE UPLOAD VALIDATION
// ============================================

/**
 * Validate file upload
 */
export const validateFileUpload = (
  allowedTypes: string[],
  maxSize: number = 5 * 1024 * 1024, // 5MB
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    // Check file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
      });
    }

    // Check file size
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`,
      });
    }

    next();
  };
};

// ============================================
// 8. SECURITY HEADERS MIDDLEWARE
// ============================================

/**
 * Add security headers to form responses
 */
export const formSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Prevent caching of form responses
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  next();
};

// ============================================
// 9. HONEYPOT FIELD VALIDATION
// ============================================

/**
 * Validate honeypot field (bot detection)
 */
export const validateHoneypot = (fieldName: string = "website") => {
  return (req: Request, res: Response, next: NextFunction) => {
    // If honeypot field is filled, it's likely a bot
    if (req.body[fieldName] && req.body[fieldName].trim() !== "") {
      return res.status(400).json({
        success: false,
        error: "Invalid form submission",
      });
    }

    // Remove honeypot field from body
    delete req.body[fieldName];
    next();
  };
};

// ============================================
// 10. EXPORT ALL
// ============================================

export default {
  ValidationRules,
  validate,
  createValidation,
  CSRFProtection,
  formRateLimiter,
  strictRateLimiter,
  sanitizeBody,
  loginValidation,
  registrationValidation,
  profileUpdateValidation,
  transactionValidation,
  contactFormValidation,
  passwordResetValidation,
  changePasswordValidation,
  validateFileUpload,
  formSecurityHeaders,
  validateHoneypot,
};
