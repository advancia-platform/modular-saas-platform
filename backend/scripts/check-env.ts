import dotenv from "dotenv";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

// Force override so local backend/.env wins over any globally-set env vars
const envPath = process.cwd() + "/backend/.env";
// Load via dotenv, then force-assign parsed values to ensure override
dotenv.config({ path: envPath, override: true });
try {
  const raw = fs.readFileSync(envPath, "utf8");
  const parsed = dotenv.parse(raw);
  for (const [k, v] of Object.entries(parsed)) {
    process.env[k] = v;
  }
} catch (e) {
  // ignore if file missing
}
const prisma = new PrismaClient();

async function main() {
  console.log("\n🔍 Checking environment variables...\n");
  console.log(`Using env file: ${envPath}`);

  const required = [
    "DATABASE_URL",
    "SMTP_USER",
    "SMTP_PASS",
    "NEXT_PUBLIC_API_URL"
  ];

  let ok = true;
  for (const key of required) {
    const val = process.env[key];
    if (!val) {
      console.error(`❌ Missing: ${key}`);
      ok = false;
    } else {
      const preview = val.length > 30 ? val.slice(0, 30) + "..." : val;
      console.log(`✅ ${key} = ${preview}`);
    }
  }

  // Flexible JWT secret check: allow plain, base64, or encrypted variants
  const hasPlain = !!process.env.JWT_SECRET;
  const hasBase64 = !!process.env.JWT_SECRET_BASE64;
  const hasEncrypted = !!process.env.JWT_SECRET_ENCRYPTED && !!process.env.JWT_ENCRYPTION_KEY && !!process.env.JWT_ENCRYPTION_IV;
  if (hasEncrypted) {
    console.log("✅ JWT secret provided via encrypted variables (JWT_SECRET_ENCRYPTED + key/iv)");
  } else if (hasBase64) {
    console.log("✅ JWT secret provided via base64 (JWT_SECRET_BASE64)");
  } else if (hasPlain) {
    console.log("✅ JWT secret provided via plain JWT_SECRET");
  } else {
    console.error("❌ Missing JWT secret. Provide one of: JWT_SECRET, JWT_SECRET_BASE64, or JWT_SECRET_ENCRYPTED + JWT_ENCRYPTION_KEY + JWT_ENCRYPTION_IV");
    ok = false;
  }

  // Quick sanity for Prisma URL format
  const dbUrl = process.env.DATABASE_URL || "";
  if (!/^postgres(ql)?:\/\//.test(dbUrl)) {
    console.error(`❌ DATABASE_URL must start with postgresql:// or postgres:// (current: ${dbUrl})`);
    ok = false;
  }

  // Stripe keys are optional in dev but required for payments
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("⚠️  STRIPE_SECRET_KEY not set. Payment endpoints will be disabled.");
  }
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn("⚠️  STRIPE_WEBHOOK_SECRET not set. Webhook verification will be disabled.");
  }

  console.log("\n🔗 Testing database connection...");
  try {
    await prisma.$connect();
    console.log("✅ Prisma connected successfully.\n");
  } catch (err: any) {
    console.error("❌ Prisma connection failed:", err?.message || err);
    ok = false;
  } finally {
    await prisma.$disconnect();
  }

  if (!ok) {
    console.error("⚠  Some environment settings are missing or invalid.\n");
    process.exit(1);
  } else {
    console.log("🎉 All checks passed. Environment is ready to run!");
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
