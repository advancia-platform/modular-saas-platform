#!/usr/bin/env node
/**
 * Seed Test Database Script
 *
 * This script populates the test database with minimal data needed for tests.
 * Run with: npm run seed:test
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { Decimal } = require("@prisma/client/runtime/library");

// Load test environment
require("dotenv").config({ path: ".env.test" });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

async function seedTestData() {
  console.log("🌱 Seeding test database...");
  console.log(
    `📊 Database: ${process.env.TEST_DATABASE_URL?.split("@")[1] || "Unknown"}`
  );

  try {
    // ─── Clear existing data (in reverse order of dependencies) ───
    console.log("🧹 Clearing existing test data...");
    await prisma.tokenTransaction.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.tokenWallet.deleteMany({});
    await prisma.cryptoWallet.deleteMany({});
    await prisma.reward.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.supportTicket.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});
    console.log("✅ Existing data cleared");

    // ─── Create Test Admin User ─────────────────────────────────
    console.log("👤 Creating test admin user...");
    const adminPassword = await bcrypt.hash("TestAdmin123!", 10);
    const admin = await prisma.user.create({
      data: {
        email: "admin@advancia.test",
        password: adminPassword,
        firstName: "Test",
        lastName: "Admin",
        role: "admin",
        emailVerified: true,
        phone: "+1234567890",
        country: "US",
        isActive: true,
      },
    });
    console.log(`✅ Admin created: ${admin.email} (ID: ${admin.id})`);

    // ─── Create Test Regular User ────────────────────────────────
    console.log("👤 Creating test user...");
    const userPassword = await bcrypt.hash("TestUser123!", 10);
    const user = await prisma.user.create({
      data: {
        email: "user@advancia.test",
        password: userPassword,
        firstName: "Test",
        lastName: "User",
        role: "user",
        emailVerified: true,
        phone: "+1234567891",
        country: "US",
        isActive: true,
      },
    });
    console.log(`✅ User created: ${user.email} (ID: ${user.id})`);

    // ─── Create Test Support Agent ───────────────────────────────
    console.log("👤 Creating test support agent...");
    const agentPassword = await bcrypt.hash("TestAgent123!", 10);
    const agent = await prisma.user.create({
      data: {
        email: "agent@advancia.test",
        password: agentPassword,
        firstName: "Test",
        lastName: "Agent",
        role: "support",
        emailVerified: true,
        phone: "+1234567892",
        country: "US",
        isActive: true,
      },
    });
    console.log(`✅ Agent created: ${agent.email} (ID: ${agent.id})`);

    // ─── Create Token Wallets ─────────────────────────────────────
    console.log("💰 Creating token wallets...");
    const adminWallet = await prisma.tokenWallet.create({
      data: {
        userId: admin.id,
        balance: new Decimal(10000.0),
        currency: "ADVP",
      },
    });

    const userWallet = await prisma.tokenWallet.create({
      data: {
        userId: user.id,
        balance: new Decimal(1000.0),
        currency: "ADVP",
      },
    });
    console.log(`✅ Wallets created`);

    // ─── Create Crypto Wallets ────────────────────────────────────
    console.log("🔐 Creating crypto wallets...");
    await prisma.cryptoWallet.create({
      data: {
        userId: user.id,
        address: "0xTestWalletAddress123456789",
        balance: new Decimal(100.0),
        currency: "USDT",
        network: "ethereum",
      },
    });
    console.log(`✅ Crypto wallets created`);

    // ─── Create Sample Transactions ───────────────────────────────
    console.log("💸 Creating sample transactions...");
    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: new Decimal(100.0),
        type: "deposit",
        status: "completed",
        currency: "USD",
        paymentMethod: "stripe",
        description: "Test deposit transaction",
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: new Decimal(50.0),
        type: "withdrawal",
        status: "pending",
        currency: "USD",
        paymentMethod: "bank_transfer",
        description: "Test withdrawal transaction",
      },
    });
    console.log(`✅ Transactions created`);

    // ─── Create Token Transactions ─────────────────────────────────
    console.log("🪙 Creating token transactions...");
    await prisma.tokenTransaction.create({
      data: {
        walletId: userWallet.id,
        userId: user.id,
        amount: new Decimal(100.0),
        type: "credit",
        status: "completed",
        description: "Test token credit",
      },
    });

    await prisma.tokenTransaction.create({
      data: {
        walletId: userWallet.id,
        userId: user.id,
        amount: new Decimal(50.0),
        type: "debit",
        status: "completed",
        description: "Test token debit",
      },
    });
    console.log(`✅ Token transactions created`);

    // ─── Create Rewards ────────────────────────────────────────────
    console.log("🎁 Creating rewards...");
    await prisma.reward.create({
      data: {
        userId: user.id,
        amount: new Decimal(10.0),
        type: "referral",
        status: "claimed",
        description: "Test referral reward",
      },
    });
    console.log(`✅ Rewards created`);

    // ─── Create Support Tickets ────────────────────────────────────
    console.log("🎫 Creating support tickets...");
    await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject: "Test support ticket",
        description: "This is a test support ticket for testing purposes",
        status: "open",
        priority: "medium",
        category: "general",
      },
    });

    await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject: "Resolved test ticket",
        description: "This ticket was already resolved",
        status: "resolved",
        priority: "low",
        category: "technical",
        assignedToId: agent.id,
      },
    });
    console.log(`✅ Support tickets created`);

    // ─── Create Notifications ──────────────────────────────────────
    console.log("🔔 Creating notifications...");
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "transaction",
        title: "Transaction Completed",
        message: "Your deposit of $100 has been completed",
        read: false,
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "system",
        title: "Welcome to Advancia",
        message: "Welcome to Advancia Pay Ledger!",
        read: true,
      },
    });
    console.log(`✅ Notifications created`);

    // ─── Create Audit Logs ─────────────────────────────────────────
    console.log("📝 Creating audit logs...");
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "user_login",
        resource: "auth",
        resourceId: admin.id.toString(),
        details: "Test admin login",
        ipAddress: "127.0.0.1",
        userAgent: "Test User Agent",
      },
    });
    console.log(`✅ Audit logs created`);

    // ─── Summary ───────────────────────────────────────────────────
    console.log("\n📊 Seeding Summary:");
    const counts = {
      users: await prisma.user.count(),
      wallets: await prisma.tokenWallet.count(),
      cryptoWallets: await prisma.cryptoWallet.count(),
      transactions: await prisma.transaction.count(),
      tokenTransactions: await prisma.tokenTransaction.count(),
      rewards: await prisma.reward.count(),
      supportTickets: await prisma.supportTicket.count(),
      notifications: await prisma.notification.count(),
      auditLogs: await prisma.auditLog.count(),
    };

    console.table(counts);

    console.log("\n✅ Test database seeded successfully!\n");
    console.log("🔑 Test Credentials:");
    console.log("   Admin:   admin@advancia.test / TestAdmin123!");
    console.log("   User:    user@advancia.test / TestUser123!");
    console.log("   Agent:   agent@advancia.test / TestAgent123!\n");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
if (require.main === module) {
  seedTestData()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedTestData };
