// RPA Module - Configuration
// Centralized configuration for all RPA automation tasks

import dotenv from "dotenv";

dotenv.config();

export const rpaConfig = {
  // Transaction Processing
  transactionProcessing: {
    enabled: process.env.RPA_TRANSACTION_ENABLED === "true",
    batchSize: parseInt(process.env.RPA_TRANSACTION_BATCH_SIZE || "100"),
    scheduleInterval: process.env.RPA_TRANSACTION_INTERVAL || "*/5 * * * *", // Every 5 minutes
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
  },

  // KYC / Identity Verification
  kyc: {
    enabled: process.env.RPA_KYC_ENABLED === "true",
    ocrProvider: process.env.RPA_KYC_OCR_PROVIDER || "tesseract",
    verificationApi: process.env.RPA_KYC_API_URL,
    apiKey: process.env.RPA_KYC_API_KEY,
    supportedDocuments: ["passport", "drivers_license", "national_id"],
    autoApproveThreshold: 0.95, // 95% confidence
  },

  // Report Generation
  reportGeneration: {
    enabled: process.env.RPA_REPORTS_ENABLED === "true",
    scheduleInterval: process.env.RPA_REPORTS_INTERVAL || "0 0 * * *", // Daily at midnight
    reportTypes: ["balance", "crypto_recovery", "admin_actions", "transactions"],
    outputFormat: process.env.RPA_REPORTS_FORMAT || "pdf",
    recipients: (process.env.RPA_REPORTS_RECIPIENTS || "").split(",").filter(Boolean),
    storageLocation: process.env.RPA_REPORTS_STORAGE || "./reports",
  },

  // Email/SMS Notifications
  notifications: {
    enabled: process.env.RPA_NOTIFICATIONS_ENABLED === "true",
    email: {
      enabled: process.env.RPA_EMAIL_ENABLED === "true",
      provider: "nodemailer",
      from: process.env.EMAIL_USER,
      templates: "./templates/emails",
    },
    sms: {
      enabled: process.env.RPA_SMS_ENABLED === "true",
      provider: "twilio",
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
    throttle: {
      maxPerMinute: 60,
      maxPerHour: 500,
    },
  },

  // Data Backup & Sync
  dataBackup: {
    enabled: process.env.RPA_BACKUP_ENABLED === "true",
    scheduleInterval: process.env.RPA_BACKUP_INTERVAL || "0 2 * * *", // Daily at 2 AM
    backupLocation: process.env.RPA_BACKUP_LOCATION || "./backups",
    cloudSync: {
      enabled: process.env.RPA_CLOUD_SYNC_ENABLED === "true",
      provider: process.env.RPA_CLOUD_PROVIDER || "s3",
      bucket: process.env.RPA_CLOUD_BUCKET,
      region: process.env.RPA_CLOUD_REGION || "us-east-1",
    },
    retention: {
      daily: 7,
      weekly: 4,
      monthly: 12,
    },
  },

  // User Support Automation
  userSupport: {
    enabled: process.env.RPA_SUPPORT_ENABLED === "true",
    chatbot: {
      enabled: process.env.RPA_CHATBOT_ENABLED === "true",
      provider: process.env.RPA_CHATBOT_PROVIDER || "dialogflow",
      projectId: process.env.RPA_CHATBOT_PROJECT_ID,
      languages: ["en", "es"],
    },
    autoResponses: {
      enabled: true,
      responseTime: 2000, // 2 seconds
      escalationThreshold: 3, // Escalate after 3 failed responses
    },
  },

  // General RPA Settings
  general: {
    logLevel: process.env.RPA_LOG_LEVEL || "info",
    enableMetrics: process.env.RPA_METRICS_ENABLED === "true",
    metricsPort: parseInt(process.env.RPA_METRICS_PORT || "9090"),
    healthCheckEndpoint: "/rpa/health",
    maxConcurrentTasks: parseInt(process.env.RPA_MAX_CONCURRENT || "5"),
  },
};

export default rpaConfig;
