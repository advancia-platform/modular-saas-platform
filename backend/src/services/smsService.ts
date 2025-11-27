import axios from "axios";
import logger from "../logger";

/**
 * SMS Service for sending verification codes and business notifications
 *
 * Business Number: +1 (717) 469-5102 (Google Voice)
 *
 * SMS Providers:
 * 1. Twilio (Primary for production) - Programmable SMS API
 * 2. Google Voice (Manual verification) - Your current number
 * 3. Vonage/Nexmo (Alternative)
 *
 * For automated SMS with Google Voice number:
 * - Port number to Twilio/Vonage
 * - OR use Google Voice API (unofficial, limited)
 * - OR use Twilio with your Google Voice as From number (after porting)
 */

interface SMSMessage {
  to: string;
  body: string;
  from?: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send SMS using Twilio (Production)
 */
export async function sendSMS(to: string, body: string): Promise<SMSResponse> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber =
    process.env.TWILIO_PHONE_NUMBER || process.env.BUSINESS_PHONE_NUMBER;

  // If Twilio is not configured, log the message for manual sending
  if (!accountSid || !authToken) {
    logger.warn("Twilio not configured. SMS would be sent manually:", {
      to,
      from: fromNumber,
      body,
    });

    return {
      success: true,
      messageId: `MANUAL_${Date.now()}`,
      error: "Twilio not configured. Send manually via Google Voice app.",
    };
  }

  try {
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        To: to,
        From: fromNumber!,
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

    logger.info("SMS sent successfully", {
      to,
      messageId: response.data.sid,
    });

    return {
      success: true,
      messageId: response.data.sid,
    };
  } catch (error: any) {
    logger.error("Failed to send SMS", {
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
 * Send verification code via SMS
 */
export async function sendVerificationCode(
  phoneNumber: string,
  code: string,
): Promise<SMSResponse> {
  const body = `Your Advancia Pay verification code is: ${code}\n\nValid for 10 minutes.\n\nIf you didn't request this, please ignore.`;

  return await sendSMS(phoneNumber, body);
}

/**
 * Send 2FA code via SMS
 */
export async function send2FACode(
  phoneNumber: string,
  code: string,
): Promise<SMSResponse> {
  const body = `Your Advancia Pay 2FA code is: ${code}\n\nValid for 5 minutes.`;

  return await sendSMS(phoneNumber, body);
}

/**
 * Send transaction notification via SMS
 */
export async function sendTransactionNotification(
  phoneNumber: string,
  type: "deposit" | "withdrawal" | "payment",
  amount: string,
  currency: string,
): Promise<SMSResponse> {
  const body = `Advancia Pay Alert: ${type.toUpperCase()} of ${amount} ${currency} processed successfully.\n\nCheck your account for details.`;

  return await sendSMS(phoneNumber, body);
}

/**
 * Send withdrawal approval request to admin
 */
export async function sendWithdrawalApprovalRequest(
  amount: string,
  currency: string,
  userId: string,
): Promise<SMSResponse> {
  const adminPhone =
    process.env.ADMIN_PHONE_NUMBER || process.env.BUSINESS_PHONE_NUMBER;

  if (!adminPhone) {
    logger.warn("Admin phone not configured for withdrawal approval");
    return {
      success: false,
      error: "Admin phone not configured",
    };
  }

  const body = `🔔 Withdrawal Approval Needed\n\nAmount: ${amount} ${currency}\nUser: ${userId}\n\nLogin to dashboard to approve/reject.`;

  return await sendSMS(adminPhone, body);
}

/**
 * Send welcome SMS to new user
 */
export async function sendWelcomeSMS(
  phoneNumber: string,
  firstName: string,
): Promise<SMSResponse> {
  const body = `Welcome to Advancia Pay, ${firstName}! 🎉\n\nYour account is ready. Start sending & receiving crypto/fiat payments instantly.\n\nNeed help? Reply to this number.`;

  return await sendSMS(phoneNumber, body);
}

/**
 * Format phone number to E.164 format
 * Example: (717) 469-5102 -> +17174695102
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Add +1 if US number without country code
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Add + if missing
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // Return as-is if already in correct format
  return phone.startsWith("+") ? phone : `+${digits}`;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // E.164 format: +[country code][number] (max 15 digits)
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(formatted);
}

/**
 * Get business contact information
 */
export function getBusinessContact() {
  return {
    phoneNumber: process.env.BUSINESS_PHONE_NUMBER || "+17174695102",
    provider: process.env.BUSINESS_PHONE_PROVIDER || "Google Voice",
    email: process.env.BUSINESS_EMAIL || "support@advanciapayledger.com",
    capabilities: {
      sms: true,
      voice: true,
      automated: !!process.env.TWILIO_ACCOUNT_SID,
    },
    notes: process.env.TWILIO_ACCOUNT_SID
      ? "Automated SMS via Twilio"
      : "Manual SMS via Google Voice app - Consider Twilio for automation",
  };
}

export default {
  sendSMS,
  sendVerificationCode,
  send2FACode,
  sendTransactionNotification,
  sendWithdrawalApprovalRequest,
  sendWelcomeSMS,
  formatPhoneNumber,
  isValidPhoneNumber,
  getBusinessContact,
};
