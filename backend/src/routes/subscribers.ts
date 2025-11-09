import express from "express";
import prisma from "../prismaClient";
import { validateInput } from "../middleware/security";
import { requireAdmin } from "../middleware/adminAuth";
import { z } from "zod";
// Avoid adding a new dependency for CSV generation; we'll build CSV manually

const router = express.Router();

const subscribeSchema = z.object({
  email: z.string().email(),
});

// POST /api/subscribers/subscribe
router.post("/subscribe", async (req, res, next) => {
  try {
    // validate with zod here since validateInput middleware is a generic sanitizer
    const parsed = subscribeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.errors });
    }
    const { email } = parsed.data;

    const existing = await (prisma as any).subscriber.findUnique({
      where: { email },
    });
    if (existing) {
      return res.status(200).json({ ok: true, message: "Already subscribed" });
    }

    const subscriber = await (prisma as any).subscriber.create({
      data: { email },
    });

    // Optionally: enqueue Mailchimp or send admin email here (requires env keys)

    return res.status(201).json({ ok: true, subscriber });
  } catch (err) {
    next(err);
  }
});

// GET /api/subscribers - Admin only
router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const subs = await (prisma as any).subscriber.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ ok: true, subscribers: subs });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/subscribers/:id - Admin only
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await (prisma as any).subscriber.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/subscribers/export/csv - Admin only
router.get("/export/csv", requireAdmin, async (req, res, next) => {
  try {
    const subs: Array<{ id: number; email: string; createdAt: Date }> = await (
      prisma as any
    ).subscriber.findMany({ orderBy: { createdAt: "desc" } });

    // Build CSV manually to avoid adding dependencies
    const header = ["id", "email", "createdAt"].join(",");
    const rows = subs.map(
      (s) => `${s.id},"${s.email}","${s.createdAt.toISOString()}"`
    );
    const csv = [header, ...rows].join("\n");

    res.header("Content-Type", "text/csv");
    res.attachment("subscribers.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// GET /api/subscribers/summary - Admin only
router.get("/summary", requireAdmin, async (req, res, next) => {
  try {
    const total = await (prisma as any).subscriber.count();
    const latest = await (prisma as any).subscriber.findFirst({
      orderBy: { createdAt: "desc" },
    });
    res.json({ ok: true, total, latest });
  } catch (err) {
    next(err);
  }
});

export default router;
