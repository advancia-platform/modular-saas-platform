import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import "dotenv/config";
import fs from "fs";
import path from "path";

const REGION = "auto";
const {
  CLOUDFLARE_R2_ACCOUNT_ID,
  CLOUDFLARE_R2_ACCESS_KEY_ID,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  CLOUDFLARE_R2_BUCKET_NAME,
} = process.env;

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

async function main() {
  const fileArg = process.argv[2] || "backend/.env.enc.json";
  const filePath = path.resolve(process.cwd(), fileArg);

  if (
    !CLOUDFLARE_R2_ACCOUNT_ID ||
    !CLOUDFLARE_R2_ACCESS_KEY_ID ||
    !CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    !CLOUDFLARE_R2_BUCKET_NAME
  ) {
    fail(
      "Missing R2 env vars: CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET_NAME",
    );
  }
  if (!fs.existsSync(filePath)) fail(`File not found: ${filePath}`);

  const endpoint = `https://${CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const client = new S3Client({
    region: REGION,
    endpoint,
    forcePathStyle: false,
    credentials: {
      accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  });

  const data = fs.readFileSync(filePath);
  const base = path.basename(filePath);
  const key = `backups/${new Date().toISOString().replace(/[:.]/g, "-")}-${base}`;
  const contentType = base.endsWith(".json")
    ? "application/json"
    : "text/plain";

  await client.send(
    new PutObjectCommand({
      Bucket: CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      Body: data,
      ContentType: contentType,
    }),
  );
  console.log(
    `✅ Uploaded ${base} to r2://${CLOUDFLARE_R2_BUCKET_NAME}/${key}`,
  );
}

main().catch((e) => fail(e.message));
