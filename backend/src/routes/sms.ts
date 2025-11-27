import express from "express";
import logger from "../logger";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import smsService from "../services/smsService";

const router = express.Router();

/**
 * GET /api/sms/business-contact
 * Get business contact information
 */
router.get("/business-contact", async (req, res) => {
  try {
    const contact = smsService.getBusinessContact();

    res.json({
      success: true,
      contact,
    });
  } catch (error: any) {
    logger.error("Failed to fetch business contact", { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/sms/send-verification
 * Send SMS verification code (authenticated users)
 */
router.post("/send-verification", authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        error: "Phone number and code are required",
      });
    }

    // Validate phone number format
    if (!smsService.isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid phone number format. Use E.164 format (e.g., +17174695102)",
      });
    }

    const result = await smsService.sendVerificationCode(phoneNumber, code);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to send SMS",
      });
    }

    res.json({
      success: true,
      messageId: result.messageId,
      message: "Verification code sent successfully",
    });
  } catch (error: any) {
    logger.error("Failed to send verification SMS", { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/sms/send-2fa
 * Send 2FA code via SMS (authenticated users)
 */
router.post("/send-2fa", authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        error: "Phone number and code are required",
      });
    }

    if (!smsService.isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone number format",
      });
    }

    const result = await smsService.send2FACode(phoneNumber, code);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to send 2FA code",
      });
    }

    res.json({
      success: true,
      messageId: result.messageId,
      message: "2FA code sent successfully",
    });
  } catch (error: any) {
    logger.error("Failed to send 2FA SMS", { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/sms/send-custom (Admin only)
 * Send custom SMS message
 */
router.post(
  "/send-custom",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { to, body } = req.body;

      if (!to || !body) {
        return res.status(400).json({
          success: false,
          error: "Recipient phone number and message body are required",
        });
      }

      if (!smsService.isValidPhoneNumber(to)) {
        return res.status(400).json({
          success: false,
          error: "Invalid phone number format",
        });
      }

      const result = await smsService.sendSMS(to, body);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to send SMS",
        });
      }

      res.json({
        success: true,
        messageId: result.messageId,
        message: "SMS sent successfully",
      });
    } catch (error: any) {
      logger.error("Failed to send custom SMS", { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

/**
 * POST /api/sms/validate-phone
 * Validate phone number format
 */
router.post("/validate-phone", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required",
      });
    }

    const isValid = smsService.isValidPhoneNumber(phoneNumber);
    const formatted = smsService.formatPhoneNumber(phoneNumber);

    res.json({
      success: true,
      isValid,
      formatted,
      original: phoneNumber,
    });
  } catch (error: any) {
    logger.error("Failed to validate phone number", { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/sms/test-send (Admin only)
 * Test SMS sending functionality
 */
router.post("/test-send", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { to } = req.body;
    const phoneNumber =
      to || process.env.BUSINESS_PHONE_NUMBER || "+17174695102";

    const testMessage = `🧪 Advancia Pay SMS Test\n\nTime: ${new Date().toLocaleString()}\n\nYour SMS integration is working! ✅`;

    const result = await smsService.sendSMS(phoneNumber, testMessage);

    res.json({
      success: true,
      result,
      note:
        result.success && result.error
          ? "Twilio not configured. Check Google Voice app for manual message."
          : "SMS sent via Twilio API",
    });
  } catch (error: any) {
    logger.error("Failed to send test SMS", { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/sms/setup-guide
 * Get SMS setup guide for integrating with Twilio
 */
router.get("/setup-guide", async (req, res) => {
  try {
    const guide = {
      title: "SMS Integration Setup Guide",
      currentNumber: process.env.BUSINESS_PHONE_NUMBER || "+17174695102",
      provider: process.env.BUSINESS_PHONE_PROVIDER || "Google Voice",

      automationOptions: [
        {
          option: "Option 1: Use Twilio with your Google Voice number",
          difficulty: "Medium",
          steps: [
            "1. Sign up at https://www.twilio.com/try-twilio",
            "2. Get $15 free trial credit",
            "3. Port your Google Voice number to Twilio (optional) OR buy new Twilio number",
            "4. Get your Account SID and Auth Token from Twilio Console",
            "5. Add to backend/.env file:",
            "   TWILIO_ACCOUNT_SID=your_account_sid",
            "   TWILIO_AUTH_TOKEN=your_auth_token",
            "   TWILIO_PHONE_NUMBER=+17174695102",
            "6. Restart backend server",
            "7. SMS will be sent automatically via API",
          ],
          cost: "$1/month per number + $0.0075 per SMS",
        },
        {
          option: "Option 2: Keep Google Voice (Manual Sending)",
          difficulty: "Easy",
          steps: [
            "1. Keep using Google Voice app on your phone",
            "2. When user requests verification, check backend logs",
            "3. Manually send SMS via Google Voice app",
            "4. User enters code in app",
          ],
          cost: "Free",
          limitations: [
            "Manual process",
            "Not scalable",
            "Slower response time",
          ],
        },
        {
          option: "Option 3: Use Vonage (Nexmo) API",
          difficulty: "Medium",
          steps: [
            "1. Sign up at https://www.vonage.com/",
            "2. Get API credentials",
            "3. Update backend to use Vonage SMS API",
            "4. Configure webhook for delivery receipts",
          ],
          cost: "$0.90/month per number + $0.006 per SMS",
        },
      ],

      currentSetup: {
        businessNumber: "+1 (717) 469-5102",
        formattedForAPI: "+17174695102",
        provider: "Google Voice",
        capabilities: ["SMS", "Voice", "Voicemail"],
        automation: process.env.TWILIO_ACCOUNT_SID
          ? "Enabled via Twilio"
          : "Manual only",
      },

      testingSteps: [
        "1. Add your phone number to backend/.env as BUSINESS_PHONE_NUMBER",
        "2. Call POST /api/sms/test-send to send test message",
        "3. Check if SMS received",
        "4. If using Twilio, verify message in Twilio Console",
        "5. If manual, check Google Voice app",
      ],

      bestPractices: [
        "Use Twilio or Vonage for production (automated, reliable)",
        "Keep Google Voice as backup communication channel",
        "Implement rate limiting for SMS endpoints",
        "Store SMS logs in database for audit trail",
        "Add opt-out mechanism for marketing messages",
        "Comply with TCPA regulations (US)",
        "Use short codes for high-volume sending",
        "Monitor SMS delivery rates and costs",
      ],
    };

    res.json({
      success: true,
      guide,
    });
  } catch (error: any) {
    logger.error("Failed to generate setup guide", { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
