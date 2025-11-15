# 🧪 Test Database Quick Reference

## 🚀 Quick Commands

### Setup

```bash
# One-time setup: Create DB, run migrations, seed data
npm run db:setup:test

# Just run migrations
npm run migrate:test

# Just seed data
npm run seed:test
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# With coverage report
npm run test:coverage

# Verbose output
npm run test:verbose

# Run specific test file
npm test -- src/__tests__/integration/auth.test.js

# Run tests matching pattern
npm test -- --testNamePattern="User Authentication"
```

### Database Management

```bash
# Reset database (drop all data, re-run migrations)
npm run db:reset:test

# Open Prisma Studio for test database
npm run prisma:studio:test

# Generate Prisma Client
npm run prisma:generate
```

## 🔑 Test Credentials

Created by seed script (`npm run seed:test`):

| Role  | Email               | Password      |
| ----- | ------------------- | ------------- |
| Admin | admin@advancia.test | TestAdmin123! |
| User  | user@advancia.test  | TestUser123!  |
| Agent | agent@advancia.test | TestAgent123! |

## 📊 Test Data Seeded

After running `npm run seed:test`:

- ✅ 3 Users (admin, user, agent)
- ✅ 2 Token Wallets (admin, user)
- ✅ 1 Crypto Wallet (user)
- ✅ 2 Transactions (deposit, withdrawal)
- ✅ 2 Token Transactions (credit, debit)
- ✅ 1 Reward (referral)
- ✅ 2 Support Tickets (open, resolved)
- ✅ 2 Notifications (unread, read)
- ✅ 1 Audit Log

## 🔧 Troubleshooting

### "Cannot connect to test database"

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Verify database exists
psql -U test_user -d advancia_test

# Check .env.test URL
cat backend/.env.test | grep TEST_DATABASE_URL

# Expected format:
# TEST_DATABASE_URL=postgres://test_user:test_pass@localhost:5432/advancia_test
```

### "Permission denied"

```bash
# Grant privileges to test user
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE advancia_test TO test_user;
ALTER DATABASE advancia_test OWNER TO test_user;
\q
```

### "Migration lock timeout"

```bash
# Release lock
psql -U test_user -d advancia_test
DELETE FROM _prisma_migrations WHERE migration_name = 'migration-engine-lock';
\q

# Or reset completely
npm run db:reset:test
```

### "Tests hanging"

```bash
# Check for open database connections
psql -U test_user -d advancia_test
SELECT * FROM pg_stat_activity WHERE datname = 'advancia_test';

# Kill if needed
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'advancia_test' AND pid <> pg_backend_pid();
```

### "Port already in use"

```bash
# Find process on port 4001
lsof -i :4001
# or
netstat -tulpn | grep 4001

# Kill process
kill -9 <PID>

# Or use different port in .env.test
PORT=4002
```

## 📝 Writing Tests

### Basic Test Structure

```javascript
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
});

describe("Feature Name", () => {
  beforeAll(async () => {
    // Setup before all tests
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Setup before each test
  });

  afterEach(async () => {
    // Cleanup after each test
  });

  test("should do something", async () => {
    // Test code
    expect(result).toBe(expected);
  });
});
```

### Using Test Data

```javascript
test("should authenticate test user", async () => {
  // Use seeded test user
  const user = await prisma.user.findUnique({
    where: { email: "user@advancia.test" },
  });

  expect(user).toBeDefined();
  expect(user.role).toBe("user");
});
```

### Mocking External APIs

```javascript
// Mock Stripe
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ id: "pi_test" }),
    },
  }));
});

// Mock email service
jest.mock("../services/emailService", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));
```

## 🎯 CI/CD Integration

### GitHub Actions

The `integration-tests.yml` workflow automatically:

1. ✅ Starts PostgreSQL container
2. ✅ Creates test database
3. ✅ Runs migrations
4. ✅ Seeds test data
5. ✅ Runs all tests
6. ✅ Generates coverage report
7. ✅ Uploads to Codecov
8. ✅ Cleans up database

### Required Secrets

Add in **Settings → Secrets → Actions**:

```
TEST_JWT_SECRET=your_test_jwt_secret
STRIPE_TEST_SECRET_KEY=sk_test_your_stripe_key
CRYPTOMUS_TEST_API_KEY=your_test_key
CODECOV_TOKEN=your_codecov_token
```

## 📦 NPM Scripts Reference

| Script                       | Description                             |
| ---------------------------- | --------------------------------------- |
| `npm test`                   | Run all tests                           |
| `npm run test:watch`         | Run tests in watch mode                 |
| `npm run test:coverage`      | Run tests with coverage                 |
| `npm run test:verbose`       | Run tests with verbose output           |
| `npm run migrate:test`       | Run migrations on test DB               |
| `npm run seed:test`          | Seed test database                      |
| `npm run db:setup:test`      | Complete setup (DB + migrations + seed) |
| `npm run db:reset:test`      | Reset test database                     |
| `npm run prisma:generate`    | Generate Prisma Client                  |
| `npm run prisma:studio:test` | Open Prisma Studio for test DB          |

## 🔗 Related Documentation

- [TEST_DATABASE_SETUP.md](TEST_DATABASE_SETUP.md) - Complete setup guide
- [backend/.env.test](backend/.env.test) - Environment configuration
- [backend/jest.config.js](backend/jest.config.js) - Jest configuration
- [backend/scripts/seed-test-data.js](backend/scripts/seed-test-data.js) - Seed script
- [backend/scripts/setup-test-db.js](backend/scripts/setup-test-db.js) - Setup script

---

**Last Updated:** 2025-11-14  
**Quick Help:** `npm run db:setup:test` for first-time setup, then `npm test` to run tests
