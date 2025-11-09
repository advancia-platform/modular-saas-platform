import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Decrypt an AES-256-GCM encrypted .env bundle created by encrypt-env.ts
 *
 * Usage:
 *   npx tsx backend/scripts/secrets/decrypt-env.ts --in backend/.env.enc.json --out backend/.env
 *   SECRETS_PASSPHRASE must match the one used for encryption
 */

type EncBundle = {
  version: 1;
  alg: 'AES-256-GCM';
  kdf: 'scrypt';
  salt: string;
  iv: string;
  tag: string;
  ciphertext: string;
  createdAt: string;
  envFile?: string;
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
  return out as { in?: string; out?: string; backup?: boolean };
}

function fail(msg: string): never {
  console.error(`\u274c ${msg}`);
  process.exit(1);
}

async function main() {
  console.log('🔓 Decrypting secrets bundle...');

  const args = parseArgs(process.argv);
  const inPath = args.in || path.resolve(process.cwd(), 'backend/.env.enc.json');
  const outPath = args.out || path.resolve(process.cwd(), 'backend/.env');
  const passphrase = process.env.SECRETS_PASSPHRASE;

  if (!passphrase || passphrase.length < 8) {
    fail('SECRETS_PASSPHRASE is required and should be at least 8 characters.');
  }

  if (!fs.existsSync(inPath)) {
    fail(`Encrypted bundle not found at: ${inPath}`);
  }

  const raw = fs.readFileSync(inPath, 'utf8');
  let bundle: EncBundle;
  try {
    bundle = JSON.parse(raw);
  } catch (e) {
    fail('Invalid bundle JSON');
  }

  if (bundle.alg !== 'AES-256-GCM' || bundle.kdf !== 'scrypt' || bundle.version !== 1) {
    fail('Unsupported bundle format');
  }

  const salt = Buffer.from(bundle.salt, 'base64');
  const iv = Buffer.from(bundle.iv, 'base64');
  const tag = Buffer.from(bundle.tag, 'base64');
  const ciphertext = Buffer.from(bundle.ciphertext, 'base64');

  const key = crypto.scryptSync(passphrase, salt, 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  let plaintext: string;
  try {
    const dec = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    plaintext = dec.toString('utf8');
  } catch (e) {
    fail('Decryption failed. Check passphrase.');
  }

  // Write output, with backup if exists
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  if (fs.existsSync(outPath)) {
    const backupPath = `${outPath}.backup`;
    fs.copyFileSync(outPath, backupPath);
    console.log(`📦 Existing .env backed up to ${backupPath}`);
  }

  fs.writeFileSync(outPath, plaintext, 'utf8');
  console.log(`✅ Decrypted .env written to: ${outPath}`);
}

main().catch((err) => {
  console.error('Decryption failed:', err);
  process.exit(1);
});
