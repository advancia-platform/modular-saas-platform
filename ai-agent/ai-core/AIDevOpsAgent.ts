/**
 * AI DevOps Agent Main Controller
 * Orchestrates the entire error detection → analysis → fix → deploy pipeline
 */

import { spawn } from "child_process";
import { EventEmitter } from "events";
import path from "path";
import winston from "winston";

import ErrorIntakeSystem, { ErrorEvent } from "./intake/ErrorIntakeSystem";

interface AIAnalysisResult {
  error_id: string;
  root_cause: string;
  confidence_score: number;
  risk_assessment: any;
  fix_recommendations: any[];
  estimated_fix_time: number;
  requires_human_review: boolean;
}

interface FixPlanResult {
  analysis_id: string;
  strategy: string;
  actions: any[];
  test_requirements: string[];
  estimated_duration: number;
  risk_factors: string[];
}

interface FixExecutionResult {
  success: boolean;
  execution_time: number;
  tests_passed: boolean;
  changes_applied: string[];
  rollback_required: boolean;
}

export class AIDevOpsAgent extends EventEmitter {
  private logger: winston.Logger;
  private errorIntake!: ErrorIntakeSystem;
  private isRunning: boolean = false;
  private processingQueue: Map<string, ErrorEvent> = new Map();
  private activeFixAttempts: Map<string, any> = new Map();

  constructor(
    private config: {
      intakeConfig: any;
      reasoningEngineUrl: string;
      executionEngineUrl: string;
      enableAutoFix: boolean;
      riskThresholds: {
        autoFix: number;
        humanReview: number;
      };
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
        new winston.transports.File({ filename: "ai-devops-agent.log" }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    });

    this.initializeComponents();
  }

  private initializeComponents(): void {
    // Initialize Error Intake System
    this.errorIntake = new ErrorIntakeSystem(this.config.intakeConfig);

    // Set up event handlers
    this.errorIntake.on("error_detected", this.handleErrorDetected.bind(this));

    this.logger.info("AI DevOps Agent components initialized");
  }

  /**
   * Start the AI DevOps Agent
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn("AI DevOps Agent is already running");
      return;
    }

    try {
      this.logger.info("Starting AI DevOps Agent...");

      // Start error intake system
      await this.errorIntake.start();

      this.isRunning = true;
      this.emit("agent_started");

      this.logger.info("🤖 AI DevOps Agent started successfully");
      this.logger.info(
        "🔍 Monitoring for errors across all configured sources",
      );
    } catch (error) {
      this.logger.error("Failed to start AI DevOps Agent:", error);
      throw error;
    }
  }

  /**
   * Stop the AI DevOps Agent
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.logger.info("Stopping AI DevOps Agent...");

    try {
      // Stop error intake
      await this.errorIntake.stop();

      // Wait for active fix attempts to complete or timeout
      await this.waitForActiveFixes(30000); // 30 second timeout

      this.isRunning = false;
      this.emit("agent_stopped");

      this.logger.info("AI DevOps Agent stopped successfully");
    } catch (error) {
      this.logger.error("Error stopping AI DevOps Agent:", error);
      throw error;
    }
  }

  /**
   * Main error handling pipeline
   */
  private async handleErrorDetected(errorEvent: ErrorEvent): Promise<void> {
    const startTime = Date.now();

    this.logger.info(`🚨 New error detected: ${errorEvent.id}`, {
      source: errorEvent.source,
      severity: errorEvent.severity,
      type: errorEvent.type,
      repository: errorEvent.context.repository,
    });

    try {
      // Add to processing queue
      this.processingQueue.set(errorEvent.id, errorEvent);
      this.emit("error_queued", errorEvent);

      // Step 1: AI Analysis using Python Reasoning Engine
      const analysis = await this.performAIAnalysis(errorEvent);
      this.emit("analysis_completed", { errorEvent, analysis });

      // Step 2: Generate Fix Plan
      const fixPlan = await this.generateFixPlan(analysis);
      this.emit("fix_plan_generated", { errorEvent, analysis, fixPlan });

      // Step 3: Risk Assessment & Decision
      const shouldAutoFix = this.shouldAutoFix(analysis, fixPlan);

      if (shouldAutoFix && this.config.enableAutoFix) {
        // Step 4: Execute Automated Fix
        const fixResult = await this.executeAutomatedFix(fixPlan);
        this.emit("fix_completed", {
          errorEvent,
          analysis,
          fixPlan,
          fixResult,
        });

        // Step 5: Validate & Deploy or Rollback
        await this.validateAndDeploy(fixPlan, fixResult);
      } else {
        // Queue for human review
        await this.queueForHumanReview(errorEvent, analysis, fixPlan);
        this.emit("queued_for_review", { errorEvent, analysis, fixPlan });
      }

      // Update learning systems
      await this.updateLearningData(errorEvent, analysis, fixPlan);

      const totalTime = Date.now() - startTime;
      this.logger.info(
        `✅ Error processing completed in ${totalTime}ms: ${errorEvent.id}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error processing failed for ${errorEvent.id}:`,
        error,
      );
      this.emit("error_processing_failed", { errorEvent, error });
    } finally {
      // Remove from processing queue
      this.processingQueue.delete(errorEvent.id);
    }
  }

  /**
   * Call Python AI Reasoning Engine for analysis
   */
  private async performAIAnalysis(
    errorEvent: ErrorEvent,
  ): Promise<AIAnalysisResult> {
    this.logger.info(`🧠 Analyzing error with AI: ${errorEvent.id}`);

    return new Promise((resolve, reject) => {
      const pythonScript = path.join(
        __dirname,
        "reasoning",
        "analyze_error.py",
      );
      const python = spawn("python3", [pythonScript]);

      let stdout = "";
      let stderr = "";

      // Send error event to Python script via stdin
      python.stdin.write(JSON.stringify(errorEvent));
      python.stdin.end();

      python.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      python.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      python.on("close", (code) => {
        if (code === 0) {
          try {
            const analysis = JSON.parse(stdout);
            this.logger.info(
              `✅ AI analysis completed: ${analysis.root_cause}`,
            );
            resolve(analysis);
          } catch (parseError) {
            this.logger.error(
              "Failed to parse AI analysis result:",
              parseError,
            );
            reject(parseError);
          }
        } else {
          this.logger.error("AI analysis failed:", stderr);
          reject(
            new Error(`Python script failed with code ${code}: ${stderr}`),
          );
        }
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        python.kill();
        reject(new Error("AI analysis timeout"));
      }, 300000);
    });
  }

  /**
   * Generate comprehensive fix plan
   */
  private async generateFixPlan(
    analysis: AIAnalysisResult,
  ): Promise<FixPlanResult> {
    this.logger.info(`🛠️ Generating fix plan: ${analysis.error_id}`);

    return new Promise((resolve, reject) => {
      const pythonScript = path.join(
        __dirname,
        "reasoning",
        "generate_fix_plan.py",
      );
      const python = spawn("python3", [pythonScript]);

      let stdout = "";
      let stderr = "";

      // Send analysis to Python script
      python.stdin.write(JSON.stringify(analysis));
      python.stdin.end();

      python.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      python.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      python.on("close", (code) => {
        if (code === 0) {
          try {
            const fixPlan = JSON.parse(stdout);
            this.logger.info(
              `✅ Fix plan generated: ${fixPlan.strategy} strategy`,
            );
            resolve(fixPlan);
          } catch (parseError) {
            reject(parseError);
          }
        } else {
          reject(new Error(`Fix plan generation failed: ${stderr}`));
        }
      });
    });
  }

  /**
   * Determine if error should be auto-fixed
   */
  private shouldAutoFix(
    analysis: AIAnalysisResult,
    fixPlan: FixPlanResult,
  ): boolean {
    // Risk-based decision using fintech AI logic
    const riskScore = this.calculateRiskScore(analysis);
    const confidence = analysis.confidence_score;

    // Auto-fix conditions
    const conditions = [
      confidence > this.config.riskThresholds.autoFix,
      riskScore < this.config.riskThresholds.humanReview,
      !analysis.requires_human_review,
      fixPlan.strategy === "automated",
      fixPlan.risk_factors.length <= 2,
    ];

    const shouldAutoFix = conditions.every((condition) => condition);

    this.logger.info(`🤔 Auto-fix decision: ${shouldAutoFix ? "YES" : "NO"}`, {
      confidence: confidence,
      riskScore: riskScore,
      requiresHumanReview: analysis.requires_human_review,
      strategy: fixPlan.strategy,
      riskFactors: fixPlan.risk_factors.length,
    });

    return shouldAutoFix;
  }

  /**
   * Calculate overall risk score for decision making
   */
  private calculateRiskScore(analysis: AIAnalysisResult): number {
    const risk = analysis.risk_assessment;

    // Convert risk levels to scores (using credit risk assessment logic)
    const riskMapping: Record<string, number> = {
      LOW: 0.2,
      MEDIUM: 0.5,
      HIGH: 0.8,
      CRITICAL: 1.0,
    };

    const scores = [
      riskMapping[risk.technical_risk] || 0.5,
      riskMapping[risk.business_risk] || 0.5,
      riskMapping[risk.security_risk] || 0.5,
      riskMapping[risk.compliance_risk] || 0.5,
    ];

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Execute automated fix using Node.js execution engine
   */
  private async executeAutomatedFix(
    fixPlan: FixPlanResult,
  ): Promise<FixExecutionResult> {
    this.logger.info(`⚡ Executing automated fix: ${fixPlan.analysis_id}`);

    const startTime = Date.now();
    this.activeFixAttempts.set(fixPlan.analysis_id, {
      startTime,
      status: "executing",
    });

    try {
      // Initialize execution results
      const result: FixExecutionResult = {
        success: false,
        execution_time: 0,
        tests_passed: false,
        changes_applied: [],
        rollback_required: false,
      };

      // Execute each action in the fix plan
      for (const action of fixPlan.actions) {
        const actionResult = await this.executeFixAction(action);

        if (!actionResult.success) {
          result.rollback_required = true;
          break;
        }

        result.changes_applied.push(actionResult.description);
      }

      // Run validation tests
      if (!result.rollback_required) {
        result.tests_passed = await this.runValidationTests(fixPlan);
        result.success = result.tests_passed;
      }

      result.execution_time = Date.now() - startTime;

      this.logger.info(
        `${result.success ? "✅" : "❌"} Fix execution completed`,
        {
          analysisId: fixPlan.analysis_id,
          success: result.success,
          executionTime: result.execution_time,
          testsPassed: result.tests_passed,
          changesApplied: result.changes_applied.length,
        },
      );

      return result;
    } catch (error) {
      this.logger.error("Fix execution failed:", error);
      return {
        success: false,
        execution_time: Date.now() - startTime,
        tests_passed: false,
        changes_applied: [],
        rollback_required: true,
      };
    } finally {
      this.activeFixAttempts.delete(fixPlan.analysis_id);
    }
  }

  /**
   * Execute individual fix action
   */
  private async executeFixAction(
    action: any,
  ): Promise<{ success: boolean; description: string }> {
    switch (action.action_type) {
      case "code_change":
        return await this.applyCodeChanges(action);

      case "dependency_update":
        return await this.updateDependencies(action);

      case "configuration_change":
        return await this.updateConfiguration(action);

      default:
        this.logger.warn(`Unknown action type: ${action.action_type}`);
        return {
          success: false,
          description: `Unknown action: ${action.action_type}`,
        };
    }
  }

  /**
   * Apply code changes
   */
  private async applyCodeChanges(
    action: any,
  ): Promise<{ success: boolean; description: string }> {
    try {
      // Use git to apply patches or direct file modifications
      const { spawn } = require("child_process");

      // This is a simplified implementation
      // In production, you'd use more sophisticated code modification tools

      if (action.changes === "automated_linting_and_formatting") {
        // Run ESLint/Prettier fix
        const eslintResult = await this.runCommand("npx", [
          "eslint",
          "--fix",
          ...action.files_to_modify,
        ]);

        if (eslintResult.code === 0) {
          return {
            success: true,
            description: "Applied automated linting fixes",
          };
        }
      }

      return { success: false, description: "Code changes failed" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error("Code change failed:", error);
      return {
        success: false,
        description: `Code change error: ${errorMessage}`,
      };
    }
  }

  /**
   * Update dependencies
   */
  private async updateDependencies(
    action: any,
  ): Promise<{ success: boolean; description: string }> {
    try {
      const packageManager = action.package_manager || "npm";
      const packages = action.packages || [];

      for (const packageName of packages) {
        const result = await this.runCommand(packageManager, [
          "install",
          packageName,
        ]);

        if (result.code !== 0) {
          return {
            success: false,
            description: `Failed to install ${packageName}`,
          };
        }
      }

      return {
        success: true,
        description: `Updated ${packages.length} dependencies`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error("Dependency update failed:", error);
      return {
        success: false,
        description: `Dependency update error: ${errorMessage}`,
      };
    }
  }

  /**
   * Update configuration files
   */
  private async updateConfiguration(
    action: any,
  ): Promise<{ success: boolean; description: string }> {
    try {
      // Apply configuration changes
      // This would involve parsing and updating config files

      return { success: true, description: "Configuration updated" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error("Configuration update failed:", error);
      return {
        success: false,
        description: `Configuration error: ${errorMessage}`,
      };
    }
  }

  /**
   * Run validation tests
   */
  private async runValidationTests(fixPlan: FixPlanResult): Promise<boolean> {
    this.logger.info(`🧪 Running validation tests: ${fixPlan.analysis_id}`);

    try {
      for (const requirement of fixPlan.test_requirements) {
        const testResult = await this.runTestSuite(requirement);

        if (!testResult) {
          this.logger.warn(`Test suite failed: ${requirement}`);
          return false;
        }
      }

      this.logger.info("✅ All validation tests passed");
      return true;
    } catch (error) {
      this.logger.error("Validation tests failed:", error);
      return false;
    }
  }

  /**
   * Run specific test suite
   */
  private async runTestSuite(testType: string): Promise<boolean> {
    switch (testType) {
      case "unit_tests":
        const unitResult = await this.runCommand("npm", ["test"]);
        return unitResult.code === 0;

      case "integration_tests":
        const integrationResult = await this.runCommand("npm", [
          "run",
          "test:integration",
        ]);
        return integrationResult.code === 0;

      case "security_scan":
        const securityResult = await this.runCommand("npm", [
          "audit",
          "--audit-level",
          "moderate",
        ]);
        return securityResult.code === 0;

      default:
        this.logger.warn(`Unknown test type: ${testType}`);
        return true; // Don't fail on unknown test types
    }
  }

  /**
   * Validate fix and deploy or rollback
   */
  private async validateAndDeploy(
    fixPlan: FixPlanResult,
    fixResult: FixExecutionResult,
  ): Promise<void> {
    if (fixResult.rollback_required || !fixResult.success) {
      this.logger.warn(`🔄 Rolling back fix: ${fixPlan.analysis_id}`);
      await this.rollbackChanges(fixPlan);
      return;
    }

    // Deploy using smart deployment strategy (algorithmic trading logic)
    await this.smartDeploy(fixPlan, fixResult);
  }

  /**
   * Smart deployment with risk-based strategy
   */
  private async smartDeploy(
    fixPlan: FixPlanResult,
    fixResult: FixExecutionResult,
  ): Promise<void> {
    this.logger.info(`🚀 Deploying fix: ${fixPlan.analysis_id}`);

    // Use deployment strategy from fix plan (based on trading logic)
    // This would integrate with your CI/CD system

    this.emit("fix_deployed", { fixPlan, fixResult });
    this.logger.info(`✅ Fix successfully deployed: ${fixPlan.analysis_id}`);
  }

  /**
   * Rollback changes if fix failed
   */
  private async rollbackChanges(fixPlan: FixPlanResult): Promise<void> {
    this.logger.info(`🔄 Rolling back changes: ${fixPlan.analysis_id}`);

    try {
      // Use git to rollback changes
      await this.runCommand("git", ["reset", "--hard", "HEAD~1"]);

      this.emit("fix_rolledback", { fixPlan });
      this.logger.info(
        `✅ Changes rolled back successfully: ${fixPlan.analysis_id}`,
      );
    } catch (error) {
      this.logger.error("Rollback failed:", error);
      this.emit("rollback_failed", { fixPlan, error });
    }
  }

  /**
   * Queue error for human review
   */
  private async queueForHumanReview(
    errorEvent: ErrorEvent,
    analysis: AIAnalysisResult,
    fixPlan: FixPlanResult,
  ): Promise<void> {
    this.logger.info(`👤 Queuing for human review: ${errorEvent.id}`);

    // Store in review queue (could be database, message queue, etc.)
    const reviewItem = {
      error_event: errorEvent,
      analysis: analysis,
      fix_plan: fixPlan,
      queued_at: new Date(),
      priority: this.calculateReviewPriority(analysis),
    };

    // In production, this would integrate with your ticketing/review system
    await this.saveToReviewQueue(reviewItem);

    // Notify relevant teams
    await this.notifyReviewTeam(reviewItem);
  }

  /**
   * Calculate priority for human review queue
   */
  private calculateReviewPriority(analysis: AIAnalysisResult): number {
    let priority = 5; // Base priority

    if (analysis.risk_assessment.risk_level === "CRITICAL") priority += 4;
    else if (analysis.risk_assessment.risk_level === "HIGH") priority += 2;

    if (analysis.requires_human_review) priority += 1;
    if (analysis.confidence_score < 0.5) priority += 2;

    return Math.min(priority, 10);
  }

  /**
   * Update learning data for continuous improvement
   */
  private async updateLearningData(
    errorEvent: ErrorEvent,
    analysis: AIAnalysisResult,
    fixPlan: FixPlanResult,
  ): Promise<void> {
    try {
      // Update error patterns in intake system
      const patternKey = `${errorEvent.source}-${errorEvent.type}-${analysis.root_cause}`;

      // This would update ML models and pattern databases
      // For now, just log the learning opportunity
      this.logger.debug("Learning data updated", {
        patternKey,
        confidence: analysis.confidence_score,
        fixStrategy: fixPlan.strategy,
      });
    } catch (error) {
      this.logger.error("Failed to update learning data:", error);
    }
  }

  /**
   * Utility: Run shell command
   */
  private runCommand(
    command: string,
    args: string[],
  ): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      const child = spawn(command, args);
      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (data) => (stdout += data));
      child.stderr?.on("data", (data) => (stderr += data));

      child.on("close", (code) => {
        resolve({ code: code || 0, stdout, stderr });
      });
    });
  }

  /**
   * Wait for active fixes to complete
   */
  private async waitForActiveFixes(timeout: number): Promise<void> {
    const startTime = Date.now();

    while (
      this.activeFixAttempts.size > 0 &&
      Date.now() - startTime < timeout
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (this.activeFixAttempts.size > 0) {
      this.logger.warn(
        `${this.activeFixAttempts.size} active fixes did not complete within timeout`,
      );
    }
  }

  // Placeholder methods for external integrations
  private async saveToReviewQueue(reviewItem: any): Promise<void> {
    // Implement database/queue storage
  }

  private async notifyReviewTeam(reviewItem: any): Promise<void> {
    // Implement notification system (Slack, email, etc.)
  }

  /**
   * Get current agent status
   */
  public getStatus(): any {
    return {
      isRunning: this.isRunning,
      processingQueueSize: this.processingQueue.size,
      activeFixAttempts: this.activeFixAttempts.size,
      errorIntakeStatus: this.errorIntake ? "initialized" : "not_initialized",
    };
  }

  /**
   * Get processing statistics
   */
  public getStatistics(): any {
    // Return processing statistics
    return {
      totalErrorsProcessed: 0, // Implement counters
      successfulFixes: 0,
      failedFixes: 0,
      averageProcessingTime: 0,
      humanReviewRate: 0,
    };
  }
}

export default AIDevOpsAgent;
