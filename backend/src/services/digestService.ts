import * as Sentry from '@sentry/node';
import { logger } from '../logger';
import prisma from '../prismaClient';

interface DigestUser {
  id: string;
  email: string;
  firstName?: string;
}

/**
 * Generate digest notifications for users based on their preferences
 */
export async function generateDigest(userId: string): Promise<void> {
  try {
    // Get user preferences (assuming notification_preferences exists)
    const prefs = await prisma.notification_preferences.findUnique({
      where: { userId }
    }).catch(() => null);

    if (!prefs || prefs.digestFrequency === 'NONE') {
      logger.info(`Skipping digest for user ${userId} - frequency set to NONE`);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true }
    });

    if (!user) {
      logger.error(`User ${userId} not found for digest generation`);
      return;
    }

    // Collect events since last digest
    const digestStart = getDigestStartDate(prefs.digestFrequency);

    // Get audit events
    const auditEvents = await prisma.user_audit_logs.findMany({
      where: {
        userId,
        timestamp: { gte: digestStart }
      },
      orderBy: { timestamp: 'desc' },
      take: 50 // Limit to prevent overwhelming emails
    });

    // Get transactions
    const transactions = await prisma.transactions.findMany({
      where: {
        userId,
        createdAt: { gte: digestStart }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Get rewards
    const rewards = await prisma.rewards.findMany({
      where: {
        userId,
        createdAt: { gte: digestStart }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (auditEvents.length === 0 && transactions.length === 0 && rewards.length === 0) {
      logger.info(`No activity found for user ${userId} digest`);
      return;
    }

    const digestContent = formatDigestContent({
      user,
      frequency: prefs.digestFrequency,
      auditEvents,
      transactions,
      rewards,
      periodStart: digestStart
    });

    // Send digest email using your existing notification service
    const { createNotification } = await import('./notificationService');

    await createNotification({
      userId,
      type: 'email',
      priority: 'normal',
      category: 'system',
      title: `Your ${prefs.digestFrequency.toLowerCase()} activity digest`,
      message: digestContent.textVersion,
      data: {
        htmlContent: digestContent.htmlVersion,
        actionUrl: `${process.env.FRONTEND_URL}/dashboard`,
        isDigest: true,
        frequency: prefs.digestFrequency
      }
    });

    logger.info(`Digest sent successfully to user ${userId}`, {
      userId,
      frequency: prefs.digestFrequency,
      eventsCount: auditEvents.length,
      transactionsCount: transactions.length,
      rewardsCount: rewards.length
    });

  } catch (error) {
    logger.error('Failed to generate digest', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Track digest failures in Sentry
    Sentry.captureException(error, {
      tags: {
        service: 'digest',
        type: 'generation_failure'
      },
      extra: {
        userId
      }
    });

    throw error;
  }
}

/**
 * Generate digests for all users with daily frequency
 */
export async function generateDailyDigests(): Promise<void> {
  try {
    const dailyUsers = await prisma.notification_preferences.findMany({
      where: { digestFrequency: 'DAILY' },
      select: { userId: true }
    }).catch(() => []);

    logger.info(`Generating daily digests for ${dailyUsers.length} users`);

    for (const pref of dailyUsers) {
      try {
        await generateDigest(pref.userId);
      } catch (error) {
        logger.error(`Failed to generate daily digest for user ${pref.userId}`, {
          userId: pref.userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Daily digest generation completed');
  } catch (error) {
    logger.error('Failed to generate daily digests batch', error);
    Sentry.captureException(error, {
      tags: { service: 'digest', type: 'daily_batch_failure' }
    });
  }
}

/**
 * Generate digests for all users with weekly frequency
 */
export async function generateWeeklyDigests(): Promise<void> {
  try {
    const weeklyUsers = await prisma.notification_preferences.findMany({
      where: { digestFrequency: 'WEEKLY' },
      select: { userId: true }
    }).catch(() => []);

    logger.info(`Generating weekly digests for ${weeklyUsers.length} users`);

    for (const pref of weeklyUsers) {
      try {
        await generateDigest(pref.userId);
      } catch (error) {
        logger.error(`Failed to generate weekly digest for user ${pref.userId}`, {
          userId: pref.userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Weekly digest generation completed');
  } catch (error) {
    logger.error('Failed to generate weekly digests batch', error);
    Sentry.captureException(error, {
      tags: { service: 'digest', type: 'weekly_batch_failure' }
    });
  }
}

function getDigestStartDate(frequency: string): Date {
  const now = new Date();
  if (frequency === 'DAILY') {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  if (frequency === 'WEEKLY') {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  return now;
}

interface DigestContentData {
  user: DigestUser;
  frequency: string;
  auditEvents: any[];
  transactions: any[];
  rewards: any[];
  periodStart: Date;
}

function formatDigestContent(data: DigestContentData) {
  const { user, frequency, auditEvents, transactions, rewards, periodStart } = data;

  const textVersion = `
Hello ${user.firstName || user.email},

Here's your ${frequency.toLowerCase()} activity summary for Advancia Pay:

RECENT ACTIVITY (since ${periodStart.toLocaleDateString()}):
${auditEvents.length > 0 ?
  auditEvents.slice(0, 10).map(event =>
    `• ${event.action} - ${event.timestamp.toLocaleString()}`
  ).join('\\n') :
  '• No audit events this period'
}

TRANSACTIONS (${transactions.length}):
${transactions.length > 0 ?
  transactions.slice(0, 5).map(tx =>
    `• ${tx.type}: ${tx.amount} ${tx.currency || 'USD'} - ${tx.description || 'No description'}`
  ).join('\\n') :
  '• No transactions this period'
}

REWARDS EARNED (${rewards.length}):
${rewards.length > 0 ?
  rewards.map(reward =>
    `• ${reward.title}: ${reward.amount} ${reward.type}`
  ).join('\\n') :
  '• No rewards earned this period'
}

View your full dashboard: ${process.env.FRONTEND_URL}/dashboard

Best regards,
The Advancia Pay Team
  `.trim();

  const htmlVersion = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3B82F6;">Your ${frequency.toLowerCase()} activity digest</h2>
      <p>Hello ${user.firstName || user.email},</p>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Recent Activity</h3>
        ${auditEvents.length > 0 ?
          auditEvents.slice(0, 10).map(event =>
            `<p style="margin: 5px 0;">• ${event.action} - ${event.timestamp.toLocaleString()}</p>`
          ).join('') :
          '<p>No audit events this period</p>'
        }
      </div>

      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Transactions (${transactions.length})</h3>
        ${transactions.length > 0 ?
          transactions.slice(0, 5).map(tx =>
            `<p style="margin: 5px 0;">• <strong>${tx.type}:</strong> ${tx.amount} ${tx.currency || 'USD'} - ${tx.description || 'No description'}</p>`
          ).join('') :
          '<p>No transactions this period</p>'
        }
      </div>

      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Rewards Earned (${rewards.length})</h3>
        ${rewards.length > 0 ?
          rewards.map(reward =>
            `<p style="margin: 5px 0;">• <strong>${reward.title}:</strong> ${reward.amount} ${reward.type}</p>`
          ).join('') :
          '<p>No rewards earned this period</p>'
        }
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/dashboard"
           style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Full Dashboard
        </a>
      </div>

      <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
        This is your ${frequency.toLowerCase()} digest from Advancia Pay.
        <a href="${process.env.FRONTEND_URL}/settings/notifications">Manage preferences</a>
      </p>
    </div>
  `;

  return { textVersion, htmlVersion };
}
