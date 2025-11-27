import express from "express";
import logger from "../logger";
import {
  FREE_PHONE_SERVICES,
  PREMIUM_PHONE_SERVICES,
  generateVirtualNumber,
} from "../services/virtualPhone";

const router = express.Router();

/**
 * GET /api/phone/free-services
 * Get list of free phone number services
 */
router.get("/free-services", async (req, res) => {
  try {
    res.json({
      success: true,
      services: FREE_PHONE_SERVICES,
      recommendation:
        "For business use, we recommend Google Voice (US) or TextNow (US/CA) for free options",
    });
  } catch (error: any) {
    logger.error("Failed to fetch free services", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to fetch services",
    });
  }
});

/**
 * GET /api/phone/premium-services
 * Get list of premium/paid phone services
 */
router.get("/premium-services", async (req, res) => {
  try {
    res.json({
      success: true,
      services: PREMIUM_PHONE_SERVICES,
      recommendation:
        "For production, use Twilio or Vonage for reliability and compliance",
    });
  } catch (error: any) {
    logger.error("Failed to fetch premium services", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to fetch services",
    });
  }
});

/**
 * POST /api/phone/generate
 * Generate a virtual phone number (development/testing)
 */
router.post("/generate", async (req, res) => {
  try {
    const { countryCode = "US" } = req.body;

    const virtualNumber = await generateVirtualNumber(countryCode);

    res.json({
      success: true,
      number: virtualNumber,
      warning:
        "This is a test number. For production, use a paid service like Twilio.",
    });
  } catch (error: any) {
    logger.error("Failed to generate virtual number", { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/phone/business-setup-guide
 * Get setup guide for business phone numbers
 */
router.get("/business-setup-guide", async (req, res) => {
  try {
    const guide = {
      title: "Business Phone Number Setup Guide",

      freeOptions: {
        title: "Free Options (Good for Starting)",
        recommended: [
          {
            service: "Google Voice",
            steps: [
              "1. Go to https://voice.google.com/",
              "2. Sign in with Gmail account",
              "3. Choose a US phone number",
              "4. Verify with existing phone",
              "5. Start using for business calls/SMS",
            ],
            limitations: [
              "US only",
              "Requires existing phone for verification",
              "Limited to personal use terms",
            ],
            best_for: "US-based small businesses, startups",
          },
          {
            service: "TextNow",
            steps: [
              "1. Visit https://www.textnow.com/",
              "2. Sign up with email",
              "3. Choose US or Canadian number",
              "4. Download app (optional)",
              "5. Start receiving SMS/calls",
            ],
            limitations: [
              "Ad-supported",
              "May reclaim inactive numbers",
              "Internet connection required",
            ],
            best_for: "Testing, development, temporary business use",
          },
        ],
      },

      paidOptions: {
        title: "Paid Options (Recommended for Production)",
        recommended: [
          {
            service: "Twilio",
            pricing: "$1/month + $0.0075/SMS",
            steps: [
              "1. Sign up at https://www.twilio.com/try-twilio",
              "2. Verify your email and phone",
              "3. Get $15 free trial credit",
              "4. Buy a phone number ($1/month)",
              "5. Configure webhooks for your app",
              "6. Set up environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN",
            ],
            features: [
              "Programmable",
              "Worldwide coverage",
              "SMS/Voice/Video",
              "Excellent documentation",
            ],
            best_for: "Serious businesses, scalable apps, international reach",
          },
        ],
      },

      integration: {
        title: "How to Integrate with Advancia Pay",
        steps: [
          "1. Choose a phone service (Google Voice for free, Twilio for production)",
          "2. Get your phone number",
          "3. Add to backend/.env file:",
          "   BUSINESS_PHONE=+1XXXXXXXXXX",
          "   TWILIO_ACCOUNT_SID=your_account_sid (if using Twilio)",
          "   TWILIO_AUTH_TOKEN=your_auth_token (if using Twilio)",
          "4. Restart backend server",
          "5. Configure webhooks in Twilio dashboard (if using Twilio)",
          "6. Test SMS/voice notifications",
        ],
      },

      bestPractices: [
        "Use a dedicated business number (not personal)",
        "Set up professional voicemail",
        "Enable SMS for 2FA and notifications",
        "Keep number consistent for brand identity",
        "Monitor usage and costs",
        "Have backup communication channels",
        "Comply with local telecom regulations",
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
