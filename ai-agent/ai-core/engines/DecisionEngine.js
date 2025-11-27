/**
 * AI Decision Engine
 *
 * Makes intelligent decisions about threat responses, automated actions,
 * and security policy enforcement based on analysis results.
 */

const EventEmitter = require("events");

class DecisionEngine extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      autoResponseEnabled: config.autoResponseEnabled || false,
      riskTolerance: config.riskTolerance || "medium",
      maxAutomatedActions: config.maxAutomatedActions || 10,
      cooldownPeriod: config.cooldownPeriod || 300000, // 5 minutes
      ...config,
    };

    // Decision rules and policies
    this.decisionRules = new Map();
    this.actionHistory = [];
    this.activeCooldowns = new Map();

    // Risk tolerance levels
    this.riskThresholds = {
      low: { critical: 0.3, high: 0.5, medium: 0.7, low: 0.9 },
      medium: { critical: 0.6, high: 0.7, medium: 0.8, low: 0.95 },
      high: { critical: 0.8, high: 0.85, medium: 0.9, low: 0.98 },
    };

    // Available actions
    this.availableActions = {
      block_ip: {
        type: "network",
        automated: true,
        reversible: true,
        impact: "medium",
        cooldown: 60000, // 1 minute
      },
      isolate_system: {
        type: "system",
        automated: true,
        reversible: true,
        impact: "high",
        cooldown: 300000, // 5 minutes
      },
      alert_admin: {
        type: "notification",
        automated: true,
        reversible: false,
        impact: "low",
        cooldown: 10000, // 10 seconds
      },
      update_firewall: {
        type: "network",
        automated: true,
        reversible: true,
        impact: "medium",
        cooldown: 120000, // 2 minutes
      },
      scan_system: {
        type: "security",
        automated: true,
        reversible: false,
        impact: "low",
        cooldown: 600000, // 10 minutes
      },
      backup_data: {
        type: "data",
        automated: true,
        reversible: false,
        impact: "low",
        cooldown: 1800000, // 30 minutes
      },
      shutdown_service: {
        type: "system",
        automated: false,
        reversible: true,
        impact: "critical",
        cooldown: 900000, // 15 minutes
      },
      forensic_capture: {
        type: "investigation",
        automated: false,
        reversible: false,
        impact: "medium",
        cooldown: 300000, // 5 minutes
      },
    };
  }

  async initialize() {
    console.log("🧠 Initializing Decision Engine...");

    // Load decision rules
    await this.loadDecisionRules();

    // Initialize decision tree
    this.buildDecisionTree();

    console.log("✅ Decision Engine ready");
  }

  /**
   * Main decision-making method
   */
  async makeDecision(analysis) {
    const decisionId = `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const decision = {
        decisionId: decisionId,
        timestamp: new Date(),
        analysisId: analysis.analysisId,
        riskScore: analysis.riskScore,
        severity: analysis.threat?.severity || "low",
        confidence: analysis.mlConfidence || 0.5,
        actions: [],
        reasoning: [],
        autoExecute: false,
      };

      // Apply decision rules
      await this.applyDecisionRules(analysis, decision);

      // Risk-based decision making
      await this.applyRiskBasedDecisions(analysis, decision);

      // Context-aware adjustments
      await this.applyContextualAdjustments(analysis, decision);

      // Validate and prioritize actions
      this.validateAndPrioritizeActions(decision);

      // Determine if auto-execution is appropriate
      this.determineAutoExecution(decision);

      // Log decision
      this.logDecision(decision);

      this.emit("decision-made", decision);

      return decision;
    } catch (error) {
      console.error(`Decision making failed for ${decisionId}:`, error);
      throw error;
    }
  }

  /**
   * Apply rule-based decision logic
   */
  async applyDecisionRules(analysis, decision) {
    const threats = analysis.threats || [];

    for (const threat of threats) {
      const rules = this.decisionRules.get(threat.type) || [];

      for (const rule of rules) {
        if (this.evaluateRule(rule, threat, analysis)) {
          decision.actions.push(...rule.actions);
          decision.reasoning.push(`Rule triggered: ${rule.name}`);
        }
      }
    }

    // Severity-based rules
    switch (analysis.severity) {
      case "critical":
        decision.actions.push(
          { action: "alert_admin", priority: "urgent", confidence: 1.0 },
          { action: "isolate_system", priority: "urgent", confidence: 0.9 },
          { action: "forensic_capture", priority: "high", confidence: 0.8 },
        );
        decision.reasoning.push(
          "Critical severity triggers isolation and admin alert",
        );
        break;

      case "high":
        decision.actions.push(
          { action: "alert_admin", priority: "high", confidence: 1.0 },
          { action: "scan_system", priority: "high", confidence: 0.8 },
        );
        decision.reasoning.push(
          "High severity triggers admin alert and system scan",
        );
        break;

      case "medium":
        decision.actions.push(
          { action: "alert_admin", priority: "medium", confidence: 0.8 },
          { action: "update_firewall", priority: "medium", confidence: 0.7 },
        );
        decision.reasoning.push(
          "Medium severity triggers monitoring enhancement",
        );
        break;

      case "low":
        decision.actions.push({
          action: "alert_admin",
          priority: "low",
          confidence: 0.6,
        });
        decision.reasoning.push("Low severity logged for monitoring");
        break;
    }
  }

  /**
   * Apply risk-tolerance based decisions
   */
  async applyRiskBasedDecisions(analysis, decision) {
    const riskLevel = this.config.riskTolerance;
    const thresholds = this.riskThresholds[riskLevel];
    const riskScore = analysis.riskScore;

    if (riskScore >= thresholds.critical) {
      decision.actions.push(
        { action: "block_ip", priority: "urgent", confidence: 1.0 },
        { action: "backup_data", priority: "urgent", confidence: 0.9 },
      );
      decision.reasoning.push(
        `Risk score ${riskScore} exceeds critical threshold`,
      );
    } else if (riskScore >= thresholds.high) {
      decision.actions.push({
        action: "update_firewall",
        priority: "high",
        confidence: 0.8,
      });
      decision.reasoning.push(`Risk score ${riskScore} exceeds high threshold`);
    } else if (riskScore >= thresholds.medium) {
      decision.actions.push({
        action: "scan_system",
        priority: "medium",
        confidence: 0.6,
      });
      decision.reasoning.push(
        `Risk score ${riskScore} warrants increased monitoring`,
      );
    }
  }

  /**
   * Apply contextual adjustments based on environment and history
   */
  async applyContextualAdjustments(analysis, decision) {
    // Check recent similar incidents
    const recentSimilar = this.findRecentSimilarIncidents(analysis);
    if (recentSimilar.length > 3) {
      decision.actions.push({
        action: "isolate_system",
        priority: "high",
        confidence: 0.8,
        reason: "Pattern of similar incidents detected",
      });
      decision.reasoning.push("Escalated due to pattern of similar incidents");
    }

    // Time-based adjustments
    const hour = new Date().getHours();
    if (hour >= 18 || hour <= 6) {
      // After hours
      // Increase automation during off-hours
      decision.actions.forEach((action) => {
        if (this.availableActions[action.action]?.automated) {
          action.confidence = Math.min(action.confidence + 0.1, 1.0);
        }
      });
      decision.reasoning.push(
        "Increased automation confidence for after-hours incident",
      );
    }

    // System load considerations
    if (analysis.systemLoad && analysis.systemLoad > 0.8) {
      // Reduce system-intensive actions during high load
      decision.actions = decision.actions.filter(
        (action) => this.availableActions[action.action]?.impact !== "high",
      );
      decision.reasoning.push(
        "Filtered high-impact actions due to system load",
      );
    }
  }

  /**
   * Validate actions and set priorities
   */
  validateAndPrioritizeActions(decision) {
    // Remove duplicates
    const uniqueActions = new Map();
    decision.actions.forEach((action) => {
      const key = action.action;
      if (
        !uniqueActions.has(key) ||
        uniqueActions.get(key).confidence < action.confidence
      ) {
        uniqueActions.set(key, action);
      }
    });

    decision.actions = Array.from(uniqueActions.values());

    // Check cooldowns
    decision.actions = decision.actions.filter((action) => {
      if (this.activeCooldowns.has(action.action)) {
        const cooldownEnd = this.activeCooldowns.get(action.action);
        if (Date.now() < cooldownEnd) {
          decision.reasoning.push(
            `Action ${action.action} skipped due to cooldown`,
          );
          return false;
        }
      }
      return true;
    });

    // Sort by priority and confidence
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    decision.actions.sort((a, b) => {
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      return priorityDiff !== 0 ? priorityDiff : b.confidence - a.confidence;
    });

    // Limit number of actions
    if (decision.actions.length > this.config.maxAutomatedActions) {
      decision.actions = decision.actions.slice(
        0,
        this.config.maxAutomatedActions,
      );
      decision.reasoning.push("Limited actions to maximum allowed");
    }
  }

  /**
   * Determine if actions should be auto-executed
   */
  determineAutoExecution(decision) {
    if (!this.config.autoResponseEnabled) {
      decision.autoExecute = false;
      decision.reasoning.push("Auto-response disabled by configuration");
      return;
    }

    const autoExecutableActions = decision.actions.filter(
      (action) =>
        this.availableActions[action.action]?.automated &&
        action.confidence > 0.7 &&
        action.priority !== "low",
    );

    decision.autoExecute = autoExecutableActions.length > 0;

    if (decision.autoExecute) {
      decision.reasoning.push(
        `${autoExecutableActions.length} actions approved for auto-execution`,
      );
    }
  }

  /**
   * Execute a specific action
   */
  async executeAction(actionObj) {
    const actionType = actionObj.action;
    const actionConfig = this.availableActions[actionType];

    if (!actionConfig) {
      throw new Error(`Unknown action type: ${actionType}`);
    }

    console.log(`🎯 Executing action: ${actionType}`);

    try {
      // Set cooldown
      if (actionConfig.cooldown) {
        this.activeCooldowns.set(
          actionType,
          Date.now() + actionConfig.cooldown,
        );
      }

      // Execute based on action type
      const result = await this.performAction(actionType, actionObj);

      // Log action
      this.actionHistory.push({
        action: actionType,
        timestamp: new Date(),
        success: true,
        result: result,
      });

      this.emit("action-executed", {
        action: actionType,
        result: result,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      console.error(`Action execution failed: ${actionType}`, error);

      this.actionHistory.push({
        action: actionType,
        timestamp: new Date(),
        success: false,
        error: error.message,
      });

      this.emit("action-failed", {
        action: actionType,
        error: error,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * Perform the actual action implementation
   */
  async performAction(actionType, actionObj) {
    switch (actionType) {
      case "block_ip":
        return await this.blockIP(actionObj.ip || "unknown");

      case "isolate_system":
        return await this.isolateSystem(actionObj.systemId || "unknown");

      case "alert_admin":
        return await this.alertAdmin(actionObj);

      case "update_firewall":
        return await this.updateFirewall(actionObj.rule || {});

      case "scan_system":
        return await this.scanSystem(actionObj.systemId || "unknown");

      case "backup_data":
        return await this.backupData(actionObj.dataPath || "/");

      case "shutdown_service":
        return await this.shutdownService(actionObj.service || "unknown");

      case "forensic_capture":
        return await this.forensicCapture(actionObj.target || "unknown");

      default:
        throw new Error(`Action implementation not found: ${actionType}`);
    }
  }

  // Action implementations (these would integrate with actual security systems)
  async blockIP(ip) {
    console.log(`🚫 Blocking IP: ${ip}`);
    return { status: "blocked", ip: ip, timestamp: new Date() };
  }

  async isolateSystem(systemId) {
    console.log(`🔒 Isolating system: ${systemId}`);
    return { status: "isolated", systemId: systemId, timestamp: new Date() };
  }

  async alertAdmin(actionObj) {
    console.log(`🚨 Sending admin alert`);
    return { status: "alert_sent", timestamp: new Date() };
  }

  async updateFirewall(rule) {
    console.log(`🛡️ Updating firewall rules`);
    return { status: "firewall_updated", rule: rule, timestamp: new Date() };
  }

  async scanSystem(systemId) {
    console.log(`🔍 Starting system scan: ${systemId}`);
    return {
      status: "scan_initiated",
      systemId: systemId,
      timestamp: new Date(),
    };
  }

  async backupData(dataPath) {
    console.log(`💾 Backing up data: ${dataPath}`);
    return {
      status: "backup_started",
      dataPath: dataPath,
      timestamp: new Date(),
    };
  }

  async shutdownService(service) {
    console.log(`⏹️ Shutting down service: ${service}`);
    return {
      status: "service_stopped",
      service: service,
      timestamp: new Date(),
    };
  }

  async forensicCapture(target) {
    console.log(`🔬 Starting forensic capture: ${target}`);
    return { status: "capture_started", target: target, timestamp: new Date() };
  }

  // Helper methods
  evaluateRule(rule, threat, analysis) {
    // Simple rule evaluation - in production this would be more sophisticated
    return threat.confidence >= rule.minConfidence;
  }

  findRecentSimilarIncidents(analysis) {
    // Find similar incidents in recent history
    return this.actionHistory.filter(
      (action) => Date.now() - action.timestamp.getTime() < 24 * 60 * 60 * 1000, // Last 24 hours
    );
  }

  logDecision(decision) {
    console.log(`🧠 Decision made: ${decision.decisionId}`);
    console.log(`   Risk Score: ${decision.riskScore}`);
    console.log(`   Actions: ${decision.actions.length}`);
    console.log(`   Auto-Execute: ${decision.autoExecute}`);
  }

  async loadDecisionRules() {
    // Load decision rules from configuration
    this.decisionRules.set("sql_injection", [
      {
        name: "sql_injection_block",
        minConfidence: 0.8,
        actions: [
          { action: "block_ip", priority: "high", confidence: 0.9 },
          { action: "alert_admin", priority: "high", confidence: 1.0 },
        ],
      },
    ]);

    this.decisionRules.set("malware_signature", [
      {
        name: "malware_isolate",
        minConfidence: 0.7,
        actions: [
          { action: "isolate_system", priority: "urgent", confidence: 0.95 },
          { action: "forensic_capture", priority: "high", confidence: 0.8 },
        ],
      },
    ]);
  }

  buildDecisionTree() {
    // Build decision tree for complex decision making
    console.log("🌳 Building decision tree...");
  }
}

module.exports = DecisionEngine;
