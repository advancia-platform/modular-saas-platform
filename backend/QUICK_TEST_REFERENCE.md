# Quick Reference: Test Infrastructure

## Files Created

- ✅ `tests/setup/mocks.ts` - Mock objects for Cryptomus, Email, Blockchain
- ✅ `tests/setup/testEnv.ts` - Environment helpers
- ✅ `tests/setup/adminSetup.ts` - User management & auth
- ✅ `.env.test` - Test environment config
- ✅ `TEST_IMPLEMENTATION_GUIDE.md` - Detailed guide
- ✅ `TEST_INFRASTRUCTURE_COMPLETE.md` - Full summary
- ✅ `scripts/enable-notification-tests.ts` - Automation

## Current Status

```
Tests: 65 passed, 19 skipped (84 total)
```

## Enable Notifications (2 tests) - 5 MINUTES

```bash
cd /root/projects/advancia-pay-ledger/backend
npx ts-node scripts/enable-notification-tests.ts
```

Then edit `tests/integration.test.ts` line ~546:

```typescript
import {
  createTestAdmin,
  generateAdminToken,
  cleanupTestAdmin,
} from "./setup/adminSetup";

describe("Notifications", () => {
  // Remove .skip
  let adminToken: string;

  beforeAll(async () => {
    const admin = await createTestAdmin();
    adminToken = generateAdminToken(admin.id);
  });

  afterAll(async () => {
    await cleanupTestAdmin();
  });

  // In both tests, replace authToken with adminToken
  // Change route: /api/notifications → /api/admin/user-approval/notifications
  // Change: .put(${id}/read) → .post(${id}/mark-read)
});
```

Run tests:

```bash
npm test
```

Expected: **67 passed, 17 skipped**

## Mock Usage

```typescript
import { mockCryptomusAPI, mockEmailService, resetAllMocks } from './setup/mocks';

beforeEach(() => resetAllMocks());

it('test', async () => {
  const invoice = await mockCryptomusAPI.createInvoice({...});
  expect(invoice).toHaveProperty('payment_url');
});
```

## Admin Authentication

```typescript
import { createTestAdmin, generateAdminToken } from "./setup/adminSetup";

let adminToken: string;

beforeAll(async () => {
  const admin = await createTestAdmin();
  adminToken = generateAdminToken(admin.id);
});

it("admin test", async () => {
  const res = await request(app)
    .get("/api/admin/endpoint")
    .set("Authorization", `Bearer ${adminToken}`);
});
```

## Environment Helpers

```typescript
import { loadTestEnv, skipIfNoCredentials } from "./setup/testEnv";

beforeAll(() => {
  loadTestEnv();
  skipIfNoCredentials(["CRYPTOMUS_API_KEY"]);
});
```

## Recommended npm Scripts

```json
{
  "test": "NODE_ENV=test jest --runInBand",
  "test:watch": "NODE_ENV=test jest --watch",
  "test:coverage": "NODE_ENV=test jest --coverage",
  "test:notify": "NODE_ENV=test jest --testNamePattern='Notifications'"
}
```

## Documentation

- `TEST_INFRASTRUCTURE_COMPLETE.md` - Full summary & examples
- `TEST_IMPLEMENTATION_GUIDE.md` - Detailed enablement guide

## Next Steps

1. Enable notification tests (5 min)
2. Add npm scripts to package.json
3. Run: `npm test`
