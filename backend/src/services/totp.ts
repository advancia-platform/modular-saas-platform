import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { logger } from '../logger';

interface TotpSecret {
  ascii: string;
  hex: string;
  base32: string;
  otpauth_url: string;
}

/**
 * Generate a new TOTP secret for a user
 */
export function generateTotpSecret(label: string, userEmail: string): TotpSecret {
  try {
    const secret = speakeasy.generateSecret({
      name: `${label} (${userEmail})`,
      length: 20, // 160-bit secret for security
      issuer: process.env.TOTP_ISSUER || 'Advancia Pay',
    });

    logger.info('Generated TOTP secret', { userEmail, label });
    return secret;
  } catch (error) {
    logger.error('Failed to generate TOTP secret', { error, userEmail });
    throw new Error('Failed to generate TOTP secret');
  }
}

/**
 * Generate QR code data URL for TOTP setup
 */
export async function generateTotpQr(otpauthUrl: string): Promise<string> {
  try {
    return await qrcode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    logger.error('Failed to generate TOTP QR code', { error });
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify a TOTP token against the user's secret
 */
export function verifyTotpToken(base32Secret: string, token: string): boolean {
  try {
    const verified = speakeasy.totp.verify({
      secret: base32Secret,
      encoding: 'base32',
      token,
      window: 1, // Allow ±30 second drift
    });

    logger.debug('TOTP verification result', { verified, tokenLength: token.length });
    return verified;
  } catch (error) {
    logger.error('TOTP verification failed', { error, tokenLength: token?.length });
    return false;
  }
}

/**
 * Generate current TOTP token for testing purposes
 */
export function generateTotpToken(base32Secret: string): string {
  return speakeasy.totp({
    secret: base32Secret,
    encoding: 'base32',
  });
}

/**
 * Validate TOTP token format
 */
export function isValidTotpFormat(token: string): boolean {
  return /^\d{6}$/.test(token);
}
