/**
 * Core AI Agent Architecture
 *
 * This is the main AI system that orchestrates all cybersecurity intelligence,
 * threat analysis, and automated response capabilities.
 */

const EventEmitter = require("events");
const ThreatAnalysisEngine = require("./engines/ThreatAnalysisEngine");
const DecisionEngine = require("./engines/DecisionEngine");
const LearningEngine = require("./engines/LearningEngine");
const KnowledgeBase = require("./knowledge/KnowledgeBase");
const MLModels = require("./models/MLModels");

class CyberAIAgent extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      agentId: config.agentId || `ai-agent-${Date.now()}`,
      learningRate: config.learningRate || 0.01,
      confidenceThreshold: config.confidenceThreshold || 0.8,
      maxConcurrentAnalysis: config.maxConcurrentAnalysis || 10,
      autoResponse: config.autoResponse || false,
      ...config,
    };

    // Initialize core components
    this.threatAnalysis = new ThreatAnalysisEngine(this.config);
    this.decisionEngine = new DecisionEngine(this.config);
    this.learningEngine = new LearningEngine(this.config);
    this.knowledgeBase = new KnowledgeBase(this.config);
    this.mlModels = new MLModels(this.config);

    // Agent state
    this.state = {
      status: "initializing",
      threatsAnalyzed: 0,
      decisionsAade: 0,
      learningIterations: 0,
      lastActivity: new Date(),
      activeAnalyses: new Map(),
      confidence: 0.5,
    };

    // Performance metrics
    this.metrics = {
      accuracyRate: 0,
      responseTime: [],
      threatsPrevented: 0,
      falsePositives: 0,
      falseNegatives: 0,
    };

    this.initialize();
  }

  async initialize() {
    try {
      console.log(`🤖 Initializing AI Agent: ${this.config.agentId}`);

      // Initialize knowledge base
      await this.knowledgeBase.initialize();
      console.log("✅ Knowledge Base initialized");

      // Load ML models
      await this.mlModels.loadModels();
      console.log("✅ ML Models loaded");

      // Initialize engines
      await this.threatAnalysis.initialize();
      await this.decisionEngine.initialize();
      await this.learningEngine.initialize();
      console.log("✅ AI Engines initialized");

      this.state.status = "active";
      this.state.lastActivity = new Date();

      // Start background processes
      this.startBackgroundProcesses();

      this.emit("agent-ready", {
        agentId: this.config.agentId,
        capabilities: this.getCapabilities(),
      });

      console.log("🚀 AI Agent fully operational");
    } catch (error) {
      console.error("❌ AI Agent initialization failed:", error);
      this.state.status = "error";
      this.emit("agent-error", error);
      throw error;
    }
  }

  /**
   * Analyze incoming security data for threats
   */
  async analyzeThreat(securityData) {
    const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Add to active analyses
      this.state.activeAnalyses.set(analysisId, {
        startTime: new Date(),
        data: securityData,
        status: "analyzing",
      });

      console.log(`🔍 Starting threat analysis: ${analysisId}`);

      // Multi-stage analysis
      const threatAnalysis = await this.threatAnalysis.analyze(securityData);
      const mlPrediction = await this.mlModels.predict(securityData);
      const knowledgeMatch = await this.knowledgeBase.findMatches(securityData);

      // Combine results
      const combinedAnalysis = {
        analysisId,
        timestamp: new Date(),
        threat: threatAnalysis,
        mlConfidence: mlPrediction.confidence,
        mlClassification: mlPrediction.classification,
        knowledgeMatches: knowledgeMatch,
        riskScore: this.calculateRiskScore(
          threatAnalysis,
          mlPrediction,
          knowledgeMatch,
        ),
        recommendedActions: [],
      };

      // Get decision from decision engine
      const decision = await this.decisionEngine.makeDecision(combinedAnalysis);
      combinedAnalysis.decision = decision;
      combinedAnalysis.recommendedActions = decision.actions;

      // Update metrics
      this.updateMetrics(combinedAnalysis);

      // Learn from this analysis
      await this.learningEngine.learn(combinedAnalysis);

      // Update state
      this.state.threatsAnalyzed++;
      this.state.lastActivity = new Date();
      this.state.activeAnalyses.delete(analysisId);

      // Emit results
      this.emit("threat-analyzed", combinedAnalysis);

      // Auto-response if enabled and confidence is high
      if (
        this.config.autoResponse &&
        combinedAnalysis.riskScore > this.config.confidenceThreshold
      ) {
        await this.executeAutoResponse(combinedAnalysis);
      }

      console.log(
        `✅ Threat analysis completed: ${analysisId} (Risk: ${combinedAnalysis.riskScore})`,
      );

      return combinedAnalysis;
    } catch (error) {
      console.error(`❌ Threat analysis failed: ${analysisId}`, error);
      this.state.activeAnalyses.delete(analysisId);
      this.emit("analysis-error", { analysisId, error });
      throw error;
    }
  }

  /**
   * Calculate combined risk score from multiple analysis sources
   */
  calculateRiskScore(threatAnalysis, mlPrediction, knowledgeMatch) {
    let score = 0;
    let weight = 0;

    // Threat analysis weight (40%)
    if (threatAnalysis.severity) {
      const severityScore =
        {
          low: 0.2,
          medium: 0.5,
          high: 0.8,
          critical: 1.0,
        }[threatAnalysis.severity.toLowerCase()] || 0;

      score += severityScore * 0.4;
      weight += 0.4;
    }

    // ML prediction weight (35%)
    if (mlPrediction.confidence) {
      score += mlPrediction.confidence * 0.35;
      weight += 0.35;
    }

    // Knowledge base match weight (25%)
    if (knowledgeMatch.length > 0) {
      const avgConfidence =
        knowledgeMatch.reduce((acc, match) => acc + match.confidence, 0) /
        knowledgeMatch.length;
      score += avgConfidence * 0.25;
      weight += 0.25;
    }

    return weight > 0 ? score / weight : 0;
  }

  /**
   * Execute automated response actions
   */
  async executeAutoResponse(analysis) {
    try {
      console.log(
        `🛡️ Executing auto-response for analysis: ${analysis.analysisId}`,
      );

      for (const action of analysis.recommendedActions) {
        if (
          action.automated &&
          action.confidence > this.config.confidenceThreshold
        ) {
          await this.decisionEngine.executeAction(action);

          this.emit("action-executed", {
            analysisId: analysis.analysisId,
            action: action,
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      console.error("❌ Auto-response execution failed:", error);
      this.emit("response-error", { analysis, error });
    }
  }

  /**
   * Update performance metrics
   */
  updateMetrics(analysis) {
    // Update response time
    this.metrics.responseTime.push(analysis.processingTime || 0);
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
    }

    // Update accuracy if feedback is available
    if (analysis.feedback) {
      if (analysis.feedback.correct) {
        this.metrics.accuracyRate = (this.metrics.accuracyRate + 1) / 2;
      } else {
        this.metrics.accuracyRate = this.metrics.accuracyRate * 0.9;

        if (analysis.feedback.falsePositive) {
          this.metrics.falsePositives++;
        } else if (analysis.feedback.falseNegative) {
          this.metrics.falseNegatives++;
        }
      }
    }
  }

  /**
   * Start background processes for continuous operation
   */
  startBackgroundProcesses() {
    // Knowledge base updates
    setInterval(
      async () => {
        try {
          await this.knowledgeBase.updateThreatIntelligence();
        } catch (error) {
          console.error("Knowledge base update failed:", error);
        }
      },
      5 * 60 * 1000,
    ); // Every 5 minutes

    // Model retraining
    setInterval(
      async () => {
        try {
          await this.learningEngine.performPeriodicTraining();
        } catch (error) {
          console.error("Periodic training failed:", error);
        }
      },
      60 * 60 * 1000,
    ); // Every hour

    // Performance monitoring
    setInterval(() => {
      this.emit("agent-status", this.getStatus());
    }, 30 * 1000); // Every 30 seconds
  }

  /**
   * Get current agent status
   */
  getStatus() {
    return {
      agentId: this.config.agentId,
      status: this.state.status,
      uptime: Date.now() - this.state.lastActivity.getTime(),
      metrics: {
        threatsAnalyzed: this.state.threatsAnalyzed,
        decisionsAade: this.state.decisionsAade,
        accuracyRate: this.metrics.accuracyRate,
        avgResponseTime:
          this.metrics.responseTime.reduce((a, b) => a + b, 0) /
            this.metrics.responseTime.length || 0,
        activeAnalyses: this.state.activeAnalyses.size,
      },
      capabilities: this.getCapabilities(),
    };
  }

  /**
   * Get agent capabilities
   */
  getCapabilities() {
    return {
      threatAnalysis: true,
      machineLearning: true,
      knowledgeBase: true,
      autoResponse: this.config.autoResponse,
      continuousLearning: true,
      realTimeAnalysis: true,
    };
  }

  /**
   * Provide feedback for learning
   */
  async provideFeedback(analysisId, feedback) {
    try {
      await this.learningEngine.incorporateFeedback(analysisId, feedback);
      this.emit("feedback-received", { analysisId, feedback });
    } catch (error) {
      console.error("Feedback incorporation failed:", error);
    }
  }

  /**
   * Shutdown agent gracefully
   */
  async shutdown() {
    console.log("🔄 Shutting down AI Agent...");
    this.state.status = "shutting-down";

    // Save learning progress
    await this.learningEngine.saveProgress();

    // Save knowledge base
    await this.knowledgeBase.save();

    this.state.status = "offline";
    this.emit("agent-shutdown");
    console.log("✅ AI Agent shutdown complete");
  }
}

module.exports = CyberAIAgent;
