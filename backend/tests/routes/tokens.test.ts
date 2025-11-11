/**
 * Token Wallet API Tests
 * Tests for token balance and transaction history endpoints
 */

import request from 'supertest';
import app from '../test-app';
import prisma from '../../src/prismaClient';
import { createTestUser, generateUserToken, cleanupTestUsers } from '../setup/adminSetup';

const API_KEY = process.env.API_KEY || 'dev-api-key-123';

describe('Token Wallet API', () => {
  let userId: string;
  let userToken: string;
  let walletId: string;

  beforeAll(async () => {
    const user = await createTestUser({
      email: `token-test-${Date.now()}@example.com`,
      username: `tokentest${Date.now()}`,
    });
    userId = user.id;
    userToken = generateUserToken(userId);
  });

  afterAll(async () => {
    // Cleanup token transactions
    if (walletId) {
      await prisma.tokenTransaction.deleteMany({
        where: { walletId },
      });
    }
    // Cleanup wallet
    await prisma.tokenWallet.deleteMany({
      where: { userId },
    });
    await cleanupTestUsers();
  });

  describe('GET /api/tokens/balance/:userId', () => {
    it('should create wallet if it does not exist', async () => {
      const res = await request(app)
        .get(`/api/tokens/balance/${userId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('userId', userId);
      expect(res.body).toHaveProperty('balance');
      expect(res.body).toHaveProperty('lockedBalance');

      // Store walletId for cleanup
      walletId = res.body.id;
    });    it('should return existing wallet balance', async () => {
      // Get balance again
      const res = await request(app)
        .get(`/api/tokens/balance/${userId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('userId', userId);
      expect(res.body).toHaveProperty('balance');
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/api/tokens/balance/${userId}`)
        .set('x-api-key', API_KEY)
        .expect(401);
    });
  });

  describe('GET /api/tokens/history/:userId', () => {
    beforeAll(async () => {
      // Ensure wallet exists
      const wallet = await prisma.tokenWallet.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });
      walletId = wallet.id;

      // Create some test transactions
      await prisma.tokenTransaction.createMany({
        data: [
          {
            walletId,
            type: 'EARN',
            amount: 100,
            description: 'Test reward',
            status: 'COMPLETED',
          },
          {
            walletId,
            type: 'SPEND',
            amount: 50,
            description: 'Test purchase',
            status: 'COMPLETED',
          },
          {
            walletId,
            type: 'EARN',
            amount: 25,
            description: 'Test bonus',
            status: 'PENDING',
          },
        ],
      });
    });

    it('should return transaction history', async () => {
      const res = await request(app)
        .get(`/api/tokens/history/${userId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('transactions');
      expect(Array.isArray(res.body.transactions)).toBe(true);
      expect(res.body).toHaveProperty('total');
      expect(res.body.total).toBeGreaterThanOrEqual(3);
    });

    it('should respect limit parameter', async () => {
      const res = await request(app)
        .get(`/api/tokens/history/${userId}?limit=2`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.transactions.length).toBeLessThanOrEqual(2);
    });

    it('should return empty array for user with no wallet', async () => {
      const newUser = await createTestUser({
        email: `nowallet-${Date.now()}@example.com`,
        username: `nowallet${Date.now()}`,
      });
      const newToken = generateUserToken(newUser.id);

      const res = await request(app)
        .get(`/api/tokens/history/${newUser.id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(res.body).toEqual({ transactions: [], total: 0 });

      // Cleanup
      await prisma.user.deleteMany({
        where: { email: { contains: 'nowallet-' } },
      });
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/api/tokens/history/${userId}`)
        .set('x-api-key', API_KEY)
        .expect(401);
    });
  });

  describe('POST /api/tokens/transfer', () => {
    let recipientId: string;
    let recipientToken: string;

    beforeAll(async () => {
      // Create recipient user
      const recipient = await createTestUser({
        email: `recipient-${Date.now()}@example.com`,
        username: `recipient${Date.now()}`,
      });
      recipientId = recipient.id;
      recipientToken = generateUserToken(recipientId);

      // Ensure sender has balance
      await prisma.tokenWallet.upsert({
        where: { userId },
        update: { balance: 1000 },
        create: { userId, balance: 1000 },
      });

      // Ensure recipient has wallet
      await prisma.tokenWallet.upsert({
        where: { userId: recipientId },
        update: {},
        create: { userId: recipientId },
      });
    });

    afterAll(async () => {
      // Cleanup recipient transactions and wallet
      if (recipientId) {
        const recipientWallet = await prisma.tokenWallet.findUnique({
          where: { userId: recipientId },
        });
        if (recipientWallet) {
          await prisma.tokenTransaction.deleteMany({
            where: { walletId: recipientWallet.id },
          });
          await prisma.tokenWallet.delete({
            where: { id: recipientWallet.id },
          });
        }
        // Delete user through cleanup function
        await prisma.user.deleteMany({
          where: { email: { contains: 'recipient-' } },
        });
      }
    });

    it('should transfer tokens between users', async () => {
      const res = await request(app)
        .post('/api/tokens/transfer')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fromUserId: userId,
          toUserId: recipientId,
          amount: 100,
          description: 'Test transfer',
        })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('transactionId');
      expect(res.body).toHaveProperty('message');
    });

    it('should reject transfer with insufficient balance', async () => {
      const res = await request(app)
        .post('/api/tokens/transfer')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fromUserId: userId,
          toUserId: recipientId,
          amount: 999999,
          description: 'Too much',
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject negative amounts', async () => {
      const res = await request(app)
        .post('/api/tokens/transfer')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fromUserId: userId,
          toUserId: recipientId,
          amount: -50,
          description: 'Negative',
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/tokens/transfer')
        .set('x-api-key', API_KEY)
        .send({
          fromUserId: userId,
          toUserId: recipientId,
          amount: 10,
        })
        .expect(401);
    });
  });
});
