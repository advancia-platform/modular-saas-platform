/**
 * OAL Service: Object-Action-Location audit logging
 *
 * Tracks sensitive operations in the system for compliance and audit trails.
 * All admin actions that modify critical data should be logged here.
 */

import prisma from "../prismaClient";
import { OALStatus } from "@prisma/client";

interface CreateOALLogParams {
  object: string; // e.g., "ledger.balance", "user.role", "system.config"
  action: string; // e.g., "adjust", "create", "delete", "update"
  location: string; // e.g., "admin.panel", "api.endpoint", "cron.job"
  subjectId?: string; // User ID the action concerns
  metadata?: any; // Additional context (delta, reason, old/new values)
  createdById: string; // Admin/user who initiated
  status?: OALStatus; // Optional initial status (defaults to PENDING)
}

interface UpdateOALStatusParams {
  id: string;
  status: OALStatus;
  updatedById: string;
}

/**
 * Create a new OAL audit log entry
 */
/**
 * Simple OAL logging helper - fire and forget
 * Use this for quick inline logging without error handling
 */
export async function logOAL(params: {
  object: string;
  action: string;
  location: string;
  userId: string;
  subjectId?: string;
  metadata?: any;
}) {
  try {
    await prisma.oAL.create({
      data: {
        object: params.object,
        action: params.action,
        location: params.location,
        createdById: params.userId,
        subjectId: params.subjectId,
        metadata: params.metadata,
        status: "APPROVED", // Auto-approve for simple logs
      },
    });
  } catch (err) {
    console.error("[OAL] Log failed:", err);
    // Silent fail - don't break the main operation
  }
}

/**
 * Create a new OAL audit log entry (with full control)
 */
export async function createOALLog(params: CreateOALLogParams) {
  return await prisma.oAL.create({
    data: {
      object: params.object,
      action: params.action,
      location: params.location,
      subjectId: params.subjectId,
      metadata: params.metadata,
      createdById: params.createdById,
      status: params.status || "PENDING",
    },
  });
}

/**
 * Update OAL status (approve/reject)
 */
export async function updateOALStatus(params: UpdateOALStatusParams) {
  return await prisma.oAL.update({
    where: { id: params.id },
    data: {
      status: params.status,
      updatedById: params.updatedById,
    },
  });
}

/**
 * Get OAL logs with filters
 */
export async function getOALLogs(filters: {
  object?: string;
  action?: string;
  location?: string;
  status?: OALStatus;
  createdById?: string;
  subjectId?: string;
  limit?: number;
  offset?: number;
}) {
  const { limit = 100, offset = 0, ...where } = filters;

  return await prisma.oAL.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

/**
 * Get a single OAL log by ID
 */
export async function getOALLogById(id: string) {
  return await prisma.oAL.findUnique({
    where: { id },
  });
}

/**
 * Helper: Log a balance adjustment
 */
export async function logBalanceAdjustment(params: {
  userId: string;
  adminId: string;
  currency: string;
  delta: number;
  reason: string;
  location?: string;
}) {
  return await createOALLog({
    object: "ledger.balance",
    action: "adjust",
    location: params.location || "admin.panel",
    subjectId: params.userId,
    metadata: {
      delta: params.delta,
      currency: params.currency,
      reason: params.reason,
    },
    createdById: params.adminId,
  });
}

/**
 * Helper: Log a role change
 */
export async function logRoleChange(params: {
  userId: string;
  adminId: string;
  oldRole: string;
  newRole: string;
  reason?: string;
  location?: string;
}) {
  return await createOALLog({
    object: "user.role",
    action: "update",
    location: params.location || "admin.panel",
    subjectId: params.userId,
    metadata: {
      oldRole: params.oldRole,
      newRole: params.newRole,
      reason: params.reason,
    },
    createdById: params.adminId,
  });
}

/**
 * Helper: Log a system configuration change
 */
export async function logConfigChange(params: {
  adminId: string;
  configKey: string;
  oldValue: any;
  newValue: any;
  location?: string;
}) {
  return await createOALLog({
    object: "system.config",
    action: "update",
    location: params.location || "admin.panel",
    metadata: {
      key: params.configKey,
      oldValue: params.oldValue,
      newValue: params.newValue,
    },
    createdById: params.adminId,
  });
}
/**

/**
 * Get OAL logs with count for pagination
 */
export async function getOALLogsWithCount(filters: {
  object?: string;
  action?: string;
  location?: string;
  status?: OALStatus;
  createdById?: string;
  subjectId?: string;
  limit?: number;
  offset?: number;
}) {
  const { limit = 20, offset = 0, ...where } = filters;

  const [items, count] = await Promise.all([
    prisma.oAL.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      
    }),
    prisma.oAL.count({ where }),
  ]);

  return { items, count };
}

/**
 * Get all OAL logs for export (no pagination)
 */
export async function getAllOALLogsForExport() {
  return await prisma.oAL.findMany({
    orderBy: { createdAt: "desc" },
    
  });
}

