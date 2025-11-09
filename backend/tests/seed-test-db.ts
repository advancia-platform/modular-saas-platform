import prisma from "../src/prismaClient";

export async function seedTestDatabase() {
  console.log("🌱 Seeding test database...");

  try {
    // Create admin test user
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@test.com" },
      update: {},
      create: {
        email: "admin@test.com",
        username: "testadmin",
        password: "$2a$10$dummyHashForTestingOnly",
        firstName: "Test",
        lastName: "Admin",
        role: "ADMIN",
        active: true,
      },
    });

    console.log(`✅ Created admin user: ${adminUser.email}`);

    // Create regular test user
    const testUser = await prisma.user.upsert({
      where: { email: "user@test.com" },
      update: {},
      create: {
        email: "user@test.com",
        username: "testuser",
        password: "$2a$10$dummyHashForTestingOnly",
        firstName: "Test",
        lastName: "User",
        role: "USER",
        active: true,
      },
    });

    console.log(`✅ Created test user: ${testUser.email}`);

    // Create test token wallet for the user
    await prisma.tokenWallet.upsert({
      where: { userId: testUser.id },
      update: {},
      create: {
        userId: testUser.id,
        balance: 1000,
      },
    });

    console.log("✅ Created test token wallet");

    console.log("🎉 Test database seeding complete!");

    return {
      adminUser,
      testUser,
    };
  } catch (error) {
    console.error("❌ Error seeding test database:", error);
    throw error;
  }
}

export async function cleanTestDatabase() {
  console.log("🧹 Cleaning test database...");

  try {
    // Delete in reverse order of dependencies
    await prisma.tokenWallet.deleteMany({
      where: {
        userId: {
          in: await prisma.user.findMany({
            where: { email: { in: ["admin@test.com", "user@test.com"] } },
            select: { id: true }
          }).then(users => users.map(u => u.id))
        }
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["admin@test.com", "user@test.com"],
        },
      },
    });

    console.log("✅ Test database cleaned");
  } catch (error) {
    console.error("❌ Error cleaning test database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
