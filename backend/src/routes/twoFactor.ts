import { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/2fa/setup - Initialize 2FA for user
router.post('/setup', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Check if 2FA already enabled
    const existing = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (existing && existing.enabled) {
      return res.status(400).json({ error: '2FA already enabled for this user' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Advancia Pay Ledger (${userId})`,
      length: 32
    });

    // Generate backup codes (10 codes)
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Save or update 2FA record
    const twoFactorAuth = await prisma.twoFactorAuth.upsert({
      where: { userId },
      create: {
        userId,
        secret: secret.base32,
        enabled: false,
        backupCodes
      },
      update: {
        secret: secret.base32,
        backupCodes
      }
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes,
      message: 'Scan QR code with your authenticator app'
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

// POST /api/auth/2fa/verify - Verify and enable 2FA
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: 'User ID and token required' });
    }

    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFactorAuth) {
      return res.status(404).json({ error: '2FA not set up for this user' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: twoFactorAuth.secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps (60 seconds) tolerance
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Enable 2FA
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: { enabled: true }
    });

    res.json({
      success: true,
      message: '2FA enabled successfully'
    });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
});

// POST /api/auth/2fa/validate - Validate 2FA code during login
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: 'User ID and token required' });
    }

    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFactorAuth || !twoFactorAuth.enabled) {
      return res.status(404).json({ error: '2FA not enabled for this user' });
    }

    // Check if it's a backup code
    if (twoFactorAuth.backupCodes.includes(token.toUpperCase())) {
      // Remove used backup code
      const updatedCodes = twoFactorAuth.backupCodes.filter(
        code => code !== token.toUpperCase()
      );

      await prisma.twoFactorAuth.update({
        where: { userId },
        data: { backupCodes: updatedCodes }
      });

      return res.json({
        success: true,
        method: 'backup_code',
        message: 'Backup code accepted. Please generate new backup codes.'
      });
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: twoFactorAuth.secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid authentication code' });
    }

    res.json({
      success: true,
      method: 'totp',
      message: '2FA validation successful'
    });
  } catch (error) {
    console.error('Error validating 2FA:', error);
    res.status(500).json({ error: 'Failed to validate 2FA' });
  }
});

// POST /api/auth/2fa/disable - Disable 2FA
router.post('/disable', async (req: Request, res: Response) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ error: 'User ID and password required' });
    }

    // Verify password before disabling
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // In production, verify password hash here
    // const bcrypt = require('bcrypt');
    // const valid = await bcrypt.compare(password, user.passwordHash);
    // if (!valid) return res.status(401).json({ error: 'Invalid password' });

    // Disable 2FA
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: { enabled: false }
    });

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// GET /api/auth/2fa/status/:userId - Check 2FA status
router.get('/status/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId },
      select: {
        enabled: true,
        backupCodes: true
      }
    });

    if (!twoFactorAuth) {
      return res.json({
        enabled: false,
        backupCodesRemaining: 0
      });
    }

    res.json({
      enabled: twoFactorAuth.enabled,
      backupCodesRemaining: twoFactorAuth.backupCodes.length
    });
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    res.status(500).json({ error: 'Failed to check 2FA status' });
  }
});

// POST /api/auth/2fa/regenerate-backup-codes - Generate new backup codes
router.post('/regenerate-backup-codes', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFactorAuth || !twoFactorAuth.enabled) {
      return res.status(400).json({ error: '2FA not enabled' });
    }

    // Generate new backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    await prisma.twoFactorAuth.update({
      where: { userId },
      data: { backupCodes }
    });

    res.json({
      success: true,
      backupCodes,
      message: 'New backup codes generated. Save them securely!'
    });
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    res.status(500).json({ error: 'Failed to regenerate backup codes' });
  }
});

export default router;
