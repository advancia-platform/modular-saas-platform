/**
 * OAL Test Script
 *
 * Tests the OAL service by creating sample audit log entries
 */

import prisma from "../src/prismaClient";

async function testOAL() {
  console.log("🧪 Testing OAL Model...\n");

  try {
    // 1. Create a sample balance adjustment log
    const balanceLog = await prisma.oAL.create({
      data: {
        object: "ledger.balance",
        action: "adjust",
        location: "admin.panel",
        subjectId: "user_123",
        metadata: { delta: 50, currency: "USD", reason: "bonus" },
        createdById: "admin_1",
      },
    });

    console.log("✅ Created balance adjustment log:");
    console.log(JSON.stringify(balanceLog, null, 2));
    console.log("");

    // 2. Create a role change log
    const roleLog = await prisma.oAL.create({
      data: {
        object: "user.role",
        action: "update",
        location: "admin.api",
        subjectId: "user_456",
        metadata: {
          oldRole: "USER",
          newRole: "ADMIN",
          reason: "Promoted for excellent support",
        },
        createdById: "admin_1",
        status: "APPROVED",
      },
    });

    console.log("✅ Created role change log:");
    console.log(JSON.stringify(roleLog, null, 2));
    console.log("");

    // 3. Fetch all logs
    const allLogs = await prisma.oAL.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    console.log(`✅ Found ${allLogs.length} OAL logs in database\n`);

    // 4. Update status
    const updated = await prisma.oAL.update({
      where: { id: balanceLog.id },
      data: { status: "APPROVED", updatedById: "admin_2" },
    });

    console.log("✅ Updated log status:");
    console.log(`  ID: ${updated.id}`);
    console.log(`  Status: ${updated.status}`);
    console.log(`  Updated by: ${updated.updatedById}`);
    console.log("");

    console.log("🎉 All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testOAL();
