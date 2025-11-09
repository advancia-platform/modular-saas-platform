import express, { Request, Response } from "express";
import prisma from "../prismaClient";
import { authenticateToken, requireAdmin } from "../middleware/auth";
const router = express.Router();

let ioRef: import('socket.io').Server | null = null;
export const setSupportSocketIO = (io: import('socket.io').Server) => {
  ioRef = io;
};

// 🧰 Example support route
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "Support route working properly ✅" });
});

// Create a support ticket (auth required so we can link userId)
router.post("/contact", authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { name, email, message, subject, category, priority } = req.body || {};
    if (!message) return res.status(400).json({ error: "message is required" });
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user.userId,
        subject: subject || "General Support",
        message,
        category: category || "GENERAL",
        priority: priority || "MEDIUM",
      },
    });
    try {
      ioRef?.to('admins').emit('admin:support:ticket', { id: ticket.id, subject: ticket.subject, userId: ticket.userId, createdAt: ticket.createdAt });
    } catch {}
    return res.json({ success: true, ticket });
  } catch (e) {
    console.error('Create support ticket error', e);
    return res.status(500).json({ error: 'Failed to create ticket' });
  }
});

export default router;

// --- Admin management endpoints ---
// GET /api/support/admin/tickets?subject=Med Beds Appointment Request&status=OPEN
router.get("/admin/tickets", authenticateToken as any, requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const { subject, status, limit, page, pageSize, q } = req.query as any;
    const _pageSize = Math.max(1, Math.min(100, Number(pageSize || limit) || 20));
    const _page = Math.max(1, Number(page) || 1);
    const skip = (_page - 1) * _pageSize;
    const where: any = {};
    if (subject) where.subject = { contains: String(subject), mode: 'insensitive' };
    if (status) where.status = String(status);
    if (q) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { subject: { contains: String(q), mode: 'insensitive' } },
            { message: { contains: String(q), mode: 'insensitive' } },
          ],
        },
      ];
    }
    const [total, items] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: _pageSize }),
    ]);
    res.json({ items, total, page: _page, pageSize: _pageSize });
  } catch (e) {
    console.error("Admin list tickets error", e);
    res.status(500).json({ error: "Failed to list tickets" });
  }
});

// POST /api/support/admin/tickets/:id/status { status, response }
router.post("/admin/tickets/:id/status", authenticateToken as any, requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body as any;
    if (!status) return res.status(400).json({ error: "status required" });
    const updated = await prisma.supportTicket.update({ where: { id }, data: { status, response } });
    res.json(updated);
  } catch (e) {
    console.error("Admin update ticket status error", e);
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

// GET /api/support/admin/tickets/:id - fetch single ticket, optional chat history
router.get("/admin/tickets/:id", authenticateToken as any, requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any;
    const { includeMessages, sessionId, includeRelated } = req.query as any;
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (!includeMessages && !includeRelated) return res.json({ ticket, messages: [] });

    const result: any = { ticket };

    // Optional chat history when persistence is enabled
    if (includeMessages) {
      try {
        let messages: any[] = [];
        if (sessionId) {
          messages = await (prisma as any).chatMessage.findMany({ where: { sessionId: String(sessionId) }, orderBy: { createdAt: 'asc' } });
        } else {
          const sessions = await (prisma as any).chatSession.findMany({ where: { userId: ticket.userId }, select: { id: true } });
          const sessionIds = sessions.map((s: any) => s.id);
          if (sessionIds.length) {
            messages = await (prisma as any).chatMessage.findMany({ where: { sessionId: { in: sessionIds } }, orderBy: { createdAt: 'asc' } });
          }
        }
        result.messages = messages;
      } catch {
        result.messages = [];
      }
    } else {
      result.messages = [];
    }

    // Optional related user/crypto data for admin verification
    if (includeRelated) {
      try {
        const user = await prisma.user.findUnique({ where: { id: ticket.userId }, select: { id: true, email: true, username: true, usdBalance: true, createdAt: true } });
        const [recentTx, recentOrders, recentWithdrawals] = await Promise.all([
          prisma.transaction.findMany({ where: { userId: ticket.userId }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, amount: true, type: true, status: true, createdAt: true, description: true } }),
          prisma.cryptoOrder.findMany({ where: { userId: ticket.userId }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, cryptoType: true, usdAmount: true, status: true, createdAt: true, txHash: true } }),
          prisma.cryptoWithdrawal.findMany({ where: { userId: ticket.userId }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, cryptoType: true, cryptoAmount: true, status: true, createdAt: true, txHash: true } }),
        ]);
        result.related = {
          user: user ? { ...user, usdBalance: user.usdBalance?.toString?.() ?? '0' } : null,
          transactions: recentTx.map(t => ({ ...t, amount: (t as any).amount?.toString?.() ?? '0' })),
          cryptoOrders: recentOrders.map(o => ({ ...o, usdAmount: (o as any).usdAmount?.toString?.() ?? '0' })),
          cryptoWithdrawals: recentWithdrawals.map(w => ({ ...w, cryptoAmount: (w as any).cryptoAmount?.toString?.() ?? '0' })),
        };
      } catch {
        result.related = { user: null, transactions: [], cryptoOrders: [], cryptoWithdrawals: [] };
      }
    }

    return res.json(result);
  } catch (e) {
    console.error('Admin get ticket error', e);
    res.status(500).json({ error: 'Failed to get ticket' });
  }
});

// GET /api/support/my - list tickets for the authenticated user
router.get("/my", authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { status, limit, page, pageSize, q } = req.query as any;
    const _pageSize = Math.max(1, Math.min(100, Number(pageSize || limit) || 20));
    const _page = Math.max(1, Number(page) || 1);
    const skip = (_page - 1) * _pageSize;
    const where: any = { userId: req.user.userId };
    if (status) where.status = String(status);
    if (q) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { subject: { contains: String(q), mode: 'insensitive' } },
            { message: { contains: String(q), mode: 'insensitive' } },
          ],
        },
      ];
    }
    const [total, items] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: _pageSize }),
    ]);
    res.json({ items, total, page: _page, pageSize: _pageSize });
  } catch (e) {
    console.error('User list tickets error', e);
    res.status(500).json({ error: 'Failed to list tickets' });
  }
});

// GET /api/support/my/:id - fetch single ticket, optional chat history
router.get('/my/:id', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { id } = req.params as any;
    const { includeMessages, sessionId } = req.query as any;
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket || ticket.userId !== req.user.userId) return res.status(404).json({ error: 'Ticket not found' });

    if (!includeMessages) return res.json({ ticket, messages: [] });

    try {
      let messages: any[] = [];
      if (sessionId) {
        messages = await (prisma as any).chatMessage.findMany({ where: { sessionId: String(sessionId) }, orderBy: { createdAt: 'asc' } });
      } else {
        const sessions = await (prisma as any).chatSession.findMany({ where: { userId: req.user.userId }, select: { id: true } });
        const sessionIds = sessions.map((s: any) => s.id);
        if (sessionIds.length) {
          messages = await (prisma as any).chatMessage.findMany({ where: { sessionId: { in: sessionIds } }, orderBy: { createdAt: 'asc' } });
        }
      }
      return res.json({ ticket, messages });
    } catch {
      return res.json({ ticket, messages: [] });
    }
  } catch (e) {
    console.error('User get ticket error', e);
    res.status(500).json({ error: 'Failed to get ticket' });
  }
});
