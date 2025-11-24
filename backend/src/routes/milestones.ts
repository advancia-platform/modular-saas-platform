import express, { Response } from "express";
import { z } from "zod";
import logger from "../logger";
import { authenticateToken } from "../middleware/auth";
import { validateSchema } from "../middleware/validateSchema";
import prisma from "../prismaClient";
import { serializeDecimalFields } from "../utils/decimal";

const router = express.Router();

// Socket.IO instance for real-time updates
let ioRef: import("socket.io").Server | null = null;

export const setMilestoneSocketIO = (io: import("socket.io").Server) => {
  ioRef = io;
};

// Validation schemas
const createMilestoneSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  projectId: z.string(),
  dueDate: z.string().datetime().optional(),
});

const updateMilestoneSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
});

// Helper function to check project access
async function checkProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        {
          team: {
            OR: [
              { ownerId: userId },
              {
                members: {
                  some: { userId },
                },
              },
            ],
          },
        },
      ],
    },
    include: {
      team: {
        include: {
          members: {
            select: { userId: true },
          },
        },
      },
    },
  });
  return project;
}

// Helper function to check milestone access
async function checkMilestoneAccess(milestoneId: string, userId: string) {
  const milestone = await prisma.milestone.findFirst({
    where: {
      id: milestoneId,
      project: {
        OR: [
          { ownerId: userId },
          {
            team: {
              OR: [
                { ownerId: userId },
                {
                  members: {
                    some: { userId },
                  },
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      project: {
        include: {
          team: {
            include: {
              members: {
                select: { userId: true },
              },
            },
          },
        },
      },
    },
  });
  return milestone;
}

// Get all milestones for current user or project
router.get("/", authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { projectId, completed } = req.query;

    let whereCondition: any = {
      project: {
        OR: [
          { ownerId: userId },
          {
            team: {
              OR: [
                { ownerId: userId },
                {
                  members: {
                    some: { userId },
                  },
                },
              ],
            },
          },
        ],
      },
    };

    if (projectId) {
      whereCondition.projectId = projectId;
    }

    if (completed === "true") {
      whereCondition.completedAt = { not: null };
    } else if (completed === "false") {
      whereCondition.completedAt = null;
    }

    const milestones = await prisma.milestone.findMany({
      where: whereCondition,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    const serializedMilestones = milestones.map((milestone) =>
      serializeDecimalFields(milestone),
    );

    return res.json({
      success: true,
      milestones: serializedMilestones,
      count: milestones.length,
    });
  } catch (error) {
    logger.error("Error fetching milestones:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch milestones",
    });
  }
});

// Get specific milestone details
router.get(
  "/:milestoneId",
  authenticateToken as any,
  async (req: any, res: Response) => {
    try {
      const { milestoneId } = req.params;
      const userId = req.user.userId;

      const milestone = await checkMilestoneAccess(milestoneId, userId);

      if (!milestone) {
        return res.status(404).json({
          success: false,
          error: "Milestone not found or access denied",
        });
      }

      const milestoneDetails = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              team: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!milestoneDetails) {
        return res
          .status(404)
          .json({ success: false, error: "Milestone not found" });
      }
      const serializedMilestone = serializeDecimalFields(milestoneDetails);

      return res.json({
        success: true,
        milestone: serializedMilestone,
      });
    } catch (error) {
      logger.error("Error fetching milestone details:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch milestone details",
      });
    }
  },
);

// Create new milestone
router.post(
  "/",
  authenticateToken as any,
  validateSchema(createMilestoneSchema),
  async (req: any, res: Response) => {
    try {
      const { title, description, projectId, dueDate } = req.body;
      const userId = req.user.userId;

      // Check if user has access to the project
      const project = await checkProjectAccess(projectId, userId);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: "Project not found or access denied",
        });
      }

      // Check if user has permission to create milestones
      const hasPermission =
        project.ownerId === userId ||
        project.team.ownerId === userId ||
        (await prisma.teamMember.findFirst({
          where: {
            teamId: project.teamId,
            userId,
            role: { in: ["ADMIN", "MANAGER"] },
          },
        }));

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error:
            "Insufficient permissions to create milestones in this project",
        });
      }

      const milestone = await prisma.milestone.create({
        data: {
          title,
          description,
          projectId,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              team: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Emit real-time notification to all team members
      project.team.members.forEach((member) => {
        ioRef?.to(`user-${member.userId}`).emit("milestone:created", {
          id: milestone.id,
          title: milestone.title,
          projectName: project.name,
          teamName: project.team.name,
          dueDate: milestone.dueDate,
          createdAt: milestone.createdAt,
        });
      });

      const serializedMilestone = serializeDecimalFields(milestone);

      logger.info(
        `Milestone created: ${milestone.id} by user ${userId} in project ${projectId}`,
      );

      return res.status(201).json({
        success: true,
        milestone: serializedMilestone,
      });
    } catch (error) {
      logger.error("Error creating milestone:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to create milestone",
      });
    }
  },
);

// Update milestone
router.put(
  "/:milestoneId",
  authenticateToken as any,
  validateSchema(updateMilestoneSchema),
  async (req: any, res: Response) => {
    try {
      const { milestoneId } = req.params;
      const updateData = req.body;
      const userId = req.user.userId;

      const milestone = await checkMilestoneAccess(milestoneId, userId);

      if (!milestone) {
        return res.status(404).json({
          success: false,
          error: "Milestone not found or access denied",
        });
      }

      // Check if user has permission to update milestones
      const hasPermission =
        milestone.project.ownerId === userId ||
        milestone.project.team.ownerId === userId ||
        (await prisma.teamMember.findFirst({
          where: {
            teamId: milestone.project.teamId,
            userId,
            role: { in: ["ADMIN", "MANAGER"] },
          },
        }));

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: "Insufficient permissions to update this milestone",
        });
      }

      // Prepare update data
      const prismaUpdateData: any = {};

      if (updateData.title) prismaUpdateData.title = updateData.title;
      if (updateData.description !== undefined)
        prismaUpdateData.description = updateData.description;
      if (updateData.dueDate !== undefined) {
        prismaUpdateData.dueDate = updateData.dueDate
          ? new Date(updateData.dueDate)
          : null;
      }
      if (updateData.completedAt !== undefined) {
        prismaUpdateData.completedAt = updateData.completedAt
          ? new Date(updateData.completedAt)
          : null;
      }

      const updatedMilestone = await prisma.milestone.update({
        where: { id: milestoneId },
        data: prismaUpdateData,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              team: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Emit real-time notification to all team members
      milestone.project.team.members.forEach((member) => {
        ioRef?.to(`user-${member.userId}`).emit("milestone:updated", {
          id: updatedMilestone.id,
          title: updatedMilestone.title,
          projectName: milestone.project.name,
          dueDate: updatedMilestone.dueDate,
          completedAt: updatedMilestone.completedAt,
          updatedAt: updatedMilestone.updatedAt,
        });
      });

      // Special notification for milestone completion
      if (updateData.completedAt && !milestone.completedAt) {
        milestone.project.team.members.forEach((member) => {
          ioRef?.to(`user-${member.userId}`).emit("milestone:completed", {
            id: updatedMilestone.id,
            title: updatedMilestone.title,
            projectName: milestone.project.name,
            completedAt: updatedMilestone.completedAt,
          });
        });
      }

      const serializedMilestone = serializeDecimalFields(updatedMilestone);

      logger.info(`Milestone updated: ${milestoneId} by user ${userId}`);

      return res.json({
        success: true,
        milestone: serializedMilestone,
      });
    } catch (error) {
      logger.error("Error updating milestone:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update milestone",
      });
    }
  },
);

// Mark milestone as completed
router.put(
  "/:milestoneId/complete",
  authenticateToken as any,
  async (req: any, res: Response) => {
    try {
      const { milestoneId } = req.params;
      const userId = req.user.userId;

      const milestone = await checkMilestoneAccess(milestoneId, userId);

      if (!milestone) {
        return res.status(404).json({
          success: false,
          error: "Milestone not found or access denied",
        });
      }

      // Check if milestone is already completed
      if (milestone.completedAt) {
        return res.status(400).json({
          success: false,
          error: "Milestone is already completed",
        });
      }

      const updatedMilestone = await prisma.milestone.update({
        where: { id: milestoneId },
        data: { completedAt: new Date() },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              team: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Emit real-time notification to all team members
      milestone.project.team.members.forEach((member) => {
        ioRef?.to(`user-${member.userId}`).emit("milestone:completed", {
          id: updatedMilestone.id,
          title: updatedMilestone.title,
          projectName: milestone.project.name,
          teamName: milestone.project.team.name,
          completedAt: updatedMilestone.completedAt,
          completedBy: userId,
        });
      });

      const serializedMilestone = serializeDecimalFields(updatedMilestone);

      logger.info(`Milestone completed: ${milestoneId} by user ${userId}`);

      return res.json({
        success: true,
        milestone: serializedMilestone,
        message: "Milestone marked as completed",
      });
    } catch (error) {
      logger.error("Error completing milestone:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to complete milestone",
      });
    }
  },
);

// Mark milestone as incomplete
router.put(
  "/:milestoneId/incomplete",
  authenticateToken as any,
  async (req: any, res: Response) => {
    try {
      const { milestoneId } = req.params;
      const userId = req.user.userId;

      const milestone = await checkMilestoneAccess(milestoneId, userId);

      if (!milestone) {
        return res.status(404).json({
          success: false,
          error: "Milestone not found or access denied",
        });
      }

      // Check if milestone is not completed
      if (!milestone.completedAt) {
        return res.status(400).json({
          success: false,
          error: "Milestone is not completed",
        });
      }

      const updatedMilestone = await prisma.milestone.update({
        where: { id: milestoneId },
        data: { completedAt: null },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              team: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Emit real-time notification to all team members
      milestone.project.team.members.forEach((member) => {
        ioRef?.to(`user-${member.userId}`).emit("milestone:reopened", {
          id: updatedMilestone.id,
          title: updatedMilestone.title,
          projectName: milestone.project.name,
          teamName: milestone.project.team.name,
          reopenedBy: userId,
        });
      });

      const serializedMilestone = serializeDecimalFields(updatedMilestone);

      logger.info(`Milestone reopened: ${milestoneId} by user ${userId}`);

      return res.json({
        success: true,
        milestone: serializedMilestone,
        message: "Milestone marked as incomplete",
      });
    } catch (error) {
      logger.error("Error reopening milestone:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to reopen milestone",
      });
    }
  },
);

// Get upcoming milestones for user
router.get(
  "/my/upcoming",
  authenticateToken as any,
  async (req: any, res: Response) => {
    try {
      const userId = req.user.userId;
      const { days = 30 } = req.query;

      const upcomingDate = new Date();
      upcomingDate.setDate(upcomingDate.getDate() + parseInt(days as string));

      const milestones = await prisma.milestone.findMany({
        where: {
          completedAt: null,
          dueDate: {
            gte: new Date(),
            lte: upcomingDate,
          },
          project: {
            OR: [
              { ownerId: userId },
              {
                team: {
                  OR: [
                    { ownerId: userId },
                    {
                      members: {
                        some: { userId },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              team: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { dueDate: "asc" },
      });

      const serializedMilestones = milestones.map((milestone) =>
        serializeDecimalFields(milestone),
      );

      return res.json({
        success: true,
        milestones: serializedMilestones,
        count: milestones.length,
      });
    } catch (error) {
      logger.error("Error fetching upcoming milestones:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch upcoming milestones",
      });
    }
  },
);

// Delete milestone
router.delete(
  "/:milestoneId",
  authenticateToken as any,
  async (req: any, res: Response) => {
    try {
      const { milestoneId } = req.params;
      const userId = req.user.userId;

      const milestone = await checkMilestoneAccess(milestoneId, userId);

      if (!milestone) {
        return res.status(404).json({
          success: false,
          error: "Milestone not found or access denied",
        });
      }

      // Only project owner or team owner can delete milestones
      const canDelete =
        milestone.project.ownerId === userId ||
        milestone.project.team.ownerId === userId;

      if (!canDelete) {
        return res.status(403).json({
          success: false,
          error: "Only project owner or team owner can delete milestones",
        });
      }

      // Delete milestone
      await prisma.milestone.delete({
        where: { id: milestoneId },
      });

      // Notify team members
      milestone.project.team.members.forEach((member) => {
        ioRef?.to(`user-${member.userId}`).emit("milestone:deleted", {
          milestoneId,
          title: milestone.title,
          projectName: milestone.project.name,
          teamName: milestone.project.team.name,
        });
      });

      logger.info(`Milestone deleted: ${milestoneId} by user ${userId}`);

      return res.json({
        success: true,
        message: "Milestone deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting milestone:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete milestone",
      });
    }
  },
);

export default router;
