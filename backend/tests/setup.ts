/// Test setup file for Jest
// Jest globals are provided by @types/jest (added via tests/tsconfig.json)

import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import prisma from "../src/prismaClient";

// ==========================================
// Environment Configuration
// ==========================================
process.env.NODE_ENV = "test";
process.env.PORT = "3001";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/advancia_payledger_test?schema=public";
process.env.API_KEY = "dev-api-key-123";

// Mock external service credentials
process.env.EMAIL_USER = "test@example.com";
process.env.EMAIL_PASSWORD = "test-password";
process.env.SMTP_HOST = "smtp.gmail.com";
process.env.SMTP_PORT = "587";
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_mock";
process.env.VAPID_PUBLIC_KEY = "test-vapid-public";
process.env.VAPID_PRIVATE_KEY = "test-vapid-private";

// Increase timeout for DB ops if needed
jest.setTimeout(30_000);

// ==========================================
// External Service Mocks
// ==========================================
// These mocks prevent real external calls during tests,
// keeping tests fast, isolated, and safe to run.

// NOTE: bcryptjs is NOT mocked - we use real password hashing for integration tests

// Mock Socket.IO to avoid real connections
jest.mock("socket.io", () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
  })),
}));

// Mock nodemailer to prevent actual emails
jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-message-id" }),
  }),
}));

// Mock web-push to prevent actual push notifications
jest.mock("web-push", () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue({ statusCode: 201 }),
}));

// Mock Redis client to prevent real Redis connections
jest.mock("../src/services/redisClient", () => ({
  getRedis: jest.fn().mockReturnValue(null), // Returns null to use in-memory fallback
}));

// ==========================================
// Global Lifecycle Hooks
// ==========================================
beforeAll(async () => {
  console.log("🧪 Setting up test environment...");
  console.log("Using mocks (no external connections)");
});

afterAll(async () => {
  console.log("🧹 Cleaning up test environment...");
  await prisma.$disconnect();
});

// ==========================================
// Test Utilities
// ==========================================
export const testUtils = {
  createTestUser: () => ({
    email: "test@example.com",
    username: "testuser",
    password: "password123",
  }),

  createTestAdmin: () => ({
    email: "admin@example.com",
    username: "adminuser",
    password: "admin123",
    role: "ADMIN",
  }),

  createTestToken: (userId: string = "test-user-id", role: string = "USER") =>
    jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: "1h" }),

  createAuthHeader: (userId?: string, role?: string) => ({
    Authorization: `Bearer ${testUtils.createTestToken(userId, role)}`,
  }),

  createApiKeyHeader: () => ({
    "x-api-key": process.env.API_KEY!,
  }),

  createTestNotification: (userId: string, type: string = "INFO") => ({
    userId,
    type,
    title: "Test Notification",
    message: "This is a test notification",
    read: false,
  }),

  cleanDatabase: async (prismaClient: PrismaClient = prisma) => {
    console.log("🗑️ Cleaning test database...");

    try {
      // Delete in order to respect foreign key constraints
      // Use Prisma client methods - automatically handles table naming
      await prismaClient.tokenTransaction.deleteMany({});
      await prismaClient.tokenWallet.deleteMany({});
      await prismaClient.transaction.deleteMany({});
      await prismaClient.notification.deleteMany({});
      await prismaClient.reward.deleteMany({});
      await prismaClient.userTier.deleteMany({});
      await prismaClient.auditLog.deleteMany({});
      await prismaClient.cryptoWithdrawal.deleteMany({});
      await prismaClient.cryptoOrder.deleteMany({});
      await prismaClient.ethActivity.deleteMany({});
      await prismaClient.supportTicket.deleteMany({});
      await prismaClient.pushSubscription.deleteMany({});
      await prismaClient.healthReading.deleteMany({});
      await prismaClient.debitCard.deleteMany({});
      await prismaClient.session.deleteMany({});
      await prismaClient.backupCode.deleteMany({});
      await prismaClient.loan.deleteMany({});
      await prismaClient.userProfile.deleteMany({});
      await prismaClient.user.deleteMany({});

      console.log("✅ Database cleaned successfully");
    } catch (err: any) {
      console.error("❌ Error cleaning database:", err.message);
      throw err;
    }
  },
};

// Export Prisma instance for use in tests
export { prisma };
