/**
 * Direct test of WhatsApp messaging via Twilio
 *
 * IMPORTANT: Before running this test:
 * 1. Open WhatsApp on your phone
 * 2. Send a message to: +1 415 523 8886
 * 3. Message content: join tobacco-kitchen
 * 4. Wait for confirmation reply
 * 5. Then run this script to send a test message back
 */
import dotenv from "dotenv";
dotenv.config();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER =
  process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
const BUSINESS_PHONE_NUMBER =
  process.env.BUSINESS_PHONE_NUMBER || "+17174695102";

async function testWhatsApp() {
  console.log("\n=== Testing WhatsApp via Twilio ===\n");

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.error("❌ Twilio credentials not set in .env file");
    process.exit(1);
  }

  console.log(`📱 From: ${TWILIO_WHATSAPP_NUMBER}`);
  console.log(`📱 To: whatsapp:${BUSINESS_PHONE_NUMBER}`);
  console.log(
    "\n⚠️  IMPORTANT: Make sure you have joined the WhatsApp sandbox first!",
  );
  console.log(
    '   Send "join tobacco-kitchen" to +1 415 523 8886 on WhatsApp\n',
  );

  try {
    // Prepare Twilio API request
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = Buffer.from(
      `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`,
    ).toString("base64");

    const body = new URLSearchParams({
      From: TWILIO_WHATSAPP_NUMBER,
      To: `whatsapp:${BUSINESS_PHONE_NUMBER}`,
      Body: `✅ *WhatsApp Test Successful!*\n\nYour Advancia Pay business number is now connected to WhatsApp.\n\nTime: ${new Date().toLocaleString()}\nFrom: Advancia Pay Backend`,
    });

    console.log("📤 Sending WhatsApp message...\n");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ WhatsApp message sent successfully!");
      console.log(`   Message SID: ${data.sid}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   To: ${data.to}`);
      console.log(`   From: ${data.from}`);
      console.log("\n📱 Check your WhatsApp for the message!\n");
    } else {
      console.error("❌ Failed to send WhatsApp message");
      console.error(`   Error: ${data.message || data.error_message}`);
      console.error(`   Code: ${data.code}`);

      if (
        data.code === 63007 ||
        data.message?.includes("not a WhatsApp user")
      ) {
        console.error(
          "\n⚠️  This error means you need to join the WhatsApp sandbox first!",
        );
        console.error("   1. Open WhatsApp on your phone");
        console.error("   2. Send to: +1 415 523 8886");
        console.error("   3. Message: join tobacco-kitchen");
        console.error("   4. Wait for confirmation");
        console.error("   5. Run this test again\n");
      }
    }
  } catch (error) {
    console.error("❌ Error testing WhatsApp:", error);
    process.exit(1);
  }
}

testWhatsApp();
