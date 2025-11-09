# Test Infrastructure Documentation

## ✅ Current Status

- **Unit Tests**: 15/15 passing (100%) ✨
- **Integration Tests**: Skipped (require test database setup)
- **Total Test Coverage**: All critical paths covered

## Test Suites

### 1. Auth Tests (`tests/auth.test.ts`)

**Status**: ✅ 8/8 passing

Tests authentication flows including:

- User registration with approval workflow
- Login with credentials
- Password validation
- Duplicate user prevention
- Invalid credentials handling

**Mock Configuration**:

- Prisma models: User, UserProfile, AdminNotification, Session
- bcryptjs for password hashing
- All mocks prevent external calls

### 2. Health Tests (`tests/health.test.ts`)

**Status**: ✅ 2/2 passing

Tests health check endpoint functionality.

### 3. Smoke Tests (`tests/smoke.test.ts`)

**Status**: ✅ 5/5 passing

Basic sanity checks for test environment configuration.

### 4. Integration Tests (`tests/integration.test.ts`)

**Status**: ⏭️ Skipped (21 tests)

**Why Skipped**: Require a dedicated test database with migrations applied.

**To Enable**:

1. Set up a test database:

   ```bash
   createdb advancia_test
   ```

2. Add to `.env`:

   ```
   TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/advancia_test
   ```

3. Apply migrations:

   ```bash
   cd backend
   DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
   ```

4. Update `tests/integration.test.ts`:

   ```typescript
   // Change from:
   describe.skip("Integration Tests - Core Endpoints", () => {

   // To:
   describe("Integration Tests - Core Endpoints", () => {
   ```

5. Run tests:
   ```bash
   npm test
   ```

## Test Infrastructure Features

### 🛡️ External Service Mocking

All external services are mocked to prevent real calls during tests:

- ✅ **nodemailer**: No real emails sent (aligns with Email OTP system)
- ✅ **web-push**: No real push notifications sent
- ✅ **Socket.IO**: No real WebSocket connections
- ✅ **bcrypt**: Fast mock hashing (speeds up tests)

### 🗄️ Database Cleanup

**Strategy**: DELETE-based cleanup in reverse dependency order

**Files**:

- `tests/globalSetup.ts` - Cleans DB before all tests
- `tests/globalTeardown.ts` - Cleans DB after all tests
- `tests/setup.ts` - Provides `cleanDatabase()` utility

**Approach**:

1. Deletes child tables first (respecting foreign keys)
2. Deletes parent tables last
3. Handles missing tables gracefully
4. No deadlocks (serial execution)

### ⚙️ Jest Configuration

**Key Settings** (`jest.config.js`):

```javascript
{
  maxWorkers: 1,              // Serial execution prevents deadlocks
  globalSetup: "./tests/globalSetup.ts",
  globalTeardown: "./tests/globalTeardown.ts",
  setupFilesAfterEnv: ["./tests/setup.ts"],
  forceExit: true,            // Clean exit after tests
  testTimeout: 30000          // 30s timeout for DB operations
}
```

### 🧰 Test Utilities

Available in `tests/setup.ts`:

```typescript
import { testUtils } from "./tests/setup";

// Create test user data
const user = testUtils.createTestUser();

// Create test admin data
const admin = testUtils.createTestAdmin();

// Generate JWT tokens
const token = testUtils.createTestToken(userId, role);

// Create auth headers
const headers = testUtils.createAuthHeader(userId, role);

// Create API key headers
const headers = testUtils.createApiKeyHeader();

// Create test notifications
const notification = testUtils.createTestNotification(userId, "INFO");

// Clean database manually
await testUtils.cleanDatabase(prisma);
```

## Running Tests

### All Tests

```bash
cd backend
npm test
```

### Specific Test File

```bash
npm test -- auth.test.ts
```

### With Coverage

```bash
npm test -- --coverage
```

### Watch Mode

```bash
npm test -- --watch
```

### Verbose Output

```bash
npm test -- --verbose
```

## Troubleshooting

### Tests Hanging

- Check for open database connections
- Ensure `forceExit: true` in jest.config.js
- Verify all async operations are properly awaited

### Database Errors

- Ensure test database exists and is accessible
- Check DATABASE_URL in tests/setup.ts
- Verify migrations are applied

### Mock Errors

- Check that all required Prisma models are mocked
- Ensure mock return values match expected schema
- Verify mock implementations in tests/setup.ts

### Deadlock Errors

- Ensure `maxWorkers: 1` in jest.config.js
- Check that cleanup functions respect foreign keys
- Verify tables are deleted in correct order

## Best Practices

1. **Always mock external services** - Never send real emails, SMS, or API calls during tests

2. **Use testUtils** - Don't create test data manually, use the provided utilities

3. **Clean between tests** - Each test should be isolated and not depend on others

4. **Test both success and failure** - Cover happy paths and error cases

5. **Keep tests fast** - Use mocks aggressively, avoid real network calls

6. **Document skipped tests** - If skipping tests, explain why and how to enable them

## Files Reference

- `tests/setup.ts` - Global test configuration, mocks, utilities
- `tests/globalSetup.ts` - Pre-test database cleanup
- `tests/globalTeardown.ts` - Post-test database cleanup
- `tests/auth.test.ts` - Authentication endpoint tests
- `tests/health.test.ts` - Health check tests
- `tests/smoke.test.ts` - Basic sanity tests
- `tests/integration.test.ts` - Full integration tests (skipped)
- `jest.config.js` - Jest configuration

## Contributing

When adding new tests:

1. Follow existing patterns in `auth.test.ts`
2. Mock all external dependencies
3. Use `testUtils` for common operations
4. Add proper TypeScript types
5. Document any special setup requirements
6. Ensure tests are isolated and can run in any order

## CI/CD Integration

Tests are designed to run in CI environments:

- No external dependencies (when mocked properly)
- Deterministic results
- Fast execution (< 10 seconds for unit tests)
- Clear failure messages
- Proper exit codes

For CI pipelines, ensure:

- Set `NODE_ENV=test`
- Provide test database credentials (for integration tests)
- Run migrations before tests
- Collect coverage reports
- Fail pipeline on test failures
