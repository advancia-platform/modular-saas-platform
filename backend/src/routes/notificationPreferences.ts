import * as Sentry from '@sentry/node';
import { Router } from 'express';
import { logger } from '../logger';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../prismaClient';
import { asyncHandler } from '../utils/errorHandler';

const router = Router();
router.use(authenticateToken);

// GET notification preferences
router.get('/preferences', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'User ID not found in token' });
  }

  try {
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId }
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId,
          emailEnabled: true,
          inAppEnabled: true,
          pushEnabled: false,
          transactionAlerts: true,
          securityAlerts: true,
          systemAlerts: true,
          rewardAlerts: true,
          adminAlerts: false,
          withdrawals: true,
          complianceAlerts: true,
          auditLogs: false,
          digestFrequency: 'NONE'
        }
      });

      logger.info('Created default notification preferences', { userId });
    }

    res.json({ success: true, preferences });
  } catch (error) {
    logger.error('Failed to fetch notification preferences', { userId, error });
    Sentry.captureException(error, {
      tags: { service: 'notification-preferences', action: 'get' },
      extra: { userId }
    });
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
}));

// PUT update notification preferences
router.put('/preferences', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  const updates = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'User ID not found in token' });
  }

  try {
    // Input validation following security guidelines
    if (updates.digestFrequency && !['NONE', 'DAILY', 'WEEKLY'].includes(updates.digestFrequency)) {
      return res.status(400).json({ error: 'Invalid digest frequency' });
    }

    // Validate boolean fields to prevent injection
    const allowedFields = [
      'emailEnabled', 'inAppEnabled', 'pushEnabled', 'transactionAlerts',
      'securityAlerts', 'systemAlerts', 'rewardAlerts', 'adminAlerts',
      'withdrawals', 'complianceAlerts', 'auditLogs', 'digestFrequency'
    ];

    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId },
      update: filteredUpdates,
      create: {
        userId,
        emailEnabled: true,
        inAppEnabled: true,
        pushEnabled: false,
        transactionAlerts: true,
        securityAlerts: true,
        systemAlerts: true,
        rewardAlerts: true,
        adminAlerts: false,
        withdrawals: true,
        complianceAlerts: true,
        auditLogs: false,
        digestFrequency: 'NONE',
        ...filteredUpdates
      }
    });

    // Audit log for compliance (following platform patterns)
    await prisma.adminAuditTrail.create({
      data: {
        adminId: userId,
        action: 'UPDATE_NOTIFICATION_PREFERENCES',
        target: 'user_preferences',
        details: `Updated notification preferences: ${Object.keys(filteredUpdates).join(', ')}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || null,
      }
    });

    logger.info('Notification preferences updated', { userId, updates: filteredUpdates });

    res.json({ success: true, preferences });
  } catch (error) {
    logger.error('Failed to update notification preferences', { userId, updates, error });
    Sentry.captureException(error, {
      tags: { service: 'notification-preferences', action: 'update' },
      extra: { userId, updates }
    });
    res.status(400).json({ error: 'Failed to update preferences' });
  }
}));

export default router;
