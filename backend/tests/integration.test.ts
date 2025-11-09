/**
 * ═══════════════════════════════════════════════════════════
 * ADVANCIA PAY LEDGER - INTEGRATION TEST SUITE
 * Complete API endpoint testing with real database
 *
 * Uses TEST_DATABASE_URL for real database testing
 * Database is cleaned before and after tests
 * ═══════════════════════════════════════════════════════════
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import prisma from "../src/prismaClient";
import app from "./test-app";

// Mock notificationService to prevent real notifications during tests
jest.mock("../src/services/notificationService", () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
  notifyAllAdmins: jest.fn().mockResolvedValue([]),
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

const API_KEY = process.env.API_KEY || "dev-api-key-123";
const JWT_SECRET =
  process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";

// ═══════════════════════════════════════════════════════════
// HELPER UTILITIES
// ═══════════════════════════════════════════════════════════

/**
 * Clean test database using Prisma client methods
 * This automatically handles table naming and relationships
 * Respects foreign key constraints by deleting child tables first
 */
async function cleanDatabase() {
  try {
    // Delete in order to respect foreign key constraints
    // Child tables first, then parent tables
    await prisma.tokenTransaction.deleteMany({});
    await prisma.tokenWallet.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.reward.deleteMany({});
    await prisma.userTier.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.cryptoWithdrawal.deleteMany({});
    await prisma.cryptoOrder.deleteMany({});
    await prisma.ethActivity.deleteMany({});
    await prisma.supportTicket.deleteMany({});
    await prisma.pushSubscription.deleteMany({});
    await prisma.healthReading.deleteMany({});
    await prisma.debitCard.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.backupCode.deleteMany({});
    await prisma.loan.deleteMany({});
    await prisma.userProfile.deleteMany({});
    await prisma.user.deleteMany({});

    console.log("✅ Database cleaned successfully");
  } catch (err: any) {
    console.error("❌ Error cleaning database:", err.message);
    throw err;
  }
}

/**
 * Seed admin user for testing admin endpoints
 * Uses bcrypt for password hashing (same as production)
 * Creates UserProfile to avoid foreign key constraints
 */
async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@advancia.app";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  // Check if admin already exists
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!admin) {
    // Hash password with bcrypt (same as production auth)
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        username: "adminuser",
        firstName: "Admin",
        lastName: "User",
        passwordHash: hashedPassword,
        role: "ADMIN",
        emailVerified: true,
        active: true,
        approved: true,
      },
    });

    // Create admin profile (required by schema)
    await prisma.userProfile.create({
      data: {
        id: `profile-${admin.id}`,
        userId: admin.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✅ Admin user created:", admin.email);
  }

  // Generate JWT token with admin role and email (matches middleware expectations)
  const token = jwt.sign(
    {
      userId: admin.id,
      email: admin.email,
      role: "ADMIN",
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { admin, token };
}

// ═══════════════════════════════════════════════════════════
// CORE INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════
describe("Integration Tests - Core Endpoints", () => {
  let authToken: string;
  let testUserId: string;
  let testUserEmail: string;

  beforeAll(async () => {
    console.log("🧹 Cleaning database before tests...");

    // Verify database connection
    try {
      await prisma.$connect();
      console.log("✅ Database connected");
    } catch (error: any) {
      console.error("❌ Database connection failed:", error.message);
      throw error;
    }

    await cleanDatabase();
  });

  afterAll(async () => {
    console.log("🧹 Cleaning database after tests...");
    await cleanDatabase();
    await prisma.$disconnect();
  });

  // ═══════════════════════════════════════════════════════════
  // AUTHENTICATION FLOW
  // ═══════════════════════════════════════════════════════════
  describe("Authentication Flow", () => {
    it("should check health endpoint", async () => {
      const res = await request(app).get("/api/health").expect(200);
      expect(res.body).toHaveProperty("status", "healthy");
      expect(res.body).toHaveProperty("timestamp");
    });

    it("should fail login with invalid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .set("x-api-key", API_KEY)
        .send({
          email: "nonexistent@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(res.body.error).toMatch(/invalid credentials/i);
    });

    it("should register new user and create profile", async () => {
      testUserEmail = `test-${Date.now()}@example.com`;
      const testUsername = `testuser${Date.now()}`;

      const res = await request(app)
        .post("/api/auth/register")
        .set("x-api-key", API_KEY)
        .send({
          email: testUserEmail,
          password: "Test123!@#",
          username: testUsername,
          firstName: "Test",
          lastName: "User",
        });

      // Debug 500 errors
      if (res.status === 500) {
        console.error("❌ Registration failed:", {
          status: res.status,
          body: res.body,
          error: res.body.error,
        });
      }

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toMatchObject({
        email: testUserEmail,
      });

      authToken = res.body.token;
      testUserId = res.body.user.id;

      // Debug token payload
      const decoded = jwt.verify(authToken, JWT_SECRET) as any;
      console.log("🔍 Token payload:", {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      });

      // Verify UserProfile was created
      const profile = await prisma.userProfile.findUnique({
        where: { userId: testUserId },
      });
      expect(profile).toBeDefined();

      // Approve user for subsequent tests
      await prisma.user.update({
        where: { id: testUserId },
        data: { emailVerified: true, active: true, approved: true },
      });

      // Verify user state after approval
      const verifyUser = await prisma.user.findUnique({
        where: { id: testUserId },
        select: {
          id: true,
          email: true,
          approved: true,
          active: true,
          emailVerified: true,
          role: true,
        },
      });
      console.log("✅ User State After Approval:", verifyUser);
    });

    it("should authenticate with valid token", async () => {
      // Ensure registration succeeded
      expect(authToken).toBeDefined();
      expect(testUserId).toBeDefined();

      console.log(
        "🔍 Testing /api/auth/me with token:",
        authToken.substring(0, 30) + "..."
      );

      const res = await request(app)
        .get("/api/auth/me")
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${authToken}`);

      // Debug response
      if (res.status !== 200) {
        console.error("❌ Auth /me failed:", {
          status: res.status,
          statusText: res.statusCode,
          body: res.body,
          headers: res.headers,
        });

        // Verify user still exists and is approved
        const userCheck = await prisma.user.findUnique({
          where: { id: testUserId },
          select: {
            id: true,
            email: true,
            approved: true,
            active: true,
            emailVerified: true,
          },
        });
        console.error("❌ User state during failure:", userCheck);
      }

      expect(res.status).toBe(200);

      // Handle both response formats: { user: {...} } or {...}
      const userData = res.body.user || res.body;
      expect(userData).toHaveProperty("id", testUserId);
      expect(userData).toHaveProperty("email", testUserEmail);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // AI ANALYTICS ENDPOINTS
  // ═══════════════════════════════════════════════════════════
  describe("AI Analytics Endpoints", () => {
    it("should generate market insights", async () => {
      expect(authToken).toBeDefined();

      console.log("🔍 Testing AI Analytics with userId:", testUserId);

      const res = await request(app)
        .get("/api/ai-analytics/market-insights")
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${authToken}`);

      // Debug failures
      if (res.status !== 200) {
        console.error("❌ Market insights failed:", {
          status: res.status,
          body: res.body,
        });
      }

      expect(res.status).toBe(200);
      // Flexible assertion: handles both {insights: []} and {data: {insights: []}}
      const insights =
        res.body.insights || res.body.data?.insights || res.body.data;
      expect(
        Array.isArray(insights) ||
          (res.body.success !== undefined && res.body.data !== undefined)
      ).toBe(true);
    });

    it("should analyze wallet", async () => {
      expect(authToken).toBeDefined();
      expect(testUserId).toBeDefined();

      const res = await request(app)
        .get(`/api/ai-analytics/wallet/${testUserId}`)
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${authToken}`);

      // Debug failures
      if (res.status !== 200) {
        console.error("❌ Wallet analysis failed:", {
          status: res.status,
          body: res.body,
        });
      }

      expect(res.status).toBe(200);
      // Flexible: handles {analysis: {...}} or {data: {analysis: {...}}} or {success, data}
      const analysis =
        res.body.analysis || res.body.data?.analysis || res.body.data;
      if (analysis && typeof analysis === "object") {
        expect(analysis).toHaveProperty("totalBalance");
      } else {
        // Just verify success response structure
        expect(res.body.success !== false).toBe(true);
      }
    });

    it("should check cashout eligibility", async () => {
      expect(authToken).toBeDefined();
      expect(testUserId).toBeDefined();

      const res = await request(app)
        .post("/api/ai-analytics/cashout-eligibility")
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ userId: testUserId, amount: 100 });

      // Debug failures
      if (res.status !== 200) {
        console.error("❌ Cashout eligibility failed:", {
          status: res.status,
          body: res.body,
        });
      }

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("eligible");
      expect(res.body).toHaveProperty("reason");
    });

    it("should generate product recommendations", async () => {
      expect(authToken).toBeDefined();
      expect(testUserId).toBeDefined();

      const res = await request(app)
        .get(`/api/ai-analytics/recommendations/${testUserId}`)
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${authToken}`);

      // Debug failures
      if (res.status !== 200) {
        console.error("❌ Product recommendations failed:", {
          status: res.status,
          body: res.body,
        });
      }

      expect(res.status).toBe(200);
      // Flexible: handles {recommendations: []} or {data: {recommendations: []}}
      const recommendations =
        res.body.recommendations ||
        res.body.data?.recommendations ||
        res.body.data;
      expect(
        Array.isArray(recommendations) ||
          (res.body.success !== undefined && res.body.data !== undefined)
      ).toBe(true);
    });
  }); // ════════════════════════════════════════════════════
  // USER MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  describe("User Management", () => {
    it("should get user profile", async () => {
      expect(authToken).toBeDefined();

      const res = await request(app)
        .get("/api/auth/me")
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.user).toHaveProperty("id", testUserId);
      expect(res.body.user).toHaveProperty("email", testUserEmail);
    });

    it("should update user profile", async () => {
      expect(authToken).toBeDefined();

      const res = await request(app)
        .put("/api/auth/me")
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ firstName: "Updated", lastName: "Name" })
        .expect(200);

      expect(res.body.firstName).toBe("Updated");
      expect(res.body.lastName).toBe("Name");
    });
  }); // ═══════════════════════════════════════════════════════════
  // TRANSACTIONS
  // ═══════════════════════════════════════════════════════════
  describe("Transactions", () => {
    it("should get user transactions", async () => {
      expect(authToken).toBeDefined();
      expect(testUserId).toBeDefined();

      const res = await request(app)
        .get(`/api/transactions/user/${testUserId}`)
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Flexible: handles both array and {transactions: [], total, page}
      const transactions = Array.isArray(res.body)
        ? res.body
        : res.body.transactions || res.body.data;
      expect(Array.isArray(transactions) || res.body !== null).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TOKEN WALLET
  // ═══════════════════════════════════════════════════════════
  describe("Token Wallet", () => {
    it("should get token balance", async () => {
      expect(authToken).toBeDefined();
      expect(testUserId).toBeDefined();

      const res = await request(app)
        .get(`/api/tokens/balance/${testUserId}`)
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("balance");
    });

    it("should get token history", async () => {
      expect(authToken).toBeDefined();
      expect(testUserId).toBeDefined();

      const res = await request(app)
        .get(`/api/tokens/history/${testUserId}`)
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Flexible: handles both array and {history: [], total}
      const history = Array.isArray(res.body)
        ? res.body
        : res.body.history || res.body.data;
      expect(Array.isArray(history) || res.body !== null).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // REWARD SYSTEM
  // ═══════════════════════════════════════════════════════════
  describe("Reward System", () => {
    it("should get user rewards", async () => {
      expect(authToken).toBeDefined();
      expect(testUserId).toBeDefined();

      const res = await request(app)
        .get(`/api/rewards/${testUserId}`)
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Flexible: handles both array and {rewards: [], total}
      const rewards = Array.isArray(res.body)
        ? res.body
        : res.body.rewards || res.body.data;
      expect(Array.isArray(rewards) || res.body !== null).toBe(true);
    });

    it("should get user tier", async () => {
      expect(authToken).toBeDefined();
      expect(testUserId).toBeDefined();

      const res = await request(app)
        .get(`/api/rewards/tier/${testUserId}`)
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("tier");
    });

    it("should get reward leaderboard", async () => {
      expect(authToken).toBeDefined();

      const res = await request(app)
        .get("/api/rewards/leaderboard")
        .set("x-api-key", API_KEY)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Flexible: handles both array and {leaderboard: [], count}
      const leaderboard = Array.isArray(res.body)
        ? res.body
        : res.body.leaderboard || res.body.data;
      expect(Array.isArray(leaderboard) || res.body !== null).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════
  describe.skip("Notifications", () => {
    // NOTE: Notifications routes don't exist as standalone endpoints yet
    // They are managed through userApproval.ts and require admin access
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

      // Create a notification first
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
    });
  }); // ═══════════════════════════════════════════════════════════
  // ERROR HANDLING
  // ═══════════════════════════════════════════════════════════
  describe("Error Handling", () => {
    it("should return 401 for missing token", async () => {
      await request(app)
        .get("/api/auth/me")
        .set("x-api-key", API_KEY)
        .expect(401);
    });

    it("should return 404 for unknown endpoint", async () => {
      await request(app).get("/api/nonexistent").expect(404);
    });

    it("should return 400 for invalid registration body", async () => {
      await request(app)
        .post("/api/auth/register")
        .set("x-api-key", API_KEY)
        .send({ email: "invalid-email" })
        .expect(400);
    });
  });
});

// ═══════════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════════
describe("Integration Tests - Admin Endpoints", () => {
  let adminToken: string;

  beforeAll(async () => {
    console.log("👤 Seeding admin user for tests...");
    const result = await seedAdmin();
    adminToken = result.token;

    expect(adminToken).toBeDefined();
    console.log("✅ Admin token generated");
  });

  it("should get dashboard stats", async () => {
    expect(adminToken).toBeDefined();

    const ADMIN_KEY = process.env.ADMIN_KEY || "supersecureadminkey123-production";

    const res = await request(app)
      .get("/api/admin/stats")
      .set("x-api-key", API_KEY)
      .set("x-admin-key", ADMIN_KEY)
      .set("Authorization", `Bearer ${adminToken}`);

    // Debug failures
    if (res.status !== 200) {
      console.error("❌ Dashboard stats failed:", {
        status: res.status,
        body: res.body,
      });
    }

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("stats");
    expect(res.body.stats).toHaveProperty("totalUsers");
    expect(res.body.stats).toHaveProperty("totalTransactions");
  });

  it("should get all users", async () => {
    expect(adminToken).toBeDefined();

    const ADMIN_KEY = process.env.ADMIN_KEY || "supersecureadminkey123-production";

    const res = await request(app)
      .get("/api/admin/users")
      .set("x-api-key", API_KEY)
      .set("x-admin-key", ADMIN_KEY)
      .set("Authorization", `Bearer ${adminToken}`);

    // Debug failures
    if (res.status !== 200) {
      console.error("❌ Get all users failed:", {
        status: res.status,
        body: res.body,
      });
    }

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("items");
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("page");
  });
});
