/**
 * Error Intake and Normalization System
 * Collects errors from multiple sources and normalizes them for AI processing
 */

import { EventEmitter } from "events";
import winston from "winston";

export interface ErrorEvent {
  id: string;
  timestamp: Date;
  source: "ci_cd" | "runtime" | "monitoring" | "user_report" | "security_scan";
  severity: "low" | "medium" | "high" | "critical";
  type: "compilation" | "runtime" | "security" | "performance" | "compliance";
  context: {
    repository: string;
    branch: string;
    commit: string;
    file?: string;
    line?: number;
    stackTrace?: string;
    environment: "development" | "staging" | "production";
    userId?: string;
    buildId?: string;
    deploymentId?: string;
  };
  rawError: any;
  metadata: {
    tags: string[];
    priority: number;
    autoFixable: boolean;
    estimatedImpact: "low" | "medium" | "high";
  };
}

export interface ErrorPattern {
  pattern: string;
  frequency: number;
  lastSeen: Date;
  successfulFixes: number;
  failedFixes: number;
  avgFixTime: number;
}

export class ErrorIntakeSystem extends EventEmitter {
  private logger: winston.Logger;
  private errorHistory: Map<string, ErrorEvent[]> = new Map();
  private patterns: Map<string, ErrorPattern> = new Map();
  private activeMonitors: Map<string, any> = new Map();

  constructor(
    private config: {
      githubToken?: string;
      sentryDsn?: string;
      prometheusUrl?: string;
      socketUrl?: string;
    },
  ) {
    super();

    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.File({ filename: "error-intake.log" }),
        new winston.transports.Console(),
      ],
    });

    this.initializeMonitors();
  }

  private initializeMonitors(): void {
    // Initialize various error source monitors
    this.setupCICDMonitor();
    this.setupRuntimeMonitor();
    this.setupMonitoringIntegration();
    this.setupSecurityScanMonitor();
  }

  /**
   * Setup CI/CD pipeline monitoring (GitHub Actions, GitLab CI, etc.)
   */
  private setupCICDMonitor(): void {
    // GitHub Actions webhook listener
    if (this.config.githubToken) {
      const githubMonitor = {
        type: "github_actions",
        webhook: "/webhooks/github",
        handler: this.handleGitHubWebhook.bind(this),
      };

      this.activeMonitors.set("github", githubMonitor);
      this.logger.info("GitHub Actions monitor initialized");
    }
  }

  /**
   * Setup runtime error monitoring (Sentry, application logs, etc.)
   */
  private setupRuntimeMonitor(): void {
    if (this.config.sentryDsn) {
      // Sentry integration for runtime errors
      const sentryMonitor = {
        type: "sentry",
        dsn: this.config.sentryDsn,
        handler: this.handleSentryError.bind(this),
      };

      this.activeMonitors.set("sentry", sentryMonitor);
      this.logger.info("Sentry runtime monitor initialized");
    }
  }

  /**
   * Setup monitoring system integration (Prometheus, Grafana alerts)
   */
  private setupMonitoringIntegration(): void {
    if (this.config.prometheusUrl) {
      const prometheusMonitor = {
        type: "prometheus",
        url: this.config.prometheusUrl,
        handler: this.handlePrometheusAlert.bind(this),
      };

      this.activeMonitors.set("prometheus", prometheusMonitor);
      this.logger.info("Prometheus monitoring integration initialized");
    }
  }

  /**
   * Setup security scan monitoring
   */
  private setupSecurityScanMonitor(): void {
    const securityMonitor = {
      type: "security_scan",
      sources: ["dependabot", "codeql", "snyk"],
      handler: this.handleSecurityAlert.bind(this),
    };

    this.activeMonitors.set("security", securityMonitor);
    this.logger.info("Security scan monitor initialized");
  }

  /**
   * Handle GitHub Actions webhook events
   */
  private async handleGitHubWebhook(payload: any): Promise<void> {
    try {
      if (payload.action === "completed" && payload.conclusion === "failure") {
        const errorEvent = this.normalizeGitHubError(payload);
        await this.processError(errorEvent);
      }
    } catch (error) {
      this.logger.error("Error handling GitHub webhook:", error);
    }
  }

  /**
   * Handle Sentry runtime errors
   */
  private async handleSentryError(sentryEvent: any): Promise<void> {
    try {
      const errorEvent = this.normalizeSentryError(sentryEvent);
      await this.processError(errorEvent);
    } catch (error) {
      this.logger.error("Error handling Sentry event:", error);
    }
  }

  /**
   * Handle Prometheus alerts
   */
  private async handlePrometheusAlert(alert: any): Promise<void> {
    try {
      const errorEvent = this.normalizePrometheusAlert(alert);
      await this.processError(errorEvent);
    } catch (error) {
      this.logger.error("Error handling Prometheus alert:", error);
    }
  }

  /**
   * Handle security scan alerts
   */
  private async handleSecurityAlert(alert: any): Promise<void> {
    try {
      const errorEvent = this.normalizeSecurityAlert(alert);
      await this.processError(errorEvent);
    } catch (error) {
      this.logger.error("Error handling security alert:", error);
    }
  }

  /**
   * Normalize GitHub Actions failure into standard ErrorEvent format
   */
  private normalizeGitHubError(payload: any): ErrorEvent {
    const workflowRun = payload.workflow_run;
    const repository = workflowRun.repository;

    return {
      id: `github-${workflowRun.id}`,
      timestamp: new Date(workflowRun.updated_at),
      source: "ci_cd",
      severity: this.calculateSeverity(payload),
      type: "compilation",
      context: {
        repository: repository.full_name,
        branch: workflowRun.head_branch,
        commit: workflowRun.head_sha,
        environment: this.detectEnvironment(workflowRun.head_branch),
        buildId: workflowRun.id.toString(),
      },
      rawError: payload,
      metadata: {
        tags: ["ci/cd", "github-actions", workflowRun.name],
        priority: this.calculatePriority(payload),
        autoFixable: this.assessAutoFixability(payload),
        estimatedImpact: this.estimateImpact(payload),
      },
    };
  }

  /**
   * Normalize Sentry error into standard ErrorEvent format
   */
  private normalizeSentryError(sentryEvent: any): ErrorEvent {
    return {
      id: `sentry-${sentryEvent.id}`,
      timestamp: new Date(sentryEvent.timestamp),
      source: "runtime",
      severity: this.mapSentryLevel(sentryEvent.level),
      type: "runtime",
      context: {
        repository: sentryEvent.tags?.repository || "unknown",
        branch: sentryEvent.tags?.branch || "unknown",
        commit: sentryEvent.tags?.commit || "unknown",
        file: sentryEvent.culprit,
        line: sentryEvent.exception?.[0]?.stacktrace?.frames?.[0]?.lineno,
        stackTrace: this.extractStackTrace(sentryEvent),
        environment: sentryEvent.environment || "production",
        userId: sentryEvent.user?.id,
      },
      rawError: sentryEvent,
      metadata: {
        tags: ["runtime", "sentry", ...(sentryEvent.tags || [])],
        priority: this.calculateSentryPriority(sentryEvent),
        autoFixable: this.assessSentryAutoFixability(sentryEvent),
        estimatedImpact: this.estimateSentryImpact(sentryEvent),
      },
    };
  }

  /**
   * Normalize Prometheus alert into standard ErrorEvent format
   */
  private normalizePrometheusAlert(alert: any): ErrorEvent {
    return {
      id: `prometheus-${alert.fingerprint}`,
      timestamp: new Date(alert.startsAt),
      source: "monitoring",
      severity: this.mapPrometheusSeverity(alert.labels.severity),
      type: "performance",
      context: {
        repository: alert.labels.repository || "unknown",
        branch: alert.labels.branch || "main",
        commit: alert.labels.commit || "unknown",
        environment: alert.labels.environment || "production",
      },
      rawError: alert,
      metadata: {
        tags: ["monitoring", "prometheus", alert.labels.alertname],
        priority: this.calculatePrometheusPriority(alert),
        autoFixable: this.assessPrometheusAutoFixability(alert),
        estimatedImpact: this.estimatePrometheusImpact(alert),
      },
    };
  }

  /**
   * Normalize security scan alert into standard ErrorEvent format
   */
  private normalizeSecurityAlert(alert: any): ErrorEvent {
    return {
      id: `security-${alert.id || Date.now()}`,
      timestamp: new Date(alert.created_at || Date.now()),
      source: "security_scan",
      severity: this.mapSecuritySeverity(alert.severity),
      type: "security",
      context: {
        repository: alert.repository?.full_name || "unknown",
        branch: alert.ref || "main",
        commit: alert.commit_sha || "unknown",
        file: alert.most_recent_instance?.location?.path,
        line: alert.most_recent_instance?.location?.start_line,
        environment: "development",
      },
      rawError: alert,
      metadata: {
        tags: ["security", alert.tool?.name, alert.rule?.id],
        priority: this.calculateSecurityPriority(alert),
        autoFixable: this.assessSecurityAutoFixability(alert),
        estimatedImpact: this.estimateSecurityImpact(alert),
      },
    };
  }

  /**
   * Process normalized error event
   */
  private async processError(errorEvent: ErrorEvent): Promise<void> {
    try {
      // Store in history
      this.storeErrorEvent(errorEvent);

      // Update patterns
      this.updatePatterns(errorEvent);

      // Emit for AI processing
      this.emit("error_detected", errorEvent);

      // Log the processed error
      this.logger.info("Error processed:", {
        id: errorEvent.id,
        source: errorEvent.source,
        severity: errorEvent.severity,
        type: errorEvent.type,
      });
    } catch (error) {
      this.logger.error("Error processing error event:", error);
    }
  }

  /**
   * Store error event in history
   */
  private storeErrorEvent(errorEvent: ErrorEvent): void {
    const key = `${errorEvent.context.repository}-${errorEvent.type}`;

    if (!this.errorHistory.has(key)) {
      this.errorHistory.set(key, []);
    }

    const history = this.errorHistory.get(key)!;
    history.push(errorEvent);

    // Keep only last 1000 errors per key
    if (history.length > 1000) {
      history.shift();
    }
  }

  /**
   * Update error patterns for learning
   */
  private updatePatterns(errorEvent: ErrorEvent): void {
    const patternKey = this.extractPattern(errorEvent);

    if (!this.patterns.has(patternKey)) {
      this.patterns.set(patternKey, {
        pattern: patternKey,
        frequency: 0,
        lastSeen: new Date(),
        successfulFixes: 0,
        failedFixes: 0,
        avgFixTime: 0,
      });
    }

    const pattern = this.patterns.get(patternKey)!;
    pattern.frequency++;
    pattern.lastSeen = errorEvent.timestamp;
  }

  /**
   * Extract error pattern for classification
   */
  private extractPattern(errorEvent: ErrorEvent): string {
    const components = [
      errorEvent.source,
      errorEvent.type,
      errorEvent.severity,
      this.extractErrorSignature(errorEvent),
    ];

    return components.join("|");
  }

  /**
   * Extract error signature from raw error data
   */
  private extractErrorSignature(errorEvent: ErrorEvent): string {
    // Simple signature extraction - can be enhanced with ML
    if (errorEvent.context.stackTrace) {
      const lines = errorEvent.context.stackTrace.split("\n");
      return lines[0]?.substring(0, 100) || "unknown";
    }

    return errorEvent.rawError?.message?.substring(0, 100) || "unknown";
  }

  // Utility methods for severity, priority, and impact assessment
  private calculateSeverity(payload: any): ErrorEvent["severity"] {
    // Logic to determine severity based on error context
    if (payload.workflow_run?.name?.includes("production")) return "critical";
    if (payload.workflow_run?.name?.includes("staging")) return "high";
    return "medium";
  }

  private calculatePriority(payload: any): number {
    // Priority scoring (1-10, higher = more urgent)
    let priority = 5;

    if (payload.workflow_run?.name?.includes("production")) priority += 3;
    if (payload.workflow_run?.name?.includes("security")) priority += 2;
    if (payload.workflow_run?.name?.includes("deploy")) priority += 1;

    return Math.min(priority, 10);
  }

  private assessAutoFixability(payload: any): boolean {
    // Simple heuristics - can be enhanced with ML
    const autoFixablePatterns = [
      "lint",
      "format",
      "dependency",
      "test",
      "compile",
    ];

    const workflowName = payload.workflow_run?.name?.toLowerCase() || "";
    return autoFixablePatterns.some((pattern) =>
      workflowName.includes(pattern),
    );
  }

  private estimateImpact(
    payload: any,
  ): ErrorEvent["metadata"]["estimatedImpact"] {
    if (payload.workflow_run?.name?.includes("production")) return "high";
    if (payload.workflow_run?.name?.includes("staging")) return "medium";
    return "low";
  }

  private mapSentryLevel(level: string): ErrorEvent["severity"] {
    const mapping: Record<string, ErrorEvent["severity"]> = {
      fatal: "critical",
      error: "high",
      warning: "medium",
      info: "low",
    };

    return mapping[level] || "medium";
  }

  private extractStackTrace(sentryEvent: any): string {
    if (sentryEvent.exception?.[0]?.stacktrace?.frames) {
      return sentryEvent.exception[0].stacktrace.frames
        .map(
          (frame: any) =>
            `${frame.filename}:${frame.lineno} in ${frame.function}`,
        )
        .join("\n");
    }

    return sentryEvent.message || "No stack trace available";
  }

  private detectEnvironment(
    branch: string,
  ): ErrorEvent["context"]["environment"] {
    if (
      branch.includes("main") ||
      branch.includes("master") ||
      branch.includes("prod")
    ) {
      return "production";
    }
    if (branch.includes("staging") || branch.includes("stage")) {
      return "staging";
    }
    return "development";
  }

  private calculateSentryPriority(sentryEvent: any): number {
    let priority = 5;

    if (sentryEvent.level === "fatal") priority += 4;
    else if (sentryEvent.level === "error") priority += 2;
    else if (sentryEvent.level === "warning") priority += 1;

    if (sentryEvent.user?.id) priority += 1; // User-affecting error
    if (sentryEvent.tags?.critical === "true") priority += 2;

    return Math.min(priority, 10);
  }

  private assessSentryAutoFixability(sentryEvent: any): boolean {
    const autoFixableErrorTypes = [
      "TypeError",
      "ReferenceError",
      "SyntaxError",
      "ImportError",
    ];

    const errorType = sentryEvent.exception?.[0]?.type || "";
    return autoFixableErrorTypes.includes(errorType);
  }

  private estimateSentryImpact(
    sentryEvent: any,
  ): ErrorEvent["metadata"]["estimatedImpact"] {
    if (sentryEvent.level === "fatal") return "high";
    if (sentryEvent.user?.id) return "medium"; // Affects users
    return "low";
  }

  private mapPrometheusSeverity(severity: string): ErrorEvent["severity"] {
    const mapping: Record<string, ErrorEvent["severity"]> = {
      critical: "critical",
      warning: "high",
      info: "medium",
    };

    return mapping[severity] || "medium";
  }

  private mapSecuritySeverity(severity: string): ErrorEvent["severity"] {
    const mapping: Record<string, ErrorEvent["severity"]> = {
      high: "critical",
      medium: "high",
      low: "medium",
      note: "low",
    };

    return mapping[severity] || "medium";
  }

  private calculatePrometheusPriority(alert: any): number {
    return this.mapPrometheusSeverity(alert.labels.severity) === "critical"
      ? 8
      : 5;
  }

  private calculateSecurityPriority(alert: any): number {
    return this.mapSecuritySeverity(alert.severity) === "critical" ? 9 : 6;
  }

  private assessPrometheusAutoFixability(alert: any): boolean {
    // Performance alerts might be auto-fixable with scaling/config changes
    const autoFixableAlerts = ["high_cpu", "high_memory", "disk_space"];
    return autoFixableAlerts.some((pattern) =>
      alert.labels.alertname.toLowerCase().includes(pattern),
    );
  }

  private assessSecurityAutoFixability(alert: any): boolean {
    // Some security issues can be auto-fixed (dependency updates, config changes)
    return (
      alert.rule?.id?.includes("dependency") ||
      alert.tool?.name === "dependabot"
    );
  }

  private estimatePrometheusImpact(
    alert: any,
  ): ErrorEvent["metadata"]["estimatedImpact"] {
    return alert.labels.severity === "critical" ? "high" : "medium";
  }

  private estimateSecurityImpact(
    alert: any,
  ): ErrorEvent["metadata"]["estimatedImpact"] {
    return this.mapSecuritySeverity(alert.severity) === "critical"
      ? "high"
      : "medium";
  }

  /**
   * Get error history for a specific repository/type combination
   */
  public getErrorHistory(repository: string, type?: string): ErrorEvent[] {
    if (type) {
      const key = `${repository}-${type}`;
      return this.errorHistory.get(key) || [];
    }

    const allHistory: ErrorEvent[] = [];
    for (const [key, history] of this.errorHistory) {
      if (key.startsWith(repository)) {
        allHistory.push(...history);
      }
    }

    return allHistory.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  /**
   * Get error patterns for analysis
   */
  public getErrorPatterns(): Map<string, ErrorPattern> {
    return new Map(this.patterns);
  }

  /**
   * Update pattern with fix result for learning
   */
  public updatePatternResult(
    patternKey: string,
    success: boolean,
    fixTime: number,
  ): void {
    const pattern = this.patterns.get(patternKey);
    if (!pattern) return;

    if (success) {
      pattern.successfulFixes++;
    } else {
      pattern.failedFixes++;
    }

    // Update average fix time
    const totalFixes = pattern.successfulFixes + pattern.failedFixes;
    pattern.avgFixTime =
      (pattern.avgFixTime * (totalFixes - 1) + fixTime) / totalFixes;
  }

  /**
   * Start monitoring all configured sources
   */
  public async start(): Promise<void> {
    this.logger.info("Starting Error Intake System");

    for (const [name, monitor] of this.activeMonitors) {
      try {
        // Initialize each monitor based on its type
        await this.initializeMonitor(monitor);
        this.logger.info(`${name} monitor started successfully`);
      } catch (error) {
        this.logger.error(`Failed to start ${name} monitor:`, error);
      }
    }

    this.logger.info("Error Intake System started successfully");
  }

  /**
   * Stop monitoring and cleanup
   */
  public async stop(): Promise<void> {
    this.logger.info("Stopping Error Intake System");

    for (const [name, monitor] of this.activeMonitors) {
      try {
        // Cleanup monitor resources
        await this.cleanupMonitor(monitor);
        this.logger.info(`${name} monitor stopped successfully`);
      } catch (error) {
        this.logger.error(`Error stopping ${name} monitor:`, error);
      }
    }

    this.activeMonitors.clear();
    this.logger.info("Error Intake System stopped");
  }

  private async initializeMonitor(monitor: any): Promise<void> {
    // Monitor-specific initialization logic
    switch (monitor.type) {
      case "github_actions":
        // Setup GitHub webhook listener
        break;
      case "sentry":
        // Initialize Sentry SDK
        break;
      case "prometheus":
        // Setup Prometheus alert webhook
        break;
      case "security_scan":
        // Initialize security scan integrations
        break;
    }
  }

  private async cleanupMonitor(monitor: any): Promise<void> {
    // Monitor-specific cleanup logic
    // Close connections, remove listeners, etc.
  }
}

export default ErrorIntakeSystem;
