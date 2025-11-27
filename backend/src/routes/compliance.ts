import { Router } from "express";
import {
  allowRoles,
  authenticateToken,
  requireAdmin,
} from "../middleware/auth";
import { validateInput } from "../middleware/security";
import prisma from "../prismaClient";
import {
  ComplianceService,
  setComplianceSocketIO,
} from "../services/complianceService";
import { winstonLogger as logger } from "../utils/winstonLogger";

const router = Router();

// Safe middleware wrappers
const safeAuth: any =
  typeof authenticateToken === "function"
    ? authenticateToken
    : (_req: any, _res: any, next: any) => next();

const safeRequireAdmin =
  typeof requireAdmin === "function"
    ? requireAdmin
    : (_req: any, _res: any, next: any) => next();

const safeAllowRoles = (...roles: string[]) => {
  if (typeof allowRoles === "function") return allowRoles(...roles);
  return (_req: any, _res: any, next: any) => next();
};

/**
 * GET /api/compliance/kpis
 * Get current compliance KPIs and summary
 * Requires admin authentication
 */
router.get(
  "/kpis",
  safeAuth,
  safeRequireAdmin,
  validateInput,
  async (req, res) => {
    try {
      const result = await ComplianceService.getKPIs();

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error("[Compliance] Error fetching KPIs:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch compliance KPIs",
      });
    }
  },
);

/**
 * GET /api/compliance/metrics
 * Get detailed compliance metrics with filtering
 * Query params:
 *   - category: Metric category filter
 *   - source: Source system filter
 *   - status: Compliance status filter
 *   - page: Page number (default: 1)
 *   - pageSize: Page size (default: 20)
 */
router.get(
  "/metrics",
  safeAuth,
  safeRequireAdmin,
  validateInput,
  async (req, res) => {
    try {
      const { category, source, status, page = 1, pageSize = 20 } = req.query;

      const where: any = {};
      if (category) where.category = category;
      if (source) where.source = source;
      if (status) where.status = status.toString().toUpperCase();

      const [metrics, total] = await Promise.all([
        prisma.complianceMetric.findMany({
          where,
          orderBy: { lastMeasured: "desc" },
          skip: (Number(page) - 1) * Number(pageSize),
          take: Number(pageSize),
          include: {
            application: {
              select: {
                id: true,
                name: true,
                namespace: true,
                environment: true,
              },
            },
            report: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        }),
        prisma.complianceMetric.count({ where }),
      ]);

      // Serialize decimal fields
      const serializedMetrics = metrics.map((metric) => ({
        ...metric,
        value: metric.value.toString(),
        target: metric.target?.toString() || null,
        threshold: metric.threshold?.toString() || null,
      }));

      res.json({
        success: true,
        metrics: serializedMetrics,
        pagination: {
          total,
          page: Number(page),
          pageSize: Number(pageSize),
          totalPages: Math.ceil(total / Number(pageSize)),
        },
      });
    } catch (error) {
      logger.error("[Compliance] Error fetching metrics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch compliance metrics",
      });
    }
  },
);

/**
 * GET /api/compliance/audit
 * Get audit logs with filtering and pagination
 * Query params:
 *   - page: Page number (default: 1)
 *   - pageSize: Page size (default: 50)
 *   - severity: Event severity filter
 *   - category: Event category filter
 *   - outcome: Event outcome filter
 *   - startDate: Start date filter (ISO string)
 *   - endDate: End date filter (ISO string)
 *   - complianceRelevant: Filter for compliance relevance (boolean)
 */
router.get(
  "/audit",
  safeAuth,
  safeRequireAdmin,
  validateInput,
  async (req, res) => {
    try {
      const {
        page,
        pageSize,
        severity,
        category,
        outcome,
        startDate,
        endDate,
        complianceRelevant,
      } = req.query;

      const params: any = {
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 50,
      };

      if (severity) params.severity = severity.toString();
      if (category) params.category = category.toString();
      if (outcome) params.outcome = outcome.toString();
      if (startDate) params.startDate = new Date(startDate.toString());
      if (endDate) params.endDate = new Date(endDate.toString());
      if (complianceRelevant !== undefined) {
        params.complianceRelevant = complianceRelevant === "true";
      }

      const result = await ComplianceService.getAuditLogs(params);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error("[Compliance] Error fetching audit logs:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch audit logs",
      });
    }
  },
);

/**
 * GET /api/compliance/reports
 * Get compliance reports list
 * Query params:
 *   - status: Report status filter
 *   - reportType: Report type filter
 *   - page: Page number (default: 1)
 *   - pageSize: Page size (default: 20)
 */
router.get(
  "/reports",
  safeAuth,
  safeRequireAdmin,
  validateInput,
  async (req, res) => {
    try {
      const { status, reportType, page = 1, pageSize = 20 } = req.query;

      const where: any = {};
      if (status) where.status = status.toString().toUpperCase();
      if (reportType) where.reportType = reportType.toString().toUpperCase();

      const [reports, total] = await Promise.all([
        prisma.complianceReport.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (Number(page) - 1) * Number(pageSize),
          take: Number(pageSize),
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
            reviewedBy: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
            _count: {
              select: {
                metrics: true,
                auditEvents: true,
              },
            },
          },
        }),
        prisma.complianceReport.count({ where }),
      ]);

      // Serialize decimal fields
      const serializedReports = reports.map((report) => ({
        ...report,
        riskScore: report.riskScore.toString(),
        complianceScore: report.complianceScore.toString(),
      }));

      res.json({
        success: true,
        reports: serializedReports,
        pagination: {
          total,
          page: Number(page),
          pageSize: Number(pageSize),
          totalPages: Math.ceil(total / Number(pageSize)),
        },
      });
    } catch (error) {
      logger.error("[Compliance] Error fetching reports:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch compliance reports",
      });
    }
  },
);

/**
 * POST /api/compliance/reports
 * Generate new compliance report
 * Body:
 *   - title: Report title (required)
 *   - reportType: Report type (required)
 *   - description: Report description (optional)
 *   - scheduledFor: Scheduled execution date (optional)
 *   - dueDate: Report due date (optional)
 *   - tags: Report tags (optional array)
 */
router.post(
  "/reports",
  safeAuth,
  safeRequireAdmin,
  validateInput,
  async (req, res) => {
    try {
      const { title, reportType, description, scheduledFor, dueDate, tags } =
        req.body;

      if (!title || !reportType) {
        return res.status(400).json({
          success: false,
          error: "Title and reportType are required",
        });
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User authentication required",
        });
      }

      const params = {
        title,
        reportType,
        description,
        createdById: userId,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        tags: Array.isArray(tags) ? tags : [],
      };

      const report = await ComplianceService.generateReport(params);

      res.status(201).json({
        success: true,
        message: "Compliance report generation initiated",
        report: {
          id: report.id,
          title: report.title,
          reportType: report.reportType,
          status: report.status,
          riskScore: report.riskScore.toString(),
          complianceScore: report.complianceScore.toString(),
          createdAt: report.createdAt,
        },
      });
    } catch (error) {
      logger.error("[Compliance] Error generating report:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate compliance report",
      });
    }
  },
);

/**
 * GET /api/compliance/reports/:reportId
 * Get specific compliance report details
 */
router.get(
  "/reports/:reportId",
  safeAuth,
  safeRequireAdmin,
  validateInput,
  async (req, res) => {
    try {
      const { reportId } = req.params;

      const report = await prisma.complianceReport.findUnique({
        where: { id: reportId },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          metrics: {
            orderBy: { lastMeasured: "desc" },
            take: 50,
          },
          auditEvents: {
            orderBy: { timestamp: "desc" },
            take: 50,
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                },
              },
            },
          },
          _count: {
            select: {
              metrics: true,
              auditEvents: true,
            },
          },
        },
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          error: "Compliance report not found",
        });
      }

      // Serialize decimal fields for JSON export
      const serializedReport = {
        ...report,
        riskScore: report.riskScore.toString(),
        complianceScore: report.complianceScore.toString(),
        metrics: report.metrics.map((metric) => ({
          ...metric,
          value: metric.value.toString(),
          target: metric.target?.toString() || null,
          threshold: metric.threshold?.toString() || null,
        })),
      };

      res.json({
        success: true,
        report: serializedReport,
      });
    } catch (error) {
      logger.error("[Compliance] Error fetching report:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch compliance report",
      });
    }
  },
);

/**
 * GET /api/compliance/reports/:reportId/download
 * Download compliance report as JSON/PDF
 */
router.get(
  "/reports/:reportId/download",
  safeAuth,
  safeRequireAdmin,
  validateInput,
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const { format = "json" } = req.query;

      const report = await prisma.complianceReport.findUnique({
        where: { id: reportId },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          metrics: true,
          auditEvents: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          error: "Compliance report not found",
        });
      }

      const filename = `compliance-report-${report.id}-${new Date().toISOString().split("T")[0]}.${format}`;

      if (format === "json") {
        // Serialize decimal fields for JSON export
        const serializedReport = {
          ...report,
          riskScore: report.riskScore.toString(),
          complianceScore: report.complianceScore.toString(),
          metrics: report.metrics.map((metric) => ({
            ...metric,
            value: metric.value.toString(),
            target: metric.target?.toString() || null,
            threshold: metric.threshold?.toString() || null,
          })),
        };

        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=\"${filename}\"`,
        );
        res.json(serializedReport);
      } else {
        // For other formats, return JSON for now
        // In production, you could add PDF generation here
        res.status(400).json({
          success: false,
          error: "Only JSON format is currently supported",
        });
      }
    } catch (error) {
      logger.error("[Compliance] Error downloading report:", error);
      res.status(500).json({
        success: false,
        error: "Failed to download compliance report",
      });
    }
  },
);

/**
 * GET /api/compliance/health
 * Get overall compliance health status
 */
router.get(
  "/health",
  safeAuth,
  safeRequireAdmin,
  validateInput,
  async (req, res) => {
    try {
      const healthReport = await ComplianceService.getHealthReport();

      res.json({
        success: true,
        health: healthReport,
      });
    } catch (error) {
      logger.error("[Compliance] Error fetching health:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch compliance health",
      });
    }
  },
);

/**
 * POST /api/compliance/audit
 * Record new audit event
 * Body:
 *   - eventType: Type of event (required)
 *   - action: Action performed (required)
 *   - resource: Resource affected (required)
 *   - userId: User ID (optional)
 *   - username: Username (optional)
 *   - sourceIP: Source IP address (optional)
 *   - outcome: Event outcome (optional)
 *   - severity: Event severity (optional)
 *   - category: Event category (optional)
 *   - namespace: Kubernetes namespace (optional)
 *   - reason: Event reason (optional)
 *   - metadata: Additional metadata (optional)
 *   - riskScore: Risk score (optional)
 *   - complianceRelevant: Compliance relevance (optional)
 */
router.post(
  "/audit",
  safeAuth,
  safeAllowRoles("ADMIN", "MANAGER"),
  validateInput,
  async (req, res) => {
    try {
      const {
        eventType,
        action,
        resource,
        userId,
        username,
        sourceIP,
        userAgent,
        outcome,
        severity,
        category,
        namespace,
        reason,
        metadata,
        riskScore,
        complianceRelevant,
      } = req.body;

      if (!eventType || !action || !resource) {
        return res.status(400).json({
          success: false,
          error: "eventType, action, and resource are required",
        });
      }

      const event = await ComplianceService.recordAuditEvent({
        eventType,
        action,
        resource,
        userId,
        username,
        sourceIP: sourceIP || req.ip,
        userAgent: userAgent || req.get("User-Agent"),
        outcome,
        severity,
        category,
        namespace,
        reason,
        metadata,
        riskScore,
        complianceRelevant,
      });

      res.status(201).json({
        success: true,
        message: "Audit event recorded successfully",
        event: {
          id: event.id,
          eventType: event.eventType,
          action: event.action,
          resource: event.resource,
          outcome: event.outcome,
          severity: event.severity,
          timestamp: event.timestamp,
        },
      });
    } catch (error) {
      logger.error("[Compliance] Error recording audit event:", error);
      res.status(500).json({
        success: false,
        error: "Failed to record audit event",
      });
    }
  },
);

/**
 * GET /api/compliance/metrics/service
 * Get service metrics and performance stats
 */
router.get(
  "/metrics/service",
  safeAuth,
  safeRequireAdmin,
  validateInput,
  async (req, res) => {
    try {
      const serviceMetrics = ComplianceService.getServiceMetrics();

      res.json({
        success: true,
        metrics: serviceMetrics,
      });
    } catch (error) {
      logger.error("[Compliance] Error fetching service metrics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch service metrics",
      });
    }
  },
);

export default router;
export { setComplianceSocketIO };
