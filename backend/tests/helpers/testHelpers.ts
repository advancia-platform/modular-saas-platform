/**
 * Test helpers following Advancia Pay patterns
 */

import prisma from "../../src/prismaClient";

export async function cleanupTestData() {
  // Clean in reverse order of dependencies
  await prisma.auditLog.deleteMany({
    where: { userId: { contains: "test" } },
  });

  await prisma.transactions.deleteMany({
    where: { userId: { contains: "test" } },
  });

  await prisma.user.deleteMany({
    where: { email: { contains: "test" } },
  });
}

export async function createTestUser(overrides: Record<string, any> = {}) {
  return await prisma.user.create({
    data: {
      email: `test-${Date.now()}@advancia.test`,
      passwordHash: "ValidTest123!@#", // Meets 12+ char requirement
      firstName: "Test",
      lastName: "User",
      emailVerified: true,
      active: true,
      approved: true,
      ...overrides,
    },
  });
}

// Use in tests:
// beforeEach(async () => await cleanupTestData());
// afterAll(async () => {
//   await cleanupTestData();
//   await prisma.$disconnect();
// });
