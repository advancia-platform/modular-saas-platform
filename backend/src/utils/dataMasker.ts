import { envInspector } from "./envInspector";

/**
 * Data masking utilities for production environments
 * Masks sensitive information in API responses
 */

export class DataMasker {
  private isProduction = envInspector.isProduction();

  /**
   * Mask email address
   * john.doe@example.com -> j***@e*******
   */
  maskEmail(email: string): string {
    if (!this.isProduction || !email) return email;

    const [local, domain] = email.split("@");
    if (!domain) return email;

    const maskedLocal =
      local.length > 2
        ? local[0] + "*".repeat(local.length - 2) + local[local.length - 1]
        : "*".repeat(local.length);

    const maskedDomain =
      domain.length > 3
        ? domain[0] + "*".repeat(domain.length - 2) + domain[domain.length - 1]
        : domain;

    return `${maskedLocal}@${maskedDomain}`;
  }

  /**
   * Mask phone number
   * +1234567890 -> +1*****7890
   */
  maskPhone(phone: string): string {
    if (!this.isProduction || !phone) return phone;

    // Remove all non-digits
    const digits = phone.replace(/\D/g, "");

    if (digits.length < 4) return phone;

    const visibleStart = Math.min(2, Math.floor(digits.length / 4));
    const visibleEnd = Math.min(4, Math.floor(digits.length / 4));

    const start = digits.slice(0, visibleStart);
    const end = digits.slice(-visibleEnd);
    const masked = "*".repeat(digits.length - visibleStart - visibleEnd);

    return `${start}${masked}${end}`;
  }

  /**
   * Mask credit card number
   * 1234567890123456 -> **** **** **** 3456
   */
  maskCreditCard(cardNumber: string): string {
    if (!this.isProduction || !cardNumber) return cardNumber;

    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 4) return cardNumber;

    const lastFour = digits.slice(-4);
    const masked = "*".repeat(digits.length - 4);

    return `${masked}${lastFour}`;
  }

  /**
   * Mask wallet address
   * 0x1234567890abcdef -> 0x12****abcd
   */
  maskWalletAddress(address: string): string {
    if (!this.isProduction || !address) return address;

    if (address.length < 10) return address;

    const prefix = address.slice(0, 4);
    const suffix = address.slice(-4);
    const masked = "*".repeat(Math.min(8, address.length - 8));

    return `${prefix}${masked}${suffix}`;
  }

  /**
   * Mask generic string (show first and last few characters)
   */
  maskString(
    str: string,
    visibleStart: number = 2,
    visibleEnd: number = 2,
  ): string {
    if (!this.isProduction || !str || str.length <= visibleStart + visibleEnd)
      return str;

    const start = str.slice(0, visibleStart);
    const end = str.slice(-visibleEnd);
    const masked = "*".repeat(str.length - visibleStart - visibleEnd);

    return `${start}${masked}${end}`;
  }

  /**
   * Mask sensitive fields in an object
   */
  maskObject<T extends Record<string, any>>(
    obj: T,
    sensitiveFields: string[],
  ): T {
    if (!this.isProduction) return obj;

    const masked = { ...obj } as any;

    for (const field of sensitiveFields) {
      if (field in masked) {
        const value = masked[field];
        if (typeof value === "string") {
          masked[field] = this.maskString(value);
        }
      }
    }

    return masked as T;
  }

  /**
   * Mask user data for API responses
   */
  maskUserData(user: any): any {
    if (!this.isProduction) return user;

    return this.maskObject(user, [
      "passwordHash",
      "resetToken",
      "emailVerificationToken",
      "twoFactorSecret",
      "sessionToken",
    ]);
  }

  /**
   * Mask transaction data
   */
  maskTransactionData(transaction: any): any {
    if (!this.isProduction) return transaction;

    const masked = { ...transaction };

    // Mask sensitive transaction details
    if (masked.cardNumber) {
      masked.cardNumber = this.maskCreditCard(masked.cardNumber);
    }

    if (masked.walletAddress) {
      masked.walletAddress = this.maskWalletAddress(masked.walletAddress);
    }

    return masked;
  }

  /**
   * Create a response sanitizer middleware
   */
  createResponseSanitizer() {
    return (req: any, res: any, next: any) => {
      if (!this.isProduction) {
        return next();
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method to sanitize response
      res.json = (data: any) => {
        const sanitized = this.sanitizeResponseData(data);
        return originalJson.call(res, sanitized);
      };

      next();
    };
  }

  /**
   * Sanitize response data recursively
   */
  private sanitizeResponseData(data: any): any {
    if (!this.isProduction) return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeResponseData(item));
    }

    if (typeof data === "object" && data !== null) {
      const sanitized: any = {};

      for (const [key, value] of Object.entries(data)) {
        // Skip sensitive fields entirely in production
        if (this.isSensitiveField(key)) {
          continue;
        }

        // Mask specific field types
        if (key.includes("email") && typeof value === "string") {
          sanitized[key] = this.maskEmail(value);
        } else if (key.includes("phone") && typeof value === "string") {
          sanitized[key] = this.maskPhone(value);
        } else if (key.includes("card") && typeof value === "string") {
          sanitized[key] = this.maskCreditCard(value);
        } else if (key.includes("wallet") && typeof value === "string") {
          sanitized[key] = this.maskWalletAddress(value);
        } else {
          sanitized[key] = this.sanitizeResponseData(value);
        }
      }

      return sanitized;
    }

    return data;
  }

  /**
   * Check if a field name indicates sensitive data
   */
  private isSensitiveField(fieldName: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /hash/i,
      /salt/i,
      /private/i,
      /session/i,
      /auth/i,
    ];

    return sensitivePatterns.some((pattern) => pattern.test(fieldName));
  }
}

// Global data masker instance
export const dataMasker = new DataMasker();
