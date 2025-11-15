/**
 * Sample Integration Test
 *
 * This test demonstrates how to write integration tests with database access.
 * Run with: npm test
 */

const request = require("supertest");
const app = require("../app"); // Adjust path to your Express app
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

describe("Health Check Endpoint", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("GET /health should return 200", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
  });

  test("GET /api/health should return system info", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("uptime");
    expect(response.body).toHaveProperty("timestamp");
  });
});

describe("Database Connection", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("Should connect to test database", async () => {
    const result = await prisma.$queryRaw`SELECT version();`;
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  test("Should have correct database name", async () => {
    const result = await prisma.$queryRaw`SELECT current_database();`;
    const dbName = result[0].current_database;

    // Should be connected to test database
    expect(dbName).toContain("test");
  });

  test("Should be able to query users table", async () => {
    const users = await prisma.user.findMany({ take: 10 });
    expect(Array.isArray(users)).toBe(true);
  });
});

describe("User Authentication", () => {
  let testUser;

  beforeAll(async () => {
    // Get test user created by seed script
    testUser = await prisma.user.findUnique({
      where: { email: "user@advancia.test" },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("Should have test user in database", () => {
    expect(testUser).toBeDefined();
    expect(testUser.email).toBe("user@advancia.test");
    expect(testUser.role).toBe("user");
  });

  test("POST /api/auth/login with valid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "user@advancia.test",
      password: "TestUser123!",
    });

    // Adjust based on your actual API response
    expect([200, 201]).toContain(response.status);
    // expect(response.body).toHaveProperty('token');
  });

  test("POST /api/auth/login with invalid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "user@advancia.test",
      password: "WrongPassword",
    });

    expect([401, 400]).toContain(response.status);
    expect(response.body).toHaveProperty("error");
  });
});

describe("Token Wallet Operations", () => {
  let testUser;
  let testWallet;

  beforeAll(async () => {
    testUser = await prisma.user.findUnique({
      where: { email: "user@advancia.test" },
      include: { tokenWallets: true },
    });
    testWallet = testUser.tokenWallets[0];
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("Should have wallet associated with test user", () => {
    expect(testWallet).toBeDefined();
    expect(testWallet.userId).toBe(testUser.id);
    expect(testWallet.currency).toBe("ADVP");
  });

  test("Should have initial balance from seed", () => {
    const balance = parseFloat(testWallet.balance);
    expect(balance).toBeGreaterThan(0);
    expect(balance).toBe(1000.0);
  });
});
