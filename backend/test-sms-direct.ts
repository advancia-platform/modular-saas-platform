/**
 * Direct test of SMS messaging via Twilio
 */
import dotenv from "dotenv";
dotenv.config();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const BUSINESS_PHONE_NUMBER =
  process.env.BUSINESS_PHONE_NUMBER || "+17174695102";

async function testSMS() {
  console.log("\n=== Testing SMS via Twilio ===\n");

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.error("❌ Twilio credentials not set in .env file");
    process.exit(1);
  }

  console.log(`📱 From: ${BUSINESS_PHONE_NUMBER}`);
  console.log(`📱 To: ${BUSINESS_PHONE_NUMBER} (test to self)`);

  try {
    // Prepare Twilio API request
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = Buffer.from(
      `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`,
    ).toString("base64");

    const body = new URLSearchParams({
      From: BUSINESS_PHONE_NUMBER,
      To: BUSINESS_PHONE_NUMBER, // Send to yourself for testing
      Body: `Advancia Pay SMS Test\n\nYour verification code is: 123456\n\nThis code expires in 5 minutes.\n\nTime: ${new Date().toLocaleString()}`,
    });

    console.log("📤 Sending SMS message...\n");

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
      console.log("✅ SMS message sent successfully!");
      console.log(`   Message SID: ${data.sid}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   To: ${data.to}`);
      console.log(`   From: ${data.from}`);
      console.log(`   Price: ${data.price || "N/A"} ${data.price_unit || ""}`);
      console.log("\n📱 Check your phone for the SMS!\n");
    } else {
      console.error("❌ Failed to send SMS message");
      console.error(`   Error: ${data.message || data.error_message}`);
      console.error(`   Code: ${data.code}`);

      if (data.code === 21608) {
        console.error("\n⚠️  This phone number is not verified with Twilio!");
        console.error(
          "   For trial accounts, you need to verify phone numbers first.",
        );
        console.error(
          "   Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified\n",
        );
      }
    }
  } catch (error) {
    console.error("❌ Error testing SMS:", error);
    process.exit(1);
  }
}

testSMS();
