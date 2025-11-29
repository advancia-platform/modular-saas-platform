import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

/**
 * Decrypt an encrypted JWT secret
 */
function decryptSecret(
  encrypted: string,
  keyHex: string,
  ivHex: string,
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
        process.env.JWT_ENCRYPTION_IV,
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
      // React Native development (iOS Simulator, Android Emulator, Expo)
      "http://localhost:19000",
      "http://localhost:19006",
      "http://10.0.2.2:4000", // Android Emulator
      "http://localhost:8081", // React Native Metro bundler
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

/**
 * Get proxy configuration from environment
 */
function getProxyConfig() {
  const enabled = process.env.PROXY_ENABLED === "true";

  if (!enabled) {
    return {
      enabled: false,
      type: "http" as const,
      host: "",
      port: 0,
    };
  }

  const type = (process.env.PROXY_TYPE || "http") as
    | "http"
    | "https"
    | "socks4"
    | "socks5";
  const host = process.env.PROXY_HOST || "";
  const port = parseInt(process.env.PROXY_PORT || "8080", 10);
  const username = process.env.PROXY_USERNAME;
  const password = process.env.PROXY_PASSWORD;
  const bypass = process.env.PROXY_BYPASS
    ? process.env.PROXY_BYPASS.split(",").map((s) => s.trim())
    : ["localhost", "127.0.0.1"];

  const config = {
    enabled: true,
    type,
    host,
    port,
    bypass,
    ...(username && password ? { auth: { username, password } } : {}),
  };

  console.log(`🌐 Proxy enabled: ${type}://${host}:${port}`);
  if (bypass.length > 0) {
    console.log(`   Bypass domains: ${bypass.join(", ")}`);
  }

  return config;
}

export const config: {
  port: number;
  frontendUrl: string;
  allowedOrigins: string[];
  databaseUrl: string | undefined;
  redisUrl: string | undefined;
  jwtSecret: string;
  jwtExpiration: string;
  sessionSecret: string;
  nodeEnv: string;
  stripeSecretKey: string | undefined;
  stripeWebhookSecret: string | undefined;
  proxy: any;
  telegram: {
    botToken: string | undefined;
    chatId: string | undefined;
  };
  r2: {
    accountId: string | undefined;
    accessKeyId: string | undefined;
    secretAccessKey: string | undefined;
    bucketName: string;
    endpoint: string | undefined;
    publicUrl: string | undefined;
    region: string;
  };
} = {
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
  proxy: getProxyConfig(),
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  r2: {
    accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID,
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || "advancia-uploads",
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL,
    region: "auto",
  },
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
    "⚠️  STRIPE_SECRET_KEY not set. Payment endpoints will be disabled.",
  );
}
