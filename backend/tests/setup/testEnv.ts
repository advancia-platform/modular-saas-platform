import dotenv from "dotenv";
import path from "path";

/**
 * Load test environment variables
 * Call this at the top of test files that need external API credentials
 */
export function loadTestEnv() {
  dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });

  // Set defaults for missing test env vars
  process.env.NODE_ENV = process.env.NODE_ENV || "test";
  process.env.API_KEY = process.env.API_KEY || "test-api-key-12345";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";

  // Mock external API keys (replace with real ones in CI/CD)
  process.env.CRYPTOMUS_API_KEY =
    process.env.CRYPTOMUS_API_KEY || "mock-cryptomus-api-key";
  process.env.CRYPTOMUS_MERCHANT_ID =
    process.env.CRYPTOMUS_MERCHANT_ID || "mock-merchant-id";

  // Mock email credentials
  process.env.EMAIL_USER = process.env.EMAIL_USER || "test@example.com";
  process.env.EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || "mock-password";
  process.env.SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
  process.env.SMTP_PORT = process.env.SMTP_PORT || "587";

  // Mock Stripe credentials
  process.env.STRIPE_SECRET_KEY =
    process.env.STRIPE_SECRET_KEY || "sk_test_mock";
  process.env.STRIPE_WEBHOOK_SECRET =
    process.env.STRIPE_WEBHOOK_SECRET || "whsec_mock";

  // Ethereum provider
  process.env.ETH_PROVIDER_URL =
    process.env.ETH_PROVIDER_URL || "https://cloudflare-eth.com";
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
}

/**
 * Check if we should use real APIs in tests
 */
export function useRealAPIs(): boolean {
  return process.env.USE_REAL_APIS === "true";
}

/**
 * Skip test if external credentials are not available
 */
export function skipIfNoCredentials(serviceName: string, envVars: string[]) {
  const missing = envVars.filter(
    (v) => !process.env[v] || process.env[v]?.startsWith("mock-"),
  );

  if (missing.length > 0 && !isCI() && !useRealAPIs()) {
    return {
      skip: true,
      reason: `Missing ${serviceName} credentials: ${missing.join(", ")}. Set in .env.test or USE_REAL_APIS=true.`,
    };
  }

  return { skip: false };
}

/**
 * Get test API key
 */
export function getTestAPIKey(): string {
  return process.env.API_KEY || "test-api-key-12345";
}

/**
 * Get test JWT secret
 * Matches the JWT secret that the auth middleware will use
 */
export function getTestJWTSecret(): string {
  // Use the same JWT_SECRET that config/index.ts will use
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "test-jwt-secret-for-testing-only-min-32-chars-required";
  }
  return process.env.JWT_SECRET;
}

/**
 * Check if a service is available for testing
 */
export function isServiceAvailable(
  service: "cryptomus" | "email" | "stripe" | "blockchain",
): boolean {
  const serviceEnvVars = {
    cryptomus: ["CRYPTOMUS_API_KEY", "CRYPTOMUS_MERCHANT_ID"],
    email: ["EMAIL_USER", "EMAIL_PASSWORD"],
    stripe: ["STRIPE_SECRET_KEY"],
    blockchain: ["ETH_PROVIDER_URL"],
  };

  const requiredVars = serviceEnvVars[service];
  return requiredVars.every(
    (v) => process.env[v] && !process.env[v]?.startsWith("mock-"),
  );
}

/**
 * Get test timeout based on environment
 */
export function getTestTimeout(): number {
  if (isCI()) return 30000; // 30s in CI
  if (useRealAPIs()) return 60000; // 60s for real API calls
  return 10000; // 10s for mocked tests
}

/**
 * Validate test environment setup
 */
export function validateTestEnvironment(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is not set");
  }

  if (!process.env.JWT_SECRET) {
    errors.push("JWT_SECRET is not set");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
