import express from "express";
import prisma from "../prismaClient";
import { authenticateToken } from "../middleware/auth";
import { z } from "zod";

const router = express.Router();

// Helper to extract user/doctor ID from JWT
const getUserId = (req: any): string | null => {
  return req.user?.userId || null;
};

const getDoctorId = (req: any): string | null => {
  return req.user?.doctorId || null;
};

// ============================================
// CONSULTATION MANAGEMENT
// ============================================

// GET /api/consultation - List consultations (filtered by role)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const doctorId = getDoctorId(req);

    if (!userId && !doctorId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const where: any = {};
    if (userId) {
      where.patientId = userId;
    } else if (doctorId) {
      where.doctorId = doctorId;
    }

    const consultations = await prisma.consultation.findMany({
      where,
      select: {
        id: true,
        patientId: true,
        doctorId: true,
        status: true,
        scheduledAt: true,
        startedAt: true,
        completedAt: true,
        symptoms: true,
        diagnosis: true,
        prescription: true,
        notes: true,
        videoRoomId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ consultations });
  } catch (err) {
    console.error("Fetch consultations error:", err);
    return res.status(500).json({ error: "Failed to fetch consultations" });
  }
});

// GET /api/consultation/:id - Get consultation details
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const doctorId = getDoctorId(req);

    const consultation = await prisma.consultation.findUnique({
      where: { id },
    });

    if (!consultation) {
      return res.status(404).json({ error: "Consultation not found" });
    }

    // Verify access
    if (
      consultation.patientId !== userId &&
      consultation.doctorId !== doctorId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.json({ consultation });
  } catch (err) {
    console.error("Fetch consultation error:", err);
    return res.status(500).json({ error: "Failed to fetch consultation" });
  }
});

// POST /api/consultation - Create a new consultation
const createConsultationSchema = z.object({
  doctorId: z.string().uuid(),
  symptoms: z.string().optional(),
  scheduledAt: z.string().optional(), // ISO date string
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res
        .status(401)
        .json({ error: "Only patients can create consultations" });
    }

    const data = createConsultationSchema.parse(req.body);

    // Verify doctor exists and is verified
    const doctor = await prisma.doctor.findUnique({
      where: { id: data.doctorId },
      select: { id: true, status: true },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    if (doctor.status !== "VERIFIED") {
      return res.status(400).json({ error: "Doctor is not verified" });
    }

    const consultation = await prisma.consultation.create({
      data: {
        patientId: userId,
        doctorId: data.doctorId,
        symptoms: data.symptoms || null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        status: "SCHEDULED",
      },
    });

    return res.status(201).json({
      message: "Consultation created successfully",
      consultation,
    });
  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("Create consultation error:", err);
    return res.status(500).json({ error: "Failed to create consultation" });
  }
});

// PATCH /api/consultation/:id - Update consultation (status, diagnosis, etc.)
const updateConsultationSchema = z.object({
  status: z.enum(["SCHEDULED", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  diagnosis: z.string().optional(),
  prescription: z.string().optional(),
  notes: z.string().optional(),
});

router.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = getDoctorId(req);

    if (!doctorId) {
      return res
        .status(403)
        .json({ error: "Only doctors can update consultations" });
    }

    const consultation = await prisma.consultation.findUnique({
      where: { id },
      select: { id: true, doctorId: true },
    });

    if (!consultation) {
      return res.status(404).json({ error: "Consultation not found" });
    }

    if (consultation.doctorId !== doctorId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const data = updateConsultationSchema.parse(req.body);

    const updated = await prisma.consultation.update({
      where: { id },
      data: {
        ...data,
        ...(data.status === "ACTIVE" && !consultation
          ? { startedAt: new Date() }
          : {}),
        ...(data.status === "COMPLETED" ? { completedAt: new Date() } : {}),
      },
    });

    return res.json({
      message: "Consultation updated successfully",
      consultation: updated,
    });
  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("Update consultation error:", err);
    return res.status(500).json({ error: "Failed to update consultation" });
  }
});

// ============================================
// CONSULTATION MESSAGES
// ============================================

// POST /api/consultation/message - Send a message in consultation
const sendMessageSchema = z.object({
  consultationId: z.string().uuid(),
  content: z.string().min(1),
  attachmentUrl: z.string().url().optional(),
});

router.post("/message", authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const doctorId = getDoctorId(req);

    if (!userId && !doctorId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const data = sendMessageSchema.parse(req.body);

    // Verify consultation exists and user has access
    const consultation = await prisma.consultation.findUnique({
      where: { id: data.consultationId },
      select: { id: true, patientId: true, doctorId: true },
    });

    if (!consultation) {
      return res.status(404).json({ error: "Consultation not found" });
    }

    if (
      consultation.patientId !== userId &&
      consultation.doctorId !== doctorId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const message = await prisma.consultationMessage.create({
      data: {
        consultationId: data.consultationId,
        senderType: userId ? "patient" : "doctor",
        senderId: userId || doctorId!,
        content: data.content,
        attachmentUrl: data.attachmentUrl || null,
      },
    });

    return res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("Send message error:", err);
    return res.status(500).json({ error: "Failed to send message" });
  }
});

// ============================================
// VIDEO CONSULTATION (Jitsi)
// ============================================

// GET /api/consultation/video/:consultationId - Generate Jitsi video link
router.get("/video/:consultationId", authenticateToken, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const userId = getUserId(req);
    const doctorId = getDoctorId(req);

    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      select: {
        id: true,
        patientId: true,
        doctorId: true,
        videoRoomId: true,
        status: true,
      },
    });

    if (!consultation) {
      return res.status(404).json({ error: "Consultation not found" });
    }

    if (
      consultation.patientId !== userId &&
      consultation.doctorId !== doctorId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Generate or retrieve video room ID
    let roomId = consultation.videoRoomId;
    if (!roomId) {
      roomId = `advancia-consultation-${consultationId}`;
      await prisma.consultation.update({
        where: { id: consultationId },
        data: { videoRoomId: roomId },
      });
    }

    // Generate Jitsi Meet URL
    const jitsiDomain = process.env.JITSI_DOMAIN || "meet.jit.si";
    const videoUrl = `https://${jitsiDomain}/${roomId}`;

    return res.json({
      videoUrl,
      roomId,
      embedUrl: `https://${jitsiDomain}/${roomId}?parentNode=jitsi-container`,
    });
  } catch (err) {
    console.error("Generate video link error:", err);
    return res.status(500).json({ error: "Failed to generate video link" });
  }
});

export default router;
