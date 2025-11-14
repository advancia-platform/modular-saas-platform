import { PrismaClient } from "@prisma/client";

declare global {
  // Allow global prisma in development to prevent hot-reload multiple clients
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma =
  process.env.NODE_ENV === "test"
    ? new PrismaClient({
        log: ["error"], // Test mode: only log errors
        datasources: {
          db: {
            url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
          },
        },
      })
    : (global.__prisma ??
      new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
      }));

if (process.env.NODE_ENV === "development") {
  global.__prisma = prisma;
}

// Add connection retry logic (skip in test mode - use mocks)
if (process.env.NODE_ENV !== "test") {
  let retries = 3;
  const connectWithRetry = async () => {
    while (retries > 0) {
      try {
        await prisma.$connect();
        console.log("✅ Prisma connected successfully");
        break;
      } catch (error) {
        retries--;
        console.error(`❌ Prisma connection failed. Retries left: ${retries}`);
        if (retries === 0) {
          console.error(
            "Failed to connect to database after multiple attempts",
          );
          throw error;
        }
        // Wait 2 seconds before retry
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  };

  connectWithRetry();
}

export default prisma;
export type { PrismaClient };
