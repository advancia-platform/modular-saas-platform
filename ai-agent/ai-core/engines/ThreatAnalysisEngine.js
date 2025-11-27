/**
 * Threat Analysis Engine
 *
 * Performs comprehensive threat analysis using multiple detection methods,
 * pattern recognition, and behavioral analysis.
 */

const EventEmitter = require("events");

class ThreatAnalysisEngine extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      analysisDepth: config.analysisDepth || "medium",
      patternWindowSize: config.patternWindowSize || 100,
      anomalyThreshold: config.anomalyThreshold || 2.5,
      ...config,
    };

    // Threat patterns database
    this.threatPatterns = new Map();
    this.behaviorBaselines = new Map();
    this.analysisHistory = [];

    // Known attack patterns
    this.knownPatterns = {
      sql_injection: {
        patterns: [/'.*OR.*'='/, /UNION.*SELECT/, /DROP.*TABLE/i],
        severity: "high",
        category: "injection",
      },
      xss_attempt: {
        patterns: [/<script[^>]*>.*<\/script>/i, /javascript:/i, /on\w+\s*=/i],
        severity: "medium",
        category: "xss",
      },
      brute_force: {
        indicators: [
          "rapid_login_attempts",
          "failed_auth_pattern",
          "dictionary_attack",
        ],
        severity: "high",
        category: "authentication",
      },
      port_scan: {
        indicators: [
          "sequential_port_access",
          "rapid_connection_attempts",
          "service_enumeration",
        ],
        severity: "medium",
        category: "reconnaissance",
      },
      malware_signature: {
        patterns: [/cmd\.exe/i, /powershell.*-enc/i, /wget.*sh$/i],
        severity: "critical",
        category: "malware",
      },
      data_exfiltration: {
        indicators: [
          "large_data_transfer",
          "unusual_network_pattern",
          "sensitive_file_access",
        ],
        severity: "critical",
        category: "exfiltration",
      },
    };
  }

  async initialize() {
    console.log("🔍 Initializing Threat Analysis Engine...");

    // Load threat intelligence feeds
    await this.loadThreatIntelligence();

    // Initialize behavioral baselines
    await this.initializeBehaviorBaselines();

    console.log("✅ Threat Analysis Engine ready");
  }

  /**
   * Main threat analysis method
   */
  async analyze(securityData) {
    const startTime = Date.now();

    try {
      const analysis = {
        timestamp: new Date(),
        source: securityData.source || "unknown",
        analysisId: `threat-${Date.now()}`,
        severity: "low",
        confidence: 0,
        threats: [],
        patterns: [],
        anomalies: [],
        recommendations: [],
      };

      // Multi-layer analysis
      await Promise.all([
        this.performPatternAnalysis(securityData, analysis),
        this.performBehaviorAnalysis(securityData, analysis),
        this.performAnomalyDetection(securityData, analysis),
        this.performSignatureAnalysis(securityData, analysis),
        this.performHeuristicAnalysis(securityData, analysis),
      ]);

      // Calculate overall threat level
      this.calculateThreatLevel(analysis);

      // Generate recommendations
      this.generateRecommendations(analysis);

      analysis.processingTime = Date.now() - startTime;

      // Store for learning
      this.analysisHistory.push(analysis);
      if (this.analysisHistory.length > 10000) {
        this.analysisHistory = this.analysisHistory.slice(-5000);
      }

      this.emit("analysis-complete", analysis);

      return analysis;
    } catch (error) {
      console.error("Threat analysis failed:", error);
      throw error;
    }
  }

  /**
   * Pattern-based threat detection
   */
  async performPatternAnalysis(data, analysis) {
    for (const [threatType, pattern] of Object.entries(this.knownPatterns)) {
      let matches = 0;
      let matchedPatterns = [];

      if (pattern.patterns) {
        for (const regex of pattern.patterns) {
          const content = JSON.stringify(data);
          if (regex.test(content)) {
            matches++;
            matchedPatterns.push(regex.toString());
          }
        }
      }

      if (pattern.indicators && data.indicators) {
        for (const indicator of pattern.indicators) {
          if (data.indicators.includes(indicator)) {
            matches++;
            matchedPatterns.push(indicator);
          }
        }
      }

      if (matches > 0) {
        const confidence = Math.min(matches * 0.3, 1.0);

        analysis.patterns.push({
          type: threatType,
          category: pattern.category,
          severity: pattern.severity,
          confidence: confidence,
          matches: matchedPatterns,
          count: matches,
        });

        analysis.threats.push({
          type: "pattern_match",
          threatType: threatType,
          severity: pattern.severity,
          confidence: confidence,
          description: `Detected ${threatType} pattern in security data`,
          evidence: matchedPatterns,
        });
      }
    }
  }

  /**
   * Behavioral analysis for anomaly detection
   */
  async performBehaviorAnalysis(data, analysis) {
    if (!data.userBehavior && !data.networkBehavior && !data.systemBehavior) {
      return;
    }

    const behaviors = {
      user: data.userBehavior || {},
      network: data.networkBehavior || {},
      system: data.systemBehavior || {},
    };

    for (const [behaviorType, behavior] of Object.entries(behaviors)) {
      const baseline = this.behaviorBaselines.get(behaviorType);

      if (baseline) {
        const deviation = this.calculateBehaviorDeviation(behavior, baseline);

        if (deviation > this.config.anomalyThreshold) {
          const severity =
            deviation > 5 ? "high" : deviation > 3 ? "medium" : "low";

          analysis.anomalies.push({
            type: "behavior_anomaly",
            behaviorType: behaviorType,
            deviation: deviation,
            severity: severity,
            confidence: Math.min(deviation / 5, 1.0),
            baseline: baseline,
            observed: behavior,
          });

          analysis.threats.push({
            type: "behavioral_anomaly",
            threatType: `unusual_${behaviorType}_behavior`,
            severity: severity,
            confidence: Math.min(deviation / 5, 1.0),
            description: `Unusual ${behaviorType} behavior detected`,
            evidence: { deviation, baseline, observed: behavior },
          });
        }
      }
    }
  }

  /**
   * Statistical anomaly detection
   */
  async performAnomalyDetection(data, analysis) {
    if (!data.metrics) return;

    const metrics = data.metrics;
    const anomalies = [];

    // Check each metric for statistical anomalies
    for (const [metric, value] of Object.entries(metrics)) {
      if (typeof value === "number") {
        const anomalyScore = this.calculateAnomalyScore(metric, value);

        if (anomalyScore > this.config.anomalyThreshold) {
          anomalies.push({
            metric: metric,
            value: value,
            anomalyScore: anomalyScore,
            severity: anomalyScore > 4 ? "high" : "medium",
          });
        }
      }
    }

    if (anomalies.length > 0) {
      analysis.anomalies.push(...anomalies);

      const avgScore =
        anomalies.reduce((sum, a) => sum + a.anomalyScore, 0) /
        anomalies.length;
      const severity = avgScore > 4 ? "high" : avgScore > 3 ? "medium" : "low";

      analysis.threats.push({
        type: "statistical_anomaly",
        threatType: "metric_anomaly",
        severity: severity,
        confidence: Math.min(avgScore / 5, 1.0),
        description: `Statistical anomalies detected in ${anomalies.length} metrics`,
        evidence: anomalies,
      });
    }
  }

  /**
   * Signature-based malware detection
   */
  async performSignatureAnalysis(data, analysis) {
    const content = JSON.stringify(data).toLowerCase();
    const signatures = [
      {
        name: "cmd_execution",
        pattern: /cmd\.exe|command\.com/g,
        severity: "high",
      },
      {
        name: "powershell_encoded",
        pattern: /powershell.*-enc.*[a-z0-9+\/=]{50,}/g,
        severity: "critical",
      },
      {
        name: "base64_payload",
        pattern: /[a-z0-9+\/=]{100,}/g,
        severity: "medium",
      },
      {
        name: "shell_execution",
        pattern: /\/bin\/(bash|sh|zsh)|system\(.*\)|exec\(.*\)/g,
        severity: "high",
      },
      {
        name: "file_manipulation",
        pattern: /unlink|rmdir|remove|delete.*file/g,
        severity: "medium",
      },
    ];

    for (const signature of signatures) {
      const matches = content.match(signature.pattern);

      if (matches && matches.length > 0) {
        analysis.threats.push({
          type: "signature_match",
          threatType: signature.name,
          severity: signature.severity,
          confidence: Math.min(matches.length * 0.25, 1.0),
          description: `Malicious signature detected: ${signature.name}`,
          evidence: matches.slice(0, 5), // Limit evidence size
        });
      }
    }
  }

  /**
   * Heuristic analysis for unknown threats
   */
  async performHeuristicAnalysis(data, analysis) {
    let suspicionScore = 0;
    const heuristics = [];

    // Check for suspicious timing patterns
    if (data.timestamp && data.previousEvents) {
      const timingPattern = this.analyzeTimingPattern(
        data.timestamp,
        data.previousEvents,
      );
      if (timingPattern.suspicious) {
        suspicionScore += 2;
        heuristics.push(`Suspicious timing pattern: ${timingPattern.reason}`);
      }
    }

    // Check for unusual data sizes
    if (data.dataSize && data.dataSize > 10 * 1024 * 1024) {
      // > 10MB
      suspicionScore += 1;
      heuristics.push("Unusually large data payload");
    }

    // Check for suspicious destinations
    if (data.destination && this.isSuspiciousDestination(data.destination)) {
      suspicionScore += 3;
      heuristics.push(`Suspicious destination: ${data.destination}`);
    }

    // Check for encryption or obfuscation
    if (data.payload && this.isObfuscated(data.payload)) {
      suspicionScore += 2;
      heuristics.push("Potential payload obfuscation detected");
    }

    if (suspicionScore > 3) {
      const severity = suspicionScore > 6 ? "high" : "medium";

      analysis.threats.push({
        type: "heuristic_detection",
        threatType: "suspicious_activity",
        severity: severity,
        confidence: Math.min(suspicionScore / 10, 1.0),
        description: "Heuristic analysis indicates suspicious activity",
        evidence: heuristics,
      });
    }
  }

  /**
   * Calculate overall threat level
   */
  calculateThreatLevel(analysis) {
    if (analysis.threats.length === 0) {
      analysis.severity = "none";
      analysis.confidence = 1.0;
      return;
    }

    let totalScore = 0;
    let maxSeverity = "low";
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };

    for (const threat of analysis.threats) {
      const severityScore = severityLevels[threat.severity] || 1;
      totalScore += severityScore * threat.confidence;

      if (severityLevels[threat.severity] > severityLevels[maxSeverity]) {
        maxSeverity = threat.severity;
      }
    }

    const avgScore = totalScore / analysis.threats.length;
    analysis.confidence = Math.min(avgScore / 4, 1.0);

    // Determine final severity
    if (avgScore >= 3.5) analysis.severity = "critical";
    else if (avgScore >= 2.5) analysis.severity = "high";
    else if (avgScore >= 1.5) analysis.severity = "medium";
    else analysis.severity = "low";
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.severity === "critical") {
      recommendations.push({
        action: "immediate_isolation",
        priority: "urgent",
        description: "Immediately isolate affected systems",
        automated: true,
      });
    }

    if (analysis.patterns.length > 0) {
      recommendations.push({
        action: "update_signatures",
        priority: "high",
        description: "Update security signatures based on detected patterns",
        automated: false,
      });
    }

    if (analysis.anomalies.length > 0) {
      recommendations.push({
        action: "investigate_anomalies",
        priority: "medium",
        description: "Investigate behavioral anomalies for potential threats",
        automated: false,
      });
    }

    recommendations.push({
      action: "enhance_monitoring",
      priority: "low",
      description: "Enhance monitoring for similar threat patterns",
      automated: true,
    });

    analysis.recommendations = recommendations;
  }

  // Helper methods
  calculateBehaviorDeviation(observed, baseline) {
    if (!baseline.mean || !baseline.stdDev) return 0;
    return Math.abs(observed - baseline.mean) / baseline.stdDev;
  }

  calculateAnomalyScore(metric, value) {
    // Simple z-score calculation (would be more sophisticated in production)
    return Math.random() * 3; // Placeholder
  }

  analyzeTimingPattern(timestamp, previousEvents) {
    // Analyze for suspicious timing patterns
    return { suspicious: false, reason: "" };
  }

  isSuspiciousDestination(destination) {
    const suspiciousTlds = [".tk", ".ml", ".ga", ".cf"];
    return suspiciousTlds.some((tld) => destination.includes(tld));
  }

  isObfuscated(payload) {
    const entropy = this.calculateEntropy(payload);
    return entropy > 7.5; // High entropy suggests obfuscation
  }

  calculateEntropy(str) {
    const freq = {};
    str.split("").forEach((char) => (freq[char] = (freq[char] || 0) + 1));

    return Object.values(freq).reduce((entropy, count) => {
      const p = count / str.length;
      return entropy - p * Math.log2(p);
    }, 0);
  }

  async loadThreatIntelligence() {
    // Load threat intelligence from external sources
    console.log("📊 Loading threat intelligence feeds...");
    // Implementation would fetch from real threat intelligence APIs
  }

  async initializeBehaviorBaselines() {
    // Initialize behavioral baselines for anomaly detection
    this.behaviorBaselines.set("user", { mean: 50, stdDev: 15 });
    this.behaviorBaselines.set("network", { mean: 1000, stdDev: 200 });
    this.behaviorBaselines.set("system", { mean: 30, stdDev: 10 });
  }
}

module.exports = ThreatAnalysisEngine;
