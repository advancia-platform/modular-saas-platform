import { Router, Request, Response } from 'express';
import { EmailService } from '../services/emailService';

const router = Router();
const emailService = new EmailService();

/**
 * Test Email Endpoints
 * Use these to verify email configuration and delivery
 */

// Test Welcome Email
router.post('/test/email/welcome', async (req: Request, res: Response) => {
  try {
    const { email, username } = req.body;

    if (!email || !username) {
      return res.status(400).json({
        success: false,
        error: 'Email and username are required'
      });
    }

    const result = await emailService.sendWelcomeEmail(email, username);

    res.json({
      success: result.success,
      message: result.success ? 'Welcome email sent successfully' : 'Failed to send email',
      emailId: result.id,
      error: result.error
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test Transaction Confirmation Email
router.post('/test/email/transaction', async (req: Request, res: Response) => {
  try {
    const { email, type, amount, description, transactionId } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const transactionData = {
      type: type || 'credit',
      amount: amount || 100,
      description: description || 'Test transaction',
      transactionId: transactionId || `TEST-${Date.now()}`
    };

    const result = await emailService.sendTransactionConfirmation(email, transactionData);

    res.json({
      success: result.success,
      message: result.success ? 'Transaction email sent successfully' : 'Failed to send email',
      emailId: result.id,
      error: result.error
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test Password Reset Email
router.post('/test/email/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, resetToken } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const token = resetToken || `reset_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const result = await emailService.sendPasswordResetEmail(email, token);

    res.json({
      success: result.success,
      message: result.success ? 'Password reset email sent successfully' : 'Failed to send email',
      emailId: result.id,
      resetToken: token,
      error: result.error
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test 2FA Email
router.post('/test/email/2fa', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const twoFACode = code || Math.floor(100000 + Math.random() * 900000).toString();
    const result = await emailService.sendTwoFactorEmail(email, twoFACode);

    res.json({
      success: result.success,
      message: result.success ? '2FA email sent successfully' : 'Failed to send email',
      emailId: result.id,
      code: twoFACode,
      error: result.error
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test Invoice Email
router.post('/test/email/invoice', async (req: Request, res: Response) => {
  try {
    const { email, invoiceNumber, amount, dueDate } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const invoiceData = {
      invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
      amount: amount || 250.00,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        { description: 'Service Fee', amount: 150.00 },
        { description: 'Processing Fee', amount: 100.00 }
      ]
    };

    const result = await emailService.sendInvoiceEmail(email, invoiceData);

    res.json({
      success: result.success,
      message: result.success ? 'Invoice email sent successfully' : 'Failed to send email',
      emailId: result.id,
      invoiceNumber: invoiceData.invoiceNumber,
      error: result.error
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test Admin Notification
router.post('/test/email/admin-notification', async (req: Request, res: Response) => {
  try {
    const { message, type } = req.body;

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@advanciapayledger.com';
    
    const notificationData = {
      type: type || 'user_registration',
      message: message || 'Test admin notification',
      timestamp: new Date().toISOString()
    };

    const result = await emailService.sendAdminNotification(adminEmail, notificationData);

    res.json({
      success: result.success,
      message: result.success ? 'Admin notification sent successfully' : 'Failed to send email',
      emailId: result.id,
      sentTo: adminEmail,
      error: result.error
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Email Configuration Status
router.get('/test/email/status', async (req: Request, res: Response) => {
  try {
    const config = {
      resendConfigured: !!process.env.RESEND_API_KEY,
      emailFrom: process.env.EMAIL_FROM || 'noreply@advancia.com',
      adminEmail: process.env.ADMIN_EMAIL || 'admin@advanciapayledger.com',
      environment: process.env.NODE_ENV || 'development',
      gmailConfigured: !!(process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD)
    };

    res.json({
      success: true,
      configuration: config,
      status: config.resendConfigured ? 'ready' : 'not_configured',
      message: config.resendConfigured 
        ? 'Email service is configured and ready' 
        : 'RESEND_API_KEY not configured. Please add it to environment variables.'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send Custom Test Email
router.post('/test/email/custom', async (req: Request, res: Response) => {
  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'to, subject, and html are required'
      });
    }

    const result = await emailService.sendEmail({
      to,
      subject,
      html
    });

    res.json({
      success: result.success,
      message: result.success ? 'Custom email sent successfully' : 'Failed to send email',
      emailId: result.id,
      error: result.error
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
