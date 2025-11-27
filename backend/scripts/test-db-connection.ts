/**
 * Database connection test utility
 * Per Advancia Pay: Proper error handling and logging
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import logger from "../src/logger";

export async function testDatabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  // Create pg pool with adapter (Prisma 7 style)
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);

  const prisma = new PrismaClient({
    adapter,
    log: ["query", "error", "warn"],
  });

  try {
    logger.info("Testing database connection...", {
      databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@"), // Mask password
    });

    // Test connection
    await prisma.$connect();
    logger.info("✅ Database connected successfully");

    // Test simple count query
    const userCount = await prisma.user.count();
    logger.info("✅ Database query successful", { userCount });

    // Test read permission
    const testUser = await prisma.user.findFirst({
      take: 1,
      select: { id: true, email: true, createdAt: true },
    });
    logger.info("✅ Database read permission verified", {
      hasUser: !!testUser,
    });

    await prisma.$disconnect();
    await pool.end();

    return {
      success: true,
      message: "Database connection successful",
      details: {
        connected: true,
        queryTest: true,
        readPermission: true,
        userCount,
        hasTestUser: !!testUser,
      },
    };
  } catch (error: any) {
    logger.error("❌ Database connection failed", {
      error: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });

    await prisma.$disconnect();
    await pool.end(); // Close the pool

    return {
      success: false,
      message: `Database connection failed: ${error.message}`,
      details: {
        errorCode: error.code,
        errorMessage: error.message,
      },
    };
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Test failed:", error);
      process.exit(1);
    });
}
