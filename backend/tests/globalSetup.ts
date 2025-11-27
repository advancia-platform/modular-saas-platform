// Global setup runs once before all tests
import dotenv from "dotenv";
import path from "path";

// Set NODE_ENV to 'test' BEFORE loading any modules
process.env.NODE_ENV = "test";

// Load .env.test file
dotenv.config({ path: path.join(__dirname, "../.env.test") });

export default async function globalSetup() {
  console.log("🌍 Global test setup...");

  // Ensure DATABASE_URL is set for Prisma
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }

  console.log("DEBUG: NODE_ENV =", process.env.NODE_ENV);
  console.log("DEBUG: DATABASE_URL =", process.env.DATABASE_URL);
  console.log("DEBUG: TEST_DATABASE_URL =", process.env.TEST_DATABASE_URL);

  // Skip database cleanup in globalSetup - let individual tests handle their own setup
  // This avoids issues with Prisma client initialization before tests run
  console.log("✅ Global test setup complete (database cleanup skipped)");
}
