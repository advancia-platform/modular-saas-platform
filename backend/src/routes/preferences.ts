/**
 * Notification Preferences API Routes
 * Manage user notification preferences with granular controls
 */

import express, { Response } from 'express';
import { z } from 'zod';
import { logger } from '../logger';
import { authenticateToken } from '../middleware/auth';
import { verifyAccess } from '../middleware/permissions';
import { AuthenticatedRequest } from '../middleware/rbac';
import prisma from '../prismaClient';

const router = express.Router();

// Validation schemas
const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  transactionAlerts: z.boolean().optional(),
  securityAlerts: z.boolean().optional(),
  systemAlerts: z.boolean().optional(),
  rewardAlerts: z.boolean().optional(),
  adminAlerts: z.boolean().optional(),
  withdrawals: z.boolean().optional(),
  complianceAlerts: z.boolean().optional(),
  auditLogs: z.boolean().optional(),
  digestFrequency: z.enum(['NONE', 'DAILY', 'WEEKLY']).optional()
});

const _granularPreferencesSchema = z.object({
  email: z.object({
    enabled: z.boolean(),
    alerts: z.boolean().optional(),
    reports: z.boolean().optional(),
    summary: z.boolean().optional(),
    compliance: z.boolean().optional(),
    security: z.boolean().optional()
  }).optional(),
  sms: z.object({
    enabled: z.boolean(),
    critical: z.boolean().optional(),
    incidents: z.boolean().optional(),
    security: z.boolean().optional()
  }).optional(),
  slack: z.object({
    enabled: z.boolean(),
    updates: z.boolean().optional(),
    deployments: z.boolean().optional(),
    compliance: z.boolean().optional(),
    alerts: z.boolean().optional()
  }).optional(),
  telegram: z.object({
    enabled: z.boolean(),
    alerts: z.boolean().optional(),
    updates: z.boolean().optional(),
    reports: z.boolean().optional()
  }).optional()
});

/**
 * Get user's notification preferences
 * GET /api/preferences
 */
router.get('/',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;

      // Get existing preferences or create defaults
      let preferences = await prisma.notification_preferences.findUnique({
        where: { userId }
      });

      if (!preferences) {
        // Create default preferences for new user
        preferences = await prisma.notification_preferences.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            emailEnabled: true,
            inAppEnabled: true,
            pushEnabled: false,
            transactionAlerts: true,
            securityAlerts: true,
            systemAlerts: true,
            rewardAlerts: true,
            adminAlerts: req.user?.role === 'ADMIN',
            withdrawals: true,
            complianceAlerts: ['ADMIN', 'AUDITOR'].includes(req.user?.role || ''),
            auditLogs: ['ADMIN'].includes(req.user?.role || ''),
            digestFrequency: 'NONE'
          }
        });
      }

      logger.info('Retrieved notification preferences', {
        userId,
        hasPreferences: !!preferences
      });

      res.json({
        success: true,
        message: 'Notification preferences retrieved successfully',
        data: {
          preferences: {
            emailEnabled: preferences.emailEnabled,
            inAppEnabled: preferences.inAppEnabled,
            pushEnabled: preferences.pushEnabled,
            transactionAlerts: preferences.transactionAlerts,
            securityAlerts: preferences.securityAlerts,
            systemAlerts: preferences.systemAlerts,
            rewardAlerts: preferences.rewardAlerts,
            adminAlerts: preferences.adminAlerts,
            withdrawals: preferences.withdrawals,
            complianceAlerts: preferences.complianceAlerts,
            auditLogs: preferences.auditLogs,
            digestFrequency: preferences.digestFrequency
          },
          metadata: {
            userId,
            createdAt: preferences.createdAt,
            updatedAt: preferences.updatedAt
          }
        }
      });

    } catch (error) {
      logger.error('Failed to retrieve notification preferences', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve notification preferences'
      });
    }
  }
);

/**
 * Update user's notification preferences
 * PUT /api/preferences
 */
router.put('/',
  authenticateToken,
  verifyAccess(['write:preferences']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const validatedData = notificationPreferencesSchema.parse(req.body);

      // Update preferences
      const updatedPreferences = await prisma.notification_preferences.upsert({
        where: { userId },
        update: {
          ...validatedData,
          updatedAt: new Date()
        },
        create: {
          id: crypto.randomUUID(),
          userId,
          emailEnabled: validatedData.emailEnabled ?? true,
          inAppEnabled: validatedData.inAppEnabled ?? true,
          pushEnabled: validatedData.pushEnabled ?? false,
          transactionAlerts: validatedData.transactionAlerts ?? true,
          securityAlerts: validatedData.securityAlerts ?? true,
          systemAlerts: validatedData.systemAlerts ?? true,
          rewardAlerts: validatedData.rewardAlerts ?? true,
          adminAlerts: validatedData.adminAlerts ?? false,
          withdrawals: validatedData.withdrawals ?? true,
          complianceAlerts: validatedData.complianceAlerts ?? false,
          auditLogs: validatedData.auditLogs ?? false,
          digestFrequency: validatedData.digestFrequency ?? 'NONE'
        }
      });

      logger.info('Updated notification preferences', {
        userId,
        changes: validatedData
      });

      res.json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: {
          preferences: updatedPreferences
        }
      });

    } catch (error) {
      logger.error('Failed to update notification preferences', {
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
        error: 'Failed to update notification preferences'
      });
    }
  }
);

/**
 * Get granular channel preferences (for advanced UI)
 * GET /api/preferences/channels
 */
router.get('/channels',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;

      // Get basic preferences
      const preferences = await prisma.notification_preferences.findUnique({
        where: { userId }
      });

      // Map to granular structure for frontend
      const granularPreferences = {
        email: {
          enabled: preferences?.emailEnabled ?? true,
          alerts: preferences?.transactionAlerts ?? true,
          reports: preferences?.complianceAlerts ?? false,
          summary: preferences?.digestFrequency !== 'NONE',
          compliance: preferences?.complianceAlerts ?? false,
          security: preferences?.securityAlerts ?? true
        },
        sms: {
          enabled: false, // SMS integration would need separate implementation
          critical: preferences?.securityAlerts ?? true,
          incidents: preferences?.systemAlerts ?? true,
          security: preferences?.securityAlerts ?? true
        },
        slack: {
          enabled: false, // Slack integration would need separate implementation
          updates: preferences?.systemAlerts ?? true,
          deployments: preferences?.adminAlerts ?? false,
          compliance: preferences?.complianceAlerts ?? false,
          alerts: preferences?.transactionAlerts ?? true
        },
        telegram: {
          enabled: false, // Based on existing Telegram service
          alerts: preferences?.transactionAlerts ?? true,
          updates: preferences?.systemAlerts ?? true,
          reports: preferences?.complianceAlerts ?? false
        }
      };

      res.json({
        success: true,
        message: 'Channel preferences retrieved successfully',
        data: {
          channels: granularPreferences,
          userId
        }
      });

    } catch (error) {
      logger.error('Failed to retrieve channel preferences', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve channel preferences'
      });
    }
  }
);

export default router;
