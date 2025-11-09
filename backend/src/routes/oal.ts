import { Router, Request, Response } from "express";
import { Parser } from "json2csv";
import { Server as SocketIOServer } from "socket.io";
import { authenticateToken, requireAdmin } from "../middleware/auth";
// OAL Rules feature disabled
import {
  createOALLog,
  updateOALStatus,
  getOALLogsWithCount,
  getAllOALLogsForExport,
  getOALLogById,
  logBalanceAdjustment,
} from "../services/oalService";
import { OALStatus } from "@prisma/client";

const router = Router();
router.use(authenticateToken, requireAdmin);

const sseClients = new Set<Response>();
let io: SocketIOServer | null = null;

export function setOALSocketIO(socketIO: SocketIOServer) {
  io = socketIO;
}

export function broadcastOALUpdate(entry: any) {
  const sseData = `data: ${JSON.stringify(entry)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(sseData);
    } catch (err) {
      sseClients.delete(client);
    }
  }
  if (io) {
    if (entry.createdById) {
      io.to(`user-${entry.createdById}`).emit("oal:update", entry);
    }
    if (entry.subjectId && entry.subjectId !== entry.createdById) {
      io.to(`user-${entry.subjectId}`).emit("oal:update", entry);
    }
  }
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      object,
      action,
      location,
      status,
      createdById,
      subjectId,
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const { items, count } = await getOALLogsWithCount({
      object: object as string | undefined,
      action: action as string | undefined,
      location: location as string | undefined,
      status: status as OALStatus | undefined,
      createdById: createdById as string | undefined,
      subjectId: subjectId as string | undefined,
      limit: limitNum,
      offset,
    });

    return res.json({
      success: true,
      count,
      items,
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum),
    });
  } catch (error) {
    console.error("[OAL] Error fetching logs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
});

router.get("/export", async (req: Request, res: Response) => {
  try {
    const { format = "csv" } = req.query;
    const items = await getAllOALLogsForExport();

    if (format === "json") {
      return res.json({ success: true, logs: items });
    }

    const csvData = items.map((item: any) => ({
      id: item.id,
      object: item.object,
      action: item.action,
      location: item.location,
      status: item.status,
      createdById: item.createdById,
      subjectId: item.subjectId || "",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByEmail: item.createdBy?.email || "",
      subjectEmail: item.subject?.email || "",
      metadata: JSON.stringify(item.metadata),
    }));

    const parser = new Parser();
    const csv = parser.parse(csvData);

    res.header("Content-Type", "text/csv");
    res.attachment(`oal-export-${new Date().toISOString().split("T")[0]}.csv`);
    return res.send(csv);
  } catch (error) {
    console.error("[OAL] Error exporting logs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export audit logs",
    });
  }
});

router.get("/stream", (req: Request, res: Response) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();
  sseClients.add(res);
  req.on("close", () => {
    sseClients.delete(res);
  });
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const log = await getOALLogById(id);
    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found",
      });
    }
    return res.json({ success: true, log });
  } catch (error) {
    console.error("[OAL] Error fetching log:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit log",
    });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { object, action, location, subjectId, metadata, status } = req.body;
    const userId = (req as any).user?.userId;

    if (!object || !action || !location) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: object, action, location",
      });
    }

    const log = await createOALLog({
      object,
      action,
      location,
      subjectId,
      metadata,
      createdById: userId,
      status: status || OALStatus.PENDING,
    });

    // OAL Rules checking disabled
    broadcastOALUpdate(log);

    return res.status(201).json({ success: true, log });
  } catch (error) {
    console.error("[OAL] Error creating log:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create audit log",
    });
  }
});

router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).user?.userId;

    if (!Object.values(OALStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be PENDING, APPROVED, or REJECTED",
      });
    }

    const log = await updateOALStatus({ id, status, updatedById: userId });
    broadcastOALUpdate(log);

    return res.json({ success: true, log });
  } catch (error) {
    console.error("[OAL] Error updating status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update audit log status",
    });
  }
});

router.post("/balance-adjustment", async (req: Request, res: Response) => {
  try {
    const { userId: subjectUserId, currency, delta, reason } = req.body;
    const adminId = (req as any).user?.userId;

    if (!subjectUserId || !currency || delta === undefined || !reason) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, currency, delta, reason",
      });
    }

    const log = await logBalanceAdjustment({
      userId: subjectUserId,
      adminId,
      currency,
      delta: parseFloat(delta),
      reason,
      location: "admin.api",
    });

    broadcastOALUpdate(log);
    return res.status(201).json({ success: true, log });
  } catch (error) {
    console.error("[OAL] Error logging balance adjustment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to log balance adjustment",
    });
  }
});

export default router;


