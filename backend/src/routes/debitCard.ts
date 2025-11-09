import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { config } from '../config';
import prisma from '../prismaClient';
import Stripe from 'stripe';
import type { Server as IOServer } from 'socket.io';

const router = Router();
let ioRef: IOServer | null = null;
export function setDebitCardSocketIO(io: IOServer) { ioRef = io; }

function parsePriceFromMetadata(meta?: string | null): number | null {
  try {
    if (!meta) return null;
    const j = JSON.parse(meta);
    if (j && typeof j.priceUSD === 'number' && j.priceUSD > 0) return j.priceUSD;
  } catch {}
  return null;
}

async function getDebitCardPrice(): Promise<number> {
  // Try SystemStatus config first
  const row = await prisma.systemStatus.findFirst({ where: { serviceName: 'debit-card' } });
  const fromRow = parsePriceFromMetadata(row?.metadata || null);
  if (fromRow) return fromRow;
  // Fallback to env
  const fromEnv = Number(process.env.DEBIT_CARD_PRICE_USD);
  if (!Number.isNaN(fromEnv) && fromEnv > 0) return fromEnv;
  // Default
  return 1000;
}

// Public config (auth optional)
router.get('/config', async (_req, res) => {
  const priceUSD = await getDebitCardPrice();
  res.json({ priceUSD, requiresApproval: true });
});

// Admin get/set price
router.get('/admin/price', authenticateToken as any, requireAdmin as any, async (_req, res) => {
  const priceUSD = await getDebitCardPrice();
  res.json({ priceUSD });
});

router.post('/admin/price', authenticateToken as any, requireAdmin as any, async (req, res) => {
  const { priceUSD } = req.body || {};
  const price = Number(priceUSD);
  if (Number.isNaN(price) || price <= 0) return res.status(400).json({ error: 'Invalid price' });
  const existing = await prisma.systemStatus.findFirst({ where: { serviceName: 'debit-card' } });
  const payload = { serviceName: 'debit-card', status: 'operational', statusMessage: 'config', metadata: JSON.stringify({ priceUSD: price }) };
  if (existing) {
    await prisma.systemStatus.update({ where: { id: existing.id }, data: payload });
  } else {
    await prisma.systemStatus.create({ data: payload });
  }
  res.json({ priceUSD: price });
});

// Place an order: creates a support ticket and returns a Stripe Checkout session to pay the configured price
router.post('/order', authenticateToken as any, async (req: any, res) => {
  const stripeClient = config.stripeSecretKey ? new Stripe(config.stripeSecretKey, { apiVersion: '2023-10-16' }) : null;
  if (!stripeClient) return res.status(503).json({ error: 'Stripe is not configured' });
  const { fullName, address, phone, notes } = req.body || {};
  if (!fullName || !address || !phone) return res.status(400).json({ error: 'fullName, address and phone are required' });
  const userId = req.user?.userId;
  try {
    // Create a support ticket for admin approval workflow
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: userId,
        subject: 'Debit Card Order',
        message: `Name: ${fullName}\nAddress: ${address}\nPhone: ${phone}\nNotes: ${notes || ''}`,
        category: 'BILLING',
        status: 'OPEN',
      },
    });
    // Create Stripe session for current price
    const priceUSD = await getDebitCardPrice();
    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: { currency: 'usd', unit_amount: Math.round(priceUSD * 100), product_data: { name: 'Physical Debit Card' } },
          quantity: 1,
        },
      ],
      metadata: { userId: userId || '', type: 'debit_card', ticketId: ticket.id },
      success_url: `${config.frontendUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.frontendUrl}/payments/cancel`,
    });
    // Notify admins new order submitted (pending payment)
    try { ioRef?.to('admins').emit('admin:debit-card:order', { ticketId: ticket.id, userId, fullName }); } catch {}
    res.json({ url: session.url, id: session.id, ticketId: ticket.id });
  } catch (e) {
    console.error('Debit card order error', e);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

export default router;
