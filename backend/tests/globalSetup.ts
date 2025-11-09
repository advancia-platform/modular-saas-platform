// Global setup runs once before all tests
import { PrismaClient } from "@prisma/client";

export default async () => {
  console.log("🌍 Global test setup...");

  // Enable database cleanup for integration tests with real database
  const testDbUrl = process.env.TEST_DATABASE_URL;

  if (!testDbUrl) {
    console.log("ℹ️  No TEST_DATABASE_URL - skipping database cleanup");
    return;
  }

  console.log("Cleaning test database...");
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: testDbUrl,
      },
    },
  });

  try {
    await prisma.$connect();

    // Delete data from all tables using Prisma client methods
    // This automatically handles table naming and avoids SQL injection
    console.log("Deleting test data...");

    // Child tables first (those with foreign keys)
    await prisma.tokenTransaction.deleteMany({});
    await prisma.tokenWallet.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.reward.deleteMany({});
    await prisma.userTier.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.cryptoWithdrawal.deleteMany({});
    await prisma.cryptoOrder.deleteMany({});
    await prisma.ethActivity.deleteMany({});
    await prisma.supportTicket.deleteMany({});
    await prisma.pushSubscription.deleteMany({});
    await prisma.healthReading.deleteMany({});
    await prisma.debitCard.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.backupCode.deleteMany({});
    await prisma.loan.deleteMany({});

    // Parent tables last
    await prisma.userProfile.deleteMany({});
    await prisma.user.deleteMany({});

    console.log("✅ Database cleaned successfully");
  } catch (error: any) {
    console.warn(
      "⚠️  Could not connect to test database - unit tests will use mocks"
    );
    console.warn(`   Error: ${error.message}`);
    // Don't throw - allow unit tests to proceed with mocks
  } finally {
    await prisma.$disconnect();
  }
};
