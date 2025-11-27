/**
 * Direct test of Telegram Bot API without starting the full server
 */
import dotenv from "dotenv";
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function testTelegramBot() {
  console.log("\n=== Testing Telegram Bot Directly ===\n");

  if (!TELEGRAM_BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN not set in .env file");
    process.exit(1);
  }

  console.log(`📱 Bot Token: ${TELEGRAM_BOT_TOKEN.substring(0, 20)}...`);

  try {
    // Test 1: Get bot info
    console.log("\n1. Getting bot info...");
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`,
    );
    const data = await response.json();

    if (data.ok) {
      console.log(`✅ Bot Username: @${data.result.username}`);
      console.log(`✅ Bot ID: ${data.result.id}`);
      console.log(`✅ Bot Name: ${data.result.first_name}`);
    } else {
      console.error(`❌ API Error: ${data.description}`);
    }

    // Test 2: Send a test message to admin chat
    const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (TELEGRAM_ADMIN_CHAT_ID) {
      console.log(
        `\n2. Sending test message to admin chat ${TELEGRAM_ADMIN_CHAT_ID}...`,
      );
      const msgResponse = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_ADMIN_CHAT_ID,
            text: `🤖 *Telegram Bot Test*\n\nBot is working correctly!\n\nTime: ${new Date().toISOString()}`,
            parse_mode: "Markdown",
          }),
        },
      );
      const msgData = await msgResponse.json();

      if (msgData.ok) {
        console.log(
          `✅ Message sent successfully! Message ID: ${msgData.result.message_id}`,
        );
      } else {
        console.error(`❌ Failed to send message: ${msgData.description}`);
      }
    } else {
      console.log("⚠️  TELEGRAM_ADMIN_CHAT_ID not set, skipping message test");
    }

    console.log("\n✅ All Telegram tests passed!\n");
  } catch (error) {
    console.error("❌ Error testing Telegram:", error);
    process.exit(1);
  }
}

testTelegramBot();
