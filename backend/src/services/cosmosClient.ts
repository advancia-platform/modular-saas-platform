/**
 * Azure Cosmos DB Client for AI/Chat features
 *
 * Uses Cosmos DB for:
 * - Chat history and conversation logs
 * - AI context and memory storage
 * - User session data
 * - Real-time notification queues
 *
 * PostgreSQL remains primary for:
 * - User accounts, transactions, wallets (ACID required)
 * - Financial data with strong consistency
 * - Audit logs and compliance data
 */

import { CosmosClient, Database, Container } from "@azure/cosmos";
import logger from "../logger";

// Configuration
const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE || "advancia-ai";

// Container IDs
const CONTAINERS = {
  CHAT_HISTORY: "chat-history",
  AI_CONTEXT: "ai-context",
  USER_SESSIONS: "user-sessions",
  NOTIFICATIONS: "notifications",
} as const;

let client: CosmosClient | null = null;
let database: Database | null = null;
let containers: Record<string, Container> = {};

/**
 * Initialize Cosmos DB client
 */
export async function initCosmosClient(): Promise<boolean> {
  if (!endpoint || !key) {
    logger.warn(
      "⚠️ Cosmos DB not configured (missing COSMOS_DB_ENDPOINT or COSMOS_DB_KEY)",
    );
    return false;
  }

  try {
    client = new CosmosClient({ endpoint, key });

    // Create database if not exists
    const { database: db } = await client.databases.createIfNotExists({
      id: databaseId,
    });
    database = db;

    // Create containers if not exist
    for (const [name, containerId] of Object.entries(CONTAINERS)) {
      const { container } = await database.containers.createIfNotExists({
        id: containerId,
        partitionKey: { paths: ["/userId"] },
        defaultTtl: getContainerTTL(containerId),
      });
      containers[containerId] = container;
      logger.info(`✅ Cosmos DB container ready: ${containerId}`);
    }

    logger.info("✅ Azure Cosmos DB initialized successfully");
    return true;
  } catch (error: any) {
    logger.error("❌ Failed to initialize Cosmos DB", { error: error.message });
    return false;
  }
}

/**
 * Get TTL for each container type
 */
function getContainerTTL(containerId: string): number {
  switch (containerId) {
    case CONTAINERS.USER_SESSIONS:
      return 86400 * 7; // 7 days
    case CONTAINERS.NOTIFICATIONS:
      return 86400 * 30; // 30 days
    case CONTAINERS.CHAT_HISTORY:
      return 86400 * 90; // 90 days
    case CONTAINERS.AI_CONTEXT:
      return 86400 * 365; // 1 year
    default:
      return -1; // No TTL
  }
}

// ============================================================================
// Chat History Operations
// ============================================================================

export interface ChatMessage {
  id: string;
  userId: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

/**
 * Store a chat message
 */
export async function saveChatMessage(message: ChatMessage): Promise<void> {
  if (!containers[CONTAINERS.CHAT_HISTORY]) {
    logger.warn("Cosmos DB not initialized, skipping chat save");
    return;
  }

  await containers[CONTAINERS.CHAT_HISTORY].items.create({
    ...message,
    _ts: Date.now(),
  });
}

/**
 * Get chat history for a user session
 */
export async function getChatHistory(
  userId: string,
  sessionId: string,
  limit = 50,
): Promise<ChatMessage[]> {
  if (!containers[CONTAINERS.CHAT_HISTORY]) {
    return [];
  }

  const querySpec = {
    query: `
      SELECT * FROM c
      WHERE c.userId = @userId AND c.sessionId = @sessionId
      ORDER BY c.createdAt DESC
      OFFSET 0 LIMIT @limit
    `,
    parameters: [
      { name: "@userId", value: userId },
      { name: "@sessionId", value: sessionId },
      { name: "@limit", value: limit },
    ],
  };

  const { resources } = await containers[CONTAINERS.CHAT_HISTORY].items
    .query<ChatMessage>(querySpec)
    .fetchAll();

  return resources.reverse(); // Return in chronological order
}

/**
 * Get recent conversations for a user
 */
export async function getRecentConversations(
  userId: string,
  limit = 10,
): Promise<{ sessionId: string; lastMessage: string; updatedAt: string }[]> {
  if (!containers[CONTAINERS.CHAT_HISTORY]) {
    return [];
  }

  const querySpec = {
    query: `
      SELECT DISTINCT c.sessionId, c.content as lastMessage, c.createdAt as updatedAt
      FROM c
      WHERE c.userId = @userId
      ORDER BY c.createdAt DESC
      OFFSET 0 LIMIT @limit
    `,
    parameters: [
      { name: "@userId", value: userId },
      { name: "@limit", value: limit },
    ],
  };

  const { resources } = await containers[CONTAINERS.CHAT_HISTORY].items
    .query(querySpec)
    .fetchAll();

  return resources;
}

// ============================================================================
// AI Context Operations
// ============================================================================

export interface AIContext {
  id: string;
  userId: string;
  type: "memory" | "preference" | "summary" | "embedding";
  key: string;
  value: any;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Store AI context for a user
 */
export async function saveAIContext(context: AIContext): Promise<void> {
  if (!containers[CONTAINERS.AI_CONTEXT]) {
    return;
  }

  await containers[CONTAINERS.AI_CONTEXT].items.upsert({
    ...context,
    _ts: Date.now(),
  });
}

/**
 * Get AI context for a user
 */
export async function getAIContext(
  userId: string,
  type?: AIContext["type"],
): Promise<AIContext[]> {
  if (!containers[CONTAINERS.AI_CONTEXT]) {
    return [];
  }

  const querySpec = type
    ? {
        query: "SELECT * FROM c WHERE c.userId = @userId AND c.type = @type",
        parameters: [
          { name: "@userId", value: userId },
          { name: "@type", value: type },
        ],
      }
    : {
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: userId }],
      };

  const { resources } = await containers[CONTAINERS.AI_CONTEXT].items
    .query<AIContext>(querySpec)
    .fetchAll();

  return resources;
}

/**
 * Delete AI context
 */
export async function deleteAIContext(
  userId: string,
  key: string,
): Promise<void> {
  if (!containers[CONTAINERS.AI_CONTEXT]) {
    return;
  }

  const querySpec = {
    query: "SELECT * FROM c WHERE c.userId = @userId AND c.key = @key",
    parameters: [
      { name: "@userId", value: userId },
      { name: "@key", value: key },
    ],
  };

  const { resources } = await containers[CONTAINERS.AI_CONTEXT].items
    .query(querySpec)
    .fetchAll();

  for (const item of resources) {
    await containers[CONTAINERS.AI_CONTEXT].item(item.id, userId).delete();
  }
}

// ============================================================================
// User Session Operations
// ============================================================================

export interface UserSession {
  id: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    platform?: string;
  };
  preferences: Record<string, any>;
  lastActivity: string;
  createdAt: string;
}

/**
 * Save or update user session
 */
export async function saveUserSession(session: UserSession): Promise<void> {
  if (!containers[CONTAINERS.USER_SESSIONS]) {
    return;
  }

  await containers[CONTAINERS.USER_SESSIONS].items.upsert({
    ...session,
    _ts: Date.now(),
  });
}

/**
 * Get user session
 */
export async function getUserSession(
  userId: string,
  sessionId: string,
): Promise<UserSession | null> {
  if (!containers[CONTAINERS.USER_SESSIONS]) {
    return null;
  }

  try {
    const { resource } = await containers[CONTAINERS.USER_SESSIONS]
      .item(sessionId, userId)
      .read<UserSession>();
    return resource || null;
  } catch {
    return null;
  }
}

/**
 * Get all active sessions for a user
 */
export async function getUserActiveSessions(
  userId: string,
): Promise<UserSession[]> {
  if (!containers[CONTAINERS.USER_SESSIONS]) {
    return [];
  }

  const querySpec = {
    query:
      "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.lastActivity DESC",
    parameters: [{ name: "@userId", value: userId }],
  };

  const { resources } = await containers[CONTAINERS.USER_SESSIONS].items
    .query<UserSession>(querySpec)
    .fetchAll();

  return resources;
}

// ============================================================================
// Notification Queue Operations
// ============================================================================

export interface QueuedNotification {
  id: string;
  userId: string;
  type: "email" | "push" | "sms" | "in-app";
  payload: Record<string, any>;
  status: "pending" | "sent" | "failed";
  attempts: number;
  scheduledFor?: string;
  createdAt: string;
  processedAt?: string;
}

/**
 * Queue a notification
 */
export async function queueNotification(
  notification: Omit<QueuedNotification, "status" | "attempts" | "processedAt">,
): Promise<void> {
  if (!containers[CONTAINERS.NOTIFICATIONS]) {
    return;
  }

  await containers[CONTAINERS.NOTIFICATIONS].items.create({
    ...notification,
    status: "pending",
    attempts: 0,
    _ts: Date.now(),
  });
}

/**
 * Get pending notifications
 */
export async function getPendingNotifications(
  limit = 100,
): Promise<QueuedNotification[]> {
  if (!containers[CONTAINERS.NOTIFICATIONS]) {
    return [];
  }

  const now = new Date().toISOString();
  const querySpec = {
    query: `
      SELECT * FROM c
      WHERE c.status = 'pending'
        AND (c.scheduledFor = null OR c.scheduledFor <= @now)
      ORDER BY c.createdAt ASC
      OFFSET 0 LIMIT @limit
    `,
    parameters: [
      { name: "@now", value: now },
      { name: "@limit", value: limit },
    ],
  };

  const { resources } = await containers[CONTAINERS.NOTIFICATIONS].items
    .query<QueuedNotification>(querySpec)
    .fetchAll();

  return resources;
}

/**
 * Update notification status
 */
export async function updateNotificationStatus(
  id: string,
  userId: string,
  status: QueuedNotification["status"],
  error?: string,
): Promise<void> {
  if (!containers[CONTAINERS.NOTIFICATIONS]) {
    return;
  }

  const { resource } = await containers[CONTAINERS.NOTIFICATIONS]
    .item(id, userId)
    .read<QueuedNotification>();

  if (resource) {
    await containers[CONTAINERS.NOTIFICATIONS].items.upsert({
      ...resource,
      status,
      attempts: resource.attempts + 1,
      processedAt: new Date().toISOString(),
      ...(error && { error }),
    });
  }
}

// ============================================================================
// Health Check
// ============================================================================

export async function checkCosmosHealth(): Promise<{
  connected: boolean;
  database?: string;
  containers?: string[];
  error?: string;
}> {
  if (!client || !database) {
    return { connected: false, error: "Cosmos DB not initialized" };
  }

  try {
    const { resource } = await database.read();
    return {
      connected: true,
      database: resource?.id,
      containers: Object.keys(containers),
    };
  } catch (error: any) {
    return { connected: false, error: error.message };
  }
}

// Export for use in other modules
export { client, database, containers, CONTAINERS };
