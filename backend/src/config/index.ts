import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

/**
 * Decrypt an encrypted JWT secret
 */
function decryptSecret(
  encrypted: string,
  keyHex: string,
  ivHex: string
): string {
  const algorithm = "aes-256-cbc";
  const key = Buffer.from(keyHex, "hex");
  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Decode a Base64 encoded secret
 */
function decodeBase64Secret(base64Secret: string): string {
  return Buffer.from(base64Secret, "base64").toString("utf8");
}

/**
 * Get JWT secret from environment with support for encrypted values
 */
export function getJwtSecret(): string {
  // Priority 1: Encrypted secret
  if (
    process.env.JWT_SECRET_ENCRYPTED &&
    process.env.JWT_ENCRYPTION_KEY &&
    process.env.JWT_ENCRYPTION_IV
  ) {
    try {
      const secret = decryptSecret(
        process.env.JWT_SECRET_ENCRYPTED,
        process.env.JWT_ENCRYPTION_KEY,
        process.env.JWT_ENCRYPTION_IV
      );
      console.log("✅ Using encrypted JWT secret");
      return secret;
    } catch (error) {
      console.error("❌ Failed to decrypt JWT secret:", error);
      throw new Error("Failed to decrypt JWT secret");
    }
  }

  // Priority 2: Base64 encoded secret
  if (process.env.JWT_SECRET_BASE64) {
    try {
      const secret = decodeBase64Secret(process.env.JWT_SECRET_BASE64);
      console.log("✅ Using Base64 encoded JWT secret");
      return secret;
    } catch (error) {
      console.error("❌ Failed to decode Base64 JWT secret:", error);
      throw new Error("Failed to decode Base64 JWT secret");
    }
  }

  // Priority 3: Plain secret
  if (process.env.JWT_SECRET) {
    console.log("✅ Using plain JWT secret");
    return process.env.JWT_SECRET;
  }

  throw new Error("No JWT secret found in environment variables");
}

/**
 * Get allowed CORS origins
 * Supports multiple origins for production domain and development
 */
function getAllowedOrigins(): string[] {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const set = new Set<string>();
  if (frontendUrl) set.add(frontendUrl);

  // Add production domain defaults (legacy)
  if (process.env.NODE_ENV === "production") {
    set.add("https://advanciapayledger.com");
    set.add("https://www.advanciapayledger.com");
  }

  // Add localhost variants for development
  if (process.env.NODE_ENV !== "production") {
    [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    ].forEach((o) => set.add(o));
  }

  // Merge explicit ALLOWED_ORIGINS env (comma-separated)
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    envOrigins
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((o) => set.add(o));
  }

  return [...set];
}

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  allowedOrigins: getAllowedOrigins(),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  jwtSecret: getJwtSecret(),
  jwtExpiration: process.env.JWT_EXPIRATION || "7d",
  sessionSecret: process.env.SESSION_SECRET || getJwtSecret(),
  nodeEnv: process.env.NODE_ENV || "development",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};

// Validate required configuration
if (!config.databaseUrl) {
  throw new Error("DATABASE_URL is required in environment variables");
}

console.log("🔧 Configuration loaded successfully");
console.log(`   Port: ${config.port}`);
console.log(`   Environment: ${config.nodeEnv}`);
console.log(`   Frontend URL: ${config.frontendUrl}`);
console.log(`   Allowed CORS Origins: ${config.allowedOrigins.join(", ")}`);
if (!config.stripeSecretKey) {
  console.warn(
    "⚠️  STRIPE_SECRET_KEY not set. Payment endpoints will be disabled."
  );
}

