/**
 * Stripe Integration Tests
 * Note: These tests are for a generic payments API that doesn't exist yet.
 * The current /api/payments endpoints are Stripe-specific (checkout sessions).
 * These tests are SKIPPED until generic payment endpoints are implemented.
 */

import request from "supertest";
import app from "./test-app";

describe.skip("Payments API", () => {
  describe("GET /api/payments/user/:userId", () => {
    it("should return payments for a user", async () => {
      const res = await request(app).get("/api/payments/user/42");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("payments");
      expect(Array.isArray(res.body.payments)).toBe(true);
      expect(res.body).toHaveProperty("total");
    });

    it("should return payments array with correct structure", async () => {
      const res = await request(app).get("/api/payments/user/test-user-123");

      expect(res.status).toBe(200);

      if (res.body.payments.length > 0) {
        const payment = res.body.payments[0];
        expect(payment).toHaveProperty("id");
        expect(payment).toHaveProperty("userId");
        expect(payment).toHaveProperty("amount");
        expect(payment).toHaveProperty("status");
        expect(payment).toHaveProperty("createdAt");
      }
    });
  });

  describe("POST /api/payments", () => {
    it("should create a payment", async () => {
      const res = await request(app)
        .post("/api/payments")
        .send({ userId: "abc", amount: 500.11, status: "pending" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("message", "Payment created");
      expect(res.body.payment).toMatchObject({
        userId: "abc",
        amount: 500.11,
        status: "pending",
      });
      expect(res.body.payment).toHaveProperty("id");
      expect(res.body.payment).toHaveProperty("createdAt");
    });

    it("should fail without userId", async () => {
      const res = await request(app)
        .post("/api/payments")
        .send({ amount: 100 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toContain("userId");
    });

    it("should fail without amount", async () => {
      const res = await request(app)
        .post("/api/payments")
        .send({ userId: "test-user" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toContain("amount");
    });

    it("should fail with invalid amount", async () => {
      const res = await request(app)
        .post("/api/payments")
        .send({ userId: "test-user", amount: -50 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should fail with non-numeric amount", async () => {
      const res = await request(app)
        .post("/api/payments")
        .send({ userId: "test-user", amount: "invalid" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should default status to pending if not provided", async () => {
      const res = await request(app)
        .post("/api/payments")
        .send({ userId: "test-user", amount: 100 });

      expect(res.status).toBe(201);
      expect(res.body.payment.status).toBe("pending");
    });

    it("should accept custom status", async () => {
      const res = await request(app)
        .post("/api/payments")
        .send({ userId: "test-user", amount: 100, status: "completed" });

      expect(res.status).toBe(201);
      expect(res.body.payment.status).toBe("completed");
    });
  });

  describe("GET /api/payments/:paymentId", () => {
    it("should return a specific payment", async () => {
      const paymentId = "12345";
      const res = await request(app).get(`/api/payments/${paymentId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("payment");
      expect(res.body.payment).toHaveProperty("id");
      expect(res.body.payment).toHaveProperty("amount");
      expect(res.body.payment).toHaveProperty("status");
    });
  });

  describe("Payment amount validation", () => {
    it("should handle decimal amounts correctly", async () => {
      const res = await request(app)
        .post("/api/payments")
        .send({ userId: "test-user", amount: 123.45 });

      expect(res.status).toBe(201);
      expect(res.body.payment.amount).toBe(123.45);
    });

    it("should handle large amounts", async () => {
      const res = await request(app)
        .post("/api/payments")
        .send({ userId: "test-user", amount: 999999.99 });

      expect(res.status).toBe(201);
      expect(res.body.payment.amount).toBe(999999.99);
    });

    it("should handle zero amount (edge case)", async () => {
      const res = await request(app)
        .post("/api/payments")
        .send({ userId: "test-user", amount: 0 });

      // Zero amounts should be rejected
      expect(res.status).toBe(400);
    });
  });

  describe("Payment status values", () => {
    const validStatuses = ["pending", "completed", "failed", "cancelled"];

    validStatuses.forEach((status) => {
      it(`should accept status: ${status}`, async () => {
        const res = await request(app)
          .post("/api/payments")
          .send({ userId: "test-user", amount: 100, status });

        expect(res.status).toBe(201);
        expect(res.body.payment.status).toBe(status);
      });
    });
  });
});

describe("Enhanced Payments - Create Intent", () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test user with valid password per security rules
    const signupResponse = await request(app)
      .post("/api/auth/register")
      .set("x-api-key", process.env.API_KEY || "dev-api-key-123")
      .send({
        email: `payment-test-${Date.now()}@example.com`,
        password: "ValidTest123!@#", // 12+ chars, complexity
        username: `paymentuser-${Date.now()}`,
        firstName: "Payment",
        lastName: "Test",
      });

    expect(signupResponse.status).toBe(201);
    testUserId = signupResponse.body.user?.id || "";
    authToken = signupResponse.body.token;
  });

  afterAll(async () => {
    // Cleanup test user
    if (testUserId) {
      await request(app)
        .delete(`/api/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .set("x-api-key", process.env.API_KEY || "dev-api-key-123");
    }
  });

  it("should create payment intent with proper authentication", async () => {
    // Fix: Verify route is registered in backend/src/index.ts
    // Check: app.use('/api/payments', paymentsRoutes);

    const response = await request(app)
      .post("/api/payments/create-intent") // Match exact route from payments.ts
      .set("Authorization", `Bearer ${authToken}`)
      .set("x-api-key", process.env.API_KEY || "dev-api-key-123")
      .send({
        amount: 1000,
        currency: "usd",
        description: "Test payment",
      });

    // If 404, the route may not be registered or path is wrong
    if (response.status === 404) {
      console.error(
        "Payment route not found. Check backend/src/index.ts route registration:",
      );
      console.error("Expected: app.use('/api/payments', paymentsRoutes);");
    }

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("clientSecret");
  });
});
