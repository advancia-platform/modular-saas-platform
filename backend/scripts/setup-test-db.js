#!/usr/bin/env node
/**
 * Setup Test Database Script
 *
 * This script creates the test database, runs migrations, and seeds initial data.
 * Run with: npm run db:setup:test
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Load test environment
require("dotenv").config({ path: ".env.test" });

const DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ TEST_DATABASE_URL not found in .env.test");
  process.exit(1);
}

// Parse database URL
const urlMatch = DATABASE_URL.match(
  /postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/
);
if (!urlMatch) {
  console.error("❌ Invalid TEST_DATABASE_URL format");
  console.error("   Expected: postgres://user:pass@host:port/dbname");
  process.exit(1);
}

const [, user, password, host, port, dbName] = urlMatch;

console.log("🔧 Test Database Setup\n");
console.log(`📊 Database: ${dbName}`);
console.log(`🖥️  Host: ${host}:${port}`);
console.log(`👤 User: ${user}\n`);

async function setupTestDatabase() {
  try {
    // ─── Step 1: Check PostgreSQL is running ───────────────────────
    console.log("1️⃣  Checking PostgreSQL connection...");
    try {
      execSync(
        `psql -h ${host} -p ${port} -U ${user} -d postgres -c "SELECT version();"`,
        {
          stdio: "pipe",
          env: { ...process.env, PGPASSWORD: password },
        }
      );
      console.log("   ✅ PostgreSQL is running\n");
    } catch (error) {
      console.error("   ❌ Cannot connect to PostgreSQL");
      console.error("   → Make sure PostgreSQL is running:");
      console.error("     sudo systemctl start postgresql");
      console.error("     # or");
      console.error("     brew services start postgresql\n");
      throw error;
    }

    // ─── Step 2: Create test database if not exists ────────────────
    console.log("2️⃣  Creating test database...");
    try {
      execSync(
        `psql -h ${host} -p ${port} -U ${user} -d postgres -c "CREATE DATABASE ${dbName};"`,
        {
          stdio: "pipe",
          env: { ...process.env, PGPASSWORD: password },
        }
      );
      console.log(`   ✅ Database "${dbName}" created\n`);
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log(`   ℹ️  Database "${dbName}" already exists\n`);
      } else {
        console.error("   ❌ Failed to create database");
        throw error;
      }
    }

    // ─── Step 3: Grant privileges to test user ─────────────────────
    console.log("3️⃣  Granting privileges...");
    try {
      execSync(
        `psql -h ${host} -p ${port} -U ${user} -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${user};"`,
        {
          stdio: "pipe",
          env: { ...process.env, PGPASSWORD: password },
        }
      );
      console.log("   ✅ Privileges granted\n");
    } catch (error) {
      console.log(
        "   ⚠️  Warning: Could not grant privileges (may already be owner)\n"
      );
    }

    // ─── Step 4: Run Prisma migrations ─────────────────────────────
    console.log("4️⃣  Running database migrations...");
    try {
      execSync("npx prisma migrate deploy", {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL },
      });
      console.log("   ✅ Migrations applied\n");
    } catch (error) {
      console.error("   ❌ Migration failed");
      throw error;
    }

    // ─── Step 5: Generate Prisma Client ────────────────────────────
    console.log("5️⃣  Generating Prisma Client...");
    try {
      execSync("npx prisma generate", {
        stdio: "inherit",
      });
      console.log("   ✅ Prisma Client generated\n");
    } catch (error) {
      console.error("   ❌ Client generation failed");
      throw error;
    }

    // ─── Step 6: Seed test data ────────────────────────────────────
    console.log("6️⃣  Seeding test data...");
    try {
      const seedScript = path.join(__dirname, "seed-test-data.js");
      if (fs.existsSync(seedScript)) {
        execSync(`node "${seedScript}"`, {
          stdio: "inherit",
          env: { ...process.env, DATABASE_URL },
        });
      } else {
        console.log("   ⚠️  Seed script not found, skipping...\n");
      }
    } catch (error) {
      console.error("   ❌ Seeding failed");
      throw error;
    }

    // ─── Success ────────────────────────────────────────────────────
    console.log("\n✅ Test database setup complete!\n");
    console.log("🚀 You can now run tests:");
    console.log("   npm test");
    console.log("   npm run test:watch");
    console.log("   npm run test:coverage\n");
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    console.error("\n🔍 Troubleshooting:");
    console.error("   1. Check TEST_DATABASE_URL in .env.test");
    console.error("   2. Ensure PostgreSQL is running");
    console.error("   3. Verify user has database creation privileges");
    console.error("   4. Check database connection manually:");
    console.error(`      psql "${DATABASE_URL}"\n`);
    process.exit(1);
  }
}

// Run setup
if (require.main === module) {
  setupTestDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { setupTestDatabase };
