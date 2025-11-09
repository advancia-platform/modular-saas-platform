import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { requireApiKey, requireAuth } from "../../src/middleware/auth";

// Mock environment
const ORIGINAL_ENV = process.env;

describe("Auth Middleware Tests", () => {
  let mockReq: any; // Use any for tests to allow dynamic property assignment
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset environment
    process.env = { ...ORIGINAL_ENV };
    process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
    process.env.API_KEY = "test-api-key-123";

    // Setup mocks
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockNext = jest.fn();

    mockReq = {
      headers: {},
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.clearAllMocks();
  });

  describe("requireApiKey", () => {
    it("should allow request with valid API key in production", () => {
      process.env.NODE_ENV = "production";
      process.env.API_KEY = "secure-prod-key";
      mockReq.headers = { "x-api-key": "secure-prod-key" };

      requireApiKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should reject request with invalid API key in production", () => {
      process.env.NODE_ENV = "production";
      process.env.API_KEY = "secure-prod-key";
      mockReq.headers = { "x-api-key": "wrong-key" };

      requireApiKey(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid API key" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject request with missing API key in production", () => {
      process.env.NODE_ENV = "production";
      process.env.API_KEY = "secure-prod-key";
      mockReq.headers = {};

      requireApiKey(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid API key" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should allow request without API key in development", () => {
      process.env.NODE_ENV = "development";
      mockReq.headers = {};

      requireApiKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should allow request without API key in test environment", () => {
      process.env.NODE_ENV = "test";
      mockReq.headers = {};

      requireApiKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should accept API key from X-API-Key header (capitalized)", () => {
      process.env.NODE_ENV = "production";
      process.env.API_KEY = "secure-prod-key";
      mockReq.headers = { "X-API-Key": "secure-prod-key" };

      requireApiKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should use default API key if env var not set", () => {
      process.env.NODE_ENV = "production";
      delete process.env.API_KEY;
      mockReq.headers = { "x-api-key": "dev-api-key-123" };

      requireApiKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });
  });

  describe("requireAuth", () => {
    const validToken = jwt.sign(
      { userId: "user123", email: "test@example.com", role: "USER" },
      "test-jwt-secret-key-for-testing-only",
      { expiresIn: "1h" }
    );

    it("should allow request with valid Bearer token", () => {
      mockReq.headers = { authorization: `Bearer ${validToken}` };

      requireAuth(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockReq.user).toBeDefined();
      expect((mockReq as any).user.userId).toBe("user123");
      expect((mockReq as any).user.email).toBe("test@example.com");
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should reject request without authorization header", () => {
      mockReq.headers = {};

      requireAuth(mockReq as any, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Missing or invalid Authorization header",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject request with non-Bearer authorization", () => {
      mockReq.headers = { authorization: "Basic xyz123" };

      requireAuth(mockReq as any, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Missing or invalid Authorization header",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject request with expired token", () => {
      const expiredToken = jwt.sign(
        { userId: "user123", email: "test@example.com" },
        "test-jwt-secret-key-for-testing-only",
        { expiresIn: "-1h" } // Already expired
      );
      mockReq.headers = { authorization: `Bearer ${expiredToken}` };

      requireAuth(mockReq as any, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Invalid or expired token",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject request with invalid token signature", () => {
      const invalidToken = jwt.sign(
        { userId: "user123", email: "test@example.com" },
        "wrong-secret-key",
        { expiresIn: "1h" }
      );
      mockReq.headers = { authorization: `Bearer ${invalidToken}` };

      requireAuth(mockReq as any, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Invalid or expired token",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject request with malformed token", () => {
      mockReq.headers = { authorization: "Bearer not-a-real-token" };

      requireAuth(mockReq as any, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Invalid or expired token",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should attach decoded user data to request", () => {
      const tokenWithRole = jwt.sign(
        {
          userId: "admin123",
          email: "admin@example.com",
          role: "ADMIN",
          customField: "test",
        },
        "test-jwt-secret-key-for-testing-only",
        { expiresIn: "1h" }
      );
      mockReq.headers = { authorization: `Bearer ${tokenWithRole}` };

      requireAuth(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect((mockReq as any).user).toBeDefined();
      expect((mockReq as any).user.userId).toBe("admin123");
      expect((mockReq as any).user.email).toBe("admin@example.com");
      expect((mockReq as any).user.role).toBe("ADMIN");
      expect((mockReq as any).user.customField).toBe("test");
    });

    it("should handle authorization header with extra whitespace", () => {
      mockReq.headers = { authorization: `  Bearer ${validToken}  ` };

      // requireAuth expects 'Bearer <token>' format without extra spaces
      requireAuth(mockReq as any, mockRes as Response, mockNext);

      // This should fail because of the extra spaces
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it("should use default JWT secret if not set in environment", () => {
      delete process.env.JWT_SECRET;

      const tokenWithDefaultSecret = jwt.sign(
        { userId: "user456", email: "user@example.com" },
        "test-jwt-secret-key-for-testing-only",
        { expiresIn: "1h" }
      );
      mockReq.headers = { authorization: `Bearer ${tokenWithDefaultSecret}` };

      requireAuth(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect((mockReq as any).user.userId).toBe("user456");
    });
  });

  describe("Integration: requireApiKey + requireAuth", () => {
    it("should pass both middlewares with valid credentials", () => {
      process.env.NODE_ENV = "production";
      process.env.API_KEY = "secure-key";

      const token = jwt.sign(
        { userId: "user789", email: "integrated@example.com" },
        "test-jwt-secret-key-for-testing-only",
        { expiresIn: "1h" }
      );

      mockReq.headers = {
        "x-api-key": "secure-key",
        authorization: `Bearer ${token}`,
      };

      // First middleware: requireApiKey
      requireApiKey(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Reset next mock for second call
      mockNext.mockClear();

      // Second middleware: requireAuth
      requireAuth(mockReq as any, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect((mockReq as any).user.userId).toBe("user789");
    });
  });
});
