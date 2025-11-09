import express from "express";
import jwt from "jsonwebtoken";
import { requireAdmin } from "../middleware/adminAuth";
import { activeSessions } from "./authAdmin";
import { sendAlert } from "../utils/mailer";

const router = express.Router();

// Broadcast helper (will be set from index.ts)
let broadcastSessionsFn: (() => void) | null = null;
export function setBroadcastSessions(fn: () => void) {
  broadcastSessionsFn = fn;
}

// Revoke session
export function revokeSession(token: string) {
  delete activeSessions[token];
  if (broadcastSessionsFn) broadcastSessionsFn();
}

// GET /api/sessions - Get all active sessions
router.get("/", requireAdmin, (req, res) => {
  res.json({ sessions: activeSessions });
});

// POST /api/sessions/revoke - Revoke specific session
router.post("/revoke", requireAdmin, async (req, res) => {
  const { token } = req.body;
  if (!token || !activeSessions[token]) {
    return res.status(404).json({ error: "Session not found" });
  }

  try {
    const info: any = jwt.decode(token);
    await sendAlert(
      "⚠ Advancia: Admin Session Revoked",
      `Revoked session for: ${
        info?.email || "unknown"
      }\nTime: ${new Date().toISOString()}`
    );
  } catch {}

  revokeSession(token);
  res.json({ message: "Session revoked successfully" });
});

// Clean up expired sessions periodically
setInterval(() => {
  Object.entries(activeSessions).forEach(([token, session]) => {
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      delete activeSessions[token];
    }
  });
}, 3600000); // every 1 hour

export default router;
