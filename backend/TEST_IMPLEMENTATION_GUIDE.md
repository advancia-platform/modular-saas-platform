# Test Implementation Guide

## Overview

This guide explains how to enable the 19 currently skipped tests using the new test infrastructure (mocks.ts, testEnv.ts, adminSetup.ts).

## Skipped Tests Breakdown

- **Payments API**: 17 tests (entire suite) - `tests/payments.test.ts`
- **Notifications**: 2 tests - `tests/integration.test.ts` lines 546-585

---

## Part 1: Enable Payments Tests (17 tests)

### Current State

File: `backend/tests/payments.test.ts`

- Status: Entire suite marked with `describe.skip`
- Reason: Tests for generic payment API that doesn't exist yet (current endpoints are Stripe-specific)

### Implementation Options

#### Option A: Skip Implementation (Recommended for now)

These tests expect generic `/api/payments` endpoints that are NOT implemented. The current system uses:

- `/api/payments/checkout-session` (Stripe)
- `/api/payments/webhook` (Stripe)

**Action**: Leave as `describe.skip` until generic payment endpoints are created.

#### Option B: Rewrite Tests for Existing Stripe API

If you want to test the actual Stripe integration:

1. Create new test file: `backend/tests/routes/stripe.test.ts`

```typescript
import request from "supertest";
import app from "../test-app";
import {
  createTestUser,
  generateUserToken,
  cleanupTestUsers,
} from "../setup/adminSetup";
import { mockStripeCheckoutSession } from "../setup/mocks";

describe("Stripe Payments API", () => {
  let userId: string;
  let userToken: string;

  beforeAll(async () => {
    const user = await createTestUser();
    userId = user.id;
    userToken = generateUserToken(userId);
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  describe("POST /api/payments/checkout-session", () => {
    it("should create Stripe checkout session", async () => {
      const res = await request(app)
        .post("/api/payments/checkout-session")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          amount: 50.0,
          currency: "USD",
          successUrl: "http://localhost:3000/success",
          cancelUrl: "http://localhost:3000/cancel",
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("sessionId");
      expect(res.body).toHaveProperty("url");
    });

    it("should reject invalid amount", async () => {
      const res = await request(app)
        .post("/api/payments/checkout-session")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          amount: -10,
          currency: "USD",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/payments/webhook", () => {
    it("should handle Stripe webhook with valid signature", async () => {
      // This requires mocking Stripe webhook signature verification
      const res = await request(app)
        .post("/api/payments/webhook")
        .set("stripe-signature", "mock-signature")
        .send({
          type: "checkout.session.completed",
          data: mockStripeCheckoutSession,
        });

      // Webhook typically returns 200 with no body
      expect([200, 400]).toContain(res.status);
    });
  });
});
```

2. Add Stripe mock to `backend/tests/setup/mocks.ts`:

```typescript
export const mockStripeCheckoutSession = {
  id: "cs_test_123",
  object: "checkout.session",
  amount_total: 5000,
  currency: "usd",
  customer: "cus_test_123",
  payment_status: "paid",
  status: "complete",
};

export const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/test",
      }),
    },
  },
  webhooks: {
    constructEvent: jest.fn().mockReturnValue({
      type: "checkout.session.completed",
      data: { object: mockStripeCheckoutSession },
    }),
  },
};
```

---

## Part 2: Enable Notifications Tests (2 tests)

### Current State

File: `backend/tests/integration.test.ts` lines 546-585

- Status: `describe.skip("Notifications", ...)`
- Reason: Comment states "Notifications routes don't exist as standalone endpoints yet"

### Investigation Required

Before enabling, check if notification endpoints exist:

```bash
cd backend
grep -r "router.*notifications" src/routes/
grep -r "/api/notifications" src/
```

### Implementation Steps

#### Step 1: Verify Route Existence

Check `backend/src/index.ts` for notification route registration:

```typescript
// Look for something like:
app.use("/api/notifications", notificationsRouter);
```

#### Step 2A: If Routes Exist - Enable Tests

1. **Update test file** `backend/tests/integration.test.ts`:
   - Change `describe.skip` to `describe` on line 546

2. **Add admin authentication** (notifications require admin):

```typescript
import {
  createTestAdmin,
  generateAdminToken,
  cleanupTestAdmin,
} from "./setup/adminSetup";

// In the Notifications describe block:
describe("Notifications", () => {
  let adminToken: string;

  beforeAll(async () => {
    await createTestAdmin();
    adminToken = generateAdminToken("admin-test-id");
  });

  afterAll(async () => {
    await cleanupTestAdmin();
  });

  it("should get user notifications", async () => {
    expect(authToken).toBeDefined();

    const res = await request(app)
      .get("/api/notifications")
      .set("x-api-key", API_KEY)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should mark notification as read", async () => {
    expect(authToken).toBeDefined();
    expect(testUserId).toBeDefined();

    const notification = await prisma.notification.create({
      data: {
        userId: testUserId,
        type: "INFO",
        category: "SYSTEM",
        title: "Test Notification",
        message: "Test message for notification read test",
        isRead: false,
      },
    });

    const res = await request(app)
      .put(`/api/notifications/${notification.id}/read`)
      .set("x-api-key", API_KEY)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.isRead).toBe(true);

    // Cleanup
    await prisma.notification.delete({ where: { id: notification.id } });
  });
});
```

#### Step 2B: If Routes Don't Exist - Create Routes First

1. **Create notification routes**: `backend/src/routes/notifications.ts`

```typescript
import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import prisma from "../prismaClient";

const router = Router();

// GET /api/notifications - Get user's notifications
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put("/:id/read", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update notification" });
  }
});

export default router;
```

2. **Register route in** `backend/src/index.ts`:

```typescript
import notificationsRouter from "./routes/notifications";

// In the routes section:
app.use("/api/notifications", notificationsRouter);
```

3. **Then enable tests** as described in Step 2A

---

## Part 3: Run Tests

### Run All Tests

```bash
cd backend
npm test
```

### Run Specific Test Suite

```bash
# Run only integration tests
npm test -- integration.test.ts

# Run only Stripe tests (if created)
npm test -- stripe.test.ts
```

### Run with Coverage

```bash
npm test -- --coverage --coveragePathIgnorePatterns=tests/
```

---

## Part 4: Add NPM Scripts

Add to `backend/package.json`:

```json
{
  "scripts": {
    "test": "NODE_ENV=test jest --runInBand --passWithNoTests",
    "test:watch": "NODE_ENV=test jest --watch",
    "test:coverage": "NODE_ENV=test jest --coverage --coveragePathIgnorePatterns=tests/",
    "test:integration": "NODE_ENV=test jest integration.test.ts --runInBand",
    "test:unit": "NODE_ENV=test jest --testPathIgnorePatterns=integration.test.ts --runInBand",
    "test:api": "NODE_ENV=test jest --testPathPattern='routes|auth|email' --runInBand",
    "test:verbose": "NODE_ENV=test jest --verbose --runInBand"
  }
}
```

---

## Verification Checklist

After implementation:

- [ ] Check notification routes exist: `grep -r "api/notifications" backend/src/`
- [ ] Verify .env.test has all required variables
- [ ] Test infrastructure files created:
  - [ ] `backend/tests/setup/mocks.ts`
  - [ ] `backend/tests/setup/testEnv.ts`
  - [ ] `backend/tests/setup/adminSetup.ts`
- [ ] Run tests: `cd backend && npm test`
- [ ] Verify test counts:
  - Before: 65 passed, 19 skipped
  - After enabling notifications: 67 passed, 17 skipped
  - After all implementations: 84 passed, 0 skipped

---

## Priority Recommendations

1. **HIGH**: Enable Notifications tests (2 tests)
   - Quick win
   - Real endpoints likely exist
   - Requires admin authentication setup

2. **MEDIUM**: Create Stripe payment tests (replace generic payments)
   - Tests actual implemented functionality
   - Requires Stripe mocking
   - Better than testing non-existent API

3. **LOW**: Implement generic payments API
   - Large effort
   - May not be needed if Stripe covers requirements
   - Would enable original 17 payment tests

---

## Next Steps

1. Check if notification routes exist:

```bash
cd /root/projects/advancia-pay-ledger/backend
grep -r "router.*notification" src/routes/
grep -r "/api/notifications" src/index.ts
```

2. If routes exist → Enable notification tests immediately
3. If routes don't exist → Create notification routes first
4. Consider creating Stripe-specific tests instead of generic payment tests

---

## Support

For questions or issues:

- Check test output: `npm test -- --verbose`
- Review mock implementations in `tests/setup/mocks.ts`
- Verify environment config in `.env.test`
- Check admin setup in `tests/setup/adminSetup.ts`
