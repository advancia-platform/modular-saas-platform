/**
 * UAT API Tests for New Endpoints
 * Tests: withdraw, cashout, pending rewards, leaderboard
 * Run: npm run test -- tests/uat-api-tests.ts
 */

import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

const API_BASE = process.env.API_URL || "http://localhost:4000";

describe("UAT: New API Endpoints", () => {
  let authToken: string;
  let testUserId: string;
  let testEthAddress: string;

  // Sample test data
  const testUser = {
    email: `uat-test-${Date.now()}@advancia.pay`,
    password: "TestPassword123!",
  };

  const testEthereumAddress = "0x742d35Cc6634C0532925a3b844Bc91e8e1a81aB5";

  beforeAll(async () => {
    // Create test user or login
    try {
      const response = await request(API_BASE)
        .post("/api/auth/register")
        .send(testUser);

      authToken = response.body.token;
      testUserId = response.body.user.id;
    } catch (error) {
      console.log("User may already exist, attempting login...");
      const loginResponse = await request(API_BASE)
        .post("/api/auth/login")
        .send(testUser);

      authToken = loginResponse.body.token;
      testUserId = loginResponse.body.user.id;
    }
  });

  afterAll(async () => {
    // Cleanup if needed
    console.log("UAT testing completed");
  });

  // ============================================================
  // ENDPOINT 1: POST /api/tokens/withdraw
  // ============================================================

  describe("POST /api/tokens/withdraw", () => {
    it("should withdraw tokens to valid Ethereum address", async () => {
      const response = await request(API_BASE)
        .post("/api/tokens/withdraw")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          amount: 100,
          ethAddress: testEthereumAddress,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("transactionHash");
      expect(response.body).toHaveProperty("amount", 100);
      expect(response.body).toHaveProperty("status", "pending");
    });

    it("should reject invalid Ethereum address", async () => {
      const response = await request(API_BASE)
        .post("/api/tokens/withdraw")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          amount: 100,
          ethAddress: "invalid-address",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should reject negative amount", async () => {
      const response = await request(API_BASE)
        .post("/api/tokens/withdraw")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          amount: -100,
          ethAddress: testEthereumAddress,
        });

      expect(response.status).toBe(400);
    });

    it("should require authentication", async () => {
      const response = await request(API_BASE)
        .post("/api/tokens/withdraw")
        .send({
          amount: 100,
          ethAddress: testEthereumAddress,
        });

      expect(response.status).toBe(401);
    });

    it("should respond within 2 seconds", async () => {
      const startTime = Date.now();

      const response = await request(API_BASE)
        .post("/api/tokens/withdraw")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          amount: 100,
          ethAddress: testEthereumAddress,
        });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });

  // ============================================================
  // ENDPOINT 2: POST /api/tokens/cashout
  // ============================================================

  describe("POST /api/tokens/cashout", () => {
    it("should convert tokens to USD at $0.10/token", async () => {
      const tokenAmount = 50;
      const expectedUSD = tokenAmount * 0.1;

      const response = await request(API_BASE)
        .post("/api/tokens/cashout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tokenAmount,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("usdAmount", expectedUSD);
      expect(response.body).toHaveProperty("tokensSpent", tokenAmount);
      expect(response.body).toHaveProperty("transactionId");
    });

    it("should reject cashout with zero tokens", async () => {
      const response = await request(API_BASE)
        .post("/api/tokens/cashout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tokenAmount: 0,
        });

      expect(response.status).toBe(400);
    });

    it("should reject cashout with negative tokens", async () => {
      const response = await request(API_BASE)
        .post("/api/tokens/cashout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tokenAmount: -50,
        });

      expect(response.status).toBe(400);
    });

    it("should update user USD balance", async () => {
      const response = await request(API_BASE)
        .post("/api/tokens/cashout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tokenAmount: 25,
        });

      expect(response.status).toBe(200);

      // Verify balance was updated
      const balanceResponse = await request(API_BASE)
        .get("/api/tokens/balance")
        .set("Authorization", `Bearer ${authToken}`);

      expect(balanceResponse.body).toHaveProperty("usdBalance");
      expect(balanceResponse.body.usdBalance).toBeGreaterThan(0);
    });

    it("should respond within 2 seconds", async () => {
      const startTime = Date.now();

      const response = await request(API_BASE)
        .post("/api/tokens/cashout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tokenAmount: 10,
        });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });

  // ============================================================
  // ENDPOINT 3: GET /api/rewards/pending/:userId
  // ============================================================

  describe("GET /api/rewards/pending/:userId", () => {
    it("should return pending non-expired rewards", async () => {
      const response = await request(API_BASE)
        .get(`/api/rewards/pending/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.rewards)).toBe(true);

      // Check reward structure
      response.body.rewards.forEach((reward: any) => {
        expect(reward).toHaveProperty("id");
        expect(reward).toHaveProperty("amount");
        expect(reward).toHaveProperty("expiresAt");
        expect(reward).toHaveProperty("createdAt");
      });
    });

    it("should exclude expired rewards", async () => {
      const response = await request(API_BASE)
        .get(`/api/rewards/pending/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // All rewards should have expiration in the future
      response.body.rewards.forEach((reward: any) => {
        const expiresAt = new Date(reward.expiresAt);
        expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
      });
    });

    it("should calculate total pending amount correctly", async () => {
      const response = await request(API_BASE)
        .get(`/api/rewards/pending/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("totalAmount");

      if (response.body.rewards.length > 0) {
        const calculatedTotal = response.body.rewards.reduce(
          (sum: number, r: any) => sum + r.amount,
          0
        );
        expect(response.body.totalAmount).toBe(calculatedTotal);
      }
    });

    it("should respond within 500ms", async () => {
      const startTime = Date.now();

      const response = await request(API_BASE)
        .get(`/api/rewards/pending/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
    });

    it("should return 404 for invalid user ID", async () => {
      const response = await request(API_BASE)
        .get("/api/rewards/pending/invalid-user-id")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ============================================================
  // ENDPOINT 4: GET /api/rewards/leaderboard
  // ============================================================

  describe("GET /api/rewards/leaderboard", () => {
    it("should return top users ranked by rewards", async () => {
      const response = await request(API_BASE)
        .get("/api/rewards/leaderboard")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.leaderboard)).toBe(true);
      expect(response.body.leaderboard.length).toBeGreaterThan(0);
    });

    it("should include required user fields", async () => {
      const response = await request(API_BASE)
        .get("/api/rewards/leaderboard")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      response.body.leaderboard.forEach((user: any) => {
        expect(user).toHaveProperty("rank");
        expect(user).toHaveProperty("userId");
        expect(user).toHaveProperty("userName");
        expect(user).toHaveProperty("totalRewards");
        expect(user).toHaveProperty("tier");
      });
    });

    it("should respect limit parameter", async () => {
      const response = await request(API_BASE)
        .get("/api/rewards/leaderboard?limit=5")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.leaderboard.length).toBeLessThanOrEqual(5);
    });

    it("should return users ranked correctly (highest rewards first)", async () => {
      const response = await request(API_BASE)
        .get("/api/rewards/leaderboard")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      for (let i = 0; i < response.body.leaderboard.length - 1; i++) {
        const current = response.body.leaderboard[i];
        const next = response.body.leaderboard[i + 1];

        expect(current.totalRewards).toBeGreaterThanOrEqual(next.totalRewards);
      }
    });

    it("should include tier information", async () => {
      const response = await request(API_BASE)
        .get("/api/rewards/leaderboard?limit=3")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      response.body.leaderboard.forEach((user: any) => {
        expect(user.tier).toBeDefined();
        expect(["bronze", "silver", "gold", "platinum"]).toContain(
          user.tier.toLowerCase()
        );
      });
    });

    it("should respond within 500ms even with large dataset", async () => {
      const startTime = Date.now();

      const response = await request(API_BASE)
        .get("/api/rewards/leaderboard?limit=100")
        .set("Authorization", `Bearer ${authToken}`);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
    });

    it("should handle pagination correctly", async () => {
      const page1Response = await request(API_BASE)
        .get("/api/rewards/leaderboard?limit=5&offset=0")
        .set("Authorization", `Bearer ${authToken}`);

      const page2Response = await request(API_BASE)
        .get("/api/rewards/leaderboard?limit=5&offset=5")
        .set("Authorization", `Bearer ${authToken}`);

      // Users should be different on different pages
      const page1Ids = page1Response.body.leaderboard.map((u: any) => u.userId);
      const page2Ids = page2Response.body.leaderboard.map((u: any) => u.userId);

      const intersection = page1Ids.filter((id: string) =>
        page2Ids.includes(id)
      );
      expect(intersection.length).toBe(0);
    });
  });

  // ============================================================
  // INTEGRATION TESTS
  // ============================================================

  describe("Integration: User Flow", () => {
    it("should execute complete token transaction flow", async () => {
      // 1. Get initial balance
      const initialBalance = await request(API_BASE)
        .get("/api/tokens/balance")
        .set("Authorization", `Bearer ${authToken}`);

      // 2. Perform cashout
      const cashoutResponse = await request(API_BASE)
        .post("/api/tokens/cashout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tokenAmount: 10,
        });

      expect(cashoutResponse.status).toBe(200);

      // 3. Verify balance updated
      const updatedBalance = await request(API_BASE)
        .get("/api/tokens/balance")
        .set("Authorization", `Bearer ${authToken}`);

      expect(updatedBalance.body.tokenBalance).toBeLessThan(
        initialBalance.body.tokenBalance
      );
    });

    it("should show user in leaderboard after earning rewards", async () => {
      // Get leaderboard before
      const beforeResponse = await request(API_BASE)
        .get("/api/rewards/leaderboard")
        .set("Authorization", `Bearer ${authToken}`);

      const userInLeaderboard = beforeResponse.body.leaderboard.some(
        (user: any) => user.userId === testUserId
      );

      expect(userInLeaderboard).toBe(true);
    });
  });
});
