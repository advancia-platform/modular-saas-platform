import express, { Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { z } from 'zod';

let ioRef: import('socket.io').Server | null = null;
export const setChatSocketIO = (io: import('socket.io').Server) => {
  ioRef = io;
};

const router = express.Router();

const MessageSchema = z.object({
  sessionId: z.string().min(6),
  message: z.string().min(1).max(5000),
  from: z.enum(['user', 'guest']).default('guest'),
  metadata: z.any().optional(),
});

// Simple rule-based bot responder for common intents
function advanciaBotReply(text: string): string | null {
  const q = text.toLowerCase();
  if (/(top ?up|add (funds|money)|deposit|stripe)/.test(q)) {
    return 'To add funds, open Payments > Top Up and choose an amount, then complete Stripe Checkout. After payment, your USD balance updates automatically. Link: /payments/topup';
  }
  if (/(debit ?card|visa|mastercard|physical card|virtual card)/.test(q)) {
    return 'To order a debit card, go to Debit Card > Order. The price is set by admin; after payment your order is reviewed before fulfillment. Link: /debit-card/order';
  }
  if (/(med ?beds?|appointment|schedule)/.test(q)) {
    return 'You can request a Med Beds appointment from the Med Beds page. We create a support ticket and notify admins. Link: /medbeds/book';
  }
  if (/(otp|two[- ]?factor|2fa|authenticator|backup code)/.test(q)) {
    return 'For 2FA/OTP help: enable TOTP in your profile, scan the QR in your authenticator app, and store your backup codes safely. If you lose access, use a backup code to log in.';
  }
  if (/(withdraw|payout|send|transfer)/.test(q)) {
    return 'Withdrawals: from Crypto > Withdraw, choose the asset and address. Admin approval is required for security; you will be notified on status updates.';
  }
  if (/(support|help|contact|agent|human)/.test(q)) {
    return 'I\'ve notified our support team. You can also open a ticket from Support. An agent will join this chat shortly if you\'re online.';
  }
  return null;
}

// Public endpoint: accept chat message, broadcast to admins, optionally respond
router.post('/message', async (req: Request, res: Response) => {
  const parsed = MessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', issues: parsed.error.flatten() });
  const { sessionId, message, from, metadata } = parsed.data;

  const payload = {
    sessionId,
    message,
    from,
    metadata: metadata ?? {},
    at: new Date().toISOString(),
  };

  try {
    if (ioRef) {
      ioRef.to('admins').emit('admin:chat:message', payload);
    }
  } catch {}

  // Generate a lightweight bot reply for common intents
  const reply = advanciaBotReply(message);
  return res.json({ ok: true, reply });
});

// Auth-only endpoint: allow logged-in user to send with identity context
router.post('/user/message', authenticateToken as any, async (req: any, res: Response) => {
  const parsed = MessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', issues: parsed.error.flatten() });
  const { sessionId, message, metadata } = parsed.data;

  const payload = {
    sessionId,
    message,
    from: 'user' as const,
    userId: req.user?.userId,
    metadata: metadata ?? {},
    at: new Date().toISOString(),
  };

  try {
    if (ioRef) {
      ioRef.to('admins').emit('admin:chat:message', payload);
    }
  } catch {}

  const reply = advanciaBotReply(message);
  return res.json({ ok: true, reply });
});

export default router;

// Admin reply endpoint: post a reply to a session (user or guest)
router.post('/admin/reply', authenticateToken as any, requireAdmin as any, async (req: any, res: Response) => {
  const Schema = z.object({
    sessionId: z.string().min(6),
    message: z.string().min(1).max(5000),
    userId: z.string().optional(),
  });
  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', issues: parsed.error.flatten() });
  const { sessionId, message, userId } = parsed.data;

  const payload = { sessionId, message, from: 'admin' as const, at: new Date().toISOString() };
  try {
    if (ioRef) {
      if (userId) {
        ioRef.to(`user-${userId}`).emit('chat:reply', payload);
      }
      ioRef.to(`chat-session-${sessionId}`).emit('chat:reply', payload);
      ioRef.to('admins').emit('admin:chat:message', { ...payload, mirror: true });
    }
  } catch {}
  return res.json({ ok: true });
});
