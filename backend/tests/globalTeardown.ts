// Global teardown runs once after all tests
import { PrismaClient } from "@prisma/client";

export default async () => {
  console.log("🌍 Global test teardown...");

  // Enable database cleanup for integration tests
  const testDbUrl = process.env.TEST_DATABASE_URL;

  if (!testDbUrl) {
    console.log("ℹ️  No TEST_DATABASE_URL - skipping database cleanup");
    return;
  }

  console.log("Final database cleanup...");
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
    console.log("Deleting test data...");

    // Child tables first
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

    console.log("✅ Final cleanup completed");
  } catch (error: any) {
    console.warn("⚠️  Could not connect to test database during teardown");
    console.warn(`   Error: ${error.message}`);
    // Don't throw - tests already completed
  } finally {
    await prisma.$disconnect();
  }
};
