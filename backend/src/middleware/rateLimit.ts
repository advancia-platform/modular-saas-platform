import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../logger';

// Store for per-user rate limiting
const userAttemptStore = new Map<string, { count: number; ts: number }>();

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  handler: (req: Request, res: Response) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    }, 'Rate limit exceeded');
    
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Strict login rate limiter
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Limit each IP to 20 login attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    error: 'Too many login attempts. Please try again later.',
    retryAfter: '10 minutes'
  },
  handler: (req: Request, res: Response) => {
    logger.warn({
      ip: req.ip,
      email: req.body?.email,
      userAgent: req.get('User-Agent')
    }, 'Login rate limit exceeded');
    
    res.status(429).json({
      error: 'Too many login attempts. Please try again later.',
      retryAfter: '10 minutes'
    });
  }
});

// Per-username rate limiter
export function usernameLimiter() {
  return (req: Request, res: Response, next: Function) => {
    const identifier = String(req.body?.email || req.body?.username || req.ip || '');
    const now = Date.now();
    const windowMs = 10 * 60 * 1000; // 10 minutes
    const maxAttempts = 10;
    
    const entry = userAttemptStore.get(identifier) || { count: 0, ts: now };
    
    // Reset counter if window has expired
    if (now - entry.ts > windowMs) {
      entry.count = 0;
      entry.ts = now;
    }
    
    entry.count++;
    userAttemptStore.set(identifier, entry);
    
    if (entry.count > maxAttempts) {
      logger.warn({
        identifier: identifier.includes('@') ? '[EMAIL]' : identifier,
        attempts: entry.count,
        ip: req.ip
      }, 'Per-user rate limit exceeded');
      
      return res.status(429).json({
        error: 'Too many attempts for this account. Please try again later.',
        retryAfter: '10 minutes'
      });
    }
    
    next();
  };
}

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many password reset attempts. Please try again later.',
    retryAfter: '1 hour'
  }
});

// Registration rate limiter
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 registration attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many registration attempts. Please try again later.',
    retryAfter: '1 hour'
  }
});

// 2FA verification rate limiter
export const twoFALimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 2FA attempts per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many 2FA verification attempts. Please try again later.',
    retryAfter: '5 minutes'
  }
});

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  
  for (const [key, entry] of userAttemptStore.entries()) {
    if (now - entry.ts > windowMs) {
      userAttemptStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes