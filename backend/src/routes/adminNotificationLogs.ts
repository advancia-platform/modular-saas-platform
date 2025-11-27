import express, { Response } from 'express';
import { Parser } from 'json2csv';
import { logger } from '../logger';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { adminAuditMiddleware, logAdminAction, requireAdminOrAuditor } from '../middleware/logAdminAction';
import prisma from '../prismaClient';
import { asyncHandler } from '../utils/errorHandler';

const router = express.Router();

// Apply authentication to all admin routes
router.use(authenticateToken);
router.use(requireAdminOrAuditor);

/**
 * GET /api/admin/notification-logs - Get notification logs with filtering
 * Query params:
 * - email: Filter by email address (case-insensitive partial match)
 * - subject: Filter by email subject (case-insensitive partial match)
 * - startDate: Filter emails sent after this date
 * - endDate: Filter emails sent before this date
 * - userId: Filter by specific user ID
 * - provider: Filter by email provider (gmail, resend, etc.)
 * - status: Filter by status (sent, failed)
 * - limit: Number of records to return (default 50, max 500)
 * - offset: Number of records to skip for pagination
 */
router.get('/notification-logs',
  adminAuditMiddleware('VIEW_NOTIFICATION_LOGS'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      email,
      subject,
      startDate,
      endDate,
      userId,
      provider,
      status,
      limit = '50',
      offset = '0'
    } = req.query;

    // Parse pagination params
    const limitNum = Math.min(parseInt(limit as string) || 50, 500);
    const offsetNum = parseInt(offset as string) || 0;

    // Build filter conditions
    const where: any = {
      AND: []
    };

    if (email) {
      where.AND.push({ email: { contains: email as string, mode: 'insensitive' } });
    }

    if (subject) {
      where.AND.push({ subject: { contains: subject as string, mode: 'insensitive' } });
    }

    if (startDate) {
      where.AND.push({ sentAt: { gte: new Date(startDate as string) } });
    }

    if (endDate) {
      where.AND.push({ sentAt: { lte: new Date(endDate as string) } });
    }

    if (userId) {
      where.AND.push({ userId: userId as string });
    }

    if (provider) {
      where.AND.push({ provider: provider as string });
    }

    if (status) {
      where.AND.push({ status: status as string });
    }

    // If no filters, remove empty AND array
    if (where.AND.length === 0) {
      delete where.AND;
    }

    try {
      const [logs, totalCount] = await Promise.all([
        prisma.notificationLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          },
          orderBy: { sentAt: 'desc' },
          take: limitNum,
          skip: offsetNum,
        }),
        prisma.notificationLog.count({ where })
      ]);

      logger.info('Notification logs retrieved by admin', {
        adminId: req.user?.userId,
        totalCount,
        limitNum,
        offsetNum,
        filters: { email, subject, startDate, endDate, userId, provider, status }
      });

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            total: totalCount,
            limit: limitNum,
            offset: offsetNum,
            hasMore: offsetNum + limitNum < totalCount
          },
          filters: { email, subject, startDate, endDate, userId, provider, status }
        }
      });
    } catch (error) {
      logger.error('Failed to retrieve notification logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId: req.user?.userId
      });
      res.status(500).json({ error: 'Failed to retrieve notification logs' });
    }
  })
);

/**
 * GET /api/admin/notification-logs/export - Export notification logs as CSV
 * Accepts same filters as the main logs endpoint
 * Returns CSV file download
 */
router.get('/notification-logs/export',
  adminAuditMiddleware('EXPORT_NOTIFICATION_LOGS'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      email,
      subject,
      startDate,
      endDate,
      userId,
      provider,
      status
    } = req.query;

    // Build same filter conditions as main endpoint
    const where: any = {
      AND: []
    };

    if (email) {
      where.AND.push({ email: { contains: email as string, mode: 'insensitive' } });
    }
    if (subject) {
      where.AND.push({ subject: { contains: subject as string, mode: 'insensitive' } });
    }
    if (startDate) {
      where.AND.push({ sentAt: { gte: new Date(startDate as string) } });
    }
    if (endDate) {
      where.AND.push({ sentAt: { lte: new Date(endDate as string) } });
    }
    if (userId) {
      where.AND.push({ userId: userId as string });
    }
    if (provider) {
      where.AND.push({ provider: provider as string });
    }
    if (status) {
      where.AND.push({ status: status as string });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    try {
      // Get all matching logs (no limit for export)
      const logs = await prisma.notificationLog.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: { sentAt: 'desc' },
      });

      // Transform data for CSV export
      const csvData = logs.map(log => ({
        ID: log.id,
        'User ID': log.userId,
        'User Email': log.user.email,
        'User Name': `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim(),
        'User Role': log.user.role,
        'Recipient Email': log.email,
        Subject: log.subject,
        Message: log.message.replace(/\n/g, ' ').substring(0, 200) + (log.message.length > 200 ? '...' : ''),
        Template: log.template || '',
        Provider: log.provider,
        Status: log.status,
        'Sent At': log.sentAt.toISOString(),
      }));

      // Configure CSV fields
      const fields = [
        'ID', 'User ID', 'User Email', 'User Name', 'User Role',
        'Recipient Email', 'Subject', 'Message', 'Template',
        'Provider', 'Status', 'Sent At'
      ];

      const parser = new Parser({ fields });
      const csv = parser.parse(csvData);

      // Log export action
      await logAdminAction(
        req.user?.userId || 'unknown',
        'EXPORT_NOTIFICATION_LOGS',
        `${logs.length} records`,
        JSON.stringify({ filters: { email, subject, startDate, endDate, userId, provider, status } }),
        req
      );

      logger.info('Notification logs exported', {
        adminId: req.user?.userId,
        recordCount: logs.length,
        filters: { email, subject, startDate, endDate, userId, provider, status }
      });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `notification_logs_${timestamp}.csv`;

      res.header('Content-Type', 'text/csv');
      res.attachment(filename);
      res.send(csv);
    } catch (error) {
      logger.error('Failed to export notification logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId: req.user?.userId
      });
      res.status(500).json({ error: 'Failed to export notification logs' });
    }
  })
);

/**
 * GET /api/admin/audit-trail - Get admin audit trail with filtering
 * Query params:
 * - adminId: Filter by admin user ID
 * - action: Filter by action type (case-insensitive partial match)
 * - target: Filter by action target
 * - startDate: Filter actions after this date
 * - endDate: Filter actions before this date
 * - limit: Number of records to return (default 50, max 200)
 * - offset: Number of records to skip for pagination
 */
router.get('/audit-trail',
  adminAuditMiddleware('VIEW_ADMIN_AUDIT_TRAIL'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      adminId,
      action,
      target,
      role,
      startDate,
      endDate,
      limit = '50',
      offset = '0'
    } = req.query;

    // Parse pagination params
    const limitNum = Math.min(parseInt(limit as string) || 50, 200);
    const offsetNum = parseInt(offset as string) || 0;

    // Build filter conditions
    const where: any = {
      AND: []
    };

    if (adminId) {
      where.AND.push({ adminId: adminId as string });
    }

    if (action) {
      where.AND.push({ action: { contains: action as string, mode: 'insensitive' } });
    }

    if (target) {
      where.AND.push({ target: { contains: target as string, mode: 'insensitive' } });
    }

    if (role) {
      where.AND.push({ admin: { role: role as string } });
    }

    if (startDate) {
      where.AND.push({ timestamp: { gte: new Date(startDate as string) } });
    }

    if (endDate) {
      where.AND.push({ timestamp: { lte: new Date(endDate as string) } });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    try {
      const [auditLogs, totalCount] = await Promise.all([
        prisma.adminAuditTrail.findMany({
          where,
          include: {
            admin: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          },
          orderBy: { timestamp: 'desc' },
          take: limitNum,
          skip: offsetNum,
        }),
        prisma.adminAuditTrail.count({ where })
      ]);

      logger.info('Admin audit trail retrieved', {
        adminId: req.user?.userId,
        totalCount,
        limitNum,
        offsetNum
      });

      // Add computed name field for consistency with frontend expectations
      const enrichedAuditLogs = auditLogs.map(log => ({
        ...log,
        admin: {
          ...log.admin,
          name: log.admin.firstName && log.admin.lastName
            ? `${log.admin.firstName} ${log.admin.lastName}`
            : log.admin.email
        }
      }));

      res.json({
        success: true,
        data: {
          auditLogs: enrichedAuditLogs,
          pagination: {
            total: totalCount,
            limit: limitNum,
            offset: offsetNum,
            hasMore: offsetNum + limitNum < totalCount
          },
          filters: { adminId, action, target, role, startDate, endDate }
        }
      });
    } catch (error) {
      logger.error('Failed to retrieve admin audit trail', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId: req.user?.userId
      });
      res.status(500).json({ error: 'Failed to retrieve audit trail' });
    }
  })
);

/**
 * GET /api/admin/audit-trail/export - Export admin audit trail as CSV
 */
router.get('/audit-trail/export',
  adminAuditMiddleware('EXPORT_ADMIN_AUDIT_TRAIL'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      adminId,
      action,
      target,
      role,
      startDate,
      endDate
    } = req.query;

    // Build same filter conditions as main endpoint
    const where: any = {
      AND: []
    };

    if (adminId) where.AND.push({ adminId: adminId as string });
    if (action) where.AND.push({ action: { contains: action as string, mode: 'insensitive' } });
    if (target) where.AND.push({ target: { contains: target as string, mode: 'insensitive' } });
    if (role) where.AND.push({ admin: { role: role as string } });
    if (startDate) where.AND.push({ timestamp: { gte: new Date(startDate as string) } });
    if (endDate) where.AND.push({ timestamp: { lte: new Date(endDate as string) } });

    if (where.AND.length === 0) {
      delete where.AND;
    }

    try {
      const auditLogs = await prisma.adminAuditTrail.findMany({
        where,
        include: {
          admin: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: { timestamp: 'desc' },
      });

      // Transform data for CSV export
      const csvData = auditLogs.map(log => ({
        ID: log.id,
        'Admin ID': log.adminId,
        'Admin Email': log.admin.email,
        'Admin Name': `${log.admin.firstName || ''} ${log.admin.lastName || ''}`.trim(),
        'Admin Role': log.admin.role,
        Action: log.action,
        Target: log.target || '',
        Details: (log.details || '').substring(0, 100) + ((log.details || '').length > 100 ? '...' : ''),
        'IP Address': log.ipAddress || '',
        'User Agent': (log.userAgent || '').substring(0, 50) + ((log.userAgent || '').length > 50 ? '...' : ''),
        Timestamp: log.timestamp.toISOString(),
      }));

      const fields = [
        'ID', 'Admin ID', 'Admin Email', 'Admin Name', 'Admin Role',
        'Action', 'Target', 'Details', 'IP Address', 'User Agent', 'Timestamp'
      ];

      const parser = new Parser({ fields });
      const csv = parser.parse(csvData);

      // Log export action
      await logAdminAction(
        req.user?.userId || 'unknown',
        'EXPORT_ADMIN_AUDIT_TRAIL',
        `${auditLogs.length} records`,
        JSON.stringify({ filters: { adminId, action, target, role, startDate, endDate } }),
        req
      );

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `admin_audit_trail_${timestamp}.csv`;

      res.header('Content-Type', 'text/csv');
      res.attachment(filename);
      res.send(csv);
    } catch (error) {
      logger.error('Failed to export admin audit trail', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId: req.user?.userId
      });
      res.status(500).json({ error: 'Failed to export audit trail' });
    }
  })
);

/**
 * GET /api/admin/notification-stats - Get notification statistics for dashboard
 */
router.get('/notification-stats',
  adminAuditMiddleware('VIEW_NOTIFICATION_STATS'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        todayCount,
        weekCount,
        monthCount,
        totalCount,
        failedCount,
        byProvider,
        byStatus
      ] = await Promise.all([
        prisma.notificationLog.count({
          where: { sentAt: { gte: today } }
        }),
        prisma.notificationLog.count({
          where: { sentAt: { gte: thisWeek } }
        }),
        prisma.notificationLog.count({
          where: { sentAt: { gte: thisMonth } }
        }),
        prisma.notificationLog.count(),
        prisma.notificationLog.count({
          where: { status: 'failed' }
        }),
        prisma.notificationLog.groupBy({
          by: ['provider'],
          _count: { provider: true },
          orderBy: { _count: { provider: 'desc' } }
        }),
        prisma.notificationLog.groupBy({
          by: ['status'],
          _count: { status: true }
        })
      ]);

      res.json({
        success: true,
        data: {
          counts: {
            today: todayCount,
            thisWeek: weekCount,
            thisMonth: monthCount,
            total: totalCount,
            failed: failedCount
          },
          byProvider: byProvider.map(p => ({
            provider: p.provider,
            count: p._count.provider
          })),
          byStatus: byStatus.map(s => ({
            status: s.status,
            count: s._count.status
          }))
        }
      });
    } catch (error) {
      logger.error('Failed to retrieve notification stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId: req.user?.userId
      });
      res.status(500).json({ error: 'Failed to retrieve notification statistics' });
    }
  })
);

/**
 * POST /api/admin/compliance/generate-report - Generate compliance report for date range
 * Body: { reportType: 'weekly' | 'monthly' | 'quarterly', startDate: string, endDate: string }
 */
router.post('/compliance/generate-report',
  adminAuditMiddleware('GENERATE_COMPLIANCE_REPORT'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { reportType, startDate, endDate } = req.body;

    // Validate input
    if (!reportType || !['weekly', 'monthly', 'quarterly'].includes(reportType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report type. Must be weekly, monthly, or quarterly.'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required.'
      });
    }

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format.'
        });
      }

      if (start >= end) {
        return res.status(400).json({
          success: false,
          error: 'Start date must be before end date.'
        });
      }

      const report = await generateComplianceReport(reportType, start, end);

      logger.info('Compliance report generated via API', {
        adminId: req.user?.userId,
        reportType,
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Failed to generate compliance report via API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId: req.user?.userId,
        reportType,
        startDate,
        endDate
      });
      res.status(500).json({
        success: false,
        error: 'Failed to generate compliance report'
      });
    }
  })
);

/**
 * POST /api/admin/compliance/export-pdf - Export compliance report as PDF
 * Body: { reportType: 'weekly' | 'monthly' | 'quarterly', startDate: string, endDate: string }
 */
router.post('/compliance/export-pdf',
  adminAuditMiddleware('EXPORT_COMPLIANCE_REPORT_PDF'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { reportType, startDate, endDate } = req.body;

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const report = await generateComplianceReport(reportType, start, end);
      const pdfBuffer = await exportComplianceReportPDF(report);

      const filename = `compliance_report_${reportType}_${start.toISOString().split('T')[0]}.pdf`;

      res.header('Content-Type', 'application/pdf');
      res.attachment(filename);
      res.send(pdfBuffer);

      logger.info('Compliance report PDF exported', {
        adminId: req.user?.userId,
        reportType,
        filename
      });
    } catch (error) {
      logger.error('Failed to export compliance report PDF', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId: req.user?.userId
      });
      res.status(500).json({
        success: false,
        error: 'Failed to export compliance report'
      });
    }
  })
);

export default router;
