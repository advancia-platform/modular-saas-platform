/**
 * Jest Test Setup
 *
 * This file runs before each test suite to configure the test environment.
 * It loads environment variables, sets up database connections, and provides
 * global test utilities.
 */

// Load test environment variables
require("dotenv").config({ path: ".env.test" });

// Set test environment
process.env.NODE_ENV = "test";

// Mock console methods to reduce noise (optional)
if (!process.env.ENABLE_TEST_LOGGING) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    // Keep error for debugging
    error: console.error,
  };
}

// Global test timeout
jest.setTimeout(30000);

// Cleanup after all tests
afterAll(async () => {
  // Give time for async operations to complete
  await new Promise((resolve) => setTimeout(resolve, 500));
});
