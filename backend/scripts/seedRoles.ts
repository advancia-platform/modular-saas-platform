import prisma from "../src/prismaClient";
import bcrypt from "bcrypt";

async function seedRoles() {
  console.log("🌱 Seeding roles and test users...");

  // Hash a default password for test accounts
  const defaultPassword = await bcrypt.hash("Admin123!", 10);

  // Create or update admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@advancia.com" },
    update: {
      role: "ADMIN",
      active: true,
      passwordHash: defaultPassword,
    },
    create: {
      email: "admin@advancia.com",
      username: "admin",
      passwordHash: defaultPassword,
      firstName: "System",
      lastName: "Admin",
      role: "ADMIN",
      active: true,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });
  console.log("✅ Admin user:", admin.email, "- Role:", admin.role);

  // Create or update staff user
  const staff = await prisma.user.upsert({
    where: { email: "staff@advancia.com" },
    update: {
      role: "STAFF",
      active: true,
      passwordHash: defaultPassword,
    },
    create: {
      email: "staff@advancia.com",
      username: "staff",
      passwordHash: defaultPassword,
      firstName: "Support",
      lastName: "Staff",
      role: "STAFF",
      active: true,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });
  console.log("✅ Staff user:", staff.email, "- Role:", staff.role);

  // Create or update regular user
  const user = await prisma.user.upsert({
    where: { email: "user@advancia.com" },
    update: {
      role: "USER",
      active: true,
      passwordHash: defaultPassword,
    },
    create: {
      email: "user@advancia.com",
      username: "testuser",
      passwordHash: defaultPassword,
      firstName: "Test",
      lastName: "User",
      role: "USER",
      active: true,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });
  console.log("✅ Regular user:", user.email, "- Role:", user.role);

  console.log("\n🎉 Seeding complete!");
  console.log("\n📝 Test Credentials:");
  console.log("   Admin:  admin@advancia.com  / Admin123!");
  console.log("   Staff:  staff@advancia.com  / Admin123!");
  console.log("   User:   user@advancia.com   / Admin123!");
}

seedRoles()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
