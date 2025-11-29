import argon2 from 'argon2';
import bcrypt from 'bcryptjs';

// Detect hash type by prefix
function isArgon2Hash(hash: string) {
  return hash.startsWith('$argon2');
}
function isBcryptHash(hash: string) {
  return (
    hash.startsWith('$2a$') ||
    hash.startsWith('$2b$') ||
    hash.startsWith('$2y$')
  );
}

const ARGON2_OPTIONS: argon2.Options = {
  // Use Argon2id for balanced resistance to GPU and side-channel attacks
  type: argon2.argon2id,
  memoryCost: 19456, // ~19MB
  timeCost: 3,
  parallelism: 1,
};

export async function hashPassword(plain: string): Promise<string> {
  // Prefer Argon2id for new hashes
  return argon2.hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  try {
    if (isArgon2Hash(hash)) {
      return await argon2.verify(hash, plain);
    }
    if (isBcryptHash(hash)) {
      return await bcrypt.compare(plain, hash);
    }
    // Unknown format: try both
    if (await argon2.verify(hash, plain).catch(() => false)) return true;
    if (await bcrypt.compare(plain, hash).catch(() => false)) return true;
    return false;
  } catch {
    return false;
  }
}

export async function validateResetToken(token: string): Promise<boolean> {
  // TODO: Implement proper token validation with database lookup
  // For now, return true if token is not empty
  return token && token.length > 10;
}

export async function migratePasswordIfNeeded(plain: string, storedHash: string): Promise<string | null> {
  // If bcrypt, rehash to Argon2 on next successful login
  if (isBcryptHash(storedHash)) {
    const ok = await bcrypt.compare(plain, storedHash).catch(() => false);
    if (ok) {
      const newHash = await hashPassword(plain);
      return newHash;
    }
  }
  return null;
}
