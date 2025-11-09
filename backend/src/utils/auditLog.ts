import { Request, Response } from 'express'
import prisma from '../prismaClient'

export interface AuditLogEntry {
  userId: string
  action: string
  resourceType: string
  resourceId: string
  changes?: Record<string, any>
  previousValues?: Record<string, any>
  newValues?: Record<string, any>
  metadata?: Record<string, any>
}

/**
 * Create an audit log entry for tracking admin actions
 */
export const createAuditLog = async (entry: AuditLogEntry) => {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        changes: entry.changes as any,
        previousValues: entry.previousValues as any,
        newValues: entry.newValues as any,
        metadata: entry.metadata as any,
        timestamp: new Date(),
        ipAddress: entry.metadata?.ipAddress,
        userAgent: entry.metadata?.userAgent,
      },
    })
  } catch (error) {
    console.error('Error creating audit log:', error)
    // Fallback to console logging if database fails
    console.log('[AUDIT LOG]', {
      timestamp: new Date().toISOString(),
      ...entry,
    })
    return null
  }
}

/**
 * Middleware to automatically log admin actions
 */
export const auditLogMiddleware = (req: Request, res: Response, next: any) => {
  // Store original send function
  const originalSend = res.send

  // Override send function to log after response
  res.send = function (data: any) {
    // Only log write operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      // Extract user ID from token or session
      const userId = ((req as any).user as any)?.id || req.query.userId || 'unknown'

      // Determine action based on endpoint and method
      const action = `${req.method} ${req.path}`
      const [resourceType] = req.path.split('/').filter(Boolean)

      createAuditLog({
        userId,
        action,
        resourceType: resourceType || 'unknown',
        resourceId: req.params.id || 'N/A',
        metadata: {
          method: req.method,
          path: req.path,
          query: req.query,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          responseStatus: res.statusCode,
        },
      })
    }

    return originalSend.call(this, data)
  }

  next()
}

/**
 * Get audit logs for a specific user or resource
 */
export const getAuditLogs = async (filters: {
  userId?: string
  resourceType?: string
  resourceId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  skip?: number
}) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.resourceType && { resourceType: filters.resourceType }),
        ...(filters.resourceId && { resourceId: filters.resourceId }),
        ...(filters.startDate && { timestamp: { gte: filters.startDate } }),
        ...(filters.endDate && { timestamp: { lte: filters.endDate } }),
      },
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 50,
      skip: filters.skip || 0,
    })

    return logs
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return []
  }
}

export default {
  createAuditLog,
  auditLogMiddleware,
  getAuditLogs,
}
