import { Router } from 'express';
import { logger } from '../logger';
import { emailTemplates } from '../utils/emailTemplates';

const router = Router();

/**
 * POST /api/email/welcome
 * Send welcome email to new user
 */
router.post('/welcome', (req, res) => {
  const { email, name } = req.body;
  
  if (!email || !name) {
    return res.status(400).json({ error: 'Missing email or name' });
  }
  
  logger.info('Generating welcome email', { email, name });
  
  try {
    const htmlContent = emailTemplates.welcome(name);
    
    // TODO: Send email using real mailer (nodemailer, SendGrid, etc.)
    // Example:
    // await transporter.sendMail({
    //   from: process.env.SMTP_FROM_EMAIL,
    //   to: email,
    //   subject: 'Welcome to Advancia Pay Ledger!',
    //   html: htmlContent
    // });
    
    res.json({ 
      message: 'Welcome email generated',
      preview: htmlContent.substring(0, 200) + '...',
      // In development, return full template for testing
      ...(process.env.NODE_ENV === 'development' && { template: htmlContent })
    });
  } catch (error: any) {
    logger.error('Failed to generate welcome email', { error: error.message, email });
    res.status(500).json({ error: 'Failed to generate email' });
  }
});

/**
 * POST /api/email/password-reset
 * Send password reset email
 */
router.post('/password-reset', (req, res) => {
  const { email, name } = req.body;
  
  if (!email || !name) {
    return res.status(400).json({ error: 'Missing email or name' });
  }
  
  logger.info('Generating password reset email', { email, name });
  
  try {
    // Generate secure reset token (in production, store in database)
    const resetToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const resetLink = `${process.env.FRONTEND_URL || 'https://advanciapayledger.com'}/reset-password?token=${resetToken}`;
    
    const htmlContent = emailTemplates.passwordReset(name, resetLink, '1 hour');
    
    // TODO: Send email using real mailer
    // TODO: Store resetToken in database with expiry
    
    res.json({ 
      message: 'Password reset email generated',
      preview: htmlContent.substring(0, 200) + '...',
      ...(process.env.NODE_ENV === 'development' && { 
        template: htmlContent,
        resetLink // Only in dev mode for testing
      })
    });
  } catch (error: any) {
    logger.error('Failed to generate password reset email', { error: error.message, email });
    res.status(500).json({ error: 'Failed to generate email' });
  }
});

/**
 * POST /api/email/verification
 * Send email verification link
 */
router.post('/verification', (req, res) => {
  const { email, name } = req.body;
  
  if (!email || !name) {
    return res.status(400).json({ error: 'Missing email or name' });
  }
  
  logger.info('Generating verification email', { email, name });
  
  try {
    const verificationToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const verificationLink = `${process.env.FRONTEND_URL || 'https://advanciapayledger.com'}/verify-email?token=${verificationToken}`;
    
    const htmlContent = emailTemplates.emailVerification(name, verificationLink);
    
    res.json({ 
      message: 'Verification email generated',
      preview: htmlContent.substring(0, 200) + '...',
      ...(process.env.NODE_ENV === 'development' && { 
        template: htmlContent,
        verificationLink
      })
    });
  } catch (error: any) {
    logger.error('Failed to generate verification email', { error: error.message, email });
    res.status(500).json({ error: 'Failed to generate email' });
  }
});

/**
 * POST /api/email/transaction-alert
 * Send transaction alert email
 */
router.post('/transaction-alert', (req, res) => {
  const { email, name, transaction } = req.body;
  
  if (!email || !name || !transaction) {
    return res.status(400).json({ error: 'Missing email, name, or transaction' });
  }
  
  logger.info('Generating transaction alert email', { email, name, transactionType: transaction.type });
  
  try {
    const htmlContent = emailTemplates.transactionAlert(name, transaction);
    
    res.json({ 
      message: 'Transaction alert email generated',
      preview: htmlContent.substring(0, 200) + '...',
      ...(process.env.NODE_ENV === 'development' && { template: htmlContent })
    });
  } catch (error: any) {
    logger.error('Failed to generate transaction alert email', { error: error.message, email });
    res.status(500).json({ error: 'Failed to generate email' });
  }
});

export default router;
