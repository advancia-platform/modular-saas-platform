#!/usr/bin/env node
/**
 * AI DevOps Agent - Quick Demo
 * =============================
 *
 * This demo showcases the AI DevOps Agent capabilities without requiring
 * Python dependencies. It demonstrates the complete pipeline using mock data.
 */

const fs = require("fs");
const path = require("path");

console.log("🤖 AI DevOps Agent - Quick Demo");
console.log("=================================");
console.log("");

// Mock error data for demonstration
const mockErrors = [
  {
    error_id: "ERR-001",
    source: "sentry",
    timestamp: new Date().toISOString(),
    message: 'TypeError: Cannot read property "length" of undefined',
    stack_trace: `
        at processPayment (payment-processor.js:45)
        at handleTransaction (transaction-handler.js:123)
        at /app/routes/payments.js:67`,
    context: {
      file_path: "src/payment-processor.js",
      line_number: 45,
      function_name: "processPayment",
      environment: "production",
    },
    metadata: {
      severity: "high",
      frequency: "increasing",
      impact_scope: "payment_system",
    },
  },
  {
    error_id: "ERR-002",
    source: "github",
    timestamp: new Date().toISOString(),
    message: "SecurityError: Potential SQL injection detected",
    stack_trace: `
        at validateUserInput (auth-service.js:89)
        at loginUser (user-controller.js:234)`,
    context: {
      file_path: "src/auth-service.js",
      line_number: 89,
      function_name: "validateUserInput",
      environment: "production",
    },
    metadata: {
      severity: "critical",
      frequency: "new",
      impact_scope: "authentication_system",
    },
  },
];

// Mock fintech AI analysis results
function mockFintechAnalysis(error) {
  const fraudAnalysis = {
    suspicious_patterns:
      error.message.includes("injection") || error.message.includes("Security"),
    risk_score: error.metadata.severity === "critical" ? 0.9 : 0.6,
    confidence: 0.85,
    fraud_likelihood: error.message.includes("Security") ? "high" : "medium",
  };

  const riskAssessment = {
    score: error.context.environment === "production" ? 0.8 : 0.4,
    level: error.metadata.severity === "critical" ? "high" : "medium",
    confidence: 0.88,
  };

  const sentimentAnalysis = {
    sentiment: error.message.includes("Error") ? "negative" : "neutral",
    quality_score: 0.6,
    confidence: 0.75,
  };

  const healthScore = {
    composite_score: 0.7,
    health_rating: "good",
    reliability: 0.72,
    confidence: 0.8,
  };

  const trendAnalysis = {
    trend_prediction: {
      direction:
        error.metadata.frequency === "increasing" ? "deteriorating" : "stable",
      strength: "moderate",
    },
    confidence: 0.78,
  };

  const deploymentStrategy = {
    strategy: riskAssessment.level === "high" ? "canary" : "blue_green",
    volume: riskAssessment.level === "high" ? 25 : 100,
    confidence: 0.82,
  };

  return {
    fraudAnalysis,
    riskAssessment,
    sentimentAnalysis,
    healthScore,
    trendAnalysis,
    deploymentStrategy,
  };
}

// Generate fix plans based on error analysis
function generateFixPlan(error, analysis) {
  const { riskAssessment, deploymentStrategy, fraudAnalysis } = analysis;

  let fixPlan = {
    action_type: "code_change",
    target_files: [error.context.file_path],
    estimated_time: "10-15 minutes",
    risk_level: riskAssessment.level,
    deployment_strategy: deploymentStrategy.strategy,
  };

  // Customize fix based on error type
  if (error.message.includes("TypeError")) {
    fixPlan.code_changes = [
      {
        file: error.context.file_path,
        line: error.context.line_number,
        type: "add_null_check",
        description: "Add null check before accessing property",
      },
    ];
    fixPlan.validation_steps = ["unit_tests", "integration_tests"];
  } else if (
    error.message.includes("Security") ||
    error.message.includes("injection")
  ) {
    fixPlan.action_type = "security_fix";
    fixPlan.code_changes = [
      {
        file: error.context.file_path,
        line: error.context.line_number,
        type: "sanitize_input",
        description: "Add input sanitization and validation",
      },
    ];
    fixPlan.validation_steps = ["security_tests", "penetration_tests"];
    fixPlan.estimated_time = "30-60 minutes";
  }

  return fixPlan;
}

// Calculate confidence scores
function calculateConfidence(analysis) {
  const { fraudAnalysis, riskAssessment, sentimentAnalysis, healthScore } =
    analysis;

  const overallConfidence =
    fraudAnalysis.confidence * 0.3 +
    (1.0 - riskAssessment.score) * 0.4 +
    sentimentAnalysis.confidence * 0.2 +
    healthScore.reliability * 0.1;

  return Math.round(overallConfidence * 1000) / 1000;
}

// Main demo function
async function runDemo() {
  console.log("🔍 Processing mock errors through AI DevOps pipeline...\n");

  for (let i = 0; i < mockErrors.length; i++) {
    const error = mockErrors[i];
    console.log(`📋 Analyzing Error ${i + 1}: ${error.error_id}`);
    console.log(`   Message: ${error.message}`);
    console.log(`   Environment: ${error.context.environment}`);
    console.log(`   Severity: ${error.metadata.severity}\n`);

    // Step 1: Fintech AI Analysis
    console.log("🧠 Step 1: Fintech AI Intelligence Analysis");
    const analysis = mockFintechAnalysis(error);

    console.log(
      `   🔍 Fraud Detection: ${analysis.fraudAnalysis.fraud_likelihood} risk`,
    );
    console.log(
      `   ⚖️  Risk Assessment: ${analysis.riskAssessment.level} (${analysis.riskAssessment.score})`,
    );
    console.log(
      `   😊 Sentiment Analysis: ${analysis.sentimentAnalysis.sentiment}`,
    );
    console.log(
      `   💚 Health Score: ${analysis.healthScore.health_rating} (${analysis.healthScore.composite_score})`,
    );
    console.log(
      `   📈 Trend Prediction: ${analysis.trendAnalysis.trend_prediction.direction}\n`,
    );

    // Step 2: Generate Fix Plan
    console.log("🛠️  Step 2: AI Fix Plan Generation");
    const fixPlan = generateFixPlan(error, analysis);

    console.log(
      `   Action Type: ${fixPlan.action_type.replace("_", " ").toUpperCase()}`,
    );
    console.log(`   Target Files: ${fixPlan.target_files.join(", ")}`);
    console.log(`   Estimated Time: ${fixPlan.estimated_time}`);
    console.log(`   Risk Level: ${fixPlan.risk_level.toUpperCase()}`);
    console.log(
      `   Deployment: ${fixPlan.deployment_strategy.toUpperCase()}\n`,
    );

    // Step 3: Deployment Strategy
    console.log("🚀 Step 3: Smart Deployment Strategy");
    console.log(
      `   Strategy: ${analysis.deploymentStrategy.strategy.toUpperCase()}`,
    );
    console.log(`   Deployment Volume: ${analysis.deploymentStrategy.volume}%`);
    console.log(`   Rollback Ready: YES`);

    // Step 4: Confidence Metrics
    const confidence = calculateConfidence(analysis);
    console.log(`\n📊 Step 4: Confidence Metrics`);
    console.log(`   Overall Confidence: ${confidence}`);
    console.log(`   Auto-fix Recommended: ${confidence >= 0.8 ? "YES" : "NO"}`);
    console.log(
      `   Human Review Required: ${confidence < 0.6 ? "YES" : "NO"}\n`,
    );

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("✅ Analysis Complete!\n");
    console.log("─".repeat(60) + "\n");
  }

  console.log("🎉 AI DevOps Agent Demo Complete!");
  console.log("");
  console.log("🚀 What you just saw:");
  console.log("   ✅ Real-time error analysis using 12 fintech AI functions");
  console.log("   ✅ Intelligent fix plan generation");
  console.log("   ✅ Risk-based deployment strategies");
  console.log("   ✅ Financial-grade confidence scoring");
  console.log("");
  console.log("💡 Next Steps:");
  console.log("   1. Set your OPENAI_API_KEY in .env");
  console.log(
    "   2. Install Python dependencies: pip install -r src/reasoning-engine/requirements.txt",
  );
  console.log("   3. Run full system: npm start");
  console.log("");
  console.log("🔗 Integration Ready:");
  console.log("   • GitHub Actions");
  console.log("   • Sentry Error Tracking");
  console.log("   • Prometheus Monitoring");
  console.log("   • Security Scan Tools");
}

// Run the demo
runDemo().catch(console.error);
