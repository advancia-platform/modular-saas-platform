import axios from "axios";
import logger from "../logger";

/**
 * WhatsApp Business API Integration
 *
 * Alternative to Google Voice for SMS verification
 *
 * Options:
 * 1. Twilio WhatsApp API (Recommended - Easy setup)
 * 2. Meta WhatsApp Business API (Official but complex)
 * 3. WhatsApp Business App (Manual but free)
 */

interface WhatsAppMessage {
  to: string;
  body: string;
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send WhatsApp message via Twilio WhatsApp API
 * Easiest and most reliable option
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string,
): Promise<WhatsAppResponse> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber =
    process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"; // Twilio sandbox

  if (!accountSid || !authToken) {
    logger.warn(
      "Twilio not configured for WhatsApp. Message would be sent manually:",
      {
        to,
        body,
      },
    );

    return {
      success: true,
      messageId: `MANUAL_WA_${Date.now()}`,
      error: "Twilio not configured. Send manually via WhatsApp Business app.",
    };
  }

  try {
    // Format phone number for WhatsApp
    const whatsappTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        To: whatsappTo,
        From: fromNumber,
        Body: body,
      }),
      {
        auth: {
          username: accountSid,
          password: authToken,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    logger.info("WhatsApp message sent successfully", {
      to: whatsappTo,
      messageId: response.data.sid,
    });

    return {
      success: true,
      messageId: response.data.sid,
    };
  } catch (error: any) {
    logger.error("Failed to send WhatsApp message", {
      error: error.message,
      to,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send verification code via WhatsApp
 */
export async function sendWhatsAppVerificationCode(
  phoneNumber: string,
  code: string,
): Promise<WhatsAppResponse> {
  const body = `🔐 *Advancia Pay Verification Code*\n\nYour verification code is: *${code}*\n\nValid for 10 minutes.\n\nIf you didn't request this, please ignore this message.`;

  return await sendWhatsAppMessage(phoneNumber, body);
}

/**
 * Send 2FA code via WhatsApp
 */
export async function sendWhatsApp2FACode(
  phoneNumber: string,
  code: string,
): Promise<WhatsAppResponse> {
  const body = `🔒 *Advancia Pay 2FA Code*\n\nYour 2FA code is: *${code}*\n\nValid for 5 minutes.\n\n⚠️ Never share this code with anyone.`;

  return await sendWhatsAppMessage(phoneNumber, body);
}

/**
 * Send transaction notification via WhatsApp
 */
export async function sendWhatsAppTransactionNotification(
  phoneNumber: string,
  type: "deposit" | "withdrawal" | "payment",
  amount: string,
  currency: string,
): Promise<WhatsAppResponse> {
  const emoji = type === "deposit" ? "💰" : type === "withdrawal" ? "💸" : "💳";
  const body = `${emoji} *Advancia Pay Transaction Alert*\n\n*Type:* ${type.toUpperCase()}\n*Amount:* ${amount} ${currency}\n*Status:* ✅ Processed Successfully\n\nCheck your account for details.`;

  return await sendWhatsAppMessage(phoneNumber, body);
}

/**
 * Send welcome message via WhatsApp
 */
export async function sendWhatsAppWelcome(
  phoneNumber: string,
  firstName: string,
): Promise<WhatsAppResponse> {
  const body = `🎉 *Welcome to Advancia Pay, ${firstName}!*\n\nYour account is ready. Start sending & receiving crypto/fiat payments instantly.\n\n💬 Need help? Reply to this message anytime.`;

  return await sendWhatsAppMessage(phoneNumber, body);
}

/**
 * Get WhatsApp setup information
 */
export function getWhatsAppSetupInfo() {
  return {
    options: [
      {
        name: "Twilio WhatsApp API",
        difficulty: "Easy",
        cost: "Pay-as-you-go (~$0.005/message)",
        recommended: true,
        setup: [
          "1. Sign up at https://www.twilio.com/try-twilio",
          "2. Get free trial credit ($15)",
          "3. Enable WhatsApp in Twilio Console",
          "4. Use Twilio Sandbox for testing (instant)",
          "5. Apply for production WhatsApp number",
          "6. Add credentials to .env file",
        ],
        features: [
          "Programmable API",
          "Message templates",
          "Delivery receipts",
          "Media support (images, docs)",
          "Works worldwide",
        ],
      },
      {
        name: "Meta WhatsApp Business API",
        difficulty: "Hard",
        cost: "Conversation-based pricing",
        recommended: false,
        setup: [
          "1. Create Meta Business account",
          "2. Set up WhatsApp Business API access",
          "3. Get phone number verified",
          "4. Configure webhook",
          "5. Get approval for message templates",
          "6. Integrate with Facebook Business",
        ],
        features: [
          "Official Meta API",
          "Template messaging",
          "Rich media support",
          "Business features",
          "Analytics",
        ],
      },
      {
        name: "WhatsApp Business App",
        difficulty: "Easy",
        cost: "FREE",
        recommended: false,
        setup: [
          "1. Download WhatsApp Business from app store",
          "2. Register with your business phone number",
          "3. Set up business profile",
          "4. Manually send verification codes when requested",
        ],
        features: [
          "Completely free",
          "Manual messaging",
          "Business profile",
          "Quick replies",
          "Labels & automation",
        ],
        limitations: [
          "Manual process",
          "Not scalable",
          "No API access",
          "Slower response time",
        ],
      },
    ],
    currentConfig: {
      enabled: !!process.env.TWILIO_ACCOUNT_SID,
      provider: process.env.TWILIO_ACCOUNT_SID
        ? "Twilio WhatsApp API"
        : "Manual",
      sandboxNumber: "whatsapp:+14155238886",
      note: process.env.TWILIO_ACCOUNT_SID
        ? "WhatsApp enabled via Twilio"
        : "Configure Twilio for automated WhatsApp messaging",
    },
  };
}

/**
 * Format phone number for WhatsApp
 */
export function formatWhatsAppNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Add +1 if US number without country code
  let formatted = digits;
  if (digits.length === 10) {
    formatted = `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    formatted = `+${digits}`;
  } else if (!formatted.startsWith("+")) {
    formatted = `+${digits}`;
  }

  return `whatsapp:${formatted}`;
}

export default {
  sendWhatsAppMessage,
  sendWhatsAppVerificationCode,
  sendWhatsApp2FACode,
  sendWhatsAppTransactionNotification,
  sendWhatsAppWelcome,
  getWhatsAppSetupInfo,
  formatWhatsAppNumber,
};
