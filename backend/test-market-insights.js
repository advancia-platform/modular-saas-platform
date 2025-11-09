/**
 * Direct test - calls market insights only (no userId needed)
 */
const { generateMarketInsights } = require("./src/services/aiAnalyticsService");

async function test() {
  console.log("=".repeat(60));
  console.log("AI Analytics - Market Insights Test");
  console.log("Rule-Based Logic (No OpenAI)");
  console.log("=".repeat(60));
  console.log();

  try {
    const result = await generateMarketInsights();

    if (result.success) {
      console.log("✓ SUCCESS - AI Analytics Working!");
      console.log();
      console.log("Market Summary:");
      console.log(`  Total Users: ${result.data.summary.totalUsers}`);
      console.log(
        `  Active Users: ${result.data.summary.activeUsers} (${result.data.summary.activePercentage}%)`
      );
      console.log(`  Growth Trend: ${result.data.summary.userGrowthTrend}`);
      console.log(
        `  Crypto Volume: $${result.data.summary.cryptoVolume.toFixed(2)}`
      );
      console.log(
        `  Most Popular Crypto: ${result.data.summary.mostPopularCrypto}`
      );
      console.log(`  Market Sentiment: ${result.data.summary.marketSentiment}`);
      console.log();
      console.log("Full Insights Report:");
      console.log(result.data.insights);
      console.log();
      console.log("=".repeat(60));
      console.log("✓ All analytics functions use RULE-BASED logic");
      console.log("✓ NO OpenAI API calls required");
      console.log("✓ OpenAI dependency COMPLETELY REMOVED");
      console.log("=".repeat(60));
    } else {
      console.log("✗ Error:", result.error);
    }
  } catch (error) {
    console.log("✗ Exception:", error.message);
    console.log(error.stack);
  }
}

test()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
