import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const REGION = 'auto';
const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

async function main() {
  const fileArg = process.argv[2] || 'backend/.env.enc.json';
  const filePath = path.resolve(process.cwd(), fileArg);

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    fail('Missing R2 env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET');
  }
  if (!fs.existsSync(filePath)) fail(`File not found: ${filePath}`);

  const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const client = new S3Client({
    region: REGION,
    endpoint,
    forcePathStyle: false,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });

  const data = fs.readFileSync(filePath);
  const base = path.basename(filePath);
  const key = `backups/${new Date().toISOString().replace(/[:.]/g, '-')}-${base}`;
  const contentType = base.endsWith('.json') ? 'application/json' : 'text/plain';

  await client.send(
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: data, ContentType: contentType })
  );
  console.log(`✅ Uploaded ${base} to r2://${R2_BUCKET}/${key}`);
}

main().catch((e) => fail(e.message));
