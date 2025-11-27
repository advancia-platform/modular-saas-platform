import express from "express";
import logger from "../logger";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import whatsappService from "../services/whatsappService";

const router = express.Router();

/**
 * GET /api/whatsapp/setup-info
 * Get WhatsApp setup information and options
 */
router.get("/setup-info", async (req, res) => {
  try {
    const setupInfo = whatsappService.getWhatsAppSetupInfo();

    res.json({
      success: true,
      setupInfo,
    });
  } catch (error: any) {
    logger.error("Failed to fetch WhatsApp setup info", {
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/send-verification
 * Send verification code via WhatsApp
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

    const result = await whatsappService.sendWhatsAppVerificationCode(
      phoneNumber,
      code,
    );

    if (!result.success && !result.messageId) {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to send WhatsApp message",
      });
    }

    res.json({
      success: true,
      messageId: result.messageId,
      message: "Verification code sent via WhatsApp",
      note: result.error || undefined,
    });
  } catch (error: any) {
    logger.error("Failed to send WhatsApp verification", {
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/send-2fa
 * Send 2FA code via WhatsApp
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

    const result = await whatsappService.sendWhatsApp2FACode(phoneNumber, code);

    if (!result.success && !result.messageId) {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to send 2FA code",
      });
    }

    res.json({
      success: true,
      messageId: result.messageId,
      message: "2FA code sent via WhatsApp",
    });
  } catch (error: any) {
    logger.error("Failed to send WhatsApp 2FA", { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/send-custom (Admin only)
 * Send custom WhatsApp message
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

      const result = await whatsappService.sendWhatsAppMessage(to, body);

      if (!result.success && !result.messageId) {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to send WhatsApp message",
        });
      }

      res.json({
        success: true,
        messageId: result.messageId,
        message: "WhatsApp message sent successfully",
      });
    } catch (error: any) {
      logger.error("Failed to send custom WhatsApp message", {
        error: error.message,
      });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

/**
 * POST /api/whatsapp/test-send (Admin only)
 * Test WhatsApp messaging
 */
router.post("/test-send", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: "Recipient phone number is required",
      });
    }

    const testMessage = `🧪 *Advancia Pay WhatsApp Test*\n\nTime: ${new Date().toLocaleString()}\n\nYour WhatsApp integration is working! ✅`;

    const result = await whatsappService.sendWhatsAppMessage(to, testMessage);

    res.json({
      success: true,
      result,
      note: result.error
        ? "Twilio not configured. Send manually via WhatsApp Business app."
        : "WhatsApp message sent via Twilio API",
    });
  } catch (error: any) {
    logger.error("Failed to send test WhatsApp message", {
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/whatsapp/quick-setup-guide
 * Get quick setup guide for WhatsApp
 */
router.get("/quick-setup-guide", async (req, res) => {
  try {
    const guide = {
      title: "WhatsApp Business Integration - Quick Setup",
      businessNumber: process.env.BUSINESS_PHONE_NUMBER || "+17174695102",

      quickestOption: {
        name: "Twilio WhatsApp Sandbox (5 minutes)",
        steps: [
          "1. Sign up at https://www.twilio.com/try-twilio (FREE trial)",
          "2. Go to Messaging > Try it out > Send a WhatsApp message",
          "3. Follow the sandbox setup instructions",
          "4. Send 'join <your-code>' to +1 (415) 523-8886 from your WhatsApp",
          "5. Copy your Account SID and Auth Token",
          "6. Add to backend/.env:",
          "   TWILIO_ACCOUNT_SID=your_account_sid",
          "   TWILIO_AUTH_TOKEN=your_auth_token",
          "   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886",
          "7. Restart backend server",
          "8. Test with POST /api/whatsapp/test-send",
        ],
        cost: "FREE for testing",
        timeToSetup: "5 minutes",
      },

      productionOption: {
        name: "Twilio WhatsApp Production",
        steps: [
          "1. Complete sandbox setup first",
          "2. Request WhatsApp Business profile approval",
          "3. Register your business phone number",
          "4. Submit message templates for approval",
          "5. Get approved (1-3 business days)",
          "6. Update .env with your production number",
        ],
        cost: "$0.005 per message",
        timeToSetup: "1-3 business days for approval",
      },

      freeManualOption: {
        name: "WhatsApp Business App (Manual)",
        steps: [
          "1. Download WhatsApp Business from App Store/Google Play",
          "2. Register with your business number: +17174695102",
          "3. Set up business profile",
          "4. When user requests verification, check backend logs",
          "5. Manually send the code via WhatsApp Business",
          "6. User enters code in your app",
        ],
        cost: "FREE forever",
        timeToSetup: "10 minutes",
        limitations: ["Manual process", "Not scalable", "No API"],
      },

      envConfiguration: {
        required: [
          "BUSINESS_PHONE_NUMBER=+17174695102",
          "TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          "TWILIO_AUTH_TOKEN=your_auth_token",
        ],
        optional: [
          "TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886 (sandbox)",
          "TWILIO_WHATSAPP_NUMBER=whatsapp:+17174695102 (production)",
        ],
      },

      testingCommands: [
        {
          description: "Get setup info",
          method: "GET",
          endpoint: "/api/whatsapp/setup-info",
        },
        {
          description: "Send test message",
          method: "POST",
          endpoint: "/api/whatsapp/test-send",
          body: { to: "+17174695102" },
          requiresAuth: true,
        },
        {
          description: "Send verification code",
          method: "POST",
          endpoint: "/api/whatsapp/send-verification",
          body: { phoneNumber: "+17174695102", code: "123456" },
          requiresAuth: true,
        },
      ],

      comparisonWithSMS: {
        whatsapp: {
          pros: [
            "Higher open rates (98% vs 20% SMS)",
            "Rich media support (images, buttons)",
            "Free for recipients",
            "End-to-end encryption",
            "Better engagement",
          ],
          cons: [
            "Requires WhatsApp installed",
            "Template approval needed",
            "More complex setup",
          ],
        },
        sms: {
          pros: [
            "Works on all phones",
            "No app required",
            "Simpler setup",
            "Universal compatibility",
          ],
          cons: [
            "Lower open rates",
            "Costs more per message",
            "Spam filtering issues",
            "No rich media",
          ],
        },
      },

      bestPractices: [
        "Use WhatsApp for high-priority notifications",
        "Keep messages concise and clear",
        "Use SMS as fallback option",
        "Test with sandbox before production",
        "Get message template approval early",
        "Monitor delivery rates",
        "Respect user preferences",
        "Comply with WhatsApp Business policies",
      ],
    };

    res.json({
      success: true,
      guide,
    });
  } catch (error: any) {
    logger.error("Failed to generate WhatsApp setup guide", {
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
