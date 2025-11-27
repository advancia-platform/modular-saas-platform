import { generateOpaqueToken, hashToken, verifyTokenHash } from '../auth/crypto';
import { generateTotpQr, generateTotpSecret, verifyTotpToken } from '../services/totp';

describe('Enhanced Authentication System', () => {
  // Test crypto utilities
  describe('Crypto Utilities', () => {
    test('should generate opaque token', () => {
      const token = generateOpaqueToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    test('should hash and verify tokens', async () => {
      const plainToken = 'test-token-123';
      const hashedToken = await hashToken(plainToken);

      expect(hashedToken).toBeDefined();
      expect(hashedToken).not.toBe(plainToken);

      const isValid = await verifyTokenHash(plainToken, hashedToken);
      expect(isValid).toBe(true);

      const isInvalid = await verifyTokenHash('wrong-token', hashedToken);
      expect(isInvalid).toBe(false);
    });
  });

  // Test TOTP service
  describe('TOTP Service', () => {
    test('should import TOTP functions', () => {
      expect(generateTotpSecret).toBeDefined();
      expect(generateTotpQr).toBeDefined();
      expect(verifyTotpToken).toBeDefined();
    });

    test('should generate TOTP secret', () => {
      const secret = generateTotpSecret();
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
    });

    test('should generate QR code', async () => {
      const secret = generateTotpSecret();
      const qrCode = await generateTotpQr('test@example.com', secret, 'Test App');

      expect(qrCode).toBeDefined();
      expect(typeof qrCode).toBe('string');
      expect(qrCode.startsWith('data:image')).toBe(true);
    });
  });
});
