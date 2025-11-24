/**
 * Policy Audit Service (Tamper-Evident with Hash Chains)
 * Tracks all changes to alert policies for compliance and security
 * Uses SHA-256 hash chains to detect tampering
 */

import { createHash } from "crypto";
import prisma from "../prismaClient";
import { withDefaults } from "../utils/prismaHelpers";
import { captureError } from "../utils/sentry";

export interface PolicyAuditData {
  policyId: string;
  action: "created" | "updated" | "deleted" | "enabled" | "disabled";
  changedBy: string;
  userEmail: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
  changesBefore?: any;
  changesAfter: any;
  reason?: string;
}

/**
 * Compute SHA-256 hash of audit entry
 * Hash includes: timestamp + action + userId + policyId + changes + prevHash
 */
function computeEntryHash(entry: any, prevHash: string): string {
  const data = JSON.stringify({
    timestamp: entry.timestamp,
    action: entry.action,
    changedBy: entry.changedBy,
    policyId: entry.policyId,
    changesBefore: entry.changesBefore,
    changesAfter: entry.changesAfter,
    prevHash,
  });

  return createHash("sha256").update(data).digest("hex");
}

/**
 * Get the hash of the most recent audit log entry
 */
async function getLastEntryHash(): Promise<string> {
  try {
    const lastEntry = await prisma.policy_audit_logs.findFirst({
      orderBy: { timestamp: "desc" },
      select: { entryHash: true },
    });

    return lastEntry?.entryHash || "genesis"; // Genesis block for first entry
  } catch (err) {
    console.error("Failed to get last entry hash:", err);
    return "genesis";
  }
}

/**
 * Log a policy change to the audit log (with tamper-evident hash chain)
 */
export async function logPolicyChange(data: PolicyAuditData): Promise<void> {
  try {
    // Get previous entry hash for chain
    const prevHash = await getLastEntryHash();

    // Create entry object for hashing
    const timestamp = new Date();
    const entryData = {
      policyId: data.policyId,
      action: data.action,
      changedBy: data.changedBy,
      userEmail: data.userEmail,
      userRole: data.userRole,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      changesBefore: data.changesBefore || null,
      changesAfter: data.changesAfter,
      reason: data.reason,
      timestamp,
    };

    // Compute hash of this entry + previous hash
    const entryHash = computeEntryHash(entryData, prevHash);

    // Store entry with hash chain
    await prisma.policy_audit_logs.create({
      data: withDefaults({
        ...entryData,
        entryHash,
        prevHash,
      }),
    });

    console.log(
      `✓ Policy audit logged: ${data.action} on ${data.policyId} by ${
        data.userEmail
      } [hash: ${entryHash.substring(0, 8)}...]`,
    );

    // Also log to Sentry for critical actions
    if (
      ["deleted", "disabled"].includes(data.action) ||
      data.userRole === "SUPERADMIN"
    ) {
      captureError(new Error(`Policy ${data.action}: ${data.policyId}`), {
        level: "info",
        tags: {
          type: "policy_audit",
          action: data.action,
          userRole: data.userRole,
        },
        extra: data,
      });
    }
  } catch (err) {
    console.error("Failed to log policy change:", err);

    // Critical: if audit logging fails, we need to know
    captureError(err as Error, {
      level: "error",
      tags: { type: "audit_failure", component: "policy-audit" },
      extra: data,
    });
  }
}

/**
 * Get audit history for a specific policy
 */
export async function getPolicyAuditHistory(
  policyId: string,
  limit: number = 100,
) {
  try {
    const logs = await prisma.policy_audit_logs.findMany({
      where: { policyId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return logs;
  } catch (err) {
    console.error("Failed to fetch policy audit history:", err);
    return [];
  }
}

/**
 * Get all audit logs (for security dashboard)
 */
export async function getAllAuditLogs(limit: number = 500) {
  try {
    const logs = await prisma.policy_audit_logs.findMany({
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return logs;
  } catch (err) {
    console.error("Failed to fetch audit logs:", err);
    return [];
  }
}

/**
 * Get audit logs for a specific user (track admin activity)
 */
export async function getUserAuditLogs(userId: string, limit: number = 100) {
  try {
    const logs = await prisma.policy_audit_logs.findMany({
      where: { changedBy: userId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return logs;
  } catch (err) {
    console.error("Failed to fetch user audit logs:", err);
    return [];
  }
}

/**
 * Detect suspicious patterns in audit logs
 */
export async function detectAnomalies(): Promise<{
  rapidChanges: any[];
  unusualTimes: any[];
  deletions: any[];
}> {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Detect rapid changes (>5 changes in 1 hour by same user)
    const recentLogs = await prisma.policy_audit_logs.findMany({
      where: { timestamp: { gte: last24h } },
      orderBy: { timestamp: "desc" },
    });

    const changesByUser = new Map<string, any[]>();
    for (const log of recentLogs) {
      if (!changesByUser.has(log.changedBy)) {
        changesByUser.set(log.changedBy, []);
      }
      changesByUser.get(log.changedBy)!.push(log);
    }

    const rapidChanges = Array.from(changesByUser.entries())
      .filter(([_, logs]) => logs.length > 5)
      .map(([userId, logs]) => ({ userId, count: logs.length, logs }));

    // Detect changes outside business hours (suspicious)
    const unusualTimes = recentLogs.filter((log) => {
      const hour = new Date(log.timestamp).getHours();
      return hour < 6 || hour > 22; // Outside 6 AM - 10 PM
    });

    // Detect recent deletions or disables
    const deletions = recentLogs.filter((log) =>
      ["deleted", "disabled"].includes(log.action),
    );

    return { rapidChanges, unusualTimes, deletions };
  } catch (err) {
    console.error("Failed to detect audit anomalies:", err);
    return { rapidChanges: [], unusualTimes: [], deletions: [] };
  }
}

/**
 * Verify the integrity of the audit log hash chain
 * Returns true if chain is intact, false if tampering detected
 */
export async function verifyAuditLogIntegrity(): Promise<{
  valid: boolean;
  totalEntries: number;
  errors: string[];
}> {
  try {
    const logs = await prisma.policy_audit_logs.findMany({
      orderBy: { timestamp: "asc" },
    });

    const errors: string[] = [];
    let prevHash = "genesis";

    for (const log of logs) {
      // Check if prevHash matches
      if (log.prevHash !== prevHash) {
        errors.push(
          `Entry ${log.id} has invalid prevHash (expected: ${prevHash}, got: ${log.prevHash})`,
        );
      }

      // Recompute hash and verify
      const expectedHash = computeEntryHash(log, log.prevHash || "genesis");
      if (log.entryHash !== expectedHash) {
        errors.push(
          `Entry ${log.id} has invalid hash (expected: ${expectedHash}, got: ${log.entryHash})`,
        );
      }

      prevHash = log.entryHash || "";
    }

    const valid = errors.length === 0;

    if (!valid) {
      // Critical: audit log tampering detected
      captureError(new Error("Audit log integrity check failed"), {
        level: "fatal",
        tags: { type: "security", event: "audit_tampering" },
        extra: { errors, totalEntries: logs.length },
      });
    }

    return {
      valid,
      totalEntries: logs.length,
      errors,
    };
  } catch (err) {
    console.error("Failed to verify audit log integrity:", err);
    return {
      valid: false,
      totalEntries: 0,
      errors: [`Verification failed: ${err}`],
    };
  }
}
