# 🧪 Test Database Setup Guide

Complete guide to setting up and managing test databases for Advancia Pay Ledger. This ensures test isolation, prevents data corruption, and enables reliable CI/CD pipelines.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Setup](#quick-setup)
3. [Local Development](#local-development)
4. [CI/CD Configuration](#cicd-configuration)
5. [Test Database Strategy](#test-database-strategy)
6. [Common Issues](#common-issues)
7. [Best Practices](#best-practices)

---

## 🎯 Overview

**Why a separate test database?**

- ✅ **Isolation** - Tests don't corrupt dev/prod data
- ✅ **Reproducibility** - Fresh state for every test run
- ✅ **Speed** - Optimized schema and smaller datasets
- ✅ **Safety** - No risk of deleting production data

**Test Database Architecture:**

```
┌──────────────────────────────────────────────────┐
│                 Databases                        │
├──────────────────────────────────────────────────┤
│  Production      Development       Test          │
│  advancia        advancia_dev      advancia_test │
│  (port 5432)     (port 5432)       (port 5432)  │
│                                                  │
│  Real data       Fake data         Fresh data   │
│  Persistent      Persistent        Reset daily  │
│  Backups         No backups        No backups   │
└──────────────────────────────────────────────────┘
```

---

## ⚡ Quick Setup

### Prerequisites

```bash
# Install PostgreSQL (if not already installed)
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows
# Download from: https://www.postgresql.org/download/windows/
```

### Step 1: Create Test Database User

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create test user with limited privileges
CREATE USER test_user WITH PASSWORD 'test_pass';

# Create test database
CREATE DATABASE advancia_test OWNER test_user;

# Grant necessary privileges
GRANT ALL PRIVILEGES ON DATABASE advancia_test TO test_user;

# Exit psql
\q
```

### Step 2: Copy Environment Template

```bash
# Copy .env.test to backend directory (already created)
cd backend

# Verify TEST_DATABASE_URL is set correctly
grep TEST_DATABASE_URL .env.test

# Should output:
# TEST_DATABASE_URL=postgres://test_user:test_pass@localhost:5432/advancia_test
```

### Step 3: Run Migrations

```bash
# Run migrations on test database
npm run migrate:test

# Or manually with Prisma
npx prisma migrate deploy --schema=prisma/schema.prisma
```

### Step 4: Seed Test Data (Optional)

```bash
# Seed with test data
npm run seed:test

# Or manually
node scripts/seed-test-data.js
```

### Step 5: Verify Setup

```bash
# Run tests
npm test

# Run specific test suite
npm test -- auth.test.ts

# Run with coverage
npm test -- --coverage
```

**Expected Output:**

```
PASS  src/__tests__/auth.test.ts
PASS  src/__tests__/transactions.test.ts
PASS  src/__tests__/tokens.test.ts

Test Suites: 15 passed, 15 total
Tests:       87 passed, 87 total
Snapshots:   0 total
Time:        12.456 s
```

---

## 💻 Local Development

### Method 1: PostgreSQL on localhost

**Pros:** Real database behavior, full feature support  
**Cons:** Slower than in-memory, requires PostgreSQL installation

```bash
# 1. Ensure PostgreSQL is running
sudo systemctl status postgresql
# or
brew services list | grep postgresql

# 2. Create test database (if not exists)
createdb -U test_user advancia_test

# 3. Run migrations
cd backend
npm run migrate:test

# 4. Run tests
npm test
```

### Method 2: Docker PostgreSQL

**Pros:** Isolated, reproducible, easy cleanup  
**Cons:** Requires Docker, slightly slower startup

```bash
# Create docker-compose.test.yml
cat > docker-compose.test.yml <<EOF
version: '3.8'
services:
  postgres-test:
    image: postgres:15-alpine
    container_name: advancia-test-db
    environment:
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_pass
      POSTGRES_DB: advancia_test
    ports:
      - "5433:5432"  # Use different port to avoid conflicts
    volumes:
      - test-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test_user"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  test-db-data:
EOF

# Start test database
docker-compose -f docker-compose.test.yml up -d

# Update .env.test with new port
# TEST_DATABASE_URL=postgres://test_user:test_pass@localhost:5433/advancia_test

# Run migrations
npm run migrate:test

# Run tests
npm test

# Stop and remove test database
docker-compose -f docker-compose.test.yml down -v
```

### Method 3: In-Memory SQLite (Fast, Limited)

**Pros:** Extremely fast, no setup  
**Cons:** Postgres-specific features won't work

```bash
# Update .env.test
# TEST_DATABASE_URL=file:./test.db

# Run tests (SQLite will be created automatically)
npm test

# Note: Some tests may fail if they rely on Postgres-specific features
```

### Creating `.env.test.local` for Personal Overrides

```bash
# Create local override file (gitignored)
cat > backend/.env.test.local <<EOF
# Personal test database configuration
TEST_DATABASE_URL=postgres://myuser:mypass@localhost:5432/advancia_test

# Enable verbose logging for debugging
ENABLE_TEST_LOGGING=true

# Increase timeout for slow machine
TEST_TIMEOUT=60000

# Use personal Stripe test keys
STRIPE_SECRET_KEY=sk_test_YOUR_PERSONAL_KEY
EOF

# This file is automatically loaded by dotenv and takes precedence
```

---

## 🔄 CI/CD Configuration

### GitHub Actions Setup

**File:** `.github/workflows/integration-tests.yml`

```yaml
name: Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    # PostgreSQL service container
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: advancia_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Setup test database
        working-directory: backend
        env:
          TEST_DATABASE_URL: postgres://test_user:test_pass@localhost:5432/advancia_test
        run: |
          npm run migrate:test
          npm run seed:test

      - name: Run tests
        working-directory: backend
        env:
          TEST_DATABASE_URL: postgres://test_user:test_pass@localhost:5432/advancia_test
          NODE_ENV: test
          JWT_SECRET: ${{ secrets.TEST_JWT_SECRET }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}
        run: npm test -- --coverage --maxWorkers=2

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend
          name: backend-coverage

      - name: Cleanup test database
        if: always()
        run: |
          psql -h localhost -U test_user -d postgres -c "DROP DATABASE IF EXISTS advancia_test;"
```

### GitHub Secrets Required

Add these secrets in **Settings → Secrets and variables → Actions**:

```
TEST_DATABASE_URL=postgres://test_user:test_pass@postgres:5432/advancia_test
TEST_JWT_SECRET=your_test_jwt_secret
STRIPE_TEST_SECRET_KEY=sk_test_your_stripe_key
CRYPTOMUS_TEST_API_KEY=your_cryptomus_test_key
```

---

## 🔬 Test Database Strategy

### Reset Strategy: Before Each Suite

```javascript
// backend/src/__tests__/setup.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
});

beforeAll(async () => {
  // Run migrations
  await prisma.$executeRawUnsafe("DROP SCHEMA public CASCADE;");
  await prisma.$executeRawUnsafe("CREATE SCHEMA public;");
  // Re-run migrations via CLI
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clear all tables
  const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public';
  `;
  for (const { tablename } of tables) {
    if (tablename !== "_prisma_migrations") {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
    }
  }
});
```

### Seeding Test Data

```javascript
// backend/scripts/seed-test-data.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
});

async function seedTestData() {
  console.log("🌱 Seeding test database...");

  // Create test admin
  const adminPassword = await bcrypt.hash("TestAdmin123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@advancia.test" },
    update: {},
    create: {
      email: "admin@advancia.test",
      password: adminPassword,
      firstName: "Test",
      lastName: "Admin",
      role: "admin",
      emailVerified: true,
    },
  });

  // Create test user
  const userPassword = await bcrypt.hash("TestUser123!", 10);
  const user = await prisma.user.upsert({
    where: { email: "user@advancia.test" },
    update: {},
    create: {
      email: "user@advancia.test",
      password: userPassword,
      firstName: "Test",
      lastName: "User",
      role: "user",
      emailVerified: true,
    },
  });

  // Create test wallet
  await prisma.tokenWallet.create({
    data: {
      userId: user.id,
      balance: 1000.0,
      currency: "ADVP",
    },
  });

  console.log("✅ Test data seeded successfully");
}

seedTestData()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### NPM Scripts

Add to `backend/package.json`:

```json
{
  "scripts": {
    "test": "NODE_ENV=test jest --config jest.config.js",
    "test:watch": "npm test -- --watch",
    "test:coverage": "npm test -- --coverage",
    "migrate:test": "dotenv -e .env.test -- npx prisma migrate deploy",
    "seed:test": "dotenv -e .env.test -- node scripts/seed-test-data.js",
    "db:reset:test": "dotenv -e .env.test -- npx prisma migrate reset --force --skip-seed"
  }
}
```

---

## 🐛 Common Issues

### Issue 1: "Cannot connect to test database"

**Error:**

```
Error: P1001: Can't reach database server at `localhost:5432`
```

**Solutions:**

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql
# or
pg_isready -h localhost -p 5432

# Verify database exists
psql -U test_user -d postgres -c "\l" | grep advancia_test

# Check .env.test URL is correct
cat backend/.env.test | grep TEST_DATABASE_URL

# Try connecting manually
psql postgres://test_user:test_pass@localhost:5432/advancia_test
```

### Issue 2: "Permission denied for database"

**Error:**

```
Error: permission denied for database advancia_test
```

**Solutions:**

```bash
# Grant all privileges
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE advancia_test TO test_user;
ALTER DATABASE advancia_test OWNER TO test_user;
\q
```

### Issue 3: "Migration lock timeout"

**Error:**

```
Error: Timed out waiting for migration lock
```

**Solutions:**

```bash
# Release migration lock
psql -U test_user -d advancia_test
DELETE FROM _prisma_migrations WHERE migration_name = 'migration-engine-lock';
\q

# Or reset migrations
npm run db:reset:test
```

### Issue 4: "Tests hanging or timing out"

**Solutions:**

```javascript
// Increase Jest timeout in jest.config.js
module.exports = {
  testTimeout: 30000, // 30 seconds
};

// Or per-test
test("slow operation", async () => {
  // test code
}, 60000); // 60 second timeout
```

### Issue 5: "Port already in use"

**Error:**

```
Error: listen EADDRINUSE: address already in use :::4001
```

**Solutions:**

```bash
# Find process using port 4001
lsof -i :4001
# or
netstat -tulpn | grep 4001

# Kill process
kill -9 <PID>

# Or use different port in .env.test
PORT=4002
```

---

## ✅ Best Practices

### 1. **Always Use Transactions for Test Cleanup**

```javascript
// Wrap tests in transactions that rollback
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("User Tests", () => {
  let tx;

  beforeEach(async () => {
    tx = await prisma.$transaction(async (prisma) => {
      // Test will use this transaction
      return prisma;
    });
  });

  afterEach(async () => {
    // Transaction automatically rolls back
    await tx.$disconnect();
  });

  test("create user", async () => {
    const user = await tx.user.create({
      data: { email: "test@example.com" },
    });
    expect(user).toBeDefined();
  });
});
```

### 2. **Mock External APIs in Tests**

```javascript
// Mock Stripe
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ id: "pi_test_123" }),
    },
  }));
});

// Mock Slack webhook
jest.mock("../services/notificationService", () => ({
  sendSlackAlert: jest.fn().mockResolvedValue(true),
}));
```

### 3. **Use Factories for Test Data**

```javascript
// backend/src/__tests__/factories/userFactory.ts
import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function createTestUser(overrides = {}) {
  const password = await bcrypt.hash("TestPassword123!", 10);

  return prisma.user.create({
    data: {
      email: faker.internet.email(),
      password,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: "user",
      emailVerified: true,
      ...overrides,
    },
  });
}

// Usage in tests
const user = await createTestUser({ role: "admin" });
```

### 4. **Separate Integration and Unit Tests**

```javascript
// jest.config.js
module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/__tests__/unit/**/*.test.ts'],
      testEnvironment: 'node',
    },
    {
      displayName: 'integration',
      testMatch: ['**/__tests__/integration/**/*.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
    },
  ],
};

// Run only unit tests
npm test -- --selectProjects=unit

// Run only integration tests
npm test -- --selectProjects=integration
```

### 5. **Clean Up Resources**

```javascript
afterAll(async () => {
  // Close database connections
  await prisma.$disconnect();

  // Close Redis connections
  await redis.quit();

  // Close HTTP servers
  await server.close();
});
```

---

## 📊 Verification Checklist

After setup, verify everything works:

```bash
# ✅ Test database exists
psql -U test_user -d advancia_test -c "SELECT version();"

# ✅ Migrations applied
psql -U test_user -d advancia_test -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1;"

# ✅ Test data seeded
psql -U test_user -d advancia_test -c "SELECT COUNT(*) FROM \"User\";"

# ✅ Tests pass
npm test

# ✅ Coverage generated
npm test -- --coverage
ls -la coverage/

# ✅ CI/CD pipeline succeeds
git push origin main
# Check GitHub Actions → Integration Tests workflow
```

---

## 🆘 Support

**Still having issues?**

- Check [Prisma Troubleshooting](https://www.prisma.io/docs/guides/general-guides/troubleshooting)
- Review [Jest Testing Guide](https://jestjs.io/docs/getting-started)
- Consult [PostgreSQL Documentation](https://www.postgresql.org/docs/)

**Related Documentation:**

- [PROMETHEUS_SETUP_GUIDE.md](PROMETHEUS_SETUP_GUIDE.md) - Monitoring setup
- [COMPLETE_ALERTING_OPERATIONS_GUIDE.md](COMPLETE_ALERTING_OPERATIONS_GUIDE.md) - Operations manual
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Production deployment

---

**Last Updated:** 2025-11-14  
**Version:** 1.0.0  
**Maintainer:** Advancia Pay Ledger DevOps Team
