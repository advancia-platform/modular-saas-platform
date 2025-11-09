import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const { RENDER_SERVICE_ID, RENDER_API_KEY } = process.env;

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

async function main() {
  const fileArg = process.argv[2] || 'backend/.env.enc.json';
  const filePath = path.resolve(process.cwd(), fileArg);
  if (!RENDER_SERVICE_ID || !RENDER_API_KEY) fail('Missing RENDER_SERVICE_ID or RENDER_API_KEY');
  if (!fs.existsSync(filePath)) fail(`File not found: ${filePath}`);

  const encoded = fs.readFileSync(filePath, 'utf8');
  const res = await fetch(`https://api.render.com/v1/services/${RENDER_SERVICE_ID}/env-vars`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${RENDER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ envVars: [{ key: 'ENCRYPTED_ENV', value: encoded }] }),
  });
  if (!res.ok) fail(`Render API error: ${res.status} ${await res.text()}`);
  console.log('✅ Synced encrypted .env to Render environment as ENCRYPTED_ENV');
}

main().catch((e) => fail(e.message));
