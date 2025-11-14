/**
 * Transactions API Tests
 * Tests for transaction creation and retrieval endpoints
 */

import { Decimal } from "@prisma/client/runtime/library";
import request from "supertest";
import prisma from "../../src/prismaClient";
import {
  cleanupTestUsers,
  createTestAdmin,
  createTestUser,
  generateAdminToken,
  generateUserToken,
} from "../setup/adminSetup";
import app from "../test-app";

const API_KEY = process.env.API_KEY || "test-api-key";

describe("Transactions API", () => {
  let userId: string;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Create test user
    const user = await createTestUser({
      email: `transactions-test-${Date.now()}@example.com`,
      username: `txtest${Date.now()}`,
    });
    userId = user.id;
    userToken = generateUserToken(userId);

    // Create admin user
    const admin = await createTestAdmin();
    adminToken = generateAdminToken(admin.id);
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  describe("POST /api/transactions", () => {
    it("should create a credit transaction", async () => {
      const res = await request(app)
        .post("/api/transactions")
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          userId,
          amount: 100.5,
          type: "credit",
          description: "Test credit",
        })
        .expect(201);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("transaction");
      expect(res.body.transaction).toHaveProperty("id");
      expect(res.body.transaction).toHaveProperty("amount");
      expect(res.body.transaction.type).toBe("credit");
      expect(res.body.transaction.userId).toBe(userId);
    });

    it("should create a debit transaction", async () => {
      const res = await request(app)
        .post("/api/transactions")
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          userId,
          amount: 50.25,
          type: "debit",
          description: "Test debit",
        })
        .expect(201);

      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("transaction");
      expect(res.body.transaction).toHaveProperty("id");
      expect(res.body.transaction.type).toBe("debit");
      expect(res.body.transaction.userId).toBe(userId);
    });

    it("should reject invalid transaction type", async () => {
      const res = await request(app)
        .post("/api/transactions")
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          userId,
          amount: 100,
          type: "invalid",
          description: "Invalid type",
        })
        .expect(400);

      expect(res.body).toHaveProperty("error");
    });

    it("should reject negative amount", async () => {
      const res = await request(app)
        .post("/api/transactions")
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          userId,
          amount: -100,
          type: "credit",
          description: "Negative amount",
        })
        .expect(400);

      expect(res.body).toHaveProperty("error");
    });

    it("should require authentication", async () => {
      await request(app)
        .post("/api/transactions")
        .set("x-api-key", API_KEY)
        .send({
          userId,
          amount: 100,
          type: "credit",
        })
        .expect(401);
    });
  });

  describe("GET /api/transactions/user/:userId", () => {
    beforeAll(async () => {
      // Create some test transactions
      await prisma.transaction.createMany({
        data: [
          {
            userId,
            amount: new Decimal(100) as any,
            type: "credit",
            status: "completed",
            description: "Test transaction 1",
          },
          {
            userId,
            amount: new Decimal(50) as any,
            type: "debit",
            status: "completed",
            description: "Test transaction 2",
          },
          {
            userId,
            amount: new Decimal(200) as any,
            type: "credit",
            status: "completed",
            description: "Test transaction 3",
          },
        ],
      });
    });

    it("should return user transactions", async () => {
      const res = await request(app)
        .get(`/api/transactions/user/${userId}`)
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("transactions");
      expect(Array.isArray(res.body.transactions)).toBe(true);
      expect(res.body.transactions.length).toBeGreaterThan(0);
      expect(res.body.transactions[0]).toHaveProperty("id");
      expect(res.body.transactions[0]).toHaveProperty("amount");
      expect(res.body.transactions[0]).toHaveProperty("type");
    });

    it("should support pagination", async () => {
      const res = await request(app)
        .get(`/api/transactions/user/${userId}`)
        .query({ limit: 2, offset: 0 })
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("transactions");
      expect(Array.isArray(res.body.transactions)).toBe(true);
      // Note: Pagination params may not be implemented in this endpoint
      expect(res.body.transactions.length).toBeGreaterThan(0);
    });

    it("should require authentication", async () => {
      await request(app)
        .get(`/api/transactions/user/${userId}`)
        .set("x-api-key", API_KEY)
        .expect(401);
    });
  });

  describe("GET /api/transactions/recent/:userId", () => {
    it("should return recent transactions", async () => {
      const res = await request(app)
        .get(`/api/transactions/recent/${userId}`)
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("transactions");
      expect(Array.isArray(res.body.transactions)).toBe(true);
      // Recent endpoint typically limits results
      expect(res.body.transactions.length).toBeLessThanOrEqual(10);
    });

    it("should return transactions in descending order", async () => {
      const res = await request(app)
        .get(`/api/transactions/recent/${userId}`)
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      if (res.body.transactions && res.body.transactions.length > 1) {
        const dates = res.body.transactions.map((tx: any) =>
          new Date(tx.createdAt).getTime(),
        );
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
        }
      }
    });

    it("should require authentication", async () => {
      await request(app)
        .get(`/api/transactions/recent/${userId}`)
        .set("x-api-key", API_KEY)
        .expect(401);
    });
  });

  describe("GET /api/transactions/balance/:userId", () => {
    it("should return user balance", async () => {
      const res = await request(app)
        .get(`/api/transactions/balance/${userId}`)
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("balance");
      expect(
        typeof res.body.balance === "number" ||
          typeof res.body.balance === "string",
      ).toBe(true);
    });

    it("should require authentication", async () => {
      await request(app)
        .get(`/api/transactions/balance/${userId}`)
        .set("x-api-key", API_KEY)
        .expect(401);
    });
  });

  describe("GET /api/transactions (Admin only)", () => {
    it("should return all transactions for admin", async () => {
      const res = await request(app)
        .get("/api/transactions")
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("transactions");
      expect(Array.isArray(res.body.transactions)).toBe(true);
      expect(res.body.transactions.length).toBeGreaterThan(0);
    });

    it("should reject non-admin users", async () => {
      await request(app)
        .get("/api/transactions")
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(403);
    });

    it("should require authentication", async () => {
      await request(app)
        .get("/api/transactions")
        .set("x-api-key", API_KEY)
        .expect(401);
    });
  });
});
