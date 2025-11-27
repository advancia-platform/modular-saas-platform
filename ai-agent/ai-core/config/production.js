/**
 * Production Configuration Manager
 * Handles environment-specific configuration for production deployment
 */

const fs = require("fs");
const path = require("path");

class ProductionConfig {
  constructor() {
    this.env = process.env.NODE_ENV || "development";
    this.isProduction = this.env === "production";

    // Load production configuration
    this.config = this.loadConfiguration();

    // Validate required configuration
    this.validateConfiguration();

    console.log(`🔧 Configuration loaded for: ${this.env}`);
  }

  loadConfiguration() {
    const config = {
      // Environment
      environment: this.env,
      isProduction: this.isProduction,

      // Server Configuration
      server: {
        host:
          process.env.AI_AGENT_HOST ||
          (this.isProduction ? "0.0.0.0" : "localhost"),
        port:
          parseInt(process.env.AI_AGENT_PORT) ||
          (this.isProduction ? 3001 : 3001),
        cors: {
          origin: this.isProduction
            ? process.env.CORS_ORIGINS?.split(",") || ["https://yourdomain.com"]
            : ["http://localhost:3000", "http://localhost:3002"],
          credentials: true,
        },
      },

      // Dashboard Configuration
      dashboard: {
        host:
          process.env.DASHBOARD_HOST ||
          (this.isProduction ? "0.0.0.0" : "localhost"),
        port:
          parseInt(process.env.DASHBOARD_PORT) ||
          (this.isProduction ? 3000 : 3002),
        url: this.isProduction
          ? process.env.DASHBOARD_URL || "https://yourdomain.com"
          : "http://localhost:3002",
      },

      // Integration Server Configuration
      integration: {
        host:
          process.env.INTEGRATION_SERVER_HOST ||
          (this.isProduction ? "0.0.0.0" : "localhost"),
        port:
          parseInt(process.env.INTEGRATION_SERVER_PORT) ||
          (this.isProduction ? 8000 : 8001),
        url: this.isProduction
          ? process.env.INTEGRATION_SERVER_URL || "https://api.yourdomain.com"
          : "http://localhost:8001",
      },

      // Database Configuration
      database: {
        url:
          process.env.DATABASE_URL ||
          (this.isProduction
            ? "postgresql://username:password@database:5432/cybersecurity_ai"
            : "postgresql://localhost:5432/cybersecurity_ai_dev"),
        maxConnections:
          parseInt(process.env.DB_MAX_CONNECTIONS) ||
          (this.isProduction ? 20 : 5),
        ssl: this.isProduction ? { rejectUnauthorized: false } : false,
      },

      // Redis Configuration
      redis: {
        url:
          process.env.REDIS_URL ||
          (this.isProduction
            ? "redis://:password@redis:6379"
            : "redis://localhost:6379"),
        ttl: parseInt(process.env.CACHE_TTL_SECONDS) || 300,
      },

      // AI Configuration
      ai: {
        confidenceThreshold:
          parseFloat(process.env.AI_CONFIDENCE_THRESHOLD) || 0.8,
        learningRate: parseFloat(process.env.AI_LEARNING_RATE) || 0.01,
        maxAnalysisTime:
          parseInt(process.env.AI_MAX_ANALYSIS_TIME) ||
          (this.isProduction ? 10000 : 30000),
        enableAutoResponse: process.env.AI_ENABLE_AUTO_RESPONSE === "true",
        maxConcurrentAnalyses:
          parseInt(process.env.MAX_CONCURRENT_ANALYSES) ||
          (this.isProduction ? 100 : 10),
      },

      // Security Configuration
      security: {
        jwtSecret: process.env.JWT_SECRET,
        encryptionKey: process.env.ENCRYPTION_KEY,
        sessionSecret: process.env.SESSION_SECRET,
        bcryptRounds:
          parseInt(process.env.BCRYPT_ROUNDS) || (this.isProduction ? 12 : 10),
        rateLimitRequests:
          parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE) ||
          (this.isProduction ? 1000 : 100),
        csrfProtection: this.isProduction,
        helmet: {
          enabled: this.isProduction,
          contentSecurityPolicy: this.isProduction,
          hsts: this.isProduction,
        },
      },

      // SSL Configuration
      ssl: {
        enabled: process.env.SSL_ENABLED === "true" && this.isProduction,
        certPath: process.env.SSL_CERT_PATH,
        keyPath: process.env.SSL_KEY_PATH,
      },

      // Logging Configuration
      logging: {
        level: process.env.LOG_LEVEL || (this.isProduction ? "info" : "debug"),
        format:
          process.env.LOG_FORMAT || (this.isProduction ? "json" : "simple"),
        file:
          process.env.LOG_FILE ||
          (this.isProduction ? "/var/log/cybersecurity-ai/app.log" : null),
        maxSize: process.env.LOG_MAX_SIZE || "100MB",
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 10,
        console: !this.isProduction,
      },

      // Monitoring Configuration
      monitoring: {
        healthCheckInterval:
          parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
        metricsEnabled:
          process.env.METRICS_COLLECTION_ENABLED === "true" ||
          this.isProduction,
        prometheusPort: parseInt(process.env.PROMETHEUS_METRICS_PORT) || 9090,
        uptimeTracking: this.isProduction,
      },

      // External Services
      external: {
        threatIntelligenceApiKey: process.env.THREAT_INTELLIGENCE_API_KEY,
        notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL,
        siemIntegrationUrl: process.env.SIEM_INTEGRATION_URL,
        alertWebhookUrl: process.env.ALERT_WEBHOOK_URL,
      },

      // Backup Configuration
      backup: {
        enabled: process.env.BACKUP_ENABLED === "true" || this.isProduction,
        schedule: process.env.BACKUP_SCHEDULE || "0 2 * * *",
        retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
        storagePath:
          process.env.BACKUP_STORAGE_PATH || "/var/backups/cybersecurity-ai",
      },

      // Alert Configuration
      alerts: {
        email: process.env.CRITICAL_ALERT_EMAIL,
        thresholds: {
          critical: parseFloat(process.env.ALERT_THRESHOLD_CRITICAL) || 0.9,
          high: parseFloat(process.env.ALERT_THRESHOLD_HIGH) || 0.7,
          medium: parseFloat(process.env.ALERT_THRESHOLD_MEDIUM) || 0.5,
        },
      },
    };

    return config;
  }

  validateConfiguration() {
    const requiredInProduction = [
      "security.jwtSecret",
      "security.encryptionKey",
      "security.sessionSecret",
    ];

    if (this.isProduction) {
      const missing = [];

      requiredInProduction.forEach((key) => {
        const value = this.getNestedValue(this.config, key);
        if (!value) {
          missing.push(key);
        }
      });

      if (missing.length > 0) {
        throw new Error(
          `Missing required production configuration: ${missing.join(", ")}`,
        );
      }

      // Validate secret lengths
      if (
        this.config.security.jwtSecret &&
        this.config.security.jwtSecret.length < 32
      ) {
        throw new Error("JWT_SECRET must be at least 32 characters long");
      }

      if (
        this.config.security.encryptionKey &&
        this.config.security.encryptionKey.length < 32
      ) {
        throw new Error("ENCRYPTION_KEY must be at least 32 characters long");
      }

      console.log("✅ Production configuration validated successfully");
    }
  }

  getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  get(key) {
    return this.getNestedValue(this.config, key);
  }

  getAll() {
    return { ...this.config };
  }

  // Security utilities
  getMaskedConfig() {
    const masked = JSON.parse(JSON.stringify(this.config));

    // Mask sensitive values
    if (masked.security) {
      if (masked.security.jwtSecret) masked.security.jwtSecret = "***MASKED***";
      if (masked.security.encryptionKey)
        masked.security.encryptionKey = "***MASKED***";
      if (masked.security.sessionSecret)
        masked.security.sessionSecret = "***MASKED***";
    }

    if (masked.database?.url) {
      masked.database.url = masked.database.url.replace(
        /:([^:@]+)@/,
        ":***MASKED***@",
      );
    }

    if (masked.redis?.url) {
      masked.redis.url = masked.redis.url.replace(
        /:([^:@]+)@/,
        ":***MASKED***@",
      );
    }

    return masked;
  }

  // Environment utilities
  isDevelopment() {
    return this.env === "development";
  }

  isTest() {
    return this.env === "test";
  }

  isProduction() {
    return this.env === "production";
  }

  // Configuration export for other modules
  static getInstance() {
    if (!ProductionConfig.instance) {
      ProductionConfig.instance = new ProductionConfig();
    }
    return ProductionConfig.instance;
  }
}

// Export singleton instance
module.exports = ProductionConfig.getInstance();
