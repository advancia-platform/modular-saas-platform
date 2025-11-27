import cron from "node-cron";
import { sessionManager } from "../auth/sessionManager";
import { logger } from "../logger";

/**
 * Cleanup service for managing expired sessions and tokens
 */
export class CleanupService {
  private static instance: CleanupService;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): CleanupService {
    if (!CleanupService.instance) {
      CleanupService.instance = new CleanupService();
    }
    return CleanupService.instance;
  }

  /**
   * Start the cleanup cron jobs
   */
  public start(): void {
    if (this.isRunning) {
      logger.warn("Cleanup service is already running");
      return;
    }

    this.isRunning = true;

    // Run cleanup every hour
    cron.schedule(
      "0 * * * *",
      async () => {
        await this.performCleanup();
      },
      {
        name: "session-cleanup",
        timezone: "UTC",
      },
    );

    // Run deep cleanup daily at 2 AM UTC
    cron.schedule(
      "0 2 * * *",
      async () => {
        await this.performDeepCleanup();
      },
      {
        name: "daily-cleanup",
        timezone: "UTC",
      },
    );

    logger.info("Cleanup service started with hourly and daily schedules");
  }

  /**
   * Stop the cleanup service
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    // Destroy all cron tasks
    cron.getTasks().forEach((task, name) => {
      if (name === "session-cleanup" || name === "daily-cleanup") {
        task.destroy();
      }
    });

    this.isRunning = false;
    logger.info("Cleanup service stopped");
  }

  /**
   * Perform regular cleanup (hourly)
   */
  private async performCleanup(): Promise<void> {
    try {
      logger.info("Starting regular cleanup");

      const result = await sessionManager.cleanupExpiredSessions();

      logger.info(
        {
          sessionsDeleted: result.sessionsDeleted,
          tokensDeleted: result.tokensDeleted,
        },
        "Regular cleanup completed",
      );
    } catch (error: any) {
      logger.error(
        {
          error: error.message,
        },
        "Regular cleanup failed",
      );
    }
  }

  /**
   * Perform deep cleanup (daily)
   */
  private async performDeepCleanup(): Promise<void> {
    try {
      logger.info("Starting deep cleanup");

      // Run regular cleanup first
      const sessionResult = await sessionManager.cleanupExpiredSessions();

      // Clean up old audit logs (keep for 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      const auditLogCleanup = await prisma.auditLog.deleteMany({
        where: {
          timestamp: {
            lt: ninetyDaysAgo,
          },
        },
      });

      // Clean up old activity logs
      const activityLogCleanup = await prisma.activity_logs.deleteMany({
        where: {
          createdAt: {
            lt: ninetyDaysAgo,
          },
        },
      });

      // Clean up expired email signup tokens
      const expiredTokenCleanup = await prisma.user.updateMany({
        where: {
          emailSignupTokenExpiry: {
            lt: new Date(),
          },
        },
        data: {
          emailSignupToken: null,
          emailSignupTokenExpiry: null,
        },
      });

      await prisma.$disconnect();

      logger.info(
        {
          sessionsDeleted: sessionResult.sessionsDeleted,
          revokedTokensDeleted: sessionResult.tokensDeleted,
          auditLogsDeleted: auditLogCleanup.count,
          activityLogsDeleted: activityLogCleanup.count,
          expiredTokensCleared: expiredTokenCleanup.count,
        },
        "Deep cleanup completed",
      );
    } catch (error: any) {
      logger.error(
        {
          error: error.message,
        },
        "Deep cleanup failed",
      );
    }
  }

  /**
   * Manual cleanup trigger (for testing or manual execution)
   */
  public async manualCleanup(): Promise<{
    sessionsDeleted: number;
    tokensDeleted: number;
  }> {
    logger.info("Starting manual cleanup");
    const result = await sessionManager.cleanupExpiredSessions();
    logger.info(result, "Manual cleanup completed");
    return result;
  }

  /**
   * Get cleanup statistics
   */
  public async getCleanupStats(): Promise<{
    activeSessions: number;
    expiredSessions: number;
    revokedTokens: number;
    oldAuditLogs: number;
  }> {
    try {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      const now = new Date();
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const [activeSessions, expiredSessions, revokedTokens, oldAuditLogs] =
        await Promise.all([
          prisma.session.count({
            where: {
              isRevoked: false,
              isActive: true,
              expiresAt: {
                gt: now,
              },
            },
          }),
          prisma.session.count({
            where: {
              OR: [{ expiresAt: { lt: now } }, { isRevoked: true }],
            },
          }),
          prisma.revokedAccessToken.count({
            where: {
              exp: { lt: Math.floor(now.getTime() / 1000) },
            },
          }),
          prisma.auditLog.count({
            where: {
              timestamp: {
                lt: ninetyDaysAgo,
              },
            },
          }),
        ]);

      await prisma.$disconnect();

      return {
        activeSessions,
        expiredSessions,
        revokedTokens,
        oldAuditLogs,
      };
    } catch (error: any) {
      logger.error(
        {
          error: error.message,
        },
        "Failed to get cleanup stats",
      );
      throw error;
    }
  }

  /**
   * Check if the cleanup service is running
   */
  public isServiceRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const cleanupService = CleanupService.getInstance();
