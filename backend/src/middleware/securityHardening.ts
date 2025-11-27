import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { logger } from '../logger';
import prisma from '../prismaClient';

/**
 * Security Hardening Middleware Collection
 * Implements comprehensive security measures based on pentest-resistant patterns
 */

// ============================================================================
// 1. ACCOUNT LOCKOUT TRACKING (Brute-Force Protection)
// ============================================================================

interface LoginAttempt {
  email: string;
  attempts: number;
  lockedUntil?: Date;
  lastAttempt: Date;
}

const loginAttempts = new Map<string, LoginAttempt>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function trackLoginAttempt(
  email: string,
  success: boolean
): Promise<{ allowed: boolean; remainingMinutes?: number }> {
  const now = new Date();
  const attempt = loginAttempts.get(email) || {
    email,
    attempts: 0,
    lastAttempt: now,
  };

  // Check if account is locked
  if (attempt.lockedUntil && attempt.lockedUntil > now) {
    const remainingMinutes = Math.ceil(
      (attempt.lockedUntil.getTime() - now.getTime()) / 60000
    );
    logger.warn(
      `Login attempt for locked account: ${email}. Unlocks in ${remainingMinutes}m`
    );
    return { allowed: false, remainingMinutes };
  }

  // Reset lockout if expired
  if (attempt.lockedUntil && attempt.lockedUntil <= now) {
    attempt.attempts = 0;
    attempt.lockedUntil = undefined;
  }

  if (success) {
    // Reset on success
    loginAttempts.delete(email);
    return { allowed: true };
  }

  // Increment failed attempts
  attempt.attempts++;
  attempt.lastAttempt = now;

  if (attempt.attempts >= MAX_LOGIN_ATTEMPTS) {
    attempt.lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
    logger.warn(`Account locked due to excessive login attempts: ${email}`);

    // Store in database for persistence across restarts
    // Note: AuditLog requires userId (not email), so we skip DB logging for account lockout
    // This is tracked in-memory and logged to console/monitoring
    logger.warn(
      `SECURITY: Account locked - ${email} - ${MAX_LOGIN_ATTEMPTS} failed attempts`
    );
  }

  loginAttempts.set(email, attempt);
  return {
    allowed: attempt.lockedUntil === undefined,
    remainingMinutes: attempt.lockedUntil
      ? Math.ceil((attempt.lockedUntil.getTime() - now.getTime()) / 60000)
      : undefined,
  };
}

// ============================================================================
// 2. EMAIL VERIFICATION ENFORCEMENT
// ============================================================================

export function requireEmailVerified(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (!user.emailVerified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Please verify your email address to access this feature',
    });
  }

  next();
}

// ============================================================================
// 3. STRICT RATE LIMITERS FOR SENSITIVE ROUTES
// ============================================================================

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
  },
  handler: (req, res) => {
    logger.warn(
      `Rate limit exceeded for auth endpoint: ${req.ip} - ${req.path}`
    );
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(15 * 60), // seconds
    });
  },
});

export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    success: false,
    error: 'Registration limit exceeded. Please try again later.',
  },
  handler: (req, res) => {
    logger.warn(`Registration rate limit exceeded: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many registration attempts. Please try again in 1 hour.',
    });
  },
});

export const paymentRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: {
    success: false,
    error:
      'Too many payment requests. Please contact support if you need assistance.',
  },
  handler: (req, res) => {
    logger.warn(`Payment rate limit exceeded: ${req.ip} - ${req.path}`);
    res.status(429).json({
      success: false,
      error: 'Too many payment requests. Please try again later.',
    });
  },
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: 'Too many password reset requests. Please try again later.',
  },
});

// ============================================================================
// 4. JWT VALIDATION WITH ENHANCED SECURITY
// ============================================================================

export function validateJWTClaims(payload: any): {
  valid: boolean;
  reason?: string;
} {
  const now = Math.floor(Date.now() / 1000);

  // Check expiration
  if (!payload.exp || payload.exp < now) {
    logger.warn(`Expired JWT token used: exp=${payload.exp}, now=${now}`);
    return { valid: false, reason: 'Token expired' };
  }

  // Check issued at (not from future)
  if (payload.iat && payload.iat > now + 60) {
    logger.warn(
      `JWT token from future detected: iat=${payload.iat}, now=${now}`
    );
    return { valid: false, reason: 'Invalid token timestamp' };
  }

  // Validate required claims
  if (!payload.userId || !payload.email) {
    logger.warn(
      `JWT token missing required claims: ${JSON.stringify(payload)}`
    );
    return { valid: false, reason: 'Invalid token claims' };
  }

  // Check issuer if configured
  if (
    process.env.JWT_ISSUER &&
    payload.iss !== process.env.JWT_ISSUER
  ) {
    logger.warn(
      `Invalid JWT issuer: expected=${process.env.JWT_ISSUER}, got=${payload.iss}`
    );
    return { valid: false, reason: 'Invalid token issuer' };
  }

  // Check audience if configured
  if (
    process.env.JWT_AUDIENCE &&
    payload.aud !== process.env.JWT_AUDIENCE
  ) {
    logger.warn(
      `Invalid JWT audience: expected=${process.env.JWT_AUDIENCE}, got=${payload.aud}`
    );
    return { valid: false, reason: 'Invalid token audience' };
  }

  return { valid: true };
}

// ============================================================================
// 5. PASSWORD STRENGTH VALIDATION
// ============================================================================

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

const defaultPasswordPolicy: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

// Common passwords from Have I Been Pwned and OWASP top 25
const COMMON_PASSWORDS = [
  'password',
  '123456',
  '12345678',
  'qwerty',
  'abc123',
  'monkey',
  'letmein',
  'trustno1',
  'dragon',
  'baseball',
  'iloveyou',
  'master',
  'sunshine',
  'ashley',
  'bailey',
  'shadow',
  'superman',
  'qazwsx',
  'michael',
  'football',
  'password1',
  'password123',
  'admin',
  'welcome',
  'login',
];

export function validatePasswordStrength(
  password: string,
  policy: PasswordPolicy = defaultPasswordPolicy
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(
      `Password must be at least ${policy.minLength} characters long`
    );
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (
    policy.requireSpecialChars &&
    !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  ) {
    errors.push('Password must contain at least one special character');
  }

  // Check against common passwords
  const lowerPassword = password.toLowerCase();
  if (
    COMMON_PASSWORDS.some((common) => lowerPassword.includes(common))
  ) {
    errors.push(
      'Password is too common. Please choose a more unique password'
    );
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push(
      'Password should not contain repeated characters (e.g., "aaa", "111")'
    );
  }

  // Check for sequential characters
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm',
  ];
  for (const seq of sequences) {
    for (let i = 0; i < seq.length - 2; i++) {
      const subseq = seq.substring(i, i + 3);
      if (lowerPassword.includes(subseq)) {
        errors.push(
          'Password should not contain sequential characters (e.g., "abc", "123")'
        );
        break;
      }
    }
    if (errors.some((e) => e.includes('sequential'))) break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// 6. SANITIZE ERROR MESSAGES FOR PRODUCTION
// ============================================================================

export function sanitizeError(
  error: any,
  isProduction: boolean = process.env.NODE_ENV === 'production'
): any {
  if (!isProduction) {
    return error; // Full error in development
  }

  // Production: generic messages only
  const safeErrors: Record<string, string> = {
    ValidationError: 'Invalid input provided',
    UnauthorizedError: 'Authentication failed',
    ForbiddenError: 'Access denied',
    NotFoundError: 'Resource not found',
    ConflictError: 'Operation conflicts with existing data',
    RateLimitError: 'Too many requests',
    TokenExpiredError: 'Authentication token expired',
    JsonWebTokenError: 'Invalid authentication token',
    PrismaClientKnownRequestError: 'Database operation failed',
    PrismaClientValidationError: 'Invalid data provided',
  };

  const errorType = error?.name || error?.constructor?.name || 'Error';
  return {
    success: false,
    error:
      safeErrors[errorType] ||
      'An error occurred. Please try again later.',
    code: errorType,
  };
}

// ============================================================================
// 7. ADMIN ACTION AUDIT LOGGER
// ============================================================================

export async function logAdminAction(
  adminUserId: string,
  action: string,
  details: string,
  req: any,
  targetUserId?: string | null
): Promise<void> {
  try {
    // AuditLog schema: userId, action, resource, resourceId, metadata, ipAddress, userAgent
    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action,
        resource: 'admin',
        resourceId: targetUserId || null,
        metadata: JSON.stringify({ details, timestamp: new Date().toISOString() }),
        ipAddress: (req.ip || req.headers['x-forwarded-for'] as string) || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
      },
    });

    logger.info(`Admin action logged: ${action} by ${adminUserId}`, {
      adminUserId,
      action,
      resourceId: targetUserId,
      details,
    });
  } catch (error) {
    logger.error('Failed to log admin action:', error);
  }
}

// ============================================================================
// 8. SENSITIVE FIELD FILTER (Prevent Accidental Exposure)
// ============================================================================

const SENSITIVE_FIELDS = [
  'password',
  'passwordhash',
  'apikey',
  'apisecret',
  'secretkey',
  'privatekey',
  'token',
  'refreshtoken',
  'accesstoken',
  'sessionid',
  'stripesecretkey',
  'cryptomusapikey',
  'nowpaymentsapikey',
  'jwtsecret',
  'vapidprivatekey',
  'smtppassword',
  'emailpassword',
  'resendaspikey',
  'sendgridapikey',
];

export function sanitizeObject<T extends Record<string, any>>(
  obj: T
): Partial<T> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip sensitive fields
    if (
      SENSITIVE_FIELDS.some((field) =>
        key.toLowerCase().includes(field.toLowerCase())
      )
    ) {
      continue;
    }

    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'object' ? sanitizeObject(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// ============================================================================
// 9. REQUEST VALIDATION MIDDLEWARE
// ============================================================================

export function validateRequestBody(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map((detail: any) => detail.message);
      logger.warn(`Request validation failed: ${req.path}`, { errors });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    // Replace body with validated and sanitized value
    req.body = value;
    next();
  };
}

// ============================================================================
// 10. SOCKET.IO AUTHENTICATION HELPER
// ============================================================================

export function validateSocketAuth(token: string): any {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    const validation = validateJWTClaims(decoded);
    if (!validation.valid) {
      logger.warn(`Socket.IO JWT validation failed: ${validation.reason}`);
      return null;
    }

    return decoded;
  } catch (error) {
    logger.warn(`Socket.IO auth failed: ${error}`);
    return null;
  }
}

// ============================================================================
// 11. PAYMENT AMOUNT VALIDATION
// ============================================================================

export function validatePaymentAmount(
  amount: number,
  expectedAmount: number,
  tolerance: number = 0.01 // Allow 1 cent tolerance for rounding
): boolean {
  const difference = Math.abs(amount - expectedAmount);
  return difference <= tolerance;
}

// ============================================================================
// 12. SWAGGER PROTECTION MIDDLEWARE
// ============================================================================

export function protectSwaggerInProduction(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (process.env.NODE_ENV === 'production') {
    const user = (req as any).user;

    // Require authentication
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to access API documentation',
      });
    }

    // Require admin role
    if (user.role !== 'admin' && !user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required to view API documentation',
      });
    }
  }

  next();
}

// ============================================================================
// 13. IP-BASED LOCKOUT (Additional Layer)
// ============================================================================

const ipLockouts = new Map<string, Date>();
const MAX_REQUESTS_PER_IP_PER_MINUTE = 100;
const requestCounts = new Map<string, { count: number; resetAt: Date }>();

export function trackIPRequests(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = new Date();

  // Check if IP is locked out
  const lockoutUntil = ipLockouts.get(ip);
  if (lockoutUntil && lockoutUntil > now) {
    logger.warn(`Request from locked IP: ${ip}`);
    return res.status(429).json({
      success: false,
      error: 'Too many requests from this IP. Please try again later.',
    });
  }

  // Track requests
  const record = requestCounts.get(ip) || {
    count: 0,
    resetAt: new Date(now.getTime() + 60000),
  };

  if (record.resetAt <= now) {
    // Reset counter
    record.count = 0;
    record.resetAt = new Date(now.getTime() + 60000);
  }

  record.count++;

  if (record.count > MAX_REQUESTS_PER_IP_PER_MINUTE) {
    // Lock out IP for 15 minutes
    ipLockouts.set(ip, new Date(now.getTime() + 15 * 60 * 1000));
    logger.warn(
      `IP locked out due to excessive requests: ${ip} (${record.count} req/min)`
    );

    return res.status(429).json({
      success: false,
      error: 'Too many requests. IP temporarily blocked.',
    });
  }

  requestCounts.set(ip, record);
  next();
}

// ============================================================================
// 14. CSRF TOKEN GENERATION (For Future Use with Sessions)
// ============================================================================

import crypto from 'crypto';

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCSRFToken(
  token: string,
  sessionToken: string
): boolean {
  return token === sessionToken;
}
