/**
 * Direct test of AI Analytics Service functions
 * Tests the rule-based logic without HTTP/auth layer
 */

import {
  analyzeTrumpCoinWallet,
  analyzeCashOutEligibility,
  generateProductRecommendations,
  generateMarketInsights,
} from "./src/services/aiAnalyticsService";

async function testAIAnalyticsService() {
  console.log("=".repeat(60));
  console.log("AI Analytics Service Direct Test");
  console.log("Rule-Based Logic (No OpenAI Required)");
  console.log("=".repeat(60));
  console.log();

  // Test with a known user ID from your database
  // Replace with actual user ID
  const testUserId = "cm3p1hj1n0000kx68mq2tvp9p";

  // Test 1: Market Insights (no userId required)
  console.log("Test 1: Market Insights");
  console.log("-".repeat(60));
  try {
    const marketResult = await generateMarketInsights();
    if (marketResult.success) {
      console.log("✓ Status: Success");
      console.log("\nMarket Summary:");
      console.log(`  Total Users: ${marketResult.data.summary.totalUsers}`);
      console.log(
        `  Active Users: ${marketResult.data.summary.activeUsers} (${marketResult.data.summary.activePercentage}%)`
      );
      console.log(
        `  Growth Trend: ${marketResult.data.summary.userGrowthTrend}`
      );
      console.log(
        `  Crypto Volume: $${marketResult.data.summary.cryptoVolume}`
      );
      console.log(
        `  Most Popular Crypto: ${marketResult.data.summary.mostPopularCrypto}`
      );
      console.log(
        `  Market Sentiment: ${marketResult.data.summary.marketSentiment}`
      );
      console.log("\nInsights Preview:");
      console.log(marketResult.data.insights.substring(0, 400) + "...");
    } else {
      console.log(`✗ Error: ${marketResult.error}`);
    }
  } catch (error: any) {
    console.log(`✗ Exception: ${error.message}`);
  }
  console.log();

  // Test 2: Wallet Analysis (requires valid userId)
  console.log("Test 2: Wallet Analysis");
  console.log("-".repeat(60));
  try {
    const walletResult = await analyzeTrumpCoinWallet(testUserId);
    if (walletResult.success) {
      console.log("✓ Status: Success");
      console.log("\nWallet Data:");
      console.log(`  USD Balance: ${walletResult.data.walletData.usdBalance}`);
      console.log(`  BTC Balance: ${walletResult.data.walletData.btcBalance}`);
      console.log(`  ETH Balance: ${walletResult.data.walletData.ethBalance}`);
      console.log(
        `  Recent Orders: ${walletResult.data.walletData.recentOrders.length}`
      );
      console.log("\nAnalysis Preview:");
      console.log(walletResult.data.analysis.substring(0, 300) + "...");
    } else {
      console.log(`✗ Error: ${walletResult.error}`);
    }
  } catch (error: any) {
    console.log(`✗ Exception: ${error.message}`);
  }
  console.log();

  // Test 3: Cash-Out Eligibility
  console.log("Test 3: Cash-Out Eligibility");
  console.log("-".repeat(60));
  try {
    const cashoutResult = await analyzeCashOutEligibility(testUserId, 100);
    if (cashoutResult.success) {
      console.log("✓ Status: Success");
      console.log("\nEligibility Result:");
      console.log(`  Eligible: ${cashoutResult.data.isEligible}`);
      console.log(`  Score: ${cashoutResult.data.eligibilityScore}/100`);
      console.log(`  Requested Amount: $100`);
      console.log("\nAnalysis Preview:");
      console.log(cashoutResult.data.analysis.substring(0, 300) + "...");
      if (cashoutResult.data.reasons.length > 0) {
        console.log("\nReasons:");
        cashoutResult.data.reasons.forEach((r: string) =>
          console.log(`  - ${r}`)
        );
      }
    } else {
      console.log(`✗ Error: ${cashoutResult.error}`);
    }
  } catch (error: any) {
    console.log(`✗ Exception: ${error.message}`);
  }
  console.log();

  // Test 4: Product Recommendations
  console.log("Test 4: Product Recommendations");
  console.log("-".repeat(60));
  try {
    const recsResult = await generateProductRecommendations(testUserId);
    if (recsResult.success) {
      console.log("✓ Status: Success");
      console.log("\nUser Profile:");
      console.log(`  Tier: ${recsResult.data.userProfile.tier}`);
      console.log(
        `  Account Age: ${recsResult.data.userProfile.accountAgeInDays} days`
      );
      console.log("\nRecommendations Preview:");
      console.log(recsResult.data.recommendations.substring(0, 400) + "...");
      if (recsResult.data.structuredRecommendations) {
        console.log("\nTop 3 Recommendations:");
        recsResult.data.structuredRecommendations
          .slice(0, 3)
          .forEach((rec: any) => {
            console.log(
              `  [${rec.priority.toUpperCase()}] ${rec.product} - Relevance: ${
                rec.relevance
              }%`
            );
          });
      }
    } else {
      console.log(`✗ Error: ${recsResult.error}`);
    }
  } catch (error: any) {
    console.log(`✗ Exception: ${error.message}`);
  }

  console.log();
  console.log("=".repeat(60));
  console.log("✓ All AI Analytics Functions Tested");
  console.log("✓ No OpenAI API Calls Required");
  console.log("✓ Pure Rule-Based Logic");
  console.log("=".repeat(60));
}

testAIAnalyticsService()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
