import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Generate an opaque refresh token
 * @param bytes - Number of random bytes to generate (default: 32)
 * @returns Base64URL-encoded opaque token
 */
export function generateOpaqueToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/**
 * Hash a token using bcrypt
 * @param token - Plain text token to hash
 * @returns Promise resolving to the hashed token
 */
export async function hashToken(token: string): Promise<string> {
  return await bcrypt.hash(token, 12);
}

/**
 * Verify a token against its hash
 * @param token - Plain text token to verify
 * @param hash - Hashed token to compare against
 * @returns Promise resolving to true if tokens match, false otherwise
 */
export async function verifyTokenHash(
  token: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(token, hash);
}

/**
 * Generate a secure random string for various purposes
 * @param length - Length of the generated string
 * @param encoding - Encoding type ('hex' | 'base64' | 'base64url')
 * @returns Random string
 */
export function generateSecureRandom(
  length: number = 32,
  encoding: "hex" | "base64" | "base64url" = "hex",
): string {
  const bytes = Math.ceil(length * 0.75); // Adjust for encoding overhead
  return crypto.randomBytes(bytes).toString(encoding).substring(0, length);
}

/**
 * Generate a JWT ID (jti) for token identification
 * @returns Random UUID-like string
 */
export function generateJti(): string {
  return crypto.randomUUID();
}

/**
 * Generate a secure backup code for 2FA
 * @returns 8-character alphanumeric backup code
 */
export function generateBackupCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate multiple backup codes
 * @param count - Number of backup codes to generate (default: 10)
 * @returns Array of backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateBackupCode());
  }
  return codes;
}

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @param rounds - Number of bcrypt rounds (default: 12)
 * @returns Promise resolving to the hashed password
 */
export async function hashPassword(
  password: string,
  rounds: number = 12,
): Promise<string> {
  return await bcrypt.hash(password, rounds);
}

/**
 * Verify a password against its hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns Promise resolving to true if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically secure random integer
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 * @returns Random integer between min and max
 */
export function generateSecureRandomInt(min: number, max: number): number {
  const range = max - min;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValid = Math.floor(256 ** bytesNeeded / range) * range;

  let randomValue: number;
  do {
    const randomBytes = crypto.randomBytes(bytesNeeded);
    randomValue = randomBytes.readUIntBE(0, bytesNeeded);
  } while (randomValue >= maxValid);

  return min + (randomValue % range);
}

/**
 * Constant-time string comparison to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal, false otherwise
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate a session fingerprint for device tracking
 * @param userAgent - User agent string
 * @param ip - IP address
 * @param additionalData - Additional data to include in fingerprint
 * @returns SHA-256 hash of the fingerprint data
 */
export function generateSessionFingerprint(
  userAgent?: string,
  ip?: string,
  additionalData?: Record<string, any>,
): string {
  const data = {
    userAgent: userAgent || "unknown",
    ip: ip || "unknown",
    ...additionalData,
  };

  const hash = crypto.createHash("sha256");
  hash.update(JSON.stringify(data));
  return hash.digest("hex");
}

/**
 * Derive a key from a password using PBKDF2
 * @param password - Input password
 * @param salt - Salt for key derivation
 * @param iterations - Number of iterations (default: 100000)
 * @param keyLength - Length of derived key in bytes (default: 32)
 * @returns Promise resolving to derived key as hex string
 */
export async function deriveKey(
  password: string,
  salt: string,
  iterations: number = 100000,
  keyLength: number = 32,
): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      iterations,
      keyLength,
      "sha256",
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey.toString("hex"));
      },
    );
  });
}
