/**
 * Telegram bot for AI-powered trust analysis
 * Per Advancia Pay: Secure webhook handling, audit logging
 */

import TelegramBot from "node-telegram-bot-api";
import { config } from "../config";
import logger from "../logger";
import { calculateTrustScore, getUserReputation } from "./trustScoreService";

let bot: TelegramBot | null = null;

export function initializeTelegramBot() {
  if (!config.telegram.botToken) {
    logger.warn("Telegram bot token not configured - bot disabled");
    return;
  }

  bot = new TelegramBot(config.telegram.botToken, { polling: true });

  // Command: /trustscore <userId>
  bot.onText(/\/trustscore (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = match?.[1];

    if (!userId) {
      bot?.sendMessage(chatId, "❌ Please provide a user ID");
      return;
    }

    try {
      const trustScore = await calculateTrustScore(userId);

      const riskEmoji =
        trustScore.riskLevel === "low"
          ? "🟢"
          : trustScore.riskLevel === "medium"
            ? "🟡"
            : trustScore.riskLevel === "high"
              ? "🟠"
              : "🔴";

      const message = `
🔒 *Advancia Pay Trust Score*

${riskEmoji} Overall Score: *${trustScore.overall}/100*
Risk Level: *${trustScore.riskLevel.toUpperCase()}*

📊 Breakdown:
• Transaction History: ${trustScore.transactionHistory}/25
• Account Age: ${trustScore.accountAge}/25
• Verification Level: ${trustScore.verificationLevel}/25
• Community Rating: ${trustScore.communityRating}/25

${trustScore.fraudIndicators.length > 0 ? `\n⚠️ Fraud Indicators:\n${trustScore.fraudIndicators.map((i) => `• ${i}`).join("\n")}` : ""}
      `;

      bot?.sendMessage(chatId, message, { parse_mode: "Markdown" });

      logger.info("Trust score sent via Telegram", { userId, chatId });
    } catch (error: any) {
      bot?.sendMessage(chatId, `❌ Error: ${error.message}`);
      logger.error("Telegram trust score error", {
        error: error.message,
        userId,
      });
    }
  });

  // Command: /reputation <userId>
  bot.onText(/\/reputation (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = match?.[1];

    if (!userId) {
      bot?.sendMessage(chatId, "❌ Please provide a user ID");
      return;
    }

    try {
      const reputation = await getUserReputation(userId);

      const message = `
👤 *User Reputation Report*

📈 Statistics:
• Total Transactions: ${reputation.totalTransactions}
• Success Rate: ${reputation.totalTransactions > 0 ? Math.round((reputation.successfulTransactions / reputation.totalTransactions) * 100) : 0}%
• Account Age: ${reputation.accountAgeInDays} days
• Average Transaction: $${reputation.averageTransactionAmount.toString()}

✅ Verification:
• Email: ${reputation.verificationStatus.email ? "✅" : "❌"}
• Phone: ${reputation.verificationStatus.phone ? "✅" : "❌"}
• KYC: ${reputation.verificationStatus.kyc ? "✅" : "❌"}
• 2FA: ${reputation.verificationStatus.twoFactor ? "✅" : "❌"}

⭐ Community:
• Reviews: ${reputation.communityReviews}
• Average Rating: ${reputation.averageRating.toFixed(1)}/5.0

🔒 Trust Score: *${reputation.trustScore.overall}/100*
      `;

      bot?.sendMessage(chatId, message, { parse_mode: "Markdown" });

      logger.info("Reputation sent via Telegram", { userId, chatId });
    } catch (error: any) {
      bot?.sendMessage(chatId, `❌ Error: ${error.message}`);
      logger.error("Telegram reputation error", {
        error: error.message,
        userId,
      });
    }
  });

  // Command: /help
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
🤖 *Advancia Pay Trust Bot Commands*

/trustscore <userId> - Get AI trust score
/reputation <userId> - Get full reputation report
/help - Show this help message

Example: \`/trustscore abc123\`
    `;

    bot?.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
  });

  logger.info("Telegram trust bot initialized");
}

export function getTelegramBot(): TelegramBot | null {
  return bot;
}
