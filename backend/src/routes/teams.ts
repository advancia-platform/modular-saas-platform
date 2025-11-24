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

export const setTeamSocketIO = (io: import("socket.io").Server) => {
  ioRef = io;
};

// Validation schemas
const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  settings: z.object({}).optional(),
});

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MANAGER", "MEMBER", "VIEWER"]).default("MEMBER"),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "MEMBER", "VIEWER"]),
});

// Get all teams for current user
router.get("/", authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;

    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: { userId },
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
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
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedTeams = teams.map((team) => serializeDecimalFields(team));

    return res.json({
      success: true,
      teams: serializedTeams,
      count: teams.length,
    });
  } catch (error) {
    logger.error("Error fetching teams:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch teams",
    });
  }
});

// Get specific team details
router.get(
  "/:teamId",
  authenticateToken as any,
  async (req: any, res: Response) => {
    try {
      const { teamId } = req.params;
      const userId = req.user.userId;

      // Check if user has access to this team
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
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
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
          projects: {
            include: {
              _count: {
                select: {
                  tasks: true,
                },
              },
            },
          },
        },
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          error: "Team not found or access denied",
        });
      }

      const serializedTeam = serializeDecimalFields(team);

      return res.json({
        success: true,
        team: serializedTeam,
      });
    } catch (error) {
      logger.error("Error fetching team details:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch team details",
      });
    }
  },
);

// Create new team
router.post(
  "/",
  authenticateToken as any,
  validateSchema(createTeamSchema),
  async (req: any, res: Response) => {
    try {
      const { name, description } = req.body;
      const userId = req.user.userId;

      // Check if user already has a team with this name
      const existingTeam = await prisma.team.findFirst({
        where: {
          name,
          ownerId: userId,
        },
      });

      if (existingTeam) {
        return res.status(400).json({
          success: false,
          error: "You already have a team with this name",
        });
      }

      const team = await prisma.team.create({
        data: {
          name,
          description,
          ownerId: userId,
        },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
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
      });

      // Emit real-time notification
      ioRef?.to(`user-${userId}`).emit("team:created", {
        id: team.id,
        name: team.name,
        createdAt: team.createdAt,
      });

      const serializedTeam = serializeDecimalFields(team);

      logger.info(`Team created: ${team.id} by user ${userId}`);

      return res.status(201).json({
        success: true,
        team: serializedTeam,
      });
    } catch (error) {
      logger.error("Error creating team:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to create team",
      });
    }
  },
);

// Update team
router.put(
  "/:teamId",
  authenticateToken as any,
  validateSchema(updateTeamSchema),
  async (req: any, res: Response) => {
    try {
      const { teamId } = req.params;
      const { name, description, settings } = req.body;
      const userId = req.user.userId;

      // Check if user has permission to update this team
      const team = await prisma.team.findFirst({
        where: {
          id: teamId,
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId,
                  role: { in: ["ADMIN", "MANAGER"] },
                },
              },
            },
          ],
        },
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          error: "Team not found or insufficient permissions",
        });
      }

      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(settings && { settings }),
        },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
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
      });

      // Emit real-time notification to all team members
      const memberIds = updatedTeam.members.map((member) => member.userId);
      memberIds.forEach((memberId) => {
        ioRef?.to(`user-${memberId}`).emit("team:updated", {
          id: updatedTeam.id,
          name: updatedTeam.name,
          updatedAt: updatedTeam.updatedAt,
        });
      });

      const serializedTeam = serializeDecimalFields(updatedTeam);

      logger.info(`Team updated: ${teamId} by user ${userId}`);

      return res.json({
        success: true,
        team: serializedTeam,
      });
    } catch (error) {
      logger.error("Error updating team:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update team",
      });
    }
  },
);

// Add member to team
router.post(
  "/:teamId/members",
  authenticateToken as any,
  validateSchema(addMemberSchema),
  async (req: any, res: Response) => {
    try {
      const { teamId } = req.params;
      const { email, role } = req.body;
      const userId = req.user.userId;

      // Check if user has permission to add members
      const team = await prisma.team.findFirst({
        where: {
          id: teamId,
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId,
                  role: { in: ["ADMIN", "MANAGER"] },
                },
              },
            },
          ],
        },
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          error: "Team not found or insufficient permissions",
        });
      }

      // Find user by email
      const userToAdd = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      if (!userToAdd) {
        return res.status(404).json({
          success: false,
          error: "User not found with this email",
        });
      }

      // Check if user is already a member
      const existingMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: userToAdd.id,
          },
        },
      });

      if (existingMember) {
        return res.status(400).json({
          success: false,
          error: "User is already a member of this team",
        });
      }

      // Add member
      const teamMember = await prisma.teamMember.create({
        data: {
          teamId,
          userId: userToAdd.id,
          role,
        },
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
      });

      // Emit real-time notifications
      ioRef?.to(`user-${userToAdd.id}`).emit("team:member_added", {
        teamId,
        teamName: team.name,
        role,
      });

      const serializedMember = serializeDecimalFields(teamMember);

      logger.info(
        `Member added to team: ${userToAdd.id} to ${teamId} with role ${role}`,
      );

      return res.status(201).json({
        success: true,
        member: serializedMember,
      });
    } catch (error) {
      logger.error("Error adding team member:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to add team member",
      });
    }
  },
);

// Update member role
router.put(
  "/:teamId/members/:memberId",
  authenticateToken as any,
  validateSchema(updateMemberRoleSchema),
  async (req: any, res: Response) => {
    try {
      const { teamId, memberId } = req.params;
      const { role } = req.body;
      const userId = req.user.userId;

      // Check if user has permission to update member roles
      const team = await prisma.team.findFirst({
        where: {
          id: teamId,
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId,
                  role: { in: ["ADMIN"] },
                },
              },
            },
          ],
        },
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          error: "Team not found or insufficient permissions",
        });
      }

      // Update member role
      const updatedMember = await prisma.teamMember.update({
        where: { id: memberId },
        data: { role },
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
      });

      // Emit real-time notification
      ioRef?.to(`user-${updatedMember.userId}`).emit("team:role_updated", {
        teamId,
        teamName: team.name,
        newRole: role,
      });

      const serializedMember = serializeDecimalFields(updatedMember);

      logger.info(
        `Member role updated: ${memberId} to ${role} in team ${teamId}`,
      );

      return res.json({
        success: true,
        member: serializedMember,
      });
    } catch (error) {
      logger.error("Error updating member role:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update member role",
      });
    }
  },
);

// Remove member from team
router.delete(
  "/:teamId/members/:memberId",
  authenticateToken as any,
  async (req: any, res: Response) => {
    try {
      const { teamId, memberId } = req.params;
      const userId = req.user.userId;

      // Check if user has permission to remove members
      const team = await prisma.team.findFirst({
        where: {
          id: teamId,
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId,
                  role: { in: ["ADMIN"] },
                },
              },
            },
          ],
        },
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          error: "Team not found or insufficient permissions",
        });
      }

      // Get member details before deletion
      const member = await prisma.teamMember.findUnique({
        where: { id: memberId },
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
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          error: "Member not found",
        });
      }

      // Remove member
      await prisma.teamMember.delete({
        where: { id: memberId },
      });

      // Emit real-time notification
      ioRef?.to(`user-${member.userId}`).emit("team:member_removed", {
        teamId,
        teamName: team.name,
      });

      logger.info(`Member removed from team: ${member.userId} from ${teamId}`);

      return res.json({
        success: true,
        message: "Member removed from team successfully",
      });
    } catch (error) {
      logger.error("Error removing team member:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to remove team member",
      });
    }
  },
);

// Delete team (only owner can delete)
router.delete(
  "/:teamId",
  authenticateToken as any,
  async (req: any, res: Response) => {
    try {
      const { teamId } = req.params;
      const userId = req.user.userId;

      // Check if user is the team owner
      const team = await prisma.team.findFirst({
        where: {
          id: teamId,
          ownerId: userId,
        },
        include: {
          members: {
            select: { userId: true },
          },
        },
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          error: "Team not found or you are not the owner",
        });
      }

      // Delete team (cascades will handle related records)
      await prisma.team.delete({
        where: { id: teamId },
      });

      // Emit real-time notifications to all members
      team.members.forEach((member) => {
        ioRef?.to(`user-${member.userId}`).emit("team:deleted", {
          teamId,
          teamName: team.name,
        });
      });

      logger.info(`Team deleted: ${teamId} by owner ${userId}`);

      return res.json({
        success: true,
        message: "Team deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting team:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete team",
      });
    }
  },
);

export default router;
