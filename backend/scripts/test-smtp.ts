#!/usr/bin/env tsx
/**
 * Quick SMTP test script
 * Usage: tsx scripts/test-smtp.ts recipient@example.com
 */

import * as nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || EMAIL_USER;

async function testSmtp(recipientEmail: string) {
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.error("❌ Missing EMAIL_USER or EMAIL_PASSWORD in .env");
    console.log("   Please set these environment variables:");
    console.log("   EMAIL_USER=your-gmail@gmail.com");
    console.log("   EMAIL_PASSWORD=your-16-char-app-password");
    process.exit(1);
  }

  console.log("📧 Testing SMTP configuration...");
  console.log(`   From: ${EMAIL_FROM}`);
  console.log(`   Reply-To: ${EMAIL_REPLY_TO}`);
  console.log(`   To: ${recipientEmail}`);
  console.log(`   SMTP: Gmail (${EMAIL_USER})\n`);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      replyTo: EMAIL_REPLY_TO,
      to: recipientEmail,
      subject: "✅ SMTP Test from Advancia",
      text: `This is a test email sent from the Advancia backend.\n\nIf you received this, your SMTP configuration is working correctly!\n\nConfiguration:\n- From: ${EMAIL_FROM}\n- Reply-To: ${EMAIL_REPLY_TO}\n- Authenticated as: ${EMAIL_USER}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #10B981; margin-top: 0;">✅ SMTP Test Successful</h2>
            <p style="color: #374151; line-height: 1.6; font-size: 16px;">
              This is a test email sent from the Advancia backend. If you received this, your SMTP configuration is working correctly!
            </p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="font-size: 14px; color: #6B7280;">
              <strong>Configuration:</strong><br />
              From: ${EMAIL_FROM}<br />
              Reply-To: ${EMAIL_REPLY_TO}<br />
              Authenticated as: ${EMAIL_USER}
            </p>
          </div>
        </div>
      `,
    });

    console.log("✅ Email sent successfully!");
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    console.log("\n🎉 SMTP configuration is working correctly!");
  } catch (error: any) {
    console.error("❌ Failed to send email:");
    console.error(`   Error: ${error.message}`);

    if (error.code === "EAUTH") {
      console.log("\n💡 Authentication failed. Please check:");
      console.log("   1. EMAIL_USER is your Gmail address");
      console.log(
        "   2. EMAIL_PASSWORD is an App Password (not your regular password)"
      );
      console.log(
        "   3. Create an App Password at: https://myaccount.google.com/apppasswords"
      );
    }

    process.exit(1);
  }
}

// Get recipient from command line args
const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.error("❌ Usage: tsx scripts/test-smtp.ts recipient@example.com");
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(recipientEmail)) {
  console.error("❌ Invalid email address format");
  process.exit(1);
}

testSmtp(recipientEmail);
