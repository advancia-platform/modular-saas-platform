/**
 * AI Analytics Service (Rule-Based)
 * Provides analytics insights using Prisma queries and rule-based logic.
 * No external AI dependencies required.
 */
import prisma from "../prismaClient";

/**
 * Analyze Trump Coin Wallet (Crypto Orders and Balances)
 * Replaces: supabase.from('crypto_wallets').select('*').eq('user_id', userId)
 */
export async function analyzeTrumpCoinWallet(userId: string) {
  try {
    // Get user with crypto balances
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        usdBalance: true,
        btcBalance: true,
        ethBalance: true,
        usdtBalance: true,
        createdAt: true,
      },
    });

    if (!user) {
      return {
        success: false,
        data: null,
        error: "User not found",
      };
    }

    // Get crypto orders (trump coin or any crypto purchases)
    const cryptoOrders = await prisma.cryptoOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Get crypto withdrawals
    const cryptoWithdrawals = await prisma.cryptoWithdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Calculate total crypto holdings in USD equivalent
    const btcPriceUSD = 45000; // Could be fetched from external API
    const ethPriceUSD = 2500;
    const usdtPriceUSD = 1;

    const totalCryptoValueUSD =
      parseFloat(user.btcBalance.toString()) * btcPriceUSD +
      parseFloat(user.ethBalance.toString()) * ethPriceUSD +
      parseFloat(user.usdtBalance.toString()) * usdtPriceUSD;

    // Prepare data for AI analysis
    const walletData = {
      userId: user.id,
      username: user.username,
      email: user.email,
      balances: {
        usd: user.usdBalance.toString(),
        btc: user.btcBalance.toString(),
        eth: user.ethBalance.toString(),
        usdt: user.usdtBalance.toString(),
      },
      totalCryptoValueUSD,
      ordersCount: cryptoOrders.length,
      withdrawalsCount: cryptoWithdrawals.length,
      recentOrders: cryptoOrders.slice(0, 10).map((order) => ({
        cryptoType: order.cryptoType,
        usdAmount: order.usdAmount.toString(),
        cryptoAmount: order.cryptoAmount.toString(),
        status: order.status,
        createdAt: order.createdAt,
      })),
      recentWithdrawals: cryptoWithdrawals.slice(0, 5).map((withdrawal) => ({
        cryptoType: withdrawal.cryptoType,
        cryptoAmount: withdrawal.cryptoAmount.toString(),
        usdEquivalent: withdrawal.usdEquivalent.toString(),
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
      })),
      accountAge: Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      ),
    };

    // Generate rule-based wallet analysis
    const totalValue =
      totalCryptoValueUSD + parseFloat(user.usdBalance.toString());
    const hasMultipleCryptos = [
      parseFloat(user.btcBalance.toString()) > 0,
      parseFloat(user.ethBalance.toString()) > 0,
      parseFloat(user.usdtBalance.toString()) > 0,
    ].filter(Boolean).length;

    let riskProfile = "Low";
    if (totalCryptoValueUSD > 50000) riskProfile = "High";
    else if (totalCryptoValueUSD > 10000) riskProfile = "Medium";

    let activityLevel = "Low";
    if (cryptoOrders.length > 20) activityLevel = "High";
    else if (cryptoOrders.length > 5) activityLevel = "Medium";

    const analysis = `
Wallet Analysis Summary:

Portfolio Value:
- Total Value (USD + Crypto): $${totalValue.toFixed(2)}
- USD Balance: $${parseFloat(user.usdBalance.toString()).toFixed(2)}
- Crypto Holdings Value: $${totalCryptoValueUSD.toFixed(2)}

Diversification:
- ${hasMultipleCryptos} different cryptocurrencies held
- BTC Balance: ${parseFloat(user.btcBalance.toString()).toFixed(8)} BTC
- ETH Balance: ${parseFloat(user.ethBalance.toString()).toFixed(6)} ETH
- USDT Balance: ${parseFloat(user.usdtBalance.toString()).toFixed(2)} USDT

Activity Level: ${activityLevel}
- Total Orders: ${cryptoOrders.length}
- Recent Orders: ${walletData.recentOrders.length}
- Withdrawals: ${cryptoWithdrawals.length}

Risk Profile: ${riskProfile}
Account Age: ${walletData.accountAge} days

Recommendations:
${
  hasMultipleCryptos >= 2
    ? "- Good diversification across multiple cryptocurrencies"
    : "- Consider diversifying into multiple cryptocurrencies"
}
${
  activityLevel === "High"
    ? "- Active trading detected - consider reviewing positions regularly"
    : "- Low activity - consider regular portfolio reviews"
}
${
  totalCryptoValueUSD > 1000
    ? "- Substantial holdings - ensure security measures are enabled"
    : "- Building portfolio - consider dollar-cost averaging"
}
    `.trim();

    return {
      success: true,
      data: {
        walletData,
        analysis,
        insights: {
          totalValueUSD: totalCryptoValueUSD,
          diversification: {
            btc: parseFloat(user.btcBalance.toString()) > 0,
            eth: parseFloat(user.ethBalance.toString()) > 0,
            usdt: parseFloat(user.usdtBalance.toString()) > 0,
          },
          activityLevel:
            cryptoOrders.length > 10
              ? "high"
              : cryptoOrders.length > 3
              ? "medium"
              : "low",
          accountAge: walletData.accountAge,
        },
      },
      error: null,
    };
  } catch (error) {
    console.error("Error analyzing Trump Coin wallet:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Analyze Cash Out Eligibility
 * Replaces: supabase.from('transactions').select('*').eq('user_id', userId)
 */
export async function analyzeCashOutEligibility(
  userId: string,
  requestedAmount: number
) {
  try {
    // Get user with balances
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        usdBalance: true,
        btcBalance: true,
        ethBalance: true,
        usdtBalance: true,
        active: true,
        createdAt: true,
        totpEnabled: true,
      },
    });

    if (!user) {
      return {
        success: false,
        data: null,
        error: "User not found",
      };
    }

    // Get recent transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Get pending withdrawals
    const pendingWithdrawals = await prisma.cryptoWithdrawal.findMany({
      where: {
        userId,
        status: "pending",
      },
    });

    // Get loans
    const activeLoans = await prisma.loan.findMany({
      where: {
        userId,
        status: "active",
      },
    });

    // Calculate eligibility factors
    const availableBalance = parseFloat(user.usdBalance.toString());
    const hasEnoughBalance = availableBalance >= requestedAmount;
    const accountAgeInDays = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isAccountOldEnough = accountAgeInDays >= 7; // Minimum 7 days
    const hasPendingWithdrawals = pendingWithdrawals.length > 0;
    const hasActiveLoans = activeLoans.length > 0;
    const totalLoanDebt = activeLoans.reduce(
      (sum, loan) => sum + parseFloat(loan.remainingBalance.toString()),
      0
    );

    // Transaction velocity check (fraud detection)
    const last24HoursTransactions = transactions.filter(
      (tx) => Date.now() - tx.createdAt.getTime() < 24 * 60 * 60 * 1000
    );
    const suspiciousActivity = last24HoursTransactions.length > 20;

    // Prepare data for AI analysis
    const eligibilityData = {
      userId: user.id,
      username: user.username,
      requestedAmount,
      availableBalance,
      hasEnoughBalance,
      accountAgeInDays,
      isAccountOldEnough,
      hasPendingWithdrawals,
      pendingWithdrawalsCount: pendingWithdrawals.length,
      hasActiveLoans,
      totalLoanDebt,
      last24HoursTransactionCount: last24HoursTransactions.length,
      suspiciousActivity,
      totpEnabled: user.totpEnabled,
      accountActive: user.active,
      recentTransactionTypes: last24HoursTransactions
        .slice(0, 10)
        .map((tx) => tx.type),
    };

    // Generate rule-based eligibility analysis
    let eligibilityScore = 100;
    const reasons = [];
    const warnings = [];

    if (!hasEnoughBalance) {
      eligibilityScore -= 50;
      reasons.push(
        `Insufficient balance: You have $${availableBalance.toFixed(
          2
        )}, need $${requestedAmount.toFixed(2)}`
      );
    }

    if (!isAccountOldEnough) {
      eligibilityScore -= 30;
      reasons.push(
        `Account too new: ${accountAgeInDays} days old (minimum 7 days required)`
      );
    }

    if (hasPendingWithdrawals) {
      eligibilityScore -= 20;
      reasons.push(
        `${pendingWithdrawals.length} pending withdrawal(s) must complete first`
      );
    }

    if (suspiciousActivity) {
      eligibilityScore -= 40;
      reasons.push(
        `Unusual activity: ${last24HoursTransactions.length} transactions in last 24 hours`
      );
    }

    if (!user.active) {
      eligibilityScore -= 100;
      reasons.push("Account is inactive or suspended");
    }

    if (hasActiveLoans) {
      warnings.push(
        `Active loan debt: $${totalLoanDebt.toFixed(
          2
        )} - consider payment obligations`
      );
    }

    if (!user.totpEnabled) {
      warnings.push(
        "Two-factor authentication not enabled - recommended for withdrawals"
      );
    }

    if (requestedAmount > availableBalance * 0.8) {
      warnings.push(
        "Withdrawing >80% of balance - consider maintaining reserves"
      );
    }

    const isEligible = eligibilityScore >= 70;

    const analysis = `
Cash-Out Eligibility Analysis:

Request: $${requestedAmount.toFixed(2)}
Available Balance: $${availableBalance.toFixed(2)}

Eligibility Score: ${eligibilityScore}/100
Status: ${isEligible ? "✓ APPROVED" : "✗ DENIED"}

${
  reasons.length > 0
    ? `Reasons:\n${reasons.map((r) => `- ${r}`).join("\n")}`
    : "All primary checks passed"
}

${
  warnings.length > 0
    ? `\nWarnings:\n${warnings.map((w) => `- ${w}`).join("\n")}`
    : ""
}

Account Overview:
- Account Age: ${accountAgeInDays} days
- Two-Factor Auth: ${user.totpEnabled ? "Enabled" : "Disabled"}
- Pending Withdrawals: ${pendingWithdrawals.length}
- Active Loans: ${hasActiveLoans ? `Yes ($${totalLoanDebt.toFixed(2)})` : "No"}
- Recent Activity: ${last24HoursTransactions.length} transactions (24h)

${
  isEligible
    ? "✓ You are eligible to proceed with this cash-out request."
    : "✗ Please resolve the issues above before requesting cash-out."
}
    `.trim();

    return {
      success: true,
      data: {
        isEligible,
        eligibilityScore,
        analysis,
        eligibilityData,
        reasons: reasons.length > 0 ? reasons : ["Eligible"],
        warnings,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error analyzing cash-out eligibility:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Generate Product Recommendations (Based on User Activity)
 * Replaces: supabase.from('products').select('*')
 * Note: Since there's no Product model, we'll recommend based on services
 */
export async function generateProductRecommendations(userId: string) {
  try {
    // Get user profile and activity
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        usdBalance: true,
        btcBalance: true,
        ethBalance: true,
        usdtBalance: true,
        createdAt: true,
      },
    });

    if (!user) {
      return {
        success: false,
        data: null,
        error: "User not found",
      };
    }

    // Get user's transaction history
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Get crypto orders
    const cryptoOrders = await prisma.cryptoOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Get loans
    const loans = await prisma.loan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Get MedBeds bookings
    const medBedsBookings = await prisma.medBedsBooking.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Get user tier if exists
    const userTier = await prisma.userTier.findUnique({
      where: { userId },
    });

    // Prepare user profile for AI
    const userProfile = {
      userId: user.id,
      username: user.username,
      balances: {
        usd: user.usdBalance.toString(),
        btc: user.btcBalance.toString(),
        eth: user.ethBalance.toString(),
        usdt: user.usdtBalance.toString(),
      },
      activitySummary: {
        totalTransactions: transactions.length,
        cryptoOrdersCount: cryptoOrders.length,
        loansCount: loans.length,
        medBedsBookingsCount: medBedsBookings.length,
      },
      interests: {
        crypto: cryptoOrders.length > 0,
        loans: loans.length > 0,
        medBeds: medBedsBookings.length > 0,
      },
      tier: userTier?.currentTier || "bronze",
      accountAgeInDays: Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      ),
    };

    // Define available services/products
    const availableProducts = [
      {
        id: "crypto-trading",
        name: "Crypto Trading Platform",
        category: "crypto",
        description: "Trade BTC, ETH, USDT with competitive rates",
        price: "Free",
      },
      {
        id: "debit-card",
        name: "Virtual Debit Card",
        category: "banking",
        description: "Instant virtual debit card with USD balance integration",
        price: "$1000 USD",
      },
      {
        id: "medbeds",
        name: "MedBeds Health Sessions",
        category: "health",
        description: "Recovery, Enhancement, and Diagnostic chambers available",
        price: "Starting at $50/session",
      },
      {
        id: "personal-loan",
        name: "Personal Loan",
        category: "finance",
        description: "Quick approval personal loans with flexible terms",
        price: "Variable interest rates",
      },
      {
        id: "token-wallet",
        name: "ADVANCIA Token Wallet",
        category: "crypto",
        description: "Earn and manage ADVANCIA tokens with rewards",
        price: "Free",
      },
    ];

    // Generate rule-based personalized recommendations
    const recommendations = [];

    // Crypto recommendations
    if (cryptoOrders.length > 0) {
      recommendations.push({
        product: "ADVANCIA Token Wallet",
        priority: "high",
        reason: `You've made ${cryptoOrders.length} crypto orders. Earn ADVANCIA tokens on every transaction and unlock exclusive rewards.`,
        relevance: 95,
      });
    } else {
      recommendations.push({
        product: "Crypto Trading Platform",
        priority: "medium",
        reason:
          "Start trading BTC, ETH, and USDT with competitive rates and low fees.",
        relevance: 60,
      });
    }

    // MedBeds recommendations
    if (medBedsBookings.length === 0 && userProfile.accountAgeInDays > 30) {
      recommendations.push({
        product: "MedBeds Health Sessions",
        priority: "medium",
        reason:
          "New to health services? Try our Recovery, Enhancement, or Diagnostic chambers starting at $50/session.",
        relevance: 50,
      });
    } else if (medBedsBookings.length > 3) {
      recommendations.push({
        product: "MedBeds Premium Membership",
        priority: "high",
        reason: `You've booked ${medBedsBookings.length} sessions. Consider a membership for discounted rates and priority booking.`,
        relevance: 85,
      });
    }

    // Loan recommendations
    if (loans.length === 0 && parseFloat(user.usdBalance.toString()) < 100) {
      recommendations.push({
        product: "Personal Loan",
        priority: "medium",
        reason:
          "Need quick funds? Get approved for a personal loan with flexible repayment terms.",
        relevance: 70,
      });
    }

    // Debit card recommendations
    if (
      parseFloat(user.usdBalance.toString()) > 1000 &&
      !loans.find((l) => l.status === "active")
    ) {
      recommendations.push({
        product: "Virtual Debit Card",
        priority: "high",
        reason: `You have $${parseFloat(user.usdBalance.toString()).toFixed(
          2
        )} USD. Get instant access to your funds with a virtual debit card.`,
        relevance: 90,
      });
    }

    // Tier upgrade recommendations
    if (
      userProfile.tier === "bronze" &&
      (cryptoOrders.length > 10 || transactions.length > 20)
    ) {
      recommendations.push({
        product: "Silver Tier Upgrade",
        priority: "high",
        reason:
          "You're highly active! Upgrade to Silver tier for reduced fees and exclusive benefits.",
        relevance: 88,
      });
    }

    // Sort by relevance and take top 5
    const topRecommendations = recommendations
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5);

    const recommendationsText = topRecommendations
      .map(
        (rec, idx) =>
          `${idx + 1}. ${rec.product} [${rec.priority.toUpperCase()}]\n   ${
            rec.reason
          }\n   Relevance: ${rec.relevance}%`
      )
      .join("\n\n");

    return {
      success: true,
      data: {
        userId: user.id,
        recommendations: `
Personalized Product Recommendations:

${recommendationsText}

Based on your activity:
- ${transactions.length} total transactions
- ${cryptoOrders.length} crypto orders
- ${medBedsBookings.length} MedBeds bookings
- ${loans.length} loan applications
- Current tier: ${userProfile.tier}

These recommendations are tailored to enhance your experience with services you're likely to use.
        `.trim(),
        userProfile: {
          tier: userProfile.tier,
          interests: userProfile.interests,
          accountAgeInDays: userProfile.accountAgeInDays,
        },
        availableProducts,
        structuredRecommendations: topRecommendations,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error generating product recommendations:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Generate Market Insights (General crypto and platform insights)
 * Replaces: supabase.from('orders').select('*')
 */
export async function generateMarketInsights() {
  try {
    // Get aggregate platform data
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { active: true },
    });

    // Get recent crypto orders
    const recentCryptoOrders = await prisma.cryptoOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        cryptoType: true,
        usdAmount: true,
        cryptoAmount: true,
        status: true,
        createdAt: true,
      },
    });

    // Get crypto order statistics
    const cryptoOrderStats = await prisma.cryptoOrder.groupBy({
      by: ["cryptoType", "status"],
      _count: true,
      _sum: {
        usdAmount: true,
      },
    });

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        type: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    });

    // Get loans statistics
    const loanStats = await prisma.loan.groupBy({
      by: ["status"],
      _count: true,
      _sum: {
        amount: true,
        remainingBalance: true,
      },
    });

    // Get MedBeds booking statistics
    const medBedsStats = await prisma.medBedsBooking.groupBy({
      by: ["chamberType", "status"],
      _count: true,
      _sum: {
        cost: true,
      },
    });

    // Calculate market metrics
    const totalCryptoVolume = cryptoOrderStats.reduce(
      (sum, stat) => sum + parseFloat(stat._sum.usdAmount?.toString() || "0"),
      0
    );

    const marketData = {
      timestamp: new Date().toISOString(),
      platform: {
        totalUsers,
        activeUsers,
        activeUserPercentage: ((activeUsers / totalUsers) * 100).toFixed(2),
      },
      crypto: {
        totalOrdersLast100: recentCryptoOrders.length,
        totalVolumeUSD: totalCryptoVolume,
        popularTypes: cryptoOrderStats
          .sort((a, b) => (b._count || 0) - (a._count || 0))
          .slice(0, 3)
          .map((stat) => ({
            type: stat.cryptoType,
            count: stat._count,
            volume: stat._sum.usdAmount?.toString() || "0",
          })),
      },
      transactions: {
        recentCount: recentTransactions.length,
        types: [...new Set(recentTransactions.map((tx) => tx.type))],
      },
      loans: {
        stats: loanStats.map((stat) => ({
          status: stat.status,
          count: stat._count,
          totalAmount: stat._sum.amount?.toString() || "0",
          remainingBalance: stat._sum.remainingBalance?.toString() || "0",
        })),
      },
      medBeds: {
        stats: medBedsStats.map((stat) => ({
          chamberType: stat.chamberType,
          status: stat.status,
          count: stat._count,
          totalRevenue: stat._sum.cost?.toString() || "0",
        })),
      },
    };

    // Generate rule-based market insights
    const activePercentage = parseFloat(
      ((activeUsers / totalUsers) * 100).toFixed(2)
    );

    let userGrowthTrend = "Stable";
    if (activePercentage > 75) userGrowthTrend = "Excellent";
    else if (activePercentage > 50) userGrowthTrend = "Good";
    else if (activePercentage < 30) userGrowthTrend = "Needs Attention";

    const topCrypto =
      cryptoOrderStats.length > 0
        ? cryptoOrderStats.sort((a, b) => (b._count || 0) - (a._count || 0))[0]
        : null;

    const avgOrderValue =
      cryptoOrderStats.length > 0
        ? totalCryptoVolume / recentCryptoOrders.length
        : 0;

    let marketSentiment = "Neutral";
    if (recentCryptoOrders.length > 50 && avgOrderValue > 500)
      marketSentiment = "Bullish";
    else if (recentCryptoOrders.length < 20) marketSentiment = "Bearish";

    const activeLoanCount =
      loanStats.find((s) => s.status === "active")?._count || 0;
    const completedLoanCount =
      loanStats.find((s) => s.status === "completed")?._count || 0;
    const loanRepaymentRate =
      completedLoanCount > 0
        ? (
            (completedLoanCount / (completedLoanCount + activeLoanCount)) *
            100
          ).toFixed(1)
        : 0;

    const insights = `
Platform Market Insights - ${new Date().toLocaleDateString()}

═══════════════════════════════════════════════════════════

USER METRICS:
✓ Total Users: ${totalUsers.toLocaleString()}
✓ Active Users: ${activeUsers.toLocaleString()} (${activePercentage}%)
✓ Growth Trend: ${userGrowthTrend}

CRYPTO TRADING ACTIVITY:
${
  topCrypto
    ? `• Most Popular: ${topCrypto.cryptoType} (${topCrypto._count} orders)`
    : "• No recent crypto activity"
}
• Total Volume (Last 100): $${totalCryptoVolume.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
• Average Order Value: $${avgOrderValue.toFixed(2)}
• Market Sentiment: ${marketSentiment}
• Recent Orders: ${recentCryptoOrders.length}

TRANSACTIONS:
• Recent Transaction Count: ${recentTransactions.length}
• Transaction Types: ${
      [...new Set(recentTransactions.map((tx) => tx.type))].join(", ") || "None"
    }

LENDING SERVICES:
${loanStats
  .map(
    (stat) =>
      `• ${stat.status}: ${stat._count} loans ($${parseFloat(
        stat._sum.amount?.toString() || "0"
      ).toLocaleString()})`
  )
  .join("\n")}
• Repayment Success Rate: ${loanRepaymentRate}%

MEDBEDS HEALTH SERVICES:
${
  medBedsStats.length > 0
    ? medBedsStats
        .map(
          (stat) =>
            `• ${stat.chamberType} (${stat.status}): ${
              stat._count
            } bookings ($${parseFloat(
              stat._sum.cost?.toString() || "0"
            ).toLocaleString()} revenue)`
        )
        .join("\n")
    : "• No recent MedBeds activity"
}

KEY INSIGHTS:
${
  activePercentage > 70
    ? "✓ Strong user engagement - platform health is excellent"
    : "⚠ User engagement could be improved - consider retention campaigns"
}
${
  totalCryptoVolume > 50000
    ? "✓ Healthy crypto trading volume - consider expanding crypto offerings"
    : "• Crypto trading volume is moderate - marketing campaigns may help"
}
${
  activeLoanCount > 10
    ? "⚠ High active loan count - ensure risk management protocols are followed"
    : "✓ Loan portfolio is manageable"
}
${
  medBedsStats.length > 0
    ? "✓ MedBeds services are gaining traction"
    : "• MedBeds services need promotion - consider awareness campaigns"
}

RECOMMENDATIONS:
1. ${
      activePercentage < 50
        ? "Focus on user retention and re-engagement strategies"
        : "Maintain current engagement strategies"
    }
2. ${
      totalCryptoVolume < 100000
        ? "Increase crypto trading volume through promotional offers"
        : "Crypto volume is strong - explore new trading pairs"
    }
3. ${
      loanStats.length === 0
        ? "Launch loan products to diversify revenue"
        : "Monitor loan repayment rates closely"
    }
4. ${
      medBedsStats.length === 0
        ? "Promote MedBeds services through targeted marketing"
        : "Scale MedBeds operations based on demand"
    }

═══════════════════════════════════════════════════════════
    `.trim();

    return {
      success: true,
      data: {
        marketData,
        insights,
        summary: {
          totalUsers,
          activeUsers,
          activePercentage,
          userGrowthTrend,
          cryptoVolume: totalCryptoVolume,
          mostPopularCrypto: topCrypto?.cryptoType || "N/A",
          marketSentiment,
          avgOrderValue,
          loanRepaymentRate: parseFloat(loanRepaymentRate.toString()),
        },
      },
      error: null,
    };
  } catch (error) {
    console.error("Error generating market insights:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
