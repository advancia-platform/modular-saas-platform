/**
 * AI DevOps Agent Demo
 * Demonstrates the full AI-powered error detection and resolution pipeline
 */

import AIDevOpsAgent from './ai-core/AIDevOpsAgent';
import { ErrorEvent } from './ai-core/intake/ErrorIntakeSystem';

async function runDemo() {
  console.log('🤖 AI DevOps Agent - Full Pipeline Demo');
  console.log('=====================================\n');

  // Configuration for the AI DevOps Agent
  const config = {
    intakeConfig: {
      githubToken: process.env.GITHUB_TOKEN,
      sentryDsn: process.env.SENTRY_DSN,
      prometheusUrl: process.env.PROMETHEUS_URL,
      socketUrl: process.env.SOCKET_URL
    },
    reasoningEngineUrl: 'http://localhost:5000',
    executionEngineUrl: 'http://localhost:3001',
    enableAutoFix: true,
    riskThresholds: {
      autoFix: 0.8,
      humanReview: 0.6
    }
  };

  // Initialize the AI DevOps Agent
  const agent = new AIDevOpsAgent(config);

  // Set up event listeners to demonstrate the pipeline
  setupEventListeners(agent);

  try {
    // Start the agent
    console.log('🚀 Starting AI DevOps Agent...\n');
    await agent.start();

    // Simulate various error scenarios
    await simulateErrorScenarios(agent);

    // Keep the demo running for 30 seconds to process events
    console.log('⏱️  Processing events for 30 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    // Stop the agent
    console.log('\n🛑 Stopping AI DevOps Agent...');
    await agent.stop();
    console.log('✅ Demo completed successfully!');
  }
}

function setupEventListeners(agent: AIDevOpsAgent): void {
  // Track the full pipeline
  agent.on('error_detected', (errorEvent) => {
    console.log(`🔍 ERROR DETECTED: ${errorEvent.id}`);
    console.log(`   Source: ${errorEvent.source}`);
    console.log(`   Severity: ${errorEvent.severity}`);
    console.log(`   Type: ${errorEvent.type}`);
    console.log(`   Repository: ${errorEvent.context.repository}`);
    console.log('');
  });

  agent.on('analysis_completed', ({ errorEvent, analysis }) => {
    console.log(`🧠 AI ANALYSIS COMPLETED: ${errorEvent.id}`);
    console.log(`   Root Cause: ${analysis.root_cause}`);
    console.log(`   Confidence: ${(analysis.confidence_score * 100).toFixed(1)}%`);
    console.log(`   Risk Level: ${analysis.risk_assessment.risk_level}`);
    console.log(`   Estimated Fix Time: ${analysis.estimated_fix_time} minutes`);
    console.log(`   Human Review Required: ${analysis.requires_human_review}`);
    console.log('');
  });

  agent.on('fix_plan_generated', ({ errorEvent, analysis, fixPlan }) => {
    console.log(`🛠️  FIX PLAN GENERATED: ${errorEvent.id}`);
    console.log(`   Strategy: ${fixPlan.strategy}`);
    console.log(`   Actions: ${fixPlan.actions.length} planned`);
    console.log(`   Test Requirements: ${fixPlan.test_requirements.join(', ')}`);
    console.log(`   Risk Factors: ${fixPlan.risk_factors.length}`);
    console.log('');
  });

  agent.on('fix_completed', ({ errorEvent, analysis, fixPlan, fixResult }) => {
    console.log(`⚡ AUTOMATED FIX COMPLETED: ${errorEvent.id}`);
    console.log(`   Success: ${fixResult.success ? '✅' : '❌'}`);
    console.log(`   Execution Time: ${fixResult.execution_time}ms`);
    console.log(`   Tests Passed: ${fixResult.tests_passed ? '✅' : '❌'}`);
    console.log(`   Changes Applied: ${fixResult.changes_applied.length}`);
    console.log('');
  });

  agent.on('queued_for_review', ({ errorEvent, analysis, fixPlan }) => {
    console.log(`👤 QUEUED FOR HUMAN REVIEW: ${errorEvent.id}`);
    console.log(`   Reason: High risk or low confidence`);
    console.log(`   Risk Level: ${analysis.risk_assessment.risk_level}`);
    console.log(`   Confidence: ${(analysis.confidence_score * 100).toFixed(1)}%`);
    console.log('');
  });

  agent.on('fix_deployed', ({ fixPlan, fixResult }) => {
    console.log(`🚀 FIX DEPLOYED: ${fixPlan.analysis_id}`);
    console.log(`   Deployment successful!`);
    console.log('');
  });

  agent.on('error_processing_failed', ({ errorEvent, error }) => {
    console.log(`❌ PROCESSING FAILED: ${errorEvent.id}`);
    console.log(`   Error: ${error.message}`);
    console.log('');
  });
}

async function simulateErrorScenarios(agent: AIDevOpsAgent): Promise<void> {
  console.log('🎬 Simulating Error Scenarios...\n');

  // Scenario 1: Low-risk compilation error (should auto-fix)
  const compilationError: ErrorEvent = {
    id: 'demo-compilation-001',
    timestamp: new Date(),
    source: 'ci_cd',
    severity: 'medium',
    type: 'compilation',
    context: {
      repository: 'modular-saas-platform',
      branch: 'feature/ai-devops',
      commit: 'abc123',
      file: 'backend/src/utils/helpers.ts',
      line: 42,
      environment: 'development'
    },
    rawError: "Module 'lodash' not found. Please install with 'npm install lodash'",
    metadata: {
      tags: ['typescript', 'dependencies'],
      priority: 5,
      autoFixable: true,
      estimatedImpact: 'low'
    }
  };

  // Scenario 2: High-risk security error (should queue for review)
  const securityError: ErrorEvent = {
    id: 'demo-security-001',
    timestamp: new Date(),
    source: 'security_scan',
    severity: 'critical',
    type: 'security',
    context: {
      repository: 'modular-saas-platform',
      branch: 'main',
      commit: 'xyz789',
      file: 'backend/src/routes/auth.ts',
      line: 156,
      environment: 'production'
    },
    rawError: "SQL injection vulnerability detected in user authentication query",
    metadata: {
      tags: ['security', 'sql-injection', 'authentication'],
      priority: 10,
      autoFixable: false,
      estimatedImpact: 'high'
    }
  };

  // Scenario 3: Medium-risk runtime error (should auto-fix with tests)
  const runtimeError: ErrorEvent = {
    id: 'demo-runtime-001',
    timestamp: new Date(),
    source: 'runtime',
    severity: 'high',
    type: 'runtime',
    context: {
      repository: 'modular-saas-platform',
      branch: 'staging',
      commit: 'def456',
      file: 'backend/src/services/paymentService.ts',
      line: 89,
      environment: 'staging'
    },
    rawError: "TypeError: Cannot read property 'amount' of undefined at processPayment",
    metadata: {
      tags: ['javascript', 'payments', 'null-check'],
      priority: 7,
      autoFixable: true,
      estimatedImpact: 'medium'
    }
  };

  // Simulate the errors being detected
  console.log('📡 Simulating error detection from various sources...\n');

  // Emit errors with delays to simulate real-world timing
  setTimeout(() => agent.emit('error_detected', compilationError), 1000);
  setTimeout(() => agent.emit('error_detected', securityError), 3000);
  setTimeout(() => agent.emit('error_detected', runtimeError), 5000);

  // Add some additional demo errors
  const performanceError: ErrorEvent = {
    id: 'demo-performance-001',
    timestamp: new Date(),
    source: 'monitoring',
    severity: 'high',
    type: 'performance',
    context: {
      repository: 'modular-saas-platform',
      branch: 'main',
      commit: 'perf123',
      environment: 'production'
    },
    rawError: "Database query timeout: SELECT * FROM transactions WHERE user_id = ? took 30 seconds",
    metadata: {
      tags: ['performance', 'database', 'query-optimization'],
      priority: 8,
      autoFixable: true,
      estimatedImpact: 'high'
    }
  };

  setTimeout(() => agent.emit('error_detected', performanceError), 7000);
}

// Add some demonstration statistics
async function showDemoStatistics(agent: AIDevOpsAgent): Promise<void> {
  console.log('\n📊 AI DevOps Agent Statistics');
  console.log('==============================');

  const status = agent.getStatus();
  const stats = agent.getStatistics();

  console.log(`Status: ${status.isRunning ? '🟢 Running' : '🔴 Stopped'}`);
  console.log(`Processing Queue: ${status.processingQueueSize} items`);
  console.log(`Active Fix Attempts: ${status.activeFixAttempts}`);
  console.log(`Total Errors Processed: ${stats.totalErrorsProcessed}`);
  console.log(`Successful Fixes: ${stats.successfulFixes}`);
  console.log(`Failed Fixes: ${stats.failedFixes}`);
  console.log(`Average Processing Time: ${stats.averageProcessingTime}ms`);
  console.log(`Human Review Rate: ${(stats.humanReviewRate * 100).toFixed(1)}%`);
  console.log('');
}

// Demonstration of the AI fintech function mappings
function showFintech AIFunctionMappings(): void {
  console.log('\n🏦 AI Fintech Function Mappings');
  console.log('================================');

  const mappings = [
    { fintech: 'Fraud Detection', devops: 'Anomaly Detection in Error Patterns' },
    { fintech: 'Market Sentiment Analysis', devops: 'Error Impact Assessment' },
    { fintech: 'Credit Risk Assessment', devops: 'Error Risk Scoring & Prioritization' },
    { fintech: 'Automated Code Generation', devops: 'Intelligent Fix Generation' },
    { fintech: 'Automated Testing', devops: 'Validation & Test Strategy' },
    { fintech: 'Regulatory Compliance', devops: 'Security & Compliance Validation' },
    { fintech: 'Algorithmic Trading', devops: 'Smart Deployment Decisions' },
    { fintech: 'Portfolio Risk Management', devops: 'System Health Assessment' },
    { fintech: 'Customer Support Automation', devops: 'Developer Assistant Chatbot' },
    { fintech: 'Personalized Banking', devops: 'Personalized Fix Strategies' },
    { fintech: 'Automated Budgeting', devops: 'Resource Optimization' },
    { fintech: 'Predictive Analytics', devops: 'Error Pattern Prediction' }
  ];

  mappings.forEach((mapping, index) => {
    console.log(`${index + 1}.  ${mapping.fintech} → ${mapping.devops}`);
  });

  console.log('\n💡 This demonstrates how financial AI intelligence can be repurposed');
  console.log('   for DevOps automation, creating a truly intelligent system!\n');
}

// Main execution
async function main(): Promise<void> {
  console.clear();

  // Show the concept first
  showFintechAIFunctionMappings();

  // Wait for user to read
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Run the demo
  await runDemo();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Demo interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the demo
if (require.main === module) {
  main().catch(console.error);
}

export { runDemo, showFintechAIFunctionMappings };
