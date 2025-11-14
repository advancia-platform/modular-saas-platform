import { z } from "zod";

/**
 * Environment variable validation schema
 */
const createEnvSchema = () => {
  const isTest = process.env.NODE_ENV === "test";

  // In test mode, be more lenient with validation
  return z.object({
    // Database
    DATABASE_URL: isTest
      ? z.string().optional()
      : z.string().url("DATABASE_URL must be a valid URL"),

    // JWT
    JWT_SECRET: z
      .string()
      .min(
        isTest ? 1 : 32,
        isTest
          ? "JWT_SECRET required"
          : "JWT_SECRET must be at least 32 characters",
      )
      .optional(),
    JWT_SECRET_ENCRYPTED: z.string().optional(),
    JWT_SECRET_BASE64: z.string().optional(),
    JWT_ENCRYPTION_KEY: z.string().optional(),
    JWT_ENCRYPTION_IV: z.string().optional(),
    JWT_EXPIRATION: z.string().default("7d"),

    // Server
    PORT: z
      .string()
      .transform((val) => parseInt(val, 10))
      .default("4000"),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    FRONTEND_URL: isTest
      ? z.string().optional()
      : z
          .string()
          .url("FRONTEND_URL must be a valid URL")
          .default("http://localhost:3000"),
    ALLOWED_ORIGINS: z.string().optional(),

    // Redis
    REDIS_URL: z.string().optional(),

    // Stripe
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),

    // Email
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z
      .string()
      .transform((val) => parseInt(val, 10))
      .optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email").optional(),

    // Session
    SESSION_SECRET: z
      .string()
      .min(
        isTest ? 1 : 32,
        isTest
          ? "SESSION_SECRET required"
          : "SESSION_SECRET must be at least 32 characters",
      )
      .optional(),

    // Security
    BCRYPT_ROUNDS: z
      .string()
      .transform((val) => parseInt(val, 10))
      .default("10"),
    RATE_LIMIT_WINDOW_MS: z
      .string()
      .transform((val) => parseInt(val, 10))
      .default("60000"),
    RATE_LIMIT_MAX_REQUESTS: z
      .string()
      .transform((val) => parseInt(val, 10))
      .default("300"),

    // Crypto
    BTC_ADDRESS: z.string().optional(),
    ETH_ADDRESS: z.string().optional(),
    CRYPTOMUS_API_KEY: z.string().optional(),
    CRYPTOMUS_MERCHANT_ID: z.string().optional(),

    // External APIs
    RESEND_API_KEY: z.string().optional(),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_PHONE_NUMBER: z.string().optional(),

    // Monitoring
    SENTRY_DSN: z.string().optional(),
  });
};

const envSchema = createEnvSchema();

/**
 * Validate environment variables
 */
export function validateEnvironment(): z.infer<typeof envSchema> {
  try {
    const env = envSchema.parse(process.env);
    console.log("✅ Environment variables validated successfully");
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment validation failed:");
      error.errors.forEach((err) => {
        console.error(`   ${err.path.join(".")}: ${err.message}`);
      });
      throw new Error("Environment validation failed");
    }
    throw error;
  }
}

/**
 * Environment inspection utility
 */
export class EnvironmentInspector {
  private validatedEnv: z.infer<typeof envSchema>;

  constructor() {
    this.validatedEnv = validateEnvironment();
  }

  /**
   * Get validated environment
   */
  get env() {
    return this.validatedEnv;
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.validatedEnv.NODE_ENV === "production";
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.validatedEnv.NODE_ENV === "development";
  }

  /**
   * Check if running in test environment
   */
  isTest(): boolean {
    return this.validatedEnv.NODE_ENV === "test";
  }

  /**
   * Get security level based on environment
   */
  getSecurityLevel(): "high" | "medium" | "low" {
    if (this.isProduction()) {
      return "high";
    }
    if (this.isTest()) {
      return "low";
    }
    return "medium";
  }

  /**
   * Check if all required services are configured
   */
  checkServiceAvailability(): {
    database: boolean;
    redis: boolean;
    stripe: boolean;
    email: boolean;
    crypto: boolean;
    monitoring: boolean;
  } {
    return {
      database: !!this.validatedEnv.DATABASE_URL,
      redis: !!this.validatedEnv.REDIS_URL,
      stripe: !!(
        this.validatedEnv.STRIPE_SECRET_KEY &&
        this.validatedEnv.STRIPE_WEBHOOK_SECRET
      ),
      email: !!(this.validatedEnv.SMTP_HOST && this.validatedEnv.SMTP_USER),
      crypto: !!(
        this.validatedEnv.BTC_ADDRESS && this.validatedEnv.ETH_ADDRESS
      ),
      monitoring: !!this.validatedEnv.SENTRY_DSN,
    };
  }

  /**
   * Log environment inspection results
   */
  logInspection(): void {
    console.log("\n🔍 Environment Inspection Results:");
    console.log(`   Environment: ${this.validatedEnv.NODE_ENV}`);
    console.log(`   Security Level: ${this.getSecurityLevel()}`);

    const services = this.checkServiceAvailability();
    console.log("\n📊 Service Availability:");
    Object.entries(services).forEach(([service, available]) => {
      const status = available ? "✅" : "❌";
      console.log(`   ${service}: ${status}`);
    });

    // Warn about missing critical services
    const criticalServices = ["database"];
    const missingCritical = criticalServices.filter(
      (service) => !services[service as keyof typeof services],
    );

    if (missingCritical.length > 0) {
      console.warn(
        `\n⚠️  Critical services missing: ${missingCritical.join(", ")}`,
      );
    }

    // Warn about production without proper security
    if (this.isProduction()) {
      const prodWarnings: string[] = [];

      if (!services.stripe) prodWarnings.push("Stripe not configured");
      if (!services.email) prodWarnings.push("Email not configured");
      if (!services.monitoring) prodWarnings.push("Monitoring not configured");

      if (prodWarnings.length > 0) {
        console.warn(`\n⚠️  Production warnings: ${prodWarnings.join(", ")}`);
      }
    }
  }
}

// Global environment inspector instance
export const envInspector = new EnvironmentInspector();
