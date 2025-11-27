import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../src/prismaClient";
import { adminUserFixture, regularUserFixture } from "./mocks";
import { getTestJWTSecret } from "./testEnv";

/**
 * Create admin user for tests that require admin authentication
 */
export async function createTestAdmin() {
  const hashedPassword = await bcrypt.hash("Admin123!@#", 10);

  // Delete if exists first
  await prisma.user.deleteMany({
    where: { email: adminUserFixture.email },
  });

  return await prisma.user.create({
    data: {
      id: adminUserFixture.id,
      email: adminUserFixture.email,
      username: adminUserFixture.username,
      passwordHash: hashedPassword,
      role: "ADMIN",
      approved: true,
      emailVerified: true,
      active: true,
      usdBalance: adminUserFixture.usdBalance,
      btcBalance: adminUserFixture.btcBalance,
      ethBalance: adminUserFixture.ethBalance,
      usdtBalance: adminUserFixture.usdtBalance,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Create regular user for tests
 */
export async function createTestUser(
  overrides?: Partial<typeof regularUserFixture>,
) {
  const hashedPassword = await bcrypt.hash("User123!@#", 10);
  const userData = { ...regularUserFixture, ...overrides };

  return await prisma.user.create({
    data: {
      // Don't set id - let Prisma generate it
      email: userData.email,
      username: userData.username,
      passwordHash: hashedPassword,
      role: userData.role,
      approved: userData.approved,
      emailVerified: userData.emailVerified,
      active: userData.active,
      usdBalance: userData.usdBalance,
      btcBalance: userData.btcBalance,
      ethBalance: userData.ethBalance,
      usdtBalance: userData.usdtBalance,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Clean up test admin user
 */
export async function cleanupTestAdmin() {
  await prisma.user.deleteMany({
    where: { email: adminUserFixture.email },
  });
}

/**
 * Clean up test users
 */
export async function cleanupTestUsers() {
  await prisma.user.deleteMany({
    where: {
      OR: [{ email: { contains: "test" } }, { username: { contains: "test" } }],
    },
  });
}

/**
 * Generate admin JWT token for authenticated requests
 */
export function generateAdminToken(userId: string): string {
  return jwt.sign({ userId, role: "ADMIN" }, getTestJWTSecret(), {
    expiresIn: "1h",
  });
}

/**
 * Generate user JWT token for authenticated requests
 */
export function generateUserToken(userId: string): string {
  return jwt.sign({ userId, role: "USER" }, getTestJWTSecret(), {
    expiresIn: "1h",
  });
}

/**
 * Get test user credentials
 */
export function getTestUserCredentials() {
  return {
    email: regularUserFixture.email,
    password: "User123!@#",
  };
}

/**
 * Get test admin credentials
 */
export function getTestAdminCredentials() {
  return {
    email: adminUserFixture.email,
    password: "Admin123!@#",
  };
}

/**
 * Create test crypto withdrawal
 */
export async function createTestCryptoWithdrawal(
  userId: string,
  overrides?: any,
) {
  return await prisma.cryptoWithdrawal.create({
    data: {
      userId,
      currency: "ETH",
      amount: 0.5,
      address: "0xTestReceiverAddress1234567890abcdef12345678",
      status: "pending",
      fee: 0.001,
      networkFee: 0.0005,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    },
  });
}

/**
 * Cleanup test crypto withdrawals
 */
export async function cleanupTestCryptoWithdrawals() {
  // Note: Crypto withdrawal cleanup disabled - check schema for correct field names
  // await prisma.cryptoWithdrawal.deleteMany({
  //   where: {
  //     // address: { contains: 'Test' },
  //   },
  // });
}
