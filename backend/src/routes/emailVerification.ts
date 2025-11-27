import crypto from 'crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Resend } from 'resend';
import { logger } from '../logger';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../prismaClient';

const router = Router();

// Rate limiter for resend verification - prevent abuse
const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 resends per window per IP
  message: 'Too many verification email requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const APP_URL = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@advanciapayledger.com';

/**
 * POST /api/email/send-verification
 * Send email verification link to user
 * Requires authentication
 */
router.post('/send-verification', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerified: true, firstName: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // Store token in user record (reusing emailSignupToken field)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailSignupToken: token,
        emailSignupTokenExpiry: expiresAt
      }
    });

    const verificationLink = `${APP_URL}/verify-email?token=${token}`;

    // Send email via Resend
    if (resend) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: user.email,
          subject: 'Verify Your Email Address',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔐 Verify Your Email</h1>
                </div>
                <div class="content">
                  <p>Hi ${user.firstName || 'there'},</p>
                  <p>Thanks for signing up for Advancia Pay Ledger! Please verify your email address by clicking the button below:</p>
                  <p style="text-align: center;">
                    <a href="${verificationLink}" class="button">Verify Email Address</a>
                  </p>
                  <p>Or copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 4px;">${verificationLink}</p>
                  <p><strong>This link will expire in 1 hour.</strong></p>
                  <p>If you didn't create an account, please ignore this email.</p>
                </div>
                <div class="footer">
                  <p>Advancia Pay Ledger | Secure Financial Management</p>
                  <p>This is an automated message, please do not reply.</p>
                </div>
              </div>
            </body>
            </html>
          `
        });

        logger.info('Verification email sent', { userId, email: user.email });
      } catch (error: any) {
        logger.error('Failed to send verification email via Resend', {
          userId,
          email: user.email,
          error: error.message
        });
        throw error;
      }
    } else {
      // Fallback: Log the link for development
      logger.warn('RESEND_API_KEY not configured. Verification link:', {
        link: verificationLink,
        userId,
        email: user.email
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent',
      ...(process.env.NODE_ENV === 'development' && !resend && {
        verificationLink // Only in dev without Resend
      })
    });

  } catch (error: any) {
    logger.error('Error sending verification email', {
      error: error.message,
      userId: req.user?.userId
    });
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

/**
 * GET /api/email/verify
 * Verify email address using token
 * Public route
 */
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const user = await prisma.user.findFirst({
      where: {
        emailSignupToken: token,
        emailSignupTokenExpiry: {
          gte: new Date() // Token not expired
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailSignupToken: null,
        emailSignupTokenExpiry: null
      }
    });

    logger.info('Email verified successfully', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error: any) {
    logger.error('Error verifying email', {
      error: error.message,
      token: req.query.token
    });
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

/**
 * POST /api/email/verification/resend
 * Resend email verification link
 * Requires authentication
 * Rate limited: 5 requests per 15 minutes
 */
router.post('/verification/resend', resendVerificationLimiter, authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerified: true, firstName: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Clean up existing tokens for this user (reusing emailSignupToken field)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailSignupToken: null,
        emailSignupTokenExpiry: null
      }
    });

    // Generate new verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // Store new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailSignupToken: token,
        emailSignupTokenExpiry: expiresAt
      }
    });

    const verificationLink = `${APP_URL}/verify-email?token=${token}`;

    // Send email via Resend
    if (resend) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: user.email,
          subject: 'Verify Your Email Address',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔐 Verify Your Email</h1>
                </div>
                <div class="content">
                  <p>Hi ${user.firstName || 'there'},</p>
                  <p>You requested a new verification link. Please verify your email address by clicking the button below:</p>
                  <p style="text-align: center;">
                    <a href="${verificationLink}" class="button">Verify Email Address</a>
                  </p>
                  <p>Or copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 4px;">${verificationLink}</p>
                  <p><strong>This link will expire in 1 hour.</strong></p>
                  <p>If you didn't request this, please ignore this email.</p>
                </div>
                <div class="footer">
                  <p>Advancia Pay Ledger | Secure Financial Management</p>
                  <p>This is an automated message, please do not reply.</p>
                </div>
              </div>
            </body>
            </html>
          `
        });

        logger.info('Verification email resent', { userId, email: user.email });
      } catch (error: any) {
        logger.error('Failed to resend verification email via Resend', {
          userId,
          email: user.email,
          error: error.message
        });
        throw error;
      }
    } else {
      // Fallback: Log the link for development
      logger.warn('RESEND_API_KEY not configured. Verification link:', {
        link: verificationLink,
        userId,
        email: user.email
      });
    }

    res.json({
      success: true,
      message: 'Verification email resent',
      ...(process.env.NODE_ENV === 'development' && !resend && {
        verificationLink // Only in dev without Resend
      })
    });

  } catch (error: any) {
    logger.error('Error resending verification email', {
      error: error.message,
      userId: req.user?.userId
    });
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

/**
 * GET /api/email/verification-status
 * Check if current user's email is verified
 * Requires authentication
 */
router.get('/verification-status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true, emailVerifiedAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      emailVerified: user.emailVerified,
      verifiedAt: user.emailVerifiedAt
    });

  } catch (error: any) {
    logger.error('Error checking verification status', {
      error: error.message,
      userId: req.user?.userId
    });
    res.status(500).json({ error: 'Failed to check verification status' });
  }
});

export default router;
