import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { createAlchemyPayout, getAlchemyPayoutStatus } from '../services/alchemypay';
import prisma from '../prismaClient';
import logger from '../logger';

const router = express.Router();

// Create withdrawal via Alchemy Pay
router.post('/withdrawal', authenticateToken, async (req, res) => {
  try {
    const { amount, currency, address, network } = req.body;
    const userId = (req as any).user.id;

    // Validate inputs
    if (!amount || !currency || !address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, currency, address',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0',
      });
    }

    // Check user's balance (if applicable)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    logger.info('Processing Alchemy Pay withdrawal', {
      userId,
      userEmail: user.email,
      amount,
      currency,
      address,
    });

    // Create payout via Alchemy Pay
    const payout = await createAlchemyPayout(amount, currency, address, network);

    // Record withdrawal in database
    const withdrawal = await prisma.cryptoWithdrawal.create({
      data: {
        userId,
        amount: amount.toString(),
        currency: currency.toUpperCase(),
        walletAddress: address,
        status: 'PENDING',
        provider: 'alchemypay',
        transactionHash: payout.txHash,
        externalId: payout.id,
        network,
      },
    });

    logger.info('Alchemy Pay withdrawal recorded', {
      withdrawalId: withdrawal.id,
      payoutId: payout.id,
    });

    return res.status(201).json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        status: withdrawal.status,
        provider: withdrawal.provider,
        payoutId: payout.id,
        txHash: payout.txHash,
        createdAt: withdrawal.createdAt,
      },
    });
  } catch (error: any) {
    logger.error('Alchemy Pay withdrawal failed', {
      error: error.message,
      userId: (req as any).user?.id,
    });

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process withdrawal',
    });
  }
});

// Get withdrawal status
router.get('/withdrawal/:withdrawalId', authenticateToken, async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const userId = (req as any).user.id;

    const withdrawal = await prisma.cryptoWithdrawal.findFirst({
      where: {
        id: withdrawalId,
        userId,
        provider: 'alchemypay',
      },
    });

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal not found',
      });
    }

    // Fetch latest status from Alchemy Pay if we have an external ID
    if (withdrawal.externalId) {
      try {
        const payoutStatus = await getAlchemyPayoutStatus(withdrawal.externalId);

        // Update local status if changed
        if (payoutStatus.status && payoutStatus.status !== withdrawal.status) {
          await prisma.cryptoWithdrawal.update({
            where: { id: withdrawalId },
            data: {
              status: payoutStatus.status.toUpperCase(),
              transactionHash: payoutStatus.txHash || withdrawal.transactionHash,
            },
          });

          withdrawal.status = payoutStatus.status.toUpperCase();
          withdrawal.transactionHash = payoutStatus.txHash || withdrawal.transactionHash;
        }
      } catch (error) {
        logger.warn('Failed to fetch Alchemy Pay status, using cached data', {
          withdrawalId,
          error: (error as Error).message,
        });
      }
    }

    return res.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        status: withdrawal.status,
        walletAddress: withdrawal.walletAddress,
        transactionHash: withdrawal.transactionHash,
        network: withdrawal.network,
        createdAt: withdrawal.createdAt,
        updatedAt: withdrawal.updatedAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get withdrawal status', {
      error: error.message,
      withdrawalId: req.params.withdrawalId,
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch withdrawal status',
    });
  }
});

// Webhook endpoint for Alchemy Pay callbacks
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-alchemy-signature'] as string;
    const payload = req.body;

    // TODO: Verify webhook signature
    logger.info('Received Alchemy Pay webhook', { payload });

    const { payoutId, status, txHash } = payload;

    if (payoutId) {
      // Update withdrawal status
      const withdrawal = await prisma.cryptoWithdrawal.findFirst({
        where: { externalId: payoutId },
      });

      if (withdrawal) {
        await prisma.cryptoWithdrawal.update({
          where: { id: withdrawal.id },
          data: {
            status: status?.toUpperCase() || withdrawal.status,
            transactionHash: txHash || withdrawal.transactionHash,
          },
        });

        logger.info('Updated withdrawal from webhook', {
          withdrawalId: withdrawal.id,
          status,
        });
      }
    }

    return res.json({ success: true });
  } catch (error: any) {
    logger.error('Alchemy Pay webhook processing failed', {
      error: error.message,
    });

    return res.status(500).json({ success: false });
  }
});

export default router;
