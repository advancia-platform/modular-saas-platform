/**
 * Job Queue System with SLA-Based Priority Routing
 *
 * Prevents slow jobs from blocking critical operations:
 * - HIGH Priority: Password resets, 2FA, login (< 1 second SLA)
 * - MEDIUM Priority: Payments, transactions (< 5 seconds SLA)
 * - LOW Priority: Reports, exports, analytics (< 5 minutes SLA)
 * - BATCH Priority: Bulk operations, cleanup (background)
 *
 * Features:
 * - Separate queues per SLA
 * - Retry with exponential backoff
 * - Dead letter queue for failures
 * - Rate limiting for external APIs
 * - Job throttling and batching
 */

import Bull, { Job, Queue, QueueOptions } from "bull";
import Redis from "ioredis";
import logger from "../logger";
import prisma from "../prismaClient";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export enum JobPriority {
  CRITICAL = 1, // < 1 second (auth, security)
  HIGH = 2, // < 5 seconds (payments, notifications)
  MEDIUM = 3, // < 30 seconds (transactions, updates)
  LOW = 4, // < 5 minutes (reports, exports)
  BATCH = 5, // Background (cleanup, analytics)
}

export enum JobType {
  // CRITICAL (< 1 second)
  SEND_OTP = "send_otp",
  SEND_PASSWORD_RESET = "send_password_reset",
  VERIFY_2FA = "verify_2fa",

  // HIGH (< 5 seconds)
  PROCESS_PAYMENT = "process_payment",
  SEND_PAYMENT_NOTIFICATION = "send_payment_notification",
  WEBHOOK_CRYPTOMUS = "webhook_cryptomus",
  WEBHOOK_NOWPAYMENTS = "webhook_nowpayments",

  // MEDIUM (< 30 seconds)
  UPDATE_TRANSACTION = "update_transaction",
  SEND_EMAIL = "send_email",
  SYNC_WALLET_BALANCE = "sync_wallet_balance",

  // LOW (< 5 minutes)
  GENERATE_REPORT = "generate_report",
  EXPORT_TRANSACTIONS = "export_transactions",
  CALCULATE_ANALYTICS = "calculate_analytics",

  // BATCH (background)
  CLEANUP_OLD_LOGS = "cleanup_old_logs",
  ARCHIVE_TRANSACTIONS = "archive_transactions",
  SEND_BULK_EMAILS = "send_bulk_emails",
  DATABASE_BACKUP = "database_backup",
}

interface JobData {
  type: JobType;
  priority: JobPriority;
  data: any;
  userId?: string;
  retryCount?: number;
  maxRetries?: number;
  timeout?: number;
}

interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  retries: number;
}

// ============================================================================
// REDIS CONNECTION
// ============================================================================

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

const redisClient = new Redis(redisConfig);

// ============================================================================
// QUEUE CONFIGURATION
// ============================================================================

const queueOptions: QueueOptions = {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed
    removeOnFail: 500, // Keep last 500 failed
    attempts: 3, // Default retry attempts
    backoff: {
      type: "exponential",
      delay: 2000, // Start with 2 seconds
    },
  },
};

// ============================================================================
// PRIORITY QUEUES
// ============================================================================

class JobQueueManager {
  private queues: Map<JobPriority, Queue> = new Map();
  private rateLimiters: Map<string, { count: number; resetAt: number }> =
    new Map();

  constructor() {
    this.initializeQueues();
    this.setupProcessors();
    this.setupEventHandlers();
  }

  private initializeQueues() {
    // Create separate queue for each priority
    this.queues.set(
      JobPriority.CRITICAL,
      new Bull("critical-jobs", {
        ...queueOptions,
        defaultJobOptions: {
          ...queueOptions.defaultJobOptions,
          priority: 1,
          timeout: 1000, // 1 second max
          attempts: 5, // More retries for critical
        },
      }),
    );

    this.queues.set(
      JobPriority.HIGH,
      new Bull("high-jobs", {
        ...queueOptions,
        defaultJobOptions: {
          ...queueOptions.defaultJobOptions,
          priority: 2,
          timeout: 5000, // 5 seconds max
          attempts: 3,
        },
      }),
    );

    this.queues.set(
      JobPriority.MEDIUM,
      new Bull("medium-jobs", {
        ...queueOptions,
        defaultJobOptions: {
          ...queueOptions.defaultJobOptions,
          priority: 3,
          timeout: 30000, // 30 seconds max
          attempts: 2,
        },
      }),
    );

    this.queues.set(
      JobPriority.LOW,
      new Bull("low-jobs", {
        ...queueOptions,
        defaultJobOptions: {
          ...queueOptions.defaultJobOptions,
          priority: 4,
          timeout: 300000, // 5 minutes max
          attempts: 1,
        },
      }),
    );

    this.queues.set(
      JobPriority.BATCH,
      new Bull("batch-jobs", {
        ...queueOptions,
        defaultJobOptions: {
          ...queueOptions.defaultJobOptions,
          priority: 5,
          timeout: 600000, // 10 minutes max
          attempts: 1,
        },
      }),
    );

    logger.info("Job queues initialized", {
      queues: Array.from(this.queues.keys()),
    });
  }

  // ==========================================================================
  // JOB PROCESSORS
  // ==========================================================================

  private setupProcessors() {
    // Process each queue with appropriate concurrency

    // CRITICAL: High concurrency, process immediately
    this.queues.get(JobPriority.CRITICAL)?.process(20, async (job: Job) => {
      return this.processJob(job, JobPriority.CRITICAL);
    });

    // HIGH: Medium concurrency
    this.queues.get(JobPriority.HIGH)?.process(10, async (job: Job) => {
      return this.processJob(job, JobPriority.HIGH);
    });

    // MEDIUM: Standard concurrency
    this.queues.get(JobPriority.MEDIUM)?.process(5, async (job: Job) => {
      return this.processJob(job, JobPriority.MEDIUM);
    });

    // LOW: Limited concurrency to not overload
    this.queues.get(JobPriority.LOW)?.process(2, async (job: Job) => {
      return this.processJob(job, JobPriority.LOW);
    });

    // BATCH: Single worker, run in background
    this.queues.get(JobPriority.BATCH)?.process(1, async (job: Job) => {
      return this.processJob(job, JobPriority.BATCH);
    });
  }

  // ==========================================================================
  // JOB EXECUTION
  // ==========================================================================

  private async processJob(
    job: Job<JobData>,
    priority: JobPriority,
  ): Promise<JobResult> {
    const startTime = Date.now();
    const jobData = job.data;

    try {
      logger.info("Processing job", {
        id: job.id,
        type: jobData.type,
        priority,
        attempt: job.attemptsMade + 1,
      });

      // Check rate limits for external API calls
      if (this.requiresRateLimit(jobData.type)) {
        await this.checkRateLimit(jobData.type);
      }

      // Execute job based on type
      const result = await this.executeJob(jobData);

      const duration = Date.now() - startTime;

      logger.info("Job completed", {
        id: job.id,
        type: jobData.type,
        duration,
        priority,
      });

      return {
        success: true,
        data: result,
        duration,
        retries: job.attemptsMade,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error("Job failed", {
        id: job.id,
        type: jobData.type,
        error: error.message,
        duration,
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts.attempts,
      });

      // If final attempt failed, send to dead letter queue
      if (job.attemptsMade + 1 >= (job.opts.attempts || 3)) {
        await this.sendToDeadLetterQueue(job, error);
      }

      throw error; // Re-throw to trigger Bull retry
    }
  }

  // ==========================================================================
  // JOB EXECUTION HANDLERS
  // ==========================================================================

  private async executeJob(jobData: JobData): Promise<any> {
    switch (jobData.type) {
      // CRITICAL JOBS
      case JobType.SEND_OTP:
        return this.sendOTP(jobData.data);

      case JobType.SEND_PASSWORD_RESET:
        return this.sendPasswordReset(jobData.data);

      case JobType.VERIFY_2FA:
        return this.verify2FA(jobData.data);

      // HIGH PRIORITY JOBS
      case JobType.PROCESS_PAYMENT:
        return this.processPayment(jobData.data);

      case JobType.SEND_PAYMENT_NOTIFICATION:
        return this.sendPaymentNotification(jobData.data);

      case JobType.WEBHOOK_CRYPTOMUS:
        return this.processCryptomusWebhook(jobData.data);

      case JobType.WEBHOOK_NOWPAYMENTS:
        return this.processNOWPaymentsWebhook(jobData.data);

      // MEDIUM PRIORITY JOBS
      case JobType.UPDATE_TRANSACTION:
        return this.updateTransaction(jobData.data);

      case JobType.SEND_EMAIL:
        return this.sendEmail(jobData.data);

      case JobType.SYNC_WALLET_BALANCE:
        return this.syncWalletBalance(jobData.data);

      // LOW PRIORITY JOBS
      case JobType.GENERATE_REPORT:
        return this.generateReport(jobData.data);

      case JobType.EXPORT_TRANSACTIONS:
        return this.exportTransactions(jobData.data);

      case JobType.CALCULATE_ANALYTICS:
        return this.calculateAnalytics(jobData.data);

      // BATCH JOBS
      case JobType.CLEANUP_OLD_LOGS:
        return this.cleanupOldLogs(jobData.data);

      case JobType.ARCHIVE_TRANSACTIONS:
        return this.archiveTransactions(jobData.data);

      case JobType.SEND_BULK_EMAILS:
        return this.sendBulkEmails(jobData.data);

      case JobType.DATABASE_BACKUP:
        return this.databaseBackup(jobData.data);

      default:
        throw new Error(`Unknown job type: ${jobData.type}`);
    }
  }

  // ==========================================================================
  // CRITICAL JOB HANDLERS (< 1 second)
  // ==========================================================================

  private async sendOTP(data: { email: string; code: string }): Promise<void> {
    // Import email service
    const emailService = (await import("../services/emailService.js")) as any;
    await emailService.sendOTPEmail(data.email, data.code);
  }

  private async sendPasswordReset(data: {
    email: string;
    token: string;
  }): Promise<void> {
    const emailService = (await import("../services/emailService.js")) as any;
    await emailService.sendPasswordResetEmail(data.email, data.token);
  }

  private async verify2FA(data: {
    userId: string;
    code: string;
  }): Promise<boolean> {
    const authService = (await import("../services/authService.js")) as any;
    return authService.verify2FACode(data.userId, data.code);
  }

  // ==========================================================================
  // HIGH PRIORITY JOB HANDLERS (< 5 seconds)
  // ==========================================================================

  private async processPayment(data: any): Promise<any> {
    const paymentService = (await import(
      "../services/paymentService.js"
    )) as any;
    return paymentService.processPaymentTransaction(data);
  }

  private async sendPaymentNotification(data: any): Promise<void> {
    const notificationService = (await import(
      "../services/notificationService.js"
    )) as any;
    await notificationService.sendNotification(data.userId, {
      type: "payment",
      title: "Payment Received",
      message: `You received $${data.amount}`,
    });
  }

  private async processCryptomusWebhook(data: any): Promise<any> {
    const cryptomusService = (await import(
      "../services/cryptomusService.js"
    )) as any;
    return cryptomusService.handleCryptomusWebhook(data);
  }

  private async processNOWPaymentsWebhook(data: any): Promise<any> {
    const nowpaymentsService = (await import(
      "../services/nowpaymentsService.js"
    )) as any;
    return nowpaymentsService.handleNOWPaymentsWebhook(data);
  }

  // ==========================================================================
  // MEDIUM PRIORITY JOB HANDLERS (< 30 seconds)
  // ==========================================================================

  private async updateTransaction(data: any): Promise<any> {
    return prisma.transactions.update({
      where: { id: data.transactionId },
      data: data.updates,
    });
  }

  private async sendEmail(data: {
    to: string;
    subject: string;
    body: string;
  }): Promise<void> {
    const emailService = (await import("../services/emailService.js")) as any;
    await emailService.sendEmail(data.to, data.subject, data.body);
  }

  private async syncWalletBalance(data: { walletId: string }): Promise<any> {
    const walletService = (await import("../services/walletService.js")) as any;
    return walletService.syncWalletBalance(data.walletId);
  }

  // ==========================================================================
  // LOW PRIORITY JOB HANDLERS (< 5 minutes)
  // ==========================================================================

  private async generateReport(data: any): Promise<string> {
    const reportService = (await import("../services/reportService.js")) as any;
    return reportService.generateTransactionReport(data);
  }

  private async exportTransactions(data: any): Promise<string> {
    const exportService = (await import("../services/exportService.js")) as any;
    return exportService.exportToCSV(data);
  }

  private async calculateAnalytics(data: any): Promise<any> {
    const analyticsService = (await import(
      "../services/analyticsService.js"
    )) as any;
    return analyticsService.calculateUserAnalytics(data);
  }

  // ==========================================================================
  // BATCH JOB HANDLERS (background)
  // ==========================================================================

  private async cleanupOldLogs(data: { daysOld: number }): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - data.daysOld);

    const result = await prisma.audit_logs.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  private async archiveTransactions(data: {
    daysOld: number;
  }): Promise<number> {
    // Archive old transactions to separate table/storage
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - data.daysOld);

    const transactions = await prisma.transactions.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: "completed",
      },
    });

    // Archive to cold storage (S3, etc.)
    // ... implementation

    return transactions.length;
  }

  private async sendBulkEmails(data: {
    emails: Array<{ to: string; subject: string; body: string }>;
  }): Promise<number> {
    let sent = 0;

    // Send in batches of 10 with delay
    for (let i = 0; i < data.emails.length; i += 10) {
      const batch = data.emails.slice(i, i + 10);

      await Promise.all(batch.map((email) => this.sendEmail(email)));

      sent += batch.length;

      // Wait between batches to avoid rate limits
      if (i + 10 < data.emails.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return sent;
  }

  private async databaseBackup(data: any): Promise<string> {
    const backupService = (await import("../services/backupService.js")) as any;
    return backupService.createBackup(data);
  }

  // ==========================================================================
  // RATE LIMITING FOR EXTERNAL APIs
  // ==========================================================================

  private requiresRateLimit(jobType: JobType): boolean {
    const rateLimitedJobs = [
      JobType.WEBHOOK_CRYPTOMUS,
      JobType.WEBHOOK_NOWPAYMENTS,
      JobType.SEND_EMAIL,
      JobType.SEND_BULK_EMAILS,
    ];

    return rateLimitedJobs.includes(jobType);
  }

  private async checkRateLimit(jobType: JobType): Promise<void> {
    const limits: Record<string, { max: number; windowMs: number }> = {
      [JobType.WEBHOOK_CRYPTOMUS]: { max: 100, windowMs: 60000 }, // 100/min
      [JobType.WEBHOOK_NOWPAYMENTS]: { max: 100, windowMs: 60000 }, // 100/min
      [JobType.SEND_EMAIL]: { max: 50, windowMs: 60000 }, // 50/min
      [JobType.SEND_BULK_EMAILS]: { max: 500, windowMs: 60000 }, // 500/min
    };

    const limit = limits[jobType];
    if (!limit) return;

    const limiter = this.rateLimiters.get(jobType);
    const now = Date.now();

    if (!limiter || limiter.resetAt < now) {
      // Reset window
      this.rateLimiters.set(jobType, {
        count: 1,
        resetAt: now + limit.windowMs,
      });
      return;
    }

    if (limiter.count >= limit.max) {
      // Rate limit exceeded, wait
      const waitMs = limiter.resetAt - now;
      logger.warn("Rate limit reached, waiting", {
        jobType,
        waitMs,
      });
      await new Promise((resolve) => setTimeout(resolve, waitMs));

      // Reset after wait
      this.rateLimiters.set(jobType, {
        count: 1,
        resetAt: Date.now() + limit.windowMs,
      });
    } else {
      // Increment counter
      limiter.count++;
    }
  }

  // ==========================================================================
  // DEAD LETTER QUEUE
  // ==========================================================================

  private async sendToDeadLetterQueue(job: Job, error: Error): Promise<void> {
    try {
      await prisma.failedJob.create({
        data: {
          jobId: job.id?.toString() || "unknown",
          type: job.data.type,
          priority: job.data.priority,
          data: JSON.stringify(job.data),
          error: error.message,
          stackTrace: error.stack || "",
          attempts: job.attemptsMade,
          failedAt: new Date(),
        },
      });

      logger.error("Job sent to dead letter queue", {
        id: job.id,
        type: job.data.type,
        error: error.message,
      });
    } catch (dlqError) {
      logger.error("Failed to send job to dead letter queue", dlqError);
    }
  }

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  private setupEventHandlers() {
    this.queues.forEach((queue, priority) => {
      queue.on("completed", (job: Job, result: JobResult) => {
        logger.info("Job completed", {
          id: job.id,
          type: job.data.type,
          priority,
          duration: result.duration,
        });
      });

      queue.on("failed", (job: Job, error: Error) => {
        logger.error("Job failed", {
          id: job.id,
          type: job.data.type,
          priority,
          error: error.message,
          attempt: job.attemptsMade,
        });
      });

      queue.on("stalled", (job: Job) => {
        logger.warn("Job stalled", {
          id: job.id,
          type: job.data.type,
          priority,
        });
      });
    });
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  async addJob(
    type: JobType,
    priority: JobPriority,
    data: any,
    options?: {
      delay?: number;
      timeout?: number;
      attempts?: number;
    },
  ): Promise<Job> {
    const queue = this.queues.get(priority);
    if (!queue) {
      throw new Error(`Queue not found for priority: ${priority}`);
    }

    const job = await queue.add(
      {
        type,
        priority,
        data,
      },
      options,
    );

    logger.info("Job added to queue", {
      id: job.id,
      type,
      priority,
    });

    return job;
  }

  async getJobStatus(jobId: string, priority: JobPriority): Promise<any> {
    const queue = this.queues.get(priority);
    if (!queue) return null;

    const job = await queue.getJob(jobId);
    if (!job) return null;

    return {
      id: job.id,
      type: job.data.type,
      priority: job.data.priority,
      state: await job.getState(),
      progress: job.progress(),
      attemptsMade: job.attemptsMade,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
    };
  }

  async getQueueMetrics(): Promise<any> {
    const metrics: any = {};

    for (const [priority, queue] of this.queues) {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);

      metrics[JobPriority[priority]] = {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
      };
    }

    return metrics;
  }

  async pauseQueue(priority: JobPriority): Promise<void> {
    const queue = this.queues.get(priority);
    await queue?.pause();
    logger.info("Queue paused", { priority });
  }

  async resumeQueue(priority: JobPriority): Promise<void> {
    const queue = this.queues.get(priority);
    await queue?.resume();
    logger.info("Queue resumed", { priority });
  }

  async close(): Promise<void> {
    await Promise.all(
      Array.from(this.queues.values()).map((queue) => queue.close()),
    );
    await redisClient.quit();
    logger.info("Job queue manager closed");
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const jobQueue = new JobQueueManager();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

// Critical jobs (< 1 second)
export const sendOTPJob = (email: string, code: string) =>
  jobQueue.addJob(JobType.SEND_OTP, JobPriority.CRITICAL, { email, code });

export const sendPasswordResetJob = (email: string, token: string) =>
  jobQueue.addJob(JobType.SEND_PASSWORD_RESET, JobPriority.CRITICAL, {
    email,
    token,
  });

// High priority jobs (< 5 seconds)
export const processPaymentJob = (paymentData: any) =>
  jobQueue.addJob(JobType.PROCESS_PAYMENT, JobPriority.HIGH, paymentData);

export const sendPaymentNotificationJob = (notificationData: any) =>
  jobQueue.addJob(
    JobType.SEND_PAYMENT_NOTIFICATION,
    JobPriority.HIGH,
    notificationData,
  );

// Medium priority jobs (< 30 seconds)
export const sendEmailJob = (to: string, subject: string, body: string) =>
  jobQueue.addJob(JobType.SEND_EMAIL, JobPriority.MEDIUM, {
    to,
    subject,
    body,
  });

// Low priority jobs (< 5 minutes)
export const generateReportJob = (reportData: any) =>
  jobQueue.addJob(JobType.GENERATE_REPORT, JobPriority.LOW, reportData);

export const exportTransactionsJob = (exportData: any) =>
  jobQueue.addJob(JobType.EXPORT_TRANSACTIONS, JobPriority.LOW, exportData);

// Batch jobs (background)
export const cleanupOldLogsJob = (daysOld: number) =>
  jobQueue.addJob(JobType.CLEANUP_OLD_LOGS, JobPriority.BATCH, { daysOld });

export const sendBulkEmailsJob = (emails: any[]) =>
  jobQueue.addJob(JobType.SEND_BULK_EMAILS, JobPriority.BATCH, { emails });
