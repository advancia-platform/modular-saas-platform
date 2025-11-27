/**
 * Database connection test utility
 * Per Advancia Pay: Proper error handling and logging
 */

import logger from "../logger";
import prisma from "../prismaClient";

export async function testDatabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    logger.info("Testing database connection...", {
      databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@"), // Mask password
    });

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
