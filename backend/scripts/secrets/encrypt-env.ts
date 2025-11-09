import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Encrypt a .env file with AES-256-GCM using a passphrase-derived key (scrypt).
 *
 * Usage:
 *   npx tsx backend/scripts/secrets/encrypt-env.ts --in backend/.env --out backend/.env.enc.json
 *   # Pass the passphrase via environment variable SECRETS_PASSPHRASE to avoid CLI exposure
 */

type EncBundle = {
  version: 1;
  alg: 'AES-256-GCM';
  kdf: 'scrypt';
  salt: string; // base64
  iv: string;   // base64 (12 bytes)
  tag: string;  // base64 (16 bytes GCM tag)
  ciphertext: string; // base64
  createdAt: string; // ISO
  envFile?: string; // relative path for reference
};

function parseArgs(argv: string[]) {
  const out: Record<string, string | boolean> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.includes('=') ? a.split('=') : [a, argv[i + 1]];
      const key = k.replace(/^--/, '');
      if (v && !v.startsWith('--')) {
        out[key] = v;
        i++;
      } else {
        out[key] = true;
      }
    }
  }
  return out as { in?: string; out?: string };
}

function fail(msg: string): never {
  console.error(`\u274c ${msg}`);
  process.exit(1);
}

async function main() {
  console.log('🔒 Encrypting .env with AES-256-GCM...');

  const args = parseArgs(process.argv);
  const envPath = args.in || path.resolve(process.cwd(), 'backend/.env');
  const outPath = args.out || path.resolve(process.cwd(), 'backend/.env.enc.json');
  const passphrase = process.env.SECRETS_PASSPHRASE;

  if (!passphrase || passphrase.length < 8) {
    fail('SECRETS_PASSPHRASE is required and should be at least 8 characters.');
  }

  if (!fs.existsSync(envPath)) {
    fail(`Input .env not found at: ${envPath}`);
  }

  const plaintext = fs.readFileSync(envPath, 'utf8');

  // Derive key with scrypt
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(passphrase, salt, 32); // 32 bytes for AES-256

  // Encrypt with AES-256-GCM
  const iv = crypto.randomBytes(12); // 96-bit nonce recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const bundle: EncBundle = {
    version: 1,
    alg: 'AES-256-GCM',
    kdf: 'scrypt',
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: enc.toString('base64'),
    createdAt: new Date().toISOString(),
    envFile: path.relative(process.cwd(), envPath).replace(/\\/g, '/'),
  };

  // Ensure out dir exists
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(bundle, null, 2), 'utf8');
  console.log(`✅ Encrypted secrets written to: ${outPath}`);
  console.log('ℹ️  Do not commit this file unless you intend to store encrypted secrets in VCS.');
}

main().catch((err) => {
  console.error('Encryption failed:', err);
  process.exit(1);
});
