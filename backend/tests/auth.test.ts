import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import prisma from "../src/prismaClient";
import app from "./test-app";

// Mock notificationService to prevent actual email/push notifications during tests
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
 * Seed admin user for testing admin endpoints
 */
async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@advancia.app";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  // Check if admin already exists
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!admin) {
    // Hash the password just like your auth service
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

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

    // Create admin profile
    await prisma.userProfile.create({
      data: {
        id: `profile-${admin.id}`,
        userId: admin.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // Generate JWT token for admin
  const token = jwt.sign({ userId: admin.id, role: "ADMIN" }, JWT_SECRET, {
    expiresIn: "1h",
  });

  return { admin, token };
}

describe("Auth Routes", () => {
  // Clean up test users after each test (use unique email pattern)
  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: "test-" } },
    });
  });

  describe("POST /api/auth/register", () => {
    it("successfully registers a new user (pending approval)", async () => {
      const testEmail = `test-${Date.now()}@example.com`;
      const testUsername = `testuser${Date.now()}`;

      const res = await request(app)
        .post("/api/auth/register")
        .set("x-api-key", API_KEY)
        .send({
          email: testEmail,
          password: "SecurePassword123!",
          username: testUsername,
          firstName: "Test",
          lastName: "User",
        });

      // Log response if 500 happens
      if (res.status === 500) {
        console.error("❌ Server error response:", res.body);
      }

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        message: "Registration submitted. Awaiting admin approval.",
        status: "pending_approval",
      });
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toMatchObject({
        email: testEmail,
        username: testUsername,
      });
    });

    it("rejects registration with missing email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .set("x-api-key", API_KEY)
        .send({
          password: "SecurePassword123!",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("rejects registration with weak password", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .set("x-api-key", API_KEY)
        .send({
          email: `test-${Date.now()}@example.com`,
          password: "weak",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.toLowerCase()).toContain("at least 6");
    });

    it("rejects duplicate user registration", async () => {
      const testEmail = `test-${Date.now()}@example.com`;

      // First create a user
      await request(app)
        .post("/api/auth/register")
        .set("x-api-key", API_KEY)
        .send({
          email: testEmail,
          password: "SecurePassword123!",
          username: `duplicate-test-${Date.now()}`,
          firstName: "Test",
          lastName: "User",
        });

      // Try to register again with same email
      const res = await request(app)
        .post("/api/auth/register")
        .set("x-api-key", API_KEY)
        .send({
          email: testEmail,
          password: "AnotherPassword123!",
          username: `another-user-${Date.now()}`,
          firstName: "Another",
          lastName: "User",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.toLowerCase()).toContain("already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    it("successfully logs in with valid credentials", async () => {
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = "SecurePassword123!";

      // First register a user
      await request(app)
        .post("/api/auth/register")
        .set("x-api-key", API_KEY)
        .send({
          email: testEmail,
          password: testPassword,
          username: `loginuser-${Date.now()}`,
          firstName: "Test",
          lastName: "User",
        });

      // Approve and verify user for testing
      await prisma.user.update({
        where: { email: testEmail },
        data: {
          emailVerified: true,
          active: true,
          approved: true,
        },
      });

      // Then try to login
      const res = await request(app)
        .post("/api/auth/login")
        .set("x-api-key", API_KEY)
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        message: "Login successful",
        user: {
          email: testEmail,
        },
      });
      expect(res.body).toHaveProperty("token");
    });

    it("rejects login with invalid credentials", async () => {
      const testEmail = `test-${Date.now()}@example.com`;

      // Register a user first
      await request(app)
        .post("/api/auth/register")
        .set("x-api-key", API_KEY)
        .send({
          email: testEmail,
          password: "CorrectPassword123!",
          username: `wrongpass-${Date.now()}`,
          firstName: "Test",
          lastName: "User",
        });

      // Approve and verify user
      await prisma.user.update({
        where: { email: testEmail },
        data: {
          emailVerified: true,
          active: true,
          approved: true,
        },
      });

      // Try to login with wrong password
      const res = await request(app)
        .post("/api/auth/login")
        .set("x-api-key", API_KEY)
        .send({
          email: testEmail,
          password: "WrongPassword!",
        });

      expect(res.status).toBe(401);
      expect(res.body.error.toLowerCase()).toContain("invalid credentials");
    });

    it("rejects login for non-existent user", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .set("x-api-key", API_KEY)
        .send({
          email: "nonexistent@example.com",
          password: "SecurePassword123!",
        });

      expect(res.status).toBe(401);
      expect(res.body.error.toLowerCase()).toContain("invalid credentials");
    });

    it("rejects login without credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .set("x-api-key", API_KEY)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });
});
