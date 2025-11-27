import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "../src/prismaClient";

async function main() {
  const action = process.argv[2];

  switch (action) {
    case "create-admin": {
      const email = process.argv[3];
      const roleInput = (process.argv[4] || "ADMIN").toUpperCase() as Role;
      const password = process.argv[5] || "Admin123!";

      if (!email) {
        console.error("❌ Error: Email is required");
        console.log(
          "Usage: ts-node scripts/admin.ts create-admin <email> <role?> <password?>",
        );
        process.exit(1);
      }

      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        console.log(`⚠️  User already exists: ${email}`);
        console.log("Updating role...");
        const updated = await prisma.user.update({
          where: { email },
          data: { role: roleInput },
        });
        console.log(`✅ Updated user role: ${updated.email} → ${updated.role}`);
        break;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const username = email.split("@")[0] || "admin";

      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          firstName: "Admin",
          lastName: "User",
          role: roleInput,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          termsAccepted: true,
          termsAcceptedAt: new Date(),
          active: true,
        },
      });

      console.log("✅ Admin user created successfully!");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`📧 Email:    ${user.email}`);
      console.log(`👤 Username: ${user.username}`);
      console.log(`🔐 Password: ${password}`);
      console.log(`🛡️  Role:     ${user.role}`);
      console.log(`🆔 ID:       ${user.id}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(
        "\n🚀 You can now login at: http://localhost:3000/admin/login",
      );
      break;
    }

    case "list-users": {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          active: true,
          emailVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (users.length === 0) {
        console.log("No users found in database.");
        break;
      }

      console.log(`\n📊 Total Users: ${users.length}\n`);
      console.table(
        users.map((u) => ({
          ID: u.id.slice(0, 8),
          Email: u.email,
          Username: u.username,
          Role: u.role,
          Active: u.active ? "✅" : "❌",
          Verified: u.emailVerified ? "✅" : "❌",
          Created: u.createdAt.toISOString().split("T")[0],
        })),
      );
      break;
    }

    case "promote-admin": {
      const email = process.argv[3];
      const roleInput = (process.argv[4] || "ADMIN").toUpperCase() as Role;

      if (!email) {
        console.error("❌ Error: Email is required");
        console.log(
          "Usage: ts-node scripts/admin.ts promote-admin <email> <role?>",
        );
        process.exit(1);
      }

      const user = await prisma.user.update({
        where: { email },
        data: { role: roleInput },
      });

      console.log(`✅ User promoted: ${user.email} → ${user.role}`);
      break;
    }

    case "reset-password": {
      const email = process.argv[3];
      const newPassword = process.argv[4] || "NewPassword123!";

      if (!email) {
        console.error("❌ Error: Email is required");
        console.log(
          "Usage: ts-node scripts/admin.ts reset-password <email> <newPassword?>",
        );
        process.exit(1);
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      const user = await prisma.user.update({
        where: { email },
        data: { passwordHash },
      });

      console.log("✅ Password reset successfully!");
      console.log(`📧 Email:    ${user.email}`);
      console.log(`🔐 Password: ${newPassword}`);
      break;
    }

    case "activate-user": {
      const email = process.argv[3];

      if (!email) {
        console.error("❌ Error: Email is required");
        console.log("Usage: ts-node scripts/admin.ts activate-user <email>");
        process.exit(1);
      }

      const user = await prisma.user.update({
        where: { email },
        data: {
          active: true,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      console.log(`✅ User activated: ${user.email}`);
      break;
    }

    case "delete-user": {
      const email = process.argv[3];

      if (!email) {
        console.error("❌ Error: Email is required");
        console.log("Usage: ts-node scripts/admin.ts delete-user <email>");
        process.exit(1);
      }

      const user = await prisma.user.delete({
        where: { email },
      });

      console.log(`✅ User deleted: ${user.email}`);
      break;
    }

    case "stats": {
      const totalUsers = await prisma.user.count();
      const adminUsers = await prisma.user.count({ where: { role: "ADMIN" } });
      const superAdmins = await prisma.user.count({
        where: { role: "SUPERADMIN" },
      });
      const activeUsers = await prisma.user.count({ where: { active: true } });
      const verifiedUsers = await prisma.user.count({
        where: { emailVerified: true },
      });

      console.log("\n📊 Database Statistics");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`Total Users:      ${totalUsers}`);
      console.log(`Admin Users:      ${adminUsers}`);
      console.log(`Super Admins:     ${superAdmins}`);
      console.log(`Active Users:     ${activeUsers}`);
      console.log(`Verified Users:   ${verifiedUsers}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      break;
    }

    default:
      console.log("\n🔧 Admin Utility Script");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("\n📝 Available Commands:\n");
      console.log("  create-admin <email> <role?> <password?>");
      console.log("    Create a new admin user");
      console.log("    Default role: ADMIN, Default password: Admin123!");
      console.log("    Roles: USER, STAFF, ADMIN, SUPERADMIN\n");
      console.log("  list-users");
      console.log("    List all users in the database\n");
      console.log("  promote-admin <email> <role?>");
      console.log("    Promote an existing user to admin\n");
      console.log("  reset-password <email> <newPassword?>");
      console.log("    Reset user password\n");
      console.log("  activate-user <email>");
      console.log("    Activate and verify a user account\n");
      console.log("  delete-user <email>");
      console.log("    Delete a user from the database\n");
      console.log("  stats");
      console.log("    Show database statistics\n");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("\n💡 Examples:\n");
      console.log(
        "  npx ts-node scripts/admin.ts create-admin admin@advancia.com",
      );
      console.log(
        "  npx ts-node scripts/admin.ts create-admin admin@advancia.com SUPERADMIN",
      );
      console.log("  npx ts-node scripts/admin.ts list-users");
      console.log(
        "  npx ts-node scripts/admin.ts promote-admin user@example.com ADMIN",
      );
      console.log("  npx ts-node scripts/admin.ts stats\n");
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
