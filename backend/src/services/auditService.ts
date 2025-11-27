import { NextFunction, Request, Response } from "express";
import { logger } from "../logger";
import prisma from "../prismaClient";

export interface AuditLogData {
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: Record<string, any>;
}

// Create audit log entry
export async function createAuditLog(
  userId: string,
  data: AuditLogData,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  try {
    await prisma.audit_logs.create({
      data: {
        userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
        newValues: data.newValues ? JSON.stringify(data.newValues) : null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      },
    });

    logger.info(
      {
        userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        ipAddress,
      },
      "Audit log created",
    );
  } catch (error) {
    logger.error("Failed to create audit log", {
      error: error.message,
      userId,
      action: data.action,
      resource: data.resource,
    });
  }
}

// Audit middleware for automatic logging
export function auditLog(action: string, resource: string) {
  return (req: any, res: Response, next: NextFunction) => {
    // Store audit data in res.locals for later use
    res.locals.auditData = {
      action,
      resource,
      userId: req.user?.userId || req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    };

    // Override res.json to capture response data
    const originalJson = res.json;
    res.json = function (body: any) {
      // Log audit entry after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const auditData = res.locals.auditData;
        if (auditData.userId) {
          createAuditLog(
            auditData.userId,
            {
              action: auditData.action,
              resource: auditData.resource,
              resourceId: req.params.id || body?.id,
              newValues: body,
              metadata: {
                method: req.method,
                path: req.path,
                query: req.query,
                params: req.params,
              },
            },
            auditData.ipAddress,
            auditData.userAgent,
          );
        }
      }

      return originalJson.call(this, body);
    };

    next();
  };
}

// Specific audit functions for common operations
export async function auditUserAction(
  userId: string,
  action: string,
  targetUserId?: string,
  changes?: { old: any; new: any },
  req?: Request,
): Promise<void> {
  await createAuditLog(
    userId,
    {
      action,
      resource: "user",
      resourceId: targetUserId,
      oldValues: changes?.old,
      newValues: changes?.new,
      metadata: {
        path: req?.path,
        method: req?.method,
      },
    },
    req?.ip,
    req?.get("User-Agent"),
  );
}

export async function auditTransactionAction(
  userId: string,
  action: string,
  transactionId: string,
  amount?: string,
  metadata?: any,
  req?: Request,
): Promise<void> {
  await createAuditLog(
    userId,
    {
      action,
      resource: "transaction",
      resourceId: transactionId,
      newValues: { amount },
      metadata: {
        ...metadata,
        path: req?.path,
        method: req?.method,
      },
    },
    req?.ip,
    req?.get("User-Agent"),
  );
}

export async function auditPaymentAction(
  userId: string,
  action: string,
  paymentId: string,
  amount?: string,
  paymentMethod?: string,
  req?: Request,
): Promise<void> {
  await createAuditLog(
    userId,
    {
      action,
      resource: "payment",
      resourceId: paymentId,
      newValues: { amount, paymentMethod },
      metadata: {
        path: req?.path,
        method: req?.method,
      },
    },
    req?.ip,
    req?.get("User-Agent"),
  );
}

export async function auditSecurityAction(
  userId: string,
  action: string,
  details?: any,
  req?: Request,
): Promise<void> {
  await createAuditLog(
    userId,
    {
      action,
      resource: "security",
      newValues: details,
      metadata: {
        path: req?.path,
        method: req?.method,
      },
    },
    req?.ip,
    req?.get("User-Agent"),
  );
}

export async function auditAdminAction(
  adminId: string,
  action: string,
  targetResource: string,
  targetId?: string,
  changes?: { old: any; new: any },
  req?: Request,
): Promise<void> {
  await createAuditLog(
    adminId,
    {
      action: `admin_${action}`,
      resource: targetResource,
      resourceId: targetId,
      oldValues: changes?.old,
      newValues: changes?.new,
      metadata: {
        adminAction: true,
        path: req?.path,
        method: req?.method,
      },
    },
    req?.ip,
    req?.get("User-Agent"),
  );
}

// Query audit logs with filters
export async function getAuditLogs(filters: {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = { contains: filters.action };
  if (filters.resource) where.resource = filters.resource;
  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) where.timestamp.gte = filters.startDate;
    if (filters.endDate) where.timestamp.lte = filters.endDate;
  }

  return await prisma.audit_logs.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: filters.limit || 100,
    skip: filters.offset || 0,
    include: {
      user: {
        select: {
          email: true,
          role: true,
        },
      },
    },
  });
}
