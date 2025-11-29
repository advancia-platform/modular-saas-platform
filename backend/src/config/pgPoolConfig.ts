/**
 * PostgreSQL Connection Pool Optimization
 *
 * Enhanced connection pooling with:
 * - Optimized pool settings for fintech workloads
 * - Query timeout handling
 * - Connection health monitoring
 * - Metrics for observability
 */

import { Pool, PoolConfig } from "pg";
import logger from "../logger";

// Environment-based pool configuration
function getPoolConfig(): PoolConfig {
  const isProduction = process.env.NODE_ENV === "production";
  const isTest = process.env.NODE_ENV === "test";

  const baseConfig: PoolConfig = {
    connectionString: isTest
      ? process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
      : process.env.DATABASE_URL,

    // Connection pool sizing
    // Rule of thumb: connections = (core_count * 2) + effective_spindle_count
    // For cloud: start with 10-20 and tune based on metrics
    max: parseInt(process.env.PG_POOL_MAX || (isProduction ? "20" : "10"), 10),
    min: parseInt(process.env.PG_POOL_MIN || (isProduction ? "5" : "2"), 10),

    // Idle timeout - close connections after 30s of inactivity
    idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT || "30000", 10),

    // Connection timeout - fail fast if can't connect in 10s
    connectionTimeoutMillis: parseInt(
      process.env.PG_CONNECTION_TIMEOUT || "10000",
      10,
    ),

    // Statement timeout - prevent runaway queries (30s default)
    statement_timeout: parseInt(
      process.env.PG_STATEMENT_TIMEOUT || "30000",
      10,
    ),

    // Keep connections alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  };

  // Add SSL for production
  if (isProduction && process.env.DATABASE_URL?.includes("render.com")) {
    baseConfig.ssl = {
      rejectUnauthorized: false, // Render uses self-signed certs
    };
  }

  return baseConfig;
}

// Create optimized pool
export function createOptimizedPool(): Pool {
  const config = getPoolConfig();
  const pool = new Pool(config);

  // Connection event handlers
  pool.on("connect", (client) => {
    logger.debug("New PostgreSQL connection established", {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    });

    // Set session-level optimizations
    client
      .query(
        `
      SET statement_timeout = '${config.statement_timeout}';
      SET lock_timeout = '5000';
      SET idle_in_transaction_session_timeout = '60000';
    `,
      )
      .catch((err) => {
        logger.warn("Failed to set session parameters", { error: err.message });
      });
  });

  pool.on("acquire", () => {
    poolMetrics.acquireCount++;
  });

  pool.on("release", () => {
    poolMetrics.releaseCount++;
  });

  pool.on("remove", () => {
    logger.debug("PostgreSQL connection removed from pool", {
      totalCount: pool.totalCount,
    });
  });

  pool.on("error", (err) => {
    logger.error("Unexpected PostgreSQL pool error", { error: err.message });
    poolMetrics.errorCount++;
  });

  return pool;
}

// Pool metrics for monitoring
interface PoolMetrics {
  acquireCount: number;
  releaseCount: number;
  errorCount: number;
  queryCount: number;
  slowQueryCount: number;
  avgQueryTime: number;
  lastChecked: Date;
}

export const poolMetrics: PoolMetrics = {
  acquireCount: 0,
  releaseCount: 0,
  errorCount: 0,
  queryCount: 0,
  slowQueryCount: 0,
  avgQueryTime: 0,
  lastChecked: new Date(),
};

// Slow query threshold (ms)
const SLOW_QUERY_THRESHOLD = parseInt(
  process.env.PG_SLOW_QUERY_THRESHOLD || "1000",
  10,
);

/**
 * Execute query with timing and logging
 */
export async function executeWithMetrics<T>(
  pool: Pool,
  query: string,
  params?: any[],
): Promise<{ rows: T[]; duration: number }> {
  const start = Date.now();

  try {
    const result = await pool.query(query, params);
    const duration = Date.now() - start;

    // Update metrics
    poolMetrics.queryCount++;
    poolMetrics.avgQueryTime =
      (poolMetrics.avgQueryTime * (poolMetrics.queryCount - 1) + duration) /
      poolMetrics.queryCount;

    // Log slow queries
    if (duration > SLOW_QUERY_THRESHOLD) {
      poolMetrics.slowQueryCount++;
      logger.warn("Slow query detected", {
        duration,
        query: query.substring(0, 200),
        params: params?.slice(0, 3),
      });
    }

    return { rows: result.rows as T[], duration };
  } catch (error: any) {
    const duration = Date.now() - start;
    poolMetrics.errorCount++;
    logger.error("Query execution failed", {
      error: error.message,
      duration,
      query: query.substring(0, 200),
    });
    throw error;
  }
}

/**
 * Get pool health status
 */
export function getPoolHealth(pool: Pool): {
  healthy: boolean;
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
  metrics: PoolMetrics;
} {
  return {
    healthy: pool.totalCount > 0 && pool.waitingCount < pool.totalCount,
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingClients: pool.waitingCount,
    metrics: { ...poolMetrics, lastChecked: new Date() },
  };
}

/**
 * Recommended PostgreSQL indexes for Advancia Pay Ledger
 * Run these in production for optimal performance
 */
export const RECOMMENDED_INDEXES = `
-- Transaction lookups (most critical for fintech)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_created
  ON "Transaction" ("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status_created
  ON "Transaction" ("status", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_type_status
  ON "Transaction" ("type", "status");

-- Token wallet queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_token_wallet_user_token
  ON "TokenWallet" ("userId", "tokenId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_token_wallet_balance
  ON "TokenWallet" ("balance") WHERE "balance" > 0;

-- User authentication
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email_verified
  ON "User" ("email", "isVerified");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role_active
  ON "User" ("role", "isActive");

-- Crypto payments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crypto_payments_status_created
  ON "CryptoPayments" ("status", "created_at" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crypto_payments_user_status
  ON "CryptoPayments" ("user_id", "status");

-- Audit logs (compliance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created
  ON "audit_logs" ("createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_action
  ON "audit_logs" ("userId", "action");

-- Notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read
  ON "Notification" ("userId", "isRead", "createdAt" DESC);

-- Sessions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_expires
  ON "Session" ("expiresAt") WHERE "expiresAt" > NOW();

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active
  ON "User" ("id") WHERE "isActive" = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_pending
  ON "Transaction" ("id", "userId") WHERE "status" = 'pending';
`;

export default createOptimizedPool;
