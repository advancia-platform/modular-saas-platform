/**
 * Minimal TypeScript Entry Point
 * Demonstrates proper typing, debugging, and console.log usage
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// ============================================
// DEBUG HELPERS
// ============================================

const DEBUG =
  process.env.DEBUG === "true" || process.env.NODE_ENV === "development";

function log(message: string, data?: unknown): void {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data ?? "");
  }
}

function logError(message: string, error: unknown): void {
  console.error(`❌ ${message}:`, error);
  if (error instanceof Error) {
    console.error("Stack:", error.stack);
  }
}

// ============================================
// BUSINESS LOGIC
// ============================================

async function fetchUser(id: number): Promise<ApiResponse<User>> {
  log("Fetching user", { id });

  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Type-safe response
  const user: User = {
    id,
    name: "John Doe",
    email: "john@example.com",
    active: true,
  };

  log("User fetched", user);

  return {
    success: true,
    data: user,
  };
}

async function processUsers(userIds: number[]): Promise<User[]> {
  log("Processing users", { count: userIds.length });

  const users: User[] = [];

  for (const id of userIds) {
    try {
      const response = await fetchUser(id);
      if (response.success) {
        users.push(response.data);
      }
    } catch (error) {
      logError(`Failed to fetch user ${id}`, error);
    }
  }

  return users;
}

// ============================================
// MAIN ENTRY POINT
// ============================================

async function main(): Promise<void> {
  console.log("🚀 TypeScript App Started");
  console.log(`   Node: ${process.version}`);
  console.log(`   Debug: ${DEBUG}`);
  console.log("");

  try {
    // Set breakpoint here to debug ↓
    const userIds = [1, 2, 3];
    const users = await processUsers(userIds);

    console.log("✅ Processed users:", users.length);
    console.table(users);
  } catch (error) {
    logError("Application error", error);
    process.exit(1);
  }
}

// Run main function
main().catch(console.error);
