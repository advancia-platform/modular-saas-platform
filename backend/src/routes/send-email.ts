import express, { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { logger } from '../logger';

const router = express.Router();

// Create Gmail transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL || 'advanciapayledger@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD || 'edxq uduo rffz gjqe',
    },
  });
};

/**
 * POST /api/send-email
 * Universal email sending endpoint
 */
router.post('/send-email', async (req: Request, res: Response) => {
  try {
    const { to, subject, html, text, from } = req.body;

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, and html or text',
      });
    }

    logger.info('Sending email via backend', { to, subject });

    const transporter = createTransporter();
    
    // Send email
    const info = await transporter.sendMail({
      from: from || `"Advancia Pay" <${process.env.GMAIL_EMAIL || 'advanciapayledger@gmail.com'}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
      html: html,
      text: text || html?.replace(/<[^>]*>/g, ''),
    });

    logger.info('Email sent successfully', { messageId: info.messageId, to });

    res.json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully via backend Gmail SMTP',
    });
  } catch (error: any) {
    logger.error('Email send error', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email',
    });
  }
});

/**
 * GET /api/send-email/status
 * Check backend email service status
 */
router.get('/send-email/status', async (req: Request, res: Response) => {
  try {
    const isConfigured = !!(process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD);
    
    if (isConfigured) {
      const transporter = createTransporter();
      // Test connection
      await transporter.verify();
      
      res.json({
        success: true,
        status: 'ready',
        provider: 'Gmail SMTP (Backend)',
        message: 'Email service is configured and ready',
        email: process.env.GMAIL_EMAIL,
      });
    } else {
      res.json({
        success: false,
        status: 'not_configured',
        message: 'Gmail credentials not configured',
      });
    }
  } catch (error: any) {
    logger.error('Email service check failed', { error: error.message });
    res.status(500).json({
      success: false,
      status: 'error',
      error: error.message || 'Email service connection failed',
    });
  }
});

export default router;
