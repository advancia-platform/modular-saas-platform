import axios from "axios";

const TELEGRAM_API_BASE = "https://api.telegram.org";

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set");
  return token;
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: {
    parse_mode?: "HTML" | "MarkdownV2" | "Markdown";
    disable_web_page_preview?: boolean;
    reply_markup?: any;
  },
) {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`;
  const resp = await axios.post(url, {
    chat_id: chatId,
    text,
    parse_mode: options?.parse_mode ?? "HTML",
    disable_web_page_preview: options?.disable_web_page_preview ?? true,
    ...(options?.reply_markup ? { reply_markup: options.reply_markup } : {}),
  });
  return resp.data;
}

export async function getBotInfo() {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/getMe`;
  const resp = await axios.get(url);
  return resp.data;
}

export async function deleteMessage(
  chatId: string | number,
  messageId: number,
) {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/deleteMessage`;
  const resp = await axios.post(url, {
    chat_id: chatId,
    message_id: messageId,
  });
  return resp.data;
}

export async function restrictChatMember(
  chatId: string | number,
  userId: number,
  permissions: Record<string, unknown>,
  untilDate?: number,
) {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/restrictChatMember`;
  const payload: any = { chat_id: chatId, user_id: userId, permissions };
  if (untilDate) payload.until_date = untilDate;
  const resp = await axios.post(url, payload);
  return resp.data;
}

export async function banChatMember(
  chatId: string | number,
  userId: number,
  untilDate?: number,
) {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/banChatMember`;
  const payload: any = { chat_id: chatId, user_id: userId };
  if (untilDate) payload.until_date = untilDate;
  const resp = await axios.post(url, payload);
  return resp.data;
}

export async function setWebhook(webhookUrl: string, secretToken?: string) {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/setWebhook`;
  const payload: any = { url: webhookUrl };
  if (secretToken) payload.secret_token = secretToken;
  const resp = await axios.post(url, payload);
  return resp.data;
}

export async function deleteWebhook() {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/deleteWebhook`;
  const resp = await axios.post(url, {});
  return resp.data;
}

// ==================== BUSINESS MESSAGING FUNCTIONS ====================

/**
 * Send verification code via Telegram
 */
export async function sendTelegramVerificationCode(
  chatId: string | number,
  code: string,
  phoneNumber: string,
) {
  const message = `
🔐 <b>Verification Code</b>

Your verification code is: <b>${code}</b>

Phone: ${phoneNumber}
Valid for: 10 minutes

⚠️ Never share this code with anyone!

<i>Advancia Pay - Secure Business Communications</i>
  `.trim();

  return sendTelegramMessage(chatId, message);
}

/**
 * Send 2FA code via Telegram
 */
export async function sendTelegram2FACode(
  chatId: string | number,
  code: string,
) {
  const message = `
🔒 <b>Two-Factor Authentication</b>

Your 2FA code is: <b>${code}</b>

Valid for: 5 minutes

⚠️ If you didn't request this code, contact support immediately.

<i>Advancia Pay Security Team</i>
  `.trim();

  return sendTelegramMessage(chatId, message);
}

/**
 * Send transaction notification
 */
export async function sendTelegramTransactionNotification(
  chatId: string | number,
  transaction: {
    type: "payment" | "withdrawal" | "transfer" | "deposit";
    amount: string;
    currency: string;
    status: string;
    timestamp: string;
  },
) {
  const emoji =
    transaction.type === "payment"
      ? "💳"
      : transaction.type === "withdrawal"
        ? "💸"
        : transaction.type === "deposit"
          ? "💰"
          : "🔄";

  const message = `
${emoji} <b>Transaction ${transaction.status}</b>

Type: ${transaction.type.toUpperCase()}
Amount: <b>${transaction.amount} ${transaction.currency}</b>
Status: ${transaction.status}
Time: ${transaction.timestamp}

<i>Advancia Pay Transaction Service</i>
  `.trim();

  return sendTelegramMessage(chatId, message);
}

/**
 * Send withdrawal approval request to admin
 */
export async function sendTelegramWithdrawalApproval(
  adminChatId: string | number,
  withdrawal: {
    id: string;
    userId: string;
    amount: string;
    currency: string;
    destination: string;
  },
) {
  const message = `
🚨 <b>Withdrawal Approval Required</b>

ID: ${withdrawal.id}
User: ${withdrawal.userId}
Amount: <b>${withdrawal.amount} ${withdrawal.currency}</b>
Destination: ${withdrawal.destination}

Please review and approve/reject in the admin panel.

<i>Advancia Pay Admin Notifications</i>
  `.trim();

  return sendTelegramMessage(adminChatId, message);
}

/**
 * Send welcome message
 */
export async function sendTelegramWelcome(
  chatId: string | number,
  userName: string,
) {
  const message = `
👋 <b>Welcome to Advancia Pay, ${userName}!</b>

Thank you for joining our secure payment platform.

You will receive:
✅ Verification codes
✅ Transaction notifications
✅ Security alerts
✅ Important updates

<b>Business Contact:</b> +1 (717) 469-5102

<i>Advancia Pay - Your Trusted Payment Partner</i>
  `.trim();

  return sendTelegramMessage(chatId, message);
}

/**
 * Send admin alert
 */
export async function sendTelegramAdminAlert(
  adminChatId: string | number,
  alert: {
    level: "info" | "warning" | "critical";
    title: string;
    message: string;
  },
) {
  const emoji =
    alert.level === "critical" ? "🔴" : alert.level === "warning" ? "⚠️" : "ℹ️";

  const message = `
${emoji} <b>${alert.title}</b>

${alert.message}

Level: ${alert.level.toUpperCase()}
Time: ${new Date().toLocaleString()}

<i>Advancia Pay System Monitor</i>
  `.trim();

  return sendTelegramMessage(adminChatId, message);
}
