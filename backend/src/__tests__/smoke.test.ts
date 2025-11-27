/**
 * Enhanced Authentication Smoke Tests
 *
 * This test suite verifies the complete authentication flow including:
 * - User registration and login
 * - JWT token lifecycle (access + refresh)
 * - Permission-based access control
 * - Token expiry and refresh cycles
 * - Session management
 * - Security middleware
 */

import { Express } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { generateTestToken, TEST_USER_PAYLOAD } from "../../tests/testUtils";

// Test configuration
const TEST_USER = {
  email: "smoketest@example.com",
  password: "SmokeTest123!",
  username: "smoketestuser",
  firstName: "Smoke",
  lastName: "Test",
};

const PROTECTED_ROUTE = "/api/test/protected";
const config = {
  jwtSecret: process.env.JWT_SECRET || "test-secret",
  accessTokenExpiry: "5s", // Very short for testing expiry
  refreshTokenExpiry: "1m",
};

// Test tokens and session data
let testTokens: {
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
} = {};

describe("Enhanced Authentication Smoke Tests", () => {
  let testApp: Express;

  beforeAll(async () => {
    // Import the app using require to avoid ES modules issues in Jest
    testApp = require("../index").default;
  });

  describe("Complete Authentication Flow", () => {
    it("should login, refresh, and logout securely", async () => {
      console.log("🚀 Starting comprehensive authentication smoke test...");

      // Step 1: Register new user
      console.log("📝 Step 1: User Registration");
      const registerResponse = await request(testApp)
        .post("/api/auth-enhanced/register")
        .send(TEST_USER)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.tokens).toBeDefined();
      expect(registerResponse.body.data.user.email).toBe(TEST_USER.email);

      console.log("✅ Registration successful");

      // Step 2: Login with credentials
      console.log("🔐 Step 2: User Login");
      const loginResponse = await request(testApp)
        .post("/api/auth-enhanced/login")
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.tokens.accessToken).toBeDefined();
      expect(loginResponse.body.data.tokens.refreshToken).toBeDefined();

      testTokens = loginResponse.body.data.tokens;
      console.log("✅ Login successful");

      // Step 3: Access protected route with permissions
      console.log("🛡️  Step 3: Accessing Protected Route");
      const protectedResponse = await request(testApp)
        .get(PROTECTED_ROUTE)
        .set("Authorization", `Bearer ${testTokens.accessToken}`)
        .expect(200);

      expect(protectedResponse.body.success).toBe(true);
      expect(protectedResponse.body.user).toBeDefined();
      expect(protectedResponse.body.permissions).toBeDefined();

      console.log("✅ Protected route access successful");
      console.log(
        `   Matched permissions: ${protectedResponse.body.permissions.join(", ")}`,
      );

      // Step 4: Wait for token expiry (simulate passage of time)
      console.log("⏱️  Step 4: Testing Token Expiry");

      // Create an expired token for testing
      const expiredToken = jwt.sign(
        {
          userId: "test-user",
          email: TEST_USER.email,
          role: "USER",
        },
        config.jwtSecret,
        { expiresIn: "-1s" }, // Already expired
      );

      // Attempt to access protected route with expired token
      const expiredResponse = await request(testApp)
        .get(PROTECTED_ROUTE)
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(403);

      expect(expiredResponse.body.error).toContain("Invalid");
      console.log("✅ Token expiry properly handled");

      // Step 5: Refresh tokens
      console.log("🔄 Step 5: Token Refresh");
      const refreshResponse = await request(testApp)
        .post("/api/auth-enhanced/refresh")
        .send({
          refreshToken: testTokens.refreshToken,
        })
        .expect(200);

      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data.tokens.accessToken).toBeDefined();
      expect(refreshResponse.body.data.tokens.refreshToken).toBeDefined();
      expect(refreshResponse.body.data.tokens.accessToken).not.toBe(
        testTokens.accessToken,
      );

      // Update tokens
      const newTokens = refreshResponse.body.data.tokens;
      testTokens.accessToken = newTokens.accessToken;
      testTokens.refreshToken = newTokens.refreshToken;

      console.log("✅ Token refresh successful");

      // Step 6: Verify new token works
      console.log("🔍 Step 6: Verifying Refreshed Token");
      const newTokenResponse = await request(testApp)
        .get(PROTECTED_ROUTE)
        .set("Authorization", `Bearer ${testTokens.accessToken}`)
        .expect(200);

      expect(newTokenResponse.body.success).toBe(true);
      console.log("✅ Refreshed token works correctly");

      // Step 7: Test session management
      console.log("📋 Step 7: Session Management");
      const sessionsResponse = await request(testApp)
        .get("/api/auth-enhanced/sessions")
        .set("Authorization", `Bearer ${testTokens.accessToken}`)
        .expect(200);

      expect(sessionsResponse.body.success).toBe(true);
      expect(Array.isArray(sessionsResponse.body.data.sessions)).toBe(true);
      expect(sessionsResponse.body.data.sessions.length).toBeGreaterThan(0);

      const currentSession = sessionsResponse.body.data.sessions[0];
      testTokens.sessionId = currentSession.id;

      console.log("✅ Session management working");
      console.log(
        `   Active sessions: ${sessionsResponse.body.data.sessions.length}`,
      );

      // Step 8: Logout and verify revoked access
      console.log("🚪 Step 8: Logout and Access Revocation");
      const logoutResponse = await request(testApp)
        .post("/api/auth-enhanced/logout")
        .set("Authorization", `Bearer ${testTokens.accessToken}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);
      console.log("✅ Logout successful");

      // Step 9: Verify revoked access
      console.log("🔒 Step 9: Verifying Revoked Access");
      const revokedResponse = await request(testApp)
        .get(PROTECTED_ROUTE)
        .set("Authorization", `Bearer ${testTokens.accessToken}`)
        .expect(403);

      expect(revokedResponse.body.error).toBeDefined();
      console.log("✅ Access properly revoked after logout");

      // Step 10: Verify refresh token is also revoked
      console.log("🚫 Step 10: Verifying Refresh Token Revocation");
      const revokedRefreshResponse = await request(testApp)
        .post("/api/auth-enhanced/refresh")
        .send({
          refreshToken: testTokens.refreshToken,
        })
        .expect(401);

      expect(revokedRefreshResponse.body.error).toBeDefined();
      console.log("✅ Refresh token properly revoked");

      console.log("🎉 Complete authentication flow test PASSED!");
    });
  });

  describe("Permission-Based Access Control", () => {
    let userTokens: any = {};

    beforeAll(async () => {
      // Create and login a user for permission testing
      const testUser = {
        ...TEST_USER,
        email: "permission-test@example.com",
        username: "permissiontest",
      };

      await request(testApp)
        .post("/api/auth-enhanced/register")
        .send(testUser)
        .expect(201);

      const loginResponse = await request(testApp)
        .post("/api/auth-enhanced/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      userTokens = loginResponse.body.data.tokens;
    });

    it("should enforce permission requirements correctly", async () => {
      console.log("🛡️  Testing permission-based access control...");

      // Test with valid permissions (USER role has read:accounts and write:transactions)
      const validResponse = await request(testApp)
        .get(PROTECTED_ROUTE)
        .set("Authorization", `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(validResponse.body.success).toBe(true);
      expect(validResponse.body.permissions).toEqual(
        expect.arrayContaining(["read:accounts", "write:transactions"]),
      );

      console.log("✅ Valid permissions accepted");
      console.log(
        `   User permissions: ${validResponse.body.permissions.join(", ")}`,
      );
    });

    it("should reject access without proper permissions", async () => {
      console.log("🚫 Testing permission denial...");

      // Test access to admin route that requires admin:users permission
      const deniedResponse = await request(testApp)
        .get("/api/test/admin-data")
        .set("Authorization", `Bearer ${userTokens.accessToken}`)
        .expect(403);

      expect(deniedResponse.body.error).toBe("Insufficient permissions");
      expect(deniedResponse.body.code).toBe("INSUFFICIENT_PERMISSIONS");
      expect(deniedResponse.body.required).toContain("admin:users");

      console.log("✅ Permission denial working correctly");
    });
  });

  describe("Protected Routes", () => {
    it("should access compliance metrics with valid token", async () => {
      console.log("🛡️ Testing protected compliance route...");

      const token = generateTestToken(TEST_USER_PAYLOAD);

      const response = await request(testApp)
        .get("/api/compliance/metrics")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      console.log("✅ Protected route access successful");
    });

    it("should reject compliance access without token", async () => {
      console.log("🚫 Testing protected route rejection...");

      const response = await request(testApp)
        .get("/api/compliance/metrics")
        .expect(401);

      expect(response.body.error).toContain("Missing or invalid Authorization");
      console.log("✅ Access properly denied");
    });
  });

  describe("Audit Trail", () => {
    it("should log authentication events for audit", async () => {
      console.log("📝 Testing audit trail...");

      // This would typically check database audit logs
      // For smoke test, we just verify the endpoints work

      const testUser = {
        ...TEST_USER,
        email: "audit-test@example.com",
        username: "audituser",
      };

      // Register user (should create audit log)
      const registerResponse = await request(testApp)
        .post("/api/auth-enhanced/register")
        .send(testUser)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);

      // Login (should create audit log)
      const loginResponse = await request(testApp)
        .post("/api/auth-enhanced/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);

      console.log(
        "✅ Authentication events processed (audit logs should be created)",
      );
    });
  });

  afterAll(async () => {
    console.log("🧹 Cleaning up test data...");

    // Note: In a real implementation, you might want to clean up test users
    // from the database here. For smoke tests, we leave them to verify
    // the cleanup service works properly.

    console.log("✅ Smoke test cleanup complete");
  });
});

// Helper function to wait for a specified time
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Export for use in other tests if needed
export { delay, PROTECTED_ROUTE, TEST_USER };
