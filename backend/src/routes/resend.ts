/**
 * Resend Email API Routes
 * Provides endpoints for sending emails via Resend service
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../logger';
import { authenticateToken } from '../middleware/auth';
import { verifyAccess } from '../middleware/permissions';
import { AuthenticatedRequest } from '../middleware/rbac';
import { sendCampaignEmail, sendEmail, sendTemplateEmail, verifyResendConnection } from '../services/resendService';

const router = express.Router();

// Validation schemas
const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  from: z.string().email().optional(),
  template: z.string().optional(),
  variables: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.object({
    name: z.string(),
    value: z.string()
  })).optional()
}).refine(data => data.html || data.text, {
  message: 'Either html or text content must be provided'
});

const templateEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  template: z.string().min(1),
  variables: z.record(z.string(), z.any()).optional(),
  from: z.string().email().optional(),
  tags: z.array(z.object({
    name: z.string(),
    value: z.string()
  })).optional()
});

const campaignEmailSchema = z.object({
  recipients: z.array(z.string().email()).min(1),
  subject: z.string().min(1),
  html: z.string().min(1),
  campaignId: z.string().min(1),
  from: z.string().email().optional()
});

/**
 * Send single email
 * POST /api/resend/send
 */
router.post('/send',
  authenticateToken,
  verifyAccess(['write:notifications', 'admin:communications']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validatedData = sendEmailSchema.parse(req.body);

      const result = await sendEmail({
        to: validatedData.to,
        subject: validatedData.subject,
        html: validatedData.html,
        text: validatedData.text,
        from: validatedData.from,
        template: validatedData.template,
        variables: validatedData.variables,
        tags: validatedData.tags
      });

      logger.info('Email sent via Resend API', {
        userId: req.user?.userId,
        to: validatedData.to,
        subject: validatedData.subject,
        emailId: result.id
      });

      res.json({
        success: true,
        message: 'Email sent successfully',
        data: {
          id: result.id,
          provider: 'resend'
        }
      });

    } catch (error) {
      logger.error('Failed to send email via Resend API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId,
        body: req.body
        });

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues
        });
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      });
    }
  }
);

/**
 * Send template email
 * POST /api/resend/template
 */
router.post('/template',
  authenticateToken,
  verifyAccess(['write:notifications', 'admin:communications']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validatedData = templateEmailSchema.parse(req.body);

      const result = await sendTemplateEmail({
        to: validatedData.to,
        template: validatedData.template,
        variables: validatedData.variables,
        from: validatedData.from,
        tags: validatedData.tags
      });

      logger.info('Template email sent via Resend', {
        userId: req.user?.userId,
        to: validatedData.to,
        template: validatedData.template,
        emailId: result.id
      });

      res.json({
        success: true,
        message: 'Template email sent successfully',
        data: {
          id: result.id,
          template: validatedData.template,
          provider: 'resend'
        }
      });

    } catch (error) {
      logger.error('Failed to send template email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId,
        body: req.body
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues
        });
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send template email'
      });
    }
  }
);

/**
 * Send campaign email
 * POST /api/resend/campaign
 */
router.post('/campaign',
  authenticateToken,
  verifyAccess(['admin:communications', 'write:campaigns']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validatedData = campaignEmailSchema.parse(req.body);

      const result = await sendCampaignEmail({
        recipients: validatedData.recipients,
        subject: validatedData.subject,
        html: validatedData.html,
        campaignId: validatedData.campaignId,
        from: validatedData.from
      });

      logger.info('Campaign email sent via Resend', {
        userId: req.user?.userId,
        campaignId: validatedData.campaignId,
        recipients: validatedData.recipients.length,
        sent: result.sent,
        failed: result.failed
      });

      res.json({
        success: true,
        message: 'Campaign email completed',
        data: {
          campaignId: validatedData.campaignId,
          sent: result.sent,
          failed: result.failed,
          total: validatedData.recipients.length,
          results: result.results,
          provider: 'resend'
        }
      });

    } catch (error) {
      logger.error('Failed to send campaign email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId,
        body: req.body
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues
        });
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send campaign email'
      });
    }
  }
);

/**
 * Get available email templates
 * GET /api/resend/templates
 */
router.get('/templates',
  authenticateToken,
  verifyAccess(['read:templates', 'write:notifications']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const templates = [
        {
          id: 'welcome',
          name: 'Welcome Email',
          description: 'Welcome new users to the platform',
          variables: ['userName', 'companyName', 'dashboardUrl']
        },
        {
          id: 'password-reset',
          name: 'Password Reset',
          description: 'Password reset request email',
          variables: ['userName', 'resetUrl', 'companyName']
        },
        {
          id: 'transaction-alert',
          name: 'Transaction Alert',
          description: 'Notify users of transactions',
          variables: ['userName', 'amount', 'currency', 'transactionType', 'date', 'reference', 'transactionUrl']
        },
        {
          id: 'compliance-report',
          name: 'Compliance Report',
          description: 'Send compliance reports to users',
          variables: ['userName', 'reportType', 'date', 'reportPeriod', 'status', 'itemsReviewed', 'issuesFound', 'reportUrl']
        }
      ];

      res.json({
        success: true,
        message: 'Email templates retrieved successfully',
        data: {
          templates,
          total: templates.length
        }
      });

    } catch (error) {
      logger.error('Failed to get email templates', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve email templates'
      });
    }
  }
);

/**
 * Test Resend connection
 * GET /api/resend/test-connection
 */
router.get('/test-connection',
  authenticateToken,
  verifyAccess(['admin:system']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const isConnected = await verifyResendConnection();

      res.json({
        success: true,
        message: 'Resend connection test completed',
        data: {
          connected: isConnected,
          provider: 'resend',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Resend connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: 'Connection test failed'
      });
    }
  }
);

/**
 * Health check endpoint
 * GET /api/resend/health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const hasApiKey = !!process.env.RESEND_API_KEY;

    res.json({
      success: true,
      message: 'Resend service health check',
      data: {
        service: 'resend',
        status: hasApiKey ? 'configured' : 'missing_api_key',
        timestamp: new Date().toISOString()
      }
    });

  } catch {
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export default router;
