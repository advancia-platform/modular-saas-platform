import express from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import {
  deleteWebhook,
  getBotInfo,
  sendTelegram2FACode,
  sendTelegramAdminAlert,
  sendTelegramMessage,
  sendTelegramTransactionNotification,
  sendTelegramVerificationCode,
  sendTelegramWelcome,
  sendTelegramWithdrawalApproval,
  setWebhook,
} from "../services/telegramService";

const router = express.Router();
const safeAuth: any =
  typeof authenticateToken === "function"
    ? authenticateToken
    : (_req: any, _res: any, next: any) => next();
const safeAdmin: any =
  typeof requireAdmin === "function"
    ? requireAdmin
    : (_req: any, _res: any, next: any) => next();

// GET /api/admin/telegram/me - verify bot info
router.get("/me", safeAuth, safeAdmin, async (req, res) => {
  try {
    const me = await getBotInfo();
    return res.json(me);
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: e?.message || "Failed to fetch bot info" });
  }
});

// POST /api/admin/telegram/send - send a test message
router.post("/send", safeAuth, safeAdmin, async (req, res) => {
  try {
    const { chatId, text } = req.body || {};
    if (!chatId || !text)
      return res.status(400).json({ error: "chatId and text required" });
    const resp = await sendTelegramMessage(chatId, text);
    return res.json(resp);
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: e?.message || "Failed to send message" });
  }
});

export default router;

// Admin webhook setup
router.post("/webhook", safeAuth, safeAdmin, async (req, res) => {
  try {
    const { publicUrl, secret } = req.body || {};
    const url = `${publicUrl.replace(/\/$/, "")}/api/telegram/webhook`;
    const resp = await setWebhook(
      url,
      secret || process.env.TELEGRAM_WEBHOOK_SECRET,
    );
    return res.json({ set: true, url, resp });
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: e?.message || "Failed to set webhook" });
  }
});

router.delete("/webhook", safeAuth, safeAdmin, async (_req, res) => {
  try {
    const resp = await deleteWebhook();
    return res.json({ deleted: true, resp });
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: e?.message || "Failed to delete webhook" });
  }
});

// ==================== BUSINESS MESSAGING ROUTES ====================

/**
 * POST /api/admin/telegram/send-verification
 * Send verification code to user
 */
router.post("/send-verification", safeAuth, async (req, res) => {
  try {
    const { chatId, code, phoneNumber } = req.body;
    if (!chatId || !code || !phoneNumber) {
      return res.status(400).json({
        error: "chatId, code, and phoneNumber are required",
      });
    }

    const result = await sendTelegramVerificationCode(
      chatId,
      code,
      phoneNumber,
    );
    return res.json({
      success: true,
      message: "Verification code sent successfully",
      result,
    });
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message || "Failed to send verification code",
    });
  }
});

/**
 * POST /api/admin/telegram/send-2fa
 * Send 2FA code to user
 */
router.post("/send-2fa", safeAuth, async (req, res) => {
  try {
    const { chatId, code } = req.body;
    if (!chatId || !code) {
      return res.status(400).json({ error: "chatId and code are required" });
    }

    const result = await sendTelegram2FACode(chatId, code);
    return res.json({
      success: true,
      message: "2FA code sent successfully",
      result,
    });
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: e?.message || "Failed to send 2FA code" });
  }
});

/**
 * POST /api/admin/telegram/send-transaction
 * Send transaction notification
 */
router.post("/send-transaction", safeAuth, async (req, res) => {
  try {
    const { chatId, transaction } = req.body;
    if (!chatId || !transaction) {
      return res
        .status(400)
        .json({ error: "chatId and transaction are required" });
    }

    const result = await sendTelegramTransactionNotification(
      chatId,
      transaction,
    );
    return res.json({
      success: true,
      message: "Transaction notification sent successfully",
      result,
    });
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message || "Failed to send transaction notification",
    });
  }
});

/**
 * POST /api/admin/telegram/send-welcome
 * Send welcome message to new user
 */
router.post("/send-welcome", safeAuth, async (req, res) => {
  try {
    const { chatId, userName } = req.body;
    if (!chatId || !userName) {
      return res
        .status(400)
        .json({ error: "chatId and userName are required" });
    }

    const result = await sendTelegramWelcome(chatId, userName);
    return res.json({
      success: true,
      message: "Welcome message sent successfully",
      result,
    });
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message || "Failed to send welcome message",
    });
  }
});

/**
 * POST /api/admin/telegram/admin-alert
 * Send alert to admin (admin only)
 */
router.post("/admin-alert", safeAuth, safeAdmin, async (req, res) => {
  try {
    const { alert } = req.body;
    if (!alert) {
      return res.status(400).json({ error: "alert object is required" });
    }

    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (!adminChatId) {
      return res
        .status(500)
        .json({ error: "TELEGRAM_ADMIN_CHAT_ID not configured" });
    }

    const result = await sendTelegramAdminAlert(adminChatId, alert);
    return res.json({
      success: true,
      message: "Admin alert sent successfully",
      result,
    });
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: e?.message || "Failed to send admin alert" });
  }
});

/**
 * POST /api/admin/telegram/withdrawal-approval
 * Send withdrawal approval request to admin (admin only)
 */
router.post("/withdrawal-approval", safeAuth, safeAdmin, async (req, res) => {
  try {
    const { withdrawal } = req.body;
    if (!withdrawal) {
      return res.status(400).json({ error: "withdrawal object is required" });
    }

    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (!adminChatId) {
      return res
        .status(500)
        .json({ error: "TELEGRAM_ADMIN_CHAT_ID not configured" });
    }

    const result = await sendTelegramWithdrawalApproval(
      adminChatId,
      withdrawal,
    );
    return res.json({
      success: true,
      message: "Withdrawal approval request sent successfully",
      result,
    });
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message || "Failed to send withdrawal approval request",
    });
  }
});

/**
 * GET /api/admin/telegram/setup-info
 * Get setup information
 */
router.get("/setup-info", async (_req, res) => {
  try {
    const businessPhone = process.env.BUSINESS_PHONE_NUMBER || "+17174695102";

    return res.json({
      success: true,
      setup: {
        businessPhone,
        botToken: process.env.TELEGRAM_BOT_TOKEN
          ? "✅ Configured"
          : "❌ Not set",
        adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID
          ? "✅ Configured"
          : "❌ Not set",
        webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET
          ? "✅ Configured"
          : "❌ Not set",
      },
      quickStart: {
        step1: "Open Telegram and search for @BotFather",
        step2: "Send /newbot and follow instructions",
        step3: "Copy the bot token to TELEGRAM_BOT_TOKEN in .env",
        step4: "Search for @userinfobot to get your chat ID",
        step5: "Add your chat ID to TELEGRAM_ADMIN_CHAT_ID in .env",
        step6: "Start chatting with your bot!",
      },
      documentation: "See TELEGRAM_INTEGRATION_GUIDE.md for full setup",
    });
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message || "Failed to get setup info",
    });
  }
});
