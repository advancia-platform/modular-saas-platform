/**
 * Simple AI Agent Test
 * Quick verification that our AI components work
 */

const CyberAIAgent = require("./CyberAIAgent");

async function quickTest() {
  console.log("🚀 Quick AI Agent Test...\n");

  try {
    const aiAgent = new CyberAIAgent({
      agentId: "test-agent",
      autoResponse: true,
    });

    console.log("🤖 Initializing AI Agent...");
    await aiAgent.initialize();
    console.log("✅ AI Agent initialized successfully!");

    // Test threat analysis
    const testThreat = {
      source: "test",
      type: "sql_injection",
      payload: "' OR 1=1; DROP TABLE users; --",
      sourceIP: "192.168.1.100",
      timestamp: new Date(),
      severity: "high",
    };

    console.log("\n🔍 Testing threat analysis...");
    const analysis = await aiAgent.analyzeThreat(testThreat);

    console.log(`✅ Analysis completed: ${analysis.analysisId}`);
    console.log(`   Risk Score: ${analysis.riskScore.toFixed(3)}`);
    console.log(`   Classification: ${analysis.mlClassification}`);
    console.log(
      `   Recommended Actions: ${analysis.recommendedActions.length}`,
    );

    // Show final status
    const status = aiAgent.getStatus();
    console.log("\n📊 Agent Status:");
    console.log(`   Threats Analyzed: ${status.metrics.threatsAnalyzed}`);
    console.log(`   Status: ${status.status}`);

    console.log("\n🎉 Quick test completed successfully!");
    console.log("🚀 Week 5: AI Core System - FUNCTIONAL!\n");

    await aiAgent.shutdown();
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

quickTest();
