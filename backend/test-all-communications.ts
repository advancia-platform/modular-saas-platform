/**
 * Comprehensive test of all communication services
 * Tests: Telegram, SMS, and WhatsApp
 */
import dotenv from "dotenv";
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER =
  process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
const BUSINESS_PHONE_NUMBER =
  process.env.BUSINESS_PHONE_NUMBER || "+17174695102";

async function testAllServices() {
  console.log(
    "\n╔════════════════════════════════════════════════════════════╗",
  );
  console.log("║  Advancia Pay - Communication Services Integration Test  ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n",
  );

  let allPassed = true;

  // Test 1: Telegram Bot
  console.log("📱 TEST 1: Telegram Bot");
  console.log("─".repeat(60));
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.log("❌ TELEGRAM_BOT_TOKEN not configured\n");
      allPassed = false;
    } else {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`,
      );
      const data = await response.json();

      if (data.ok) {
        console.log(`✅ Bot Active: @${data.result.username}`);
        console.log(`   Bot ID: ${data.result.id}`);
        console.log(`   Bot Name: ${data.result.first_name}\n`);
      } else {
        console.log(`❌ Bot Error: ${data.description}\n`);
        allPassed = false;
      }
    }
  } catch (error) {
    console.log(`❌ Telegram test failed: ${error}\n`);
    allPassed = false;
  }

  // Test 2: Twilio Account
  console.log("📱 TEST 2: Twilio Account");
  console.log("─".repeat(60));
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      console.log("❌ Twilio credentials not configured\n");
      allPassed = false;
    } else {
      const auth = Buffer.from(
        `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`,
      ).toString("base64");
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}.json`,
        { headers: { Authorization: `Basic ${auth}` } },
      );
      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Twilio Account Active`);
        console.log(`   Account SID: ${data.sid}`);
        console.log(`   Status: ${data.status}`);
        console.log(`   Type: ${data.type}\n`);
      } else {
        console.log(`❌ Twilio Error: ${data.message}\n`);
        allPassed = false;
      }
    }
  } catch (error) {
    console.log(`❌ Twilio test failed: ${error}\n`);
    allPassed = false;
  }

  // Test 3: WhatsApp Sandbox Status
  console.log("📱 TEST 3: WhatsApp Sandbox");
  console.log("─".repeat(60));
  console.log(`   Sandbox Number: +1 415 523 8886`);
  console.log(`   Join Code: tobacco-kitchen`);
  console.log(`   Your Business Number: ${BUSINESS_PHONE_NUMBER}`);
  console.log("\n   ⚠️  ACTION REQUIRED:");
  console.log("   1. Open WhatsApp on your phone");
  console.log("   2. Send to: +1 415 523 8886");
  console.log("   3. Message: join tobacco-kitchen");
  console.log("   4. Wait for confirmation reply");
  console.log("   5. Then run: npm run test:whatsapp\n");

  // Test 4: SMS Capability
  console.log("📱 TEST 4: SMS Capability");
  console.log("─".repeat(60));
  console.log(`   From Number: ${BUSINESS_PHONE_NUMBER}`);
  console.log(`   Provider: Twilio`);
  console.log("\n   ℹ️  To test SMS:");
  console.log("   Run: npm run test:sms\n");

  // Summary
  console.log("═".repeat(60));
  if (allPassed) {
    console.log("✅ All configured services are operational!");
  } else {
    console.log("⚠️  Some services need configuration or have errors");
  }
  console.log("═".repeat(60));

  console.log("\n📋 Quick Commands:");
  console.log("   • Test Telegram:  npm run test:telegram");
  console.log("   • Test SMS:       npm run test:sms");
  console.log("   • Test WhatsApp:  npm run test:whatsapp");
  console.log("   • Test All:       npm run test:communications\n");

  console.log("📚 Environment Variables Configured:");
  console.log(
    `   • TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN ? "✅ Set" : "❌ Missing"}`,
  );
  console.log(
    `   • TELEGRAM_ADMIN_CHAT_ID: ${TELEGRAM_ADMIN_CHAT_ID ? "✅ Set" : "⚠️  Optional"}`,
  );
  console.log(
    `   • TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID ? "✅ Set" : "❌ Missing"}`,
  );
  console.log(
    `   • TWILIO_AUTH_TOKEN: ${TWILIO_AUTH_TOKEN ? "✅ Set" : "❌ Missing"}`,
  );
  console.log(
    `   • BUSINESS_PHONE_NUMBER: ${BUSINESS_PHONE_NUMBER ? "✅ Set" : "❌ Missing"}`,
  );
  console.log();
}

testAllServices();
