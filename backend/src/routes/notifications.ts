import { Router } from 'express';
import { logger } from '../logger';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../prismaClient';
import { asyncHandler } from '../utils/errorHandler';

const router = Router();

// GET /api/notifications/preferences
// Get user's notification preferences
router.get('/preferences',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.userId;

    try {
      let preferences = await prisma.notification_preferences.findUnique({
        where: { userId }
      });

      // Create default preferences if none exist
      if (!preferences) {
        preferences = await prisma.notification_preferences.create({
          data: {
            userId,
            emailEnabled: true,
            inAppEnabled: true,
            pushEnabled: false,
            transactionAlerts: true,
            securityAlerts: true,
            systemAlerts: true,
            rewardAlerts: true,
            adminAlerts: true,
            withdrawals: true,
            complianceAlerts: true,
            auditLogs: false,
            digestFrequency: 'NONE'
          }
        });
      }

      res.json({
        success: true,
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
        }
      });

    } catch (error) {
      logger.error('Failed to get notification preferences', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve notification preferences'
      });
    }
  })
);

// PUT /api/notifications/preferences
// Update user's notification preferences
router.put('/preferences',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const {
      emailEnabled,
      inAppEnabled,
      pushEnabled,
      transactionAlerts,
      securityAlerts,
      systemAlerts,
      rewardAlerts,
      adminAlerts,
      withdrawals,
      complianceAlerts,
      auditLogs,
      digestFrequency
    } = req.body;

    try {
      // Validate digestFrequency if provided
      if (digestFrequency && !['NONE', 'DAILY', 'WEEKLY'].includes(digestFrequency)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid digest frequency. Must be: NONE, DAILY, or WEEKLY'
        });
      }

      const updateData: any = {};

      // Only update fields that are provided
      if (typeof emailEnabled === 'boolean') updateData.emailEnabled = emailEnabled;
      if (typeof inAppEnabled === 'boolean') updateData.inAppEnabled = inAppEnabled;
      if (typeof pushEnabled === 'boolean') updateData.pushEnabled = pushEnabled;
      if (typeof transactionAlerts === 'boolean') updateData.transactionAlerts = transactionAlerts;
      if (typeof securityAlerts === 'boolean') updateData.securityAlerts = securityAlerts;
      if (typeof systemAlerts === 'boolean') updateData.systemAlerts = systemAlerts;
      if (typeof rewardAlerts === 'boolean') updateData.rewardAlerts = rewardAlerts;
      if (typeof adminAlerts === 'boolean') updateData.adminAlerts = adminAlerts;
      if (typeof withdrawals === 'boolean') updateData.withdrawals = withdrawals;
      if (typeof complianceAlerts === 'boolean') updateData.complianceAlerts = complianceAlerts;
      if (typeof auditLogs === 'boolean') updateData.auditLogs = auditLogs;
      if (digestFrequency) updateData.digestFrequency = digestFrequency;

      const preferences = await prisma.notification_preferences.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          emailEnabled: emailEnabled ?? true,
          inAppEnabled: inAppEnabled ?? true,
          pushEnabled: pushEnabled ?? false,
          transactionAlerts: transactionAlerts ?? true,
          securityAlerts: securityAlerts ?? true,
          systemAlerts: systemAlerts ?? true,
          rewardAlerts: rewardAlerts ?? true,
          adminAlerts: adminAlerts ?? true,
          withdrawals: withdrawals ?? true,
          complianceAlerts: complianceAlerts ?? true,
          auditLogs: auditLogs ?? false,
          digestFrequency: digestFrequency ?? 'NONE'
        }
      });

      logger.info('Notification preferences updated', {
        userId,
        changedFields: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'Notification preferences updated successfully',
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
        }
      });

    } catch (error) {
      logger.error('Failed to update notification preferences', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update notification preferences'
      });
    }
  })
);

// POST /api/notifications/test-digest
// Manually trigger digest generation for testing (admin only)
router.post('/test-digest',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const { user } = req.user!;

    // Only allow admins to trigger test digests
    if (!user || !['ADMIN', 'SUPERADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    try {
      const { generateDigest } = require('../services/digestService');
      const targetUserId = req.body.userId || req.user!.userId;

      await generateDigest(targetUserId);

      logger.info('Test digest generated', {
        adminId: req.user!.userId,
        targetUserId
      });

      res.json({
        success: true,
        message: `Test digest sent to user ${targetUserId}`
      });

    } catch (error) {
      logger.error('Failed to generate test digest', {
        adminId: req.user!.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate test digest'
      });
    }
  })
);

export default router;
