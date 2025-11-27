import { AuditEvent, ComplianceReport, PrismaClient } from "@prisma/client";
import { Server as SocketIOServer } from "socket.io";
import { winstonLogger as logger } from "../utils/winstonLogger";

const prisma = new PrismaClient();

// Socket.IO instance for real-time updates
let io: SocketIOServer | null = null;

export function setComplianceSocketIO(socketInstance: SocketIOServer) {
  io = socketInstance;
  logger.info("[ComplianceService] Socket.IO instance configured");
}

export interface ComplianceKPI {
  id: string;
  name: string;
  value: number;
  target: number;
  status: "critical" | "warning" | "good";
  trend: "up" | "down" | "stable";
  lastUpdated: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  unit: string;
  source: string;
}

export interface ComplianceKPISummary {
  totalKpis: number;
  criticalCount: number;
  warningCount: number;
  goodCount: number;
  overallScore: number;
  compliancePercentage: number;
  lastScan: string;
  nextScanScheduled: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  source: string;
  action: string;
  user: string;
  resource: string;
  namespace?: string;
  outcome: "success" | "failure" | "blocked";
  severity: "low" | "medium" | "high" | "critical";
  details: {
    sourceIP?: string;
    userAgent?: string;
    requestId?: string;
    reason?: string;
    metadata?: Record<string, any>;
  };
  category:
    | "authentication"
    | "authorization"
    | "deployment"
    | "access"
    | "configuration"
    | "security"
    | "compliance";
  complianceRelevant: boolean;
  riskScore: number;
}

export interface ComplianceHealthReport {
  status: "healthy" | "warning" | "critical";
  overallScore: number;
  kpiSummary: ComplianceKPISummary;
  criticalFindings: string[];
  recommendations: string[];
  lastAssessment: string;
  nextAssessment: string;
}

/**
 * Comprehensive Compliance Service for GitOps monitoring
 * Handles KPI calculation, audit log processing, report generation, and real-time updates
 */
export class ComplianceService {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static kpiCache = new Map<string, { data: any; timestamp: number }>();
  private static metrics: { total: number; cacheHits: number; avgMs: number } =
    {
      total: 0,
      cacheHits: 0,
      avgMs: 0,
    };

  /**
   * Get current compliance KPIs with caching
   */
  static async getKPIs(): Promise<{
    kpis: ComplianceKPI[];
    summary: ComplianceKPISummary;
  }> {
    const startTime = Date.now();
    const cacheKey = "compliance_kpis";

    // Check cache
    const cached = this.kpiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      this.metrics.cacheHits++;
      logger.debug("[ComplianceService] KPIs served from cache");
      return cached.data;
    }

    try {
      // Fetch compliance metrics from database
      const metrics = await prisma.complianceMetric.findMany({
        orderBy: { lastMeasured: "desc" },
        take: 50, // Recent metrics for KPI calculation
        include: {
          application: true,
          report: true,
        },
      });

      // Calculate KPIs
      const kpis = await this.calculateKPIs(metrics);
      const summary = this.calculateKPISummary(kpis);

      const result = { kpis, summary };

      // Cache result
      this.kpiCache.set(cacheKey, { data: result, timestamp: Date.now() });

      // Update metrics
      const duration = Date.now() - startTime;
      this.metrics.total++;
      this.metrics.avgMs =
        (this.metrics.avgMs * (this.metrics.total - 1) + duration) /
        this.metrics.total;

      logger.info(`[ComplianceService] KPIs calculated in ${duration}ms`);

      // Emit real-time update
      this.emitComplianceUpdate("kpis_updated", result);

      return result;
    } catch (error) {
      logger.error("[ComplianceService] Error fetching KPIs:", error);
      throw new Error("Failed to fetch compliance KPIs");
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(params: {
    page?: number;
    pageSize?: number;
    severity?: string;
    category?: string;
    outcome?: string;
    startDate?: Date;
    endDate?: Date;
    complianceRelevant?: boolean;
  }): Promise<{
    logs: AuditLogEntry[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
    summary: any;
    timeRange: { from: string; to: string };
  }> {
    const {
      page = 1,
      pageSize = 50,
      severity,
      category,
      outcome,
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Default: last 7 days
      endDate = new Date(),
      complianceRelevant,
    } = params;

    try {
      const where: any = {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (severity) where.severity = severity.toUpperCase();
      if (category) where.category = category.toUpperCase();
      if (outcome) where.outcome = outcome.toUpperCase();
      if (complianceRelevant !== undefined)
        where.complianceRelevant = complianceRelevant;

      const [auditEvents, total] = await Promise.all([
        prisma.auditEvent.findMany({
          where,
          orderBy: { timestamp: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            user: {
              select: { id: true, email: true, username: true },
            },
          },
        }),
        prisma.auditEvent.count({ where }),
      ]);

      // Transform to match frontend interface
      const logs: AuditLogEntry[] = auditEvents.map((event) => ({
        id: event.id,
        timestamp: event.timestamp.toISOString(),
        source: (event.metadata as any)?.source || "system",
        action: event.action,
        user: event.user?.username || event.username || "system",
        resource: event.resource,
        namespace: event.namespace || undefined,
        outcome: event.outcome.toLowerCase() as any,
        severity: event.severity.toLowerCase() as any,
        details: {
          sourceIP: event.sourceIP || undefined,
          userAgent: event.userAgent || undefined,
          requestId: event.requestId || undefined,
          reason: event.reason || undefined,
          metadata: event.metadata as Record<string, any>,
        },
        category: event.category.toLowerCase() as any,
        complianceRelevant: event.complianceRelevant,
        riskScore: event.riskScore,
      }));

      // Calculate summary statistics
      const summary = await this.calculateAuditSummary(where);

      const result = {
        logs,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
        summary,
        timeRange: {
          from: startDate.toISOString(),
          to: endDate.toISOString(),
        },
      };

      logger.info(`[ComplianceService] Retrieved ${logs.length} audit logs`);
      return result;
    } catch (error) {
      logger.error("[ComplianceService] Error fetching audit logs:", error);
      throw new Error("Failed to fetch audit logs");
    }
  }

  /**
   * Generate compliance report
   */
  static async generateReport(params: {
    reportType: string;
    title: string;
    description?: string;
    createdById: string;
    scheduledFor?: Date;
    dueDate?: Date;
    tags?: string[];
  }): Promise<ComplianceReport> {
    try {
      const reportData = await this.collectReportData(params.reportType);

      const report = await prisma.complianceReport.create({
        data: {
          title: params.title,
          description: params.description,
          reportType: params.reportType.toUpperCase() as any,
          status: "IN_PROGRESS",
          createdById: params.createdById,
          scheduledFor: params.scheduledFor,
          dueDate: params.dueDate,
          reportData: reportData,
          tags: params.tags || [],
          riskScore: reportData.riskScore || 0.0,
          complianceScore: reportData.complianceScore || 0.0,
        },
        include: {
          createdBy: {
            select: { id: true, email: true, username: true },
          },
        },
      });

      logger.info(`[ComplianceService] Generated report: ${report.id}`);

      // Emit real-time update
      this.emitComplianceUpdate("report_generated", {
        reportId: report.id,
        title: report.title,
        type: report.reportType,
      });

      return report;
    } catch (error) {
      logger.error("[ComplianceService] Error generating report:", error);
      throw new Error("Failed to generate compliance report");
    }
  }

  /**
   * Get compliance health report
   */
  static async getHealthReport(): Promise<ComplianceHealthReport> {
    try {
      const { kpis, summary } = await this.getKPIs();

      // Determine overall status
      let status: "healthy" | "warning" | "critical" = "healthy";
      if (summary.criticalCount > 0) status = "critical";
      else if (summary.warningCount > summary.goodCount) status = "warning";

      // Get critical findings
      const criticalFindings = kpis
        .filter((kpi) => kpi.status === "critical")
        .map(
          (kpi) =>
            `${kpi.name}: ${kpi.value}${kpi.unit} (Target: ${kpi.target}${kpi.unit})`,
        );

      // Generate recommendations
      const recommendations = await this.generateRecommendations(kpis);

      return {
        status,
        overallScore: summary.overallScore,
        kpiSummary: summary,
        criticalFindings,
        recommendations,
        lastAssessment: new Date().toISOString(),
        nextAssessment: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString(), // Next 24h
      };
    } catch (error) {
      logger.error(
        "[ComplianceService] Error generating health report:",
        error,
      );
      throw new Error("Failed to generate health report");
    }
  }

  /**
   * Record audit event
   */
  static async recordAuditEvent(event: {
    eventType: string;
    action: string;
    resource: string;
    userId?: string;
    username?: string;
    sourceIP?: string;
    userAgent?: string;
    outcome?: string;
    severity?: string;
    category?: string;
    namespace?: string;
    reason?: string;
    metadata?: Record<string, any>;
    riskScore?: number;
    complianceRelevant?: boolean;
  }): Promise<AuditEvent> {
    try {
      const auditEvent = await prisma.auditEvent.create({
        data: {
          eventType: event.eventType.toUpperCase() as any,
          action: event.action,
          resource: event.resource,
          userId: event.userId,
          username: event.username,
          sourceIP: event.sourceIP,
          userAgent: event.userAgent,
          outcome: (event.outcome || "SUCCESS").toUpperCase() as any,
          severity: (event.severity || "LOW").toUpperCase() as any,
          category: (event.category || "ACCESS").toUpperCase() as any,
          namespace: event.namespace,
          reason: event.reason,
          metadata: event.metadata,
          riskScore: event.riskScore || 0.0,
          complianceRelevant: event.complianceRelevant !== false, // Default true
        },
      });

      // Emit real-time update for high-severity events
      if (
        event.severity &&
        ["HIGH", "CRITICAL"].includes(event.severity.toUpperCase())
      ) {
        this.emitComplianceUpdate("audit_event", {
          eventId: auditEvent.id,
          severity: auditEvent.severity,
          action: auditEvent.action,
          resource: auditEvent.resource,
        });
      }

      return auditEvent;
    } catch (error) {
      logger.error("[ComplianceService] Error recording audit event:", error);
      throw new Error("Failed to record audit event");
    }
  }

  /**
   * Get service metrics
   */
  static getServiceMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.kpiCache.size,
      cacheHitRate:
        this.metrics.total > 0
          ? ((this.metrics.cacheHits / this.metrics.total) * 100).toFixed(2) +
            "%"
          : "0%",
    };
  }

  // Private helper methods
  private static async calculateKPIs(metrics: any[]): Promise<ComplianceKPI[]> {
    const kpiMap = new Map<string, ComplianceKPI>();

    metrics.forEach((metric) => {
      const kpi: ComplianceKPI = {
        id: metric.metricType.toLowerCase().replace(/_/g, "-"),
        name: metric.name || this.formatMetricName(metric.metricType),
        value: metric.value,
        target: metric.target || 100,
        status:
          metric.status === "COMPLIANT"
            ? "good"
            : metric.status === "NON_COMPLIANT"
              ? "critical"
              : "warning",
        trend: metric.trendDirection || "stable",
        lastUpdated: metric.lastMeasured.toISOString(),
        description:
          metric.description || `${metric.category} compliance metric`,
        severity: metric.severity.toLowerCase() as any,
        unit: metric.unit,
        source: metric.source,
      };

      kpiMap.set(kpi.id, kpi);
    });

    return Array.from(kpiMap.values());
  }

  private static calculateKPISummary(
    kpis: ComplianceKPI[],
  ): ComplianceKPISummary {
    const totalKpis = kpis.length;
    const criticalCount = kpis.filter(
      (kpi) => kpi.status === "critical",
    ).length;
    const warningCount = kpis.filter((kpi) => kpi.status === "warning").length;
    const goodCount = kpis.filter((kpi) => kpi.status === "good").length;

    // Calculate overall score (weighted by severity)
    const overallScore =
      totalKpis > 0 ? (goodCount * 100 + warningCount * 50) / totalKpis : 0;

    const compliancePercentage =
      totalKpis > 0 ? (goodCount / totalKpis) * 100 : 0;

    return {
      totalKpis,
      criticalCount,
      warningCount,
      goodCount,
      overallScore: Math.round(overallScore),
      compliancePercentage: Math.round(compliancePercentage),
      lastScan: new Date().toISOString(),
      nextScanScheduled: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // Next hour
    };
  }

  private static async calculateAuditSummary(where: any): Promise<any> {
    const [
      total,
      successCount,
      failureCount,
      blockedCount,
      criticalCount,
      highRiskCount,
      complianceRelevantCount,
    ] = await Promise.all([
      prisma.auditEvent.count({ where }),
      prisma.auditEvent.count({ where: { ...where, outcome: "SUCCESS" } }),
      prisma.auditEvent.count({ where: { ...where, outcome: "FAILURE" } }),
      prisma.auditEvent.count({ where: { ...where, outcome: "BLOCKED" } }),
      prisma.auditEvent.count({ where: { ...where, severity: "CRITICAL" } }),
      prisma.auditEvent.count({ where: { ...where, riskScore: { gte: 7.0 } } }),
      prisma.auditEvent.count({
        where: { ...where, complianceRelevant: true },
      }),
    ]);

    return {
      totalLogs: total,
      successCount,
      failureCount,
      blockedCount,
      criticalCount,
      highRiskCount,
      complianceRelevantCount,
    };
  }

  private static async collectReportData(reportType: string): Promise<any> {
    // Collect relevant data based on report type
    const data: any = {
      reportType,
      generatedAt: new Date().toISOString(),
      summary: {},
    };

    switch (reportType.toUpperCase()) {
      case "SECURITY_SCAN":
        data.securityMetrics = await this.getSecurityMetrics();
        data.riskScore = data.securityMetrics.avgRiskScore || 0.0;
        data.complianceScore = data.securityMetrics.compliancePercentage || 0.0;
        break;

      case "POLICY_AUDIT":
        data.policyMetrics = await this.getPolicyMetrics();
        data.riskScore = data.policyMetrics.avgRiskScore || 0.0;
        data.complianceScore = data.policyMetrics.compliancePercentage || 0.0;
        break;

      default:
        data.generalMetrics = await this.getGeneralMetrics();
        data.riskScore = 5.0;
        data.complianceScore = 75.0;
    }

    return data;
  }

  private static async getSecurityMetrics(): Promise<any> {
    const metrics = await prisma.complianceMetric.findMany({
      where: { category: "security" },
      orderBy: { lastMeasured: "desc" },
    });

    return {
      totalMetrics: metrics.length,
      avgRiskScore:
        metrics.reduce((sum, m) => sum + (m.value || 0), 0) / metrics.length ||
        0,
      compliancePercentage: 85.0,
    };
  }

  private static async getPolicyMetrics(): Promise<any> {
    const metrics = await prisma.complianceMetric.findMany({
      where: { category: "policy" },
      orderBy: { lastMeasured: "desc" },
    });

    return {
      totalMetrics: metrics.length,
      avgRiskScore:
        metrics.reduce((sum, m) => sum + (m.value || 0), 0) / metrics.length ||
        0,
      compliancePercentage: 92.0,
    };
  }

  private static async getGeneralMetrics(): Promise<any> {
    const totalMetrics = await prisma.complianceMetric.count();
    return {
      totalMetrics,
      avgRiskScore: 3.5,
      compliancePercentage: 88.0,
    };
  }

  private static async generateRecommendations(
    kpis: ComplianceKPI[],
  ): Promise<string[]> {
    const recommendations: string[] = [];

    const criticalKpis = kpis.filter((kpi) => kpi.status === "critical");
    const warningKpis = kpis.filter((kpi) => kpi.status === "warning");

    if (criticalKpis.length > 0) {
      recommendations.push(
        `Address ${criticalKpis.length} critical compliance issues immediately`,
      );
      recommendations.push("Review security policies and access controls");
    }

    if (warningKpis.length > 0) {
      recommendations.push(
        `Monitor ${warningKpis.length} metrics showing warning status`,
      );
      recommendations.push("Schedule compliance review within next 48 hours");
    }

    if (kpis.length === 0) {
      recommendations.push("Initialize compliance monitoring metrics");
      recommendations.push("Setup automated security scanning");
    }

    return recommendations;
  }

  private static formatMetricName(metricType: string): string {
    return metricType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  private static emitComplianceUpdate(eventType: string, data: any): void {
    if (io) {
      io.to("admin-compliance").emit(eventType, {
        timestamp: new Date().toISOString(),
        data,
      });
      logger.debug(
        `[ComplianceService] Emitted ${eventType} to admin-compliance room`,
      );
    }
  }
}

export default ComplianceService;
