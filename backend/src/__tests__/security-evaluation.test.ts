/**
 * Integration tests for Security Evaluation Framework
 * Validates that backend endpoints meet evaluation criteria
 */

import request from "supertest";
import app from "../index";
import prisma from "../prismaClient";

describe("Security Evaluation Framework Integration", () => {
  describe("Password Strength Validation", () => {
    it("should reject password shorter than 12 characters", async () => {
      const response = await request(app).post("/api/auth/signup").send({
        email: "shortpw@test.com",
        password: "Short1!",
        firstName: "Test",
        lastName: "User",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/12 characters/i);
    });

    it("should reject password without complexity requirements", async () => {
      const testCases = [
        { password: "alllowercase123!", missing: "uppercase" },
        { password: "ALLUPPERCASE123!", missing: "lowercase" },
        { password: "NoNumbers!!!", missing: "number" },
        { password: "NoSpecialChar123", missing: "special" },
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post("/api/auth/signup")
          .send({
            email: `test-${Date.now()}@test.com`,
            password: testCase.password,
            firstName: "Test",
            lastName: "User",
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(new RegExp(testCase.missing, "i"));
      }
    });

    it("should accept strong password meeting all criteria", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          email: `strong-${Date.now()}@test.com`,
          password: "MyS3cur3P@ssw0rd!",
          firstName: "Test",
          lastName: "User",
        });

      expect(response.status).toBe(201);
      expect(response.body.token).toBeDefined();
    });
  });

  describe("Account Lockout Mechanism", () => {
    const testEmail = `lockout-${Date.now()}@test.com`;

    beforeAll(async () => {
      // Create test user
      await request(app).post("/api/auth/signup").send({
        email: testEmail,
        password: "ValidPassword123!",
        firstName: "Lockout",
        lastName: "Test",
      });
    });

    it("should lock account after 5 failed login attempts", async () => {
      const responses = [];

      // Attempt 5 failed logins
      for (let i = 0; i < 6; i++) {
        const response = await request(app).post("/api/auth/login").send({
          email: testEmail,
          password: "WrongPassword123!",
        });

        responses.push(response);
      }

      // Last response should be 429 (account locked)
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429);

      // Check for ACCOUNT_LOCKED error code
      const errorCode = lastResponse.body.error || lastResponse.body.code;
      expect(errorCode).toMatch(/ACCOUNT_LOCKED/i);

      // Should provide retryAfter
      expect(
        lastResponse.body.retryAfter || lastResponse.headers["retry-after"],
      ).toBeDefined();
    });
  });

  describe("Rate Limiting Enforcement", () => {
    it("should enforce rate limit on login endpoint", async () => {
      const responses = [];

      // Make more requests than allowed (5 per 15 min)
      for (let i = 0; i < 7; i++) {
        const response = await request(app).post("/api/auth/login").send({
          email: "nonexistent@test.com",
          password: "SomePassword123!",
        });

        responses.push(response);
      }

      // At least one should be rate limited
      const rateLimited = responses.some((r) => r.status === 429);
      expect(rateLimited).toBe(true);

      // Check for retryAfter header
      const limitedResponse = responses.find((r) => r.status === 429);
      if (limitedResponse) {
        expect(
          limitedResponse.body.retryAfter ||
            limitedResponse.headers["retry-after"],
        ).toBeDefined();
      }
    });
  });

  describe("JWT Token Security", () => {
    let validToken: string;

    beforeAll(async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          email: `jwt-${Date.now()}@test.com`,
          password: "JwtTest123!@#",
          firstName: "JWT",
          lastName: "Test",
        });

      validToken = response.body.token;
    });

    it("should reject requests without token", async () => {
      const response = await request(app).get("/api/users/profile");

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject requests with invalid token", async () => {
      const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", "Bearer invalid_token_string");

      expect(response.status).toBe(403);
    });

    it("should accept requests with valid token", async () => {
      const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBeDefined();
    });
  });

  describe("Security Headers", () => {
    it("should include security headers in responses", async () => {
      const response = await request(app).get("/health");

      // Helmet security headers
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBeDefined();
      expect(response.headers["x-xss-protection"]).toBeDefined();
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
