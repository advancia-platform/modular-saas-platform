import crypto from "crypto";
import { envInspector } from "./envInspector";

/**
 * Data encryption utilities for sensitive data storage
 * Uses AES-256-GCM encryption with unique IVs per encryption
 */

export class DataEncryptor {
  private algorithm = "aes-256-gcm";
  private keyLength = 32; // 256 bits
  private ivLength = 16; // 128 bits for GCM
  private tagLength = 16; // 128 bits auth tag

  /**
   * Get encryption key from environment
   */
  private getEncryptionKey(): Buffer {
    const keyHex = process.env.DATA_ENCRYPTION_KEY;

    if (!keyHex) {
      if (envInspector.isProduction()) {
        throw new Error("DATA_ENCRYPTION_KEY is required in production");
      }
      // Use a default key for development (NOT secure!)
      console.warn("⚠️  Using default encryption key for development");
      return crypto.scryptSync("dev-encryption-key", "salt", this.keyLength);
    }

    return Buffer.from(keyHex, "hex");
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(plainText: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);

      const cipher = crypto.createCipheriv(this.algorithm, key, iv) as any;
      let encrypted = cipher.update(plainText, "utf8", "hex");
      encrypted += cipher.final("hex");

      const authTag = cipher.getAuthTag();

      // Combine IV + Auth Tag + Encrypted Data
      const result = Buffer.concat([
        iv,
        authTag,
        Buffer.from(encrypted, "hex"),
      ]);

      return result.toString("base64");
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedText: string): string {
    try {
      const key = this.getEncryptionKey();
      const data = Buffer.from(encryptedText, "base64");

      // Extract components
      const iv = data.subarray(0, this.ivLength);
      const authTag = data.subarray(
        this.ivLength,
        this.ivLength + this.tagLength,
      );
      const encrypted = data.subarray(this.ivLength + this.tagLength);

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv) as any;
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted);
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error("Failed to decrypt data");
    }
  }

  /**
   * Encrypt object fields
   */
  encryptObjectFields<T extends Record<string, any>>(
    obj: T,
    fieldsToEncrypt: (keyof T)[],
  ): T {
    const encrypted = { ...obj };

    for (const field of fieldsToEncrypt) {
      if (field in encrypted && typeof encrypted[field] === "string") {
        encrypted[field] = this.encrypt(encrypted[field]) as any;
      }
    }

    return encrypted;
  }

  /**
   * Decrypt object fields
   */
  decryptObjectFields<T extends Record<string, any>>(
    obj: T,
    fieldsToDecrypt: (keyof T)[],
  ): T {
    const decrypted = { ...obj };

    for (const field of fieldsToDecrypt) {
      if (field in decrypted && typeof decrypted[field] === "string") {
        try {
          decrypted[field] = this.decrypt(decrypted[field]) as any;
        } catch (error) {
          // If decryption fails, keep the original value
          console.warn(`Failed to decrypt field ${String(field)}`);
        }
      }
    }

    return decrypted;
  }

  /**
   * Hash data (one-way) for passwords, etc.
   */
  hash(data: string, saltRounds: number = 12): Promise<string> {
    return new Promise((resolve, reject) => {
      // Use bcrypt for password hashing (already implemented)
      // This is just a wrapper for consistency
      const bcrypt = require("bcryptjs");
      bcrypt.hash(data, saltRounds, (err: Error, hash: string) => {
        if (err) reject(err);
        else resolve(hash);
      });
    });
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const bcrypt = require("bcryptjs");
      bcrypt.compare(data, hash, (err: Error, result: boolean) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}

// Global encryptor instance
export const dataEncryptor = new DataEncryptor();

/**
 * Database field encryption decorator
 * Can be used to automatically encrypt/decrypt specific fields
 */
export class EncryptedField {
  constructor(private encryptor: DataEncryptor = dataEncryptor) {}

  /**
   * Encrypt before saving to database
   */
  beforeSave(value: string): string {
    return this.encryptor.encrypt(value);
  }

  /**
   * Decrypt after loading from database
   */
  afterLoad(value: string): string {
    return this.encryptor.decrypt(value);
  }
}

/**
 * Secure random token generator
 */
export class TokenGenerator {
  /**
   * Generate a secure random token
   */
  static generate(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Generate a secure random string (URL-safe)
   */
  static generateUrlSafe(length: number = 32): string {
    return crypto.randomBytes(length).toString("base64url");
  }

  /**
   * Generate a UUID v4
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }
}
