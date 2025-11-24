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

export const setProjectSocketIO = (io: import("socket.io").Server) => {
  ioRef = io;
};

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  teamId: z.string(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  settings: z.object({}).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  status: z
    .enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"])
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  settings: z.object({}).optional(),
});

// Helper function to check team access
async function checkTeamAccess(teamId: string, userId: string) {
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: userId },
        {
          members: {
            some: { userId },
          },
        },
      ],
    },
  });
  return team;
}

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
      team: true,
    },
  });
  return project;
}

// Get all projects for current user
router.get("/", authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { teamId, status } = req.query;

    const whereCondition: any = {
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
    };

    if (teamId) {
      whereCondition.teamId = teamId;
    }

    if (status) {
      whereCondition.status = status;
    }

    const projects = await prisma.project.findMany({
      where: whereCondition,
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            milestones: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedProjects = projects.map((project) =>
      serializeDecimalFields(project),
    );

    return res.json({
      success: true,
      projects: serializedProjects,
      count: projects.length,
    });
  } catch (error) {
    logger.error("Error fetching projects:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch projects",
    });
  }
});

// Get specific project details
router.get(
  "/:projectId",
  authenticateToken as any,
  async (req: any, res: Response) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.userId;

      const project = await checkProjectAccess(projectId, userId);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: "Project not found or access denied",
        });
      }

      const projectDetails = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          team: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
          owner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          tasks: {
            include: {
              assignee: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
              reporter: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          milestones: {
            orderBy: { dueDate: "asc" },
          },
        },
      });

      if (!projectDetails) {
        return res
          .status(404)
          .json({ success: false, error: "Project not found" });
      }
      const serializedProject = serializeDecimalFields(projectDetails);

      return res.json({
        success: true,
        project: serializedProject,
      });
    } catch (error) {
      logger.error("Error fetching project details:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch project details",
      });
    }
  },
);

// Create new project
router.post(
  "/",
  authenticateToken as any,
  validateSchema(createProjectSchema),
  async (req: any, res: Response) => {
    try {
      const { name, description, teamId, startDate, endDate, settings } =
        req.body;
      const userId = req.user.userId;

      // Check if user has access to the team
      const team = await checkTeamAccess(teamId, userId);

      if (!team) {
        return res.status(404).json({
          success: false,
          error: "Team not found or access denied",
        });
      }

      // Check if team already has a project with this name
      const existingProject = await prisma.project.findFirst({
        where: {
          name,
          teamId,
        },
      });

      if (existingProject) {
        return res.status(400).json({
          success: false,
          error: "Team already has a project with this name",
        });
      }

      const project = await prisma.project.create({
        data: {
          name,
          description,
          teamId,
          ownerId: userId,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          settings,
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          owner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Emit real-time notification to all team members
      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId },
        select: { userId: true },
      });

      teamMembers.forEach((member) => {
        ioRef?.to(`user-${member.userId}`).emit("project:created", {
          id: project.id,
          name: project.name,
          teamName: team.name,
          createdAt: project.createdAt,
        });
      });

      const serializedProject = serializeDecimalFields(project);

      logger.info(
        `Project created: ${project.id} by user ${userId} in team ${teamId}`,
      );

      return res.status(201).json({
        success: true,
        project: serializedProject,
      });
    } catch (error) {
      logger.error("Error creating project:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to create project",
      });
    }
  },
);

// Update project
router.put(
  "/:projectId",
  authenticateToken as any,
  validateSchema(updateProjectSchema),
  async (req: any, res: Response) => {
    try {
      const { projectId } = req.params;
      const { name, description, status, startDate, endDate, settings } =
        req.body;
      const userId = req.user.userId;

      const project = await checkProjectAccess(projectId, userId);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: "Project not found or access denied",
        });
      }

      // Check if user has permission to update this project
      const hasEditPermission =
        project.ownerId === userId ||
        project.team.ownerId === userId ||
        (await prisma.teamMember.findFirst({
          where: {
            teamId: project.teamId,
            userId,
            role: { in: ["ADMIN", "MANAGER"] },
          },
        }));

      if (!hasEditPermission) {
        return res.status(403).json({
          success: false,
          error: "Insufficient permissions to update this project",
        });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (status) updateData.status = status;
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      if (settings) updateData.settings = settings;

      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: updateData,
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          owner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Emit real-time notification to all team members
      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId: project.teamId },
        select: { userId: true },
      });

      teamMembers.forEach((member) => {
        ioRef?.to(`user-${member.userId}`).emit("project:updated", {
          id: updatedProject.id,
          name: updatedProject.name,
          status: updatedProject.status,
          updatedAt: updatedProject.updatedAt,
        });
      });

      const serializedProject = serializeDecimalFields(updatedProject);

      logger.info(`Project updated: ${projectId} by user ${userId}`);

      return res.json({
        success: true,
        project: serializedProject,
      });
    } catch (error) {
      logger.error("Error updating project:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update project",
      });
    }
  },
);

// Get project statistics
router.get(
  "/:projectId/stats",
  authenticateToken as any,
  async (req: any, res: Response) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.userId;

      const project = await checkProjectAccess(projectId, userId);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: "Project not found or access denied",
        });
      }

      const stats = await prisma.task.groupBy({
        by: ["status"],
        where: { projectId },
        _count: true,
      });

      const tasksByPriority = await prisma.task.groupBy({
        by: ["priority"],
        where: { projectId },
        _count: true,
      });

      const overdueTasks = await prisma.task.count({
        where: {
          projectId,
          dueDate: { lt: new Date() },
          status: { notIn: ["DONE", "CANCELLED"] },
        },
      });

      const totalTasks = await prisma.task.count({
        where: { projectId },
      });

      const completedTasks = await prisma.task.count({
        where: {
          projectId,
          status: "DONE",
        },
      });

      const upcomingMilestones = await prisma.milestone.count({
        where: {
          projectId,
          dueDate: { gte: new Date() },
          completedAt: null,
        },
      });

      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return res.json({
        success: true,
        stats: {
          tasksByStatus: stats,
          tasksByPriority,
          overdueTasks,
          totalTasks,
          completedTasks,
          upcomingMilestones,
          progress,
        },
      });
    } catch (error) {
      logger.error("Error fetching project statistics:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch project statistics",
      });
    }
  },
);

// Archive project (soft delete)
router.put(
  "/:projectId/archive",
  authenticateToken as any,
  async (req: any, res: Response) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.userId;

      const project = await checkProjectAccess(projectId, userId);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: "Project not found or access denied",
        });
      }

      // Only project owner or team owner can archive
      if (project.ownerId !== userId && project.team.ownerId !== userId) {
        return res.status(403).json({
          success: false,
          error: "Only project owner or team owner can archive projects",
        });
      }

      const archivedProject = await prisma.project.update({
        where: { id: projectId },
        data: { status: "ARCHIVED" },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Emit real-time notification to all team members
      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId: project.teamId },
        select: { userId: true },
      });

      teamMembers.forEach((member) => {
        ioRef?.to(`user-${member.userId}`).emit("project:archived", {
          id: archivedProject.id,
          name: archivedProject.name,
        });
      });

      logger.info(`Project archived: ${projectId} by user ${userId}`);

      return res.json({
        success: true,
        message: "Project archived successfully",
        project: serializeDecimalFields(archivedProject),
      });
    } catch (error) {
      logger.error("Error archiving project:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to archive project",
      });
    }
  },
);

// Delete project (only project owner or team owner)
router.delete(
  "/:projectId",
  authenticateToken as any,
  async (req: any, res: Response) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.userId;

      const project = await checkProjectAccess(projectId, userId);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: "Project not found or access denied",
        });
      }

      // Only project owner or team owner can delete
      if (project.ownerId !== userId && project.team.ownerId !== userId) {
        return res.status(403).json({
          success: false,
          error: "Only project owner or team owner can delete projects",
        });
      }

      // Get team members before deletion for notifications
      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId: project.teamId },
        select: { userId: true },
      });

      // Delete project (cascades will handle related records)
      await prisma.project.delete({
        where: { id: projectId },
      });

      // Emit real-time notifications to all team members
      teamMembers.forEach((member) => {
        ioRef?.to(`user-${member.userId}`).emit("project:deleted", {
          projectId,
          projectName: project.name,
          teamName: project.team.name,
        });
      });

      logger.info(`Project deleted: ${projectId} by user ${userId}`);

      return res.json({
        success: true,
        message: "Project deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting project:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete project",
      });
    }
  },
);

export default router;
