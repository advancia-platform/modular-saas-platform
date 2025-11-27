// Global teardown runs once after all tests
import dotenv from "dotenv";
import path from "path";

// Load .env.test file
dotenv.config({ path: path.join(__dirname, "../.env.test") });

export default async function globalTeardown() {
  console.log("🧹 Global test teardown...");

  // Ensure DATABASE_URL is set for Prisma
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }

  try {
    // Import the existing prisma client setup
    const { default: prisma } = await import("../src/prismaClient");
    await prisma.$disconnect();
    console.log("✅ Global test teardown complete");
  } catch (error) {
    console.warn("⚠️  Teardown warning:", error);
    console.log("✅ Global test teardown complete (with warnings)");
  }
}
