import "dotenv/config";

/**
 * Simple R2 storage verification:
 * - Ensures required env vars set
 * - Attempts signed URL generation (HEAD-style pre-sign)
 * NOTE: Upload test is optional to avoid writing artifacts in pre-prod phase.
 */

const required = [
  "CLOUDFLARE_R2_ACCOUNT_ID",
  "CLOUDFLARE_R2_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
  "CLOUDFLARE_R2_BUCKET_NAME",
];

let missing: string[] = [];
for (const v of required) if (!process.env[v]) missing.push(v);

if (missing.length) {
  console.error("❌ R2 storage missing env vars:", missing.join(", "));
  process.exitCode = 1;
} else {
  console.log("✅ R2 env vars present");
}

// Try generating a signed URL using the service functions if initialized.
try {
  const {
    initR2Client,
    signedUrl,
  } = require("../src/services/r2StorageService");
  initR2Client();
  const testKey = "verify-storage-presign-test.txt";
  const url: string = signedUrl ? await signedUrl(testKey, 60) : "N/A";
  if (typeof url === "string" && url.startsWith("https://")) {
    console.log("✅ Signed URL generated:", url.split("?")[0]);
  } else {
    console.warn("⚠️  Signed URL not generated as expected");
  }
} catch (e: any) {
  console.error("❌ R2 signing test failed:", e.message);
  process.exitCode = 1;
}
