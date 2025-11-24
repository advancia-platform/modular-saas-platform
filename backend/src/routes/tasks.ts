import express, { Response } from "express";
import { z } from "zod";
import logger from "../logger";
import { authenticateToken } from "../middleware/auth";
import { validateInput } from "../middleware/validateInput";
import { validateSchema } from "../middleware/validateSchema";
import prisma from "../prismaClient";
import { TaskResponse } from "../types";
import {
  ErrorResponse,
  PaginatedResponse,
  SuccessResponse,
} from "../types/responses";
import { serializeDecimalFields } from "../utils/decimal";
import { paginationQuerySchema } from "../validation/schemas";

const router = express.Router();

// Socket.IO instance for real-time updates
let ioRef: import("socket.io").Server | null = null;

export const setTaskSocketIO = (io: import("socket.io").Server) => {
  ioRef = io;
};

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  projectId: z.string(),
  assigneeId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  tags: z.array(z.string()).default([]),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().min(0).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().nullable().optional(),
  status: z
    .enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"])
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  estimatedHours: z.number().min(0).nullable().optional(),
  actualHours: z.number().min(0).nullable().optional(),
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

// Helper function to check task access
async function checkTaskAccess(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
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
  return task;
}

// Get all tasks for current user or project (with typed pagination)
router.get("/", authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { page, pageSize } = validateInput(paginationQuerySchema, req.query);
    const { projectId, assigneeId, status, priority, search } = req.query;

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

    if (assigneeId) {
      whereCondition.assigneeId = assigneeId;
    }

    if (status) {
      whereCondition.status = status;
    }

    if (priority) {
      whereCondition.priority = priority;
    }

    if (search) {
      whereCondition.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: whereCondition,
        skip: (page - 1) * pageSize,
        take: pageSize,
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
        orderBy: [
          { priority: "desc" },
          { dueDate: "asc" },
          { createdAt: "desc" },
        ],
      }),
      prisma.task.count({ where: whereCondition }),
    ]);

    const serializedTasks = tasks.map((task) =>
      serializeDecimalFields(task),
    ) as unknown as TaskResponse[];

    const response: PaginatedResponse<TaskResponse> = {
      data: serializedTasks,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: page * pageSize < total,
        hasPrevPage: page > 1,
      },
    };

    return res.json(response);
  } catch (error) {
    logger.error("Error fetching tasks:", error);
    const errorResponse: ErrorResponse = {
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch tasks",
        details: error instanceof Error ? error.message : undefined,
      },
    };
    return res.status(500).json(errorResponse);
  }
});

// Get specific task details (with typed success/error response)
router.get(
  "/:taskId",
  authenticateToken as any,
  async (req: any, res: Response) => {
    try {
      const { taskId } = req.params;
      const userId = req.user.userId;

      const task = await checkTaskAccess(taskId, userId);

      if (!task) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Task not found or access denied",
          },
        };
        return res.status(404).json(errorResponse);
      }

      const taskDetails = await prisma.task.findUnique({
        where: { id: taskId },
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
          assignee: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          reporter: {
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

      if (!taskDetails) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "NOT_FOUND",
            message: "Task not found",
          },
        };
        return res.status(404).json(errorResponse);
      }

      const serializedTask = serializeDecimalFields(
        taskDetails,
      ) as unknown as TaskResponse;

      const successResponse: SuccessResponse<TaskResponse> = {
        data: serializedTask,
        meta: {
          requestId: (req as any).id,
          timestamp: new Date(),
        },
      };

      return res.json(successResponse);
    } catch (error) {
      logger.error("Error fetching task details:", error);
      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch task details",
          details: error instanceof Error ? error.message : undefined,
        },
      };
      return res.status(500).json(errorResponse);
    }
  },
);

// Create new task
router.post(
  "/",
  authenticateToken as any,
  validateSchema(createTaskSchema),
  async (req: any, res: Response) => {
    try {
      const {
        title,
        description,
        projectId,
        assigneeId,
        priority,
        tags,
        dueDate,
        estimatedHours,
      } = req.body;
      const userId = req.user.userId;

      // Check if user has access to the project
      const project = await checkProjectAccess(projectId, userId);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: "Project not found or access denied",
        });
      }

      // If assigneeId provided, check if assignee is a team member
      if (assigneeId) {
        const isTeamMember =
          project.team.members.some((member) => member.userId === assigneeId) ||
          project.team.ownerId === assigneeId ||
          project.ownerId === assigneeId;

        if (!isTeamMember) {
          return res.status(400).json({
            success: false,
            error: "Assignee must be a team member",
          });
        }
      }

      const task = await prisma.task.create({
        data: {
          title,
          description,
          projectId,
          assigneeId,
          reporterId: userId,
          priority,
          tags,
          dueDate: dueDate ? new Date(dueDate) : null,
          estimatedHours,
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
      });

      // Emit real-time notifications
      // Notify all team members
      project.team.members.forEach((member) => {
        ioRef?.to(`user-${member.userId}`).emit("task:created", {
          id: task.id,
          title: task.title,
          projectName: project.name,
          teamName: project.team.name,
          createdAt: task.createdAt,
        });
      });

      // Special notification for assignee if different from creator
      if (assigneeId && assigneeId !== userId) {
        ioRef?.to(`user-${assigneeId}`).emit("task:assigned", {
          id: task.id,
          title: task.title,
          projectName: project.name,
          assignedBy: task.reporter.username,
          dueDate: task.dueDate,
        });
      }

      const serializedTask = serializeDecimalFields(task);

      logger.info(
        `Task created: ${task.id} by user ${userId} in project ${projectId}`,
      );

      return res.status(201).json({
        success: true,
        task: serializedTask,
      });
    } catch (error) {
      logger.error("Error creating task:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to create task",
      });
    }
  },
);

// Update task
router.put(
  "/:taskId",
  authenticateToken as any,
  validateSchema(updateTaskSchema),
  async (req: any, res: Response) => {
    try {
      const { taskId } = req.params;
      const updateData = req.body;
      const userId = req.user.userId;

      const task = await checkTaskAccess(taskId, userId);

      if (!task) {
        return res.status(404).json({
          success: false,
          error: "Task not found or access denied",
        });
      }

      // Prepare update data
      const prismaUpdateData: any = {};

      if (updateData.title) prismaUpdateData.title = updateData.title;
      if (updateData.description !== undefined)
        prismaUpdateData.description = updateData.description;
      if (updateData.assigneeId !== undefined)
        prismaUpdateData.assigneeId = updateData.assigneeId;
      if (updateData.status) {
        prismaUpdateData.status = updateData.status;
        // Auto-set completion time for DONE status
        if (updateData.status === "DONE" && task.status !== "DONE") {
          prismaUpdateData.completedAt = new Date();
        } else if (updateData.status !== "DONE") {
          prismaUpdateData.completedAt = null;
        }
      }
      if (updateData.priority) prismaUpdateData.priority = updateData.priority;
      if (updateData.tags) prismaUpdateData.tags = updateData.tags;
      if (updateData.dueDate !== undefined) {
        prismaUpdateData.dueDate = updateData.dueDate
          ? new Date(updateData.dueDate)
          : null;
      }
      if (updateData.estimatedHours !== undefined)
        prismaUpdateData.estimatedHours = updateData.estimatedHours;
      if (updateData.actualHours !== undefined)
        prismaUpdateData.actualHours = updateData.actualHours;

      // If assigneeId is being changed, validate the new assignee is a team member
      if (updateData.assigneeId !== undefined && updateData.assigneeId) {
        const isTeamMember =
          task.project.team.members.some(
            (member) => member.userId === updateData.assigneeId,
          ) ||
          task.project.team.ownerId === updateData.assigneeId ||
          task.project.ownerId === updateData.assigneeId;

        if (!isTeamMember) {
          return res.status(400).json({
            success: false,
            error: "Assignee must be a team member",
          });
        }
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
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
      });

      // Emit real-time notifications
      // Notify all team members about the update
      task.project.team.members.forEach((member) => {
        ioRef?.to(`user-${member.userId}`).emit("task:updated", {
          id: updatedTask.id,
          title: updatedTask.title,
          status: updatedTask.status,
          projectName: task.project.name,
          updatedAt: updatedTask.updatedAt,
        });
      });

      // Special notifications for assignee changes
      if (updateData.assigneeId !== undefined) {
        // Notify old assignee if task was unassigned or reassigned
        if (task.assigneeId && task.assigneeId !== updateData.assigneeId) {
          ioRef?.to(`user-${task.assigneeId}`).emit("task:unassigned", {
            id: updatedTask.id,
            title: updatedTask.title,
            projectName: task.project.name,
          });
        }

        // Notify new assignee
        if (
          updateData.assigneeId &&
          updateData.assigneeId !== task.assigneeId
        ) {
          ioRef?.to(`user-${updateData.assigneeId}`).emit("task:assigned", {
            id: updatedTask.id,
            title: updatedTask.title,
            projectName: task.project.name,
            assignedBy: userId === task.reporterId ? "reporter" : "team member",
            dueDate: updatedTask.dueDate,
          });
        }
      }

      // Status change notifications
      if (updateData.status && updateData.status !== task.status) {
        // Notify reporter about status changes
        if (task.reporterId !== userId) {
          ioRef?.to(`user-${task.reporterId}`).emit("task:status_changed", {
            id: updatedTask.id,
            title: updatedTask.title,
            oldStatus: task.status,
            newStatus: updateData.status,
            projectName: task.project.name,
          });
        }
      }

      const serializedTask = serializeDecimalFields(updatedTask);

      logger.info(`Task updated: ${taskId} by user ${userId}`);

      return res.json({
        success: true,
        task: serializedTask,
      });
    } catch (error) {
      logger.error("Error updating task:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update task",
      });
    }
  },
);

// Assign task to user
router.put(
  "/:taskId/assign",
  authenticateToken as any,
  async (req: any, res: Response) => {
    try {
      const { taskId } = req.params;
      const { assigneeId } = req.body;
      const userId = req.user.userId;

      const task = await checkTaskAccess(taskId, userId);

      if (!task) {
        return res.status(404).json({
          success: false,
          error: "Task not found or access denied",
        });
      }

      // Validate assignee is a team member
      if (assigneeId) {
        const isTeamMember =
          task.project.team.members.some(
            (member) => member.userId === assigneeId,
          ) ||
          task.project.team.ownerId === assigneeId ||
          task.project.ownerId === assigneeId;

        if (!isTeamMember) {
          return res.status(400).json({
            success: false,
            error: "Assignee must be a team member",
          });
        }
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { assigneeId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          assignee: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Notify new assignee
      if (assigneeId) {
        ioRef?.to(`user-${assigneeId}`).emit("task:assigned", {
          id: updatedTask.id,
          title: updatedTask.title,
          projectName: task.project.name,
          dueDate: updatedTask.dueDate,
        });
      }

      // Notify old assignee if task was reassigned
      if (task.assigneeId && task.assigneeId !== assigneeId) {
        ioRef?.to(`user-${task.assigneeId}`).emit("task:unassigned", {
          id: updatedTask.id,
          title: updatedTask.title,
          projectName: task.project.name,
        });
      }

      const serializedTask = serializeDecimalFields(updatedTask);

      logger.info(
        `Task ${assigneeId ? "assigned" : "unassigned"}: ${taskId} by user ${userId}`,
      );

      return res.json({
        success: true,
        task: serializedTask,
        message: assigneeId
          ? "Task assigned successfully"
          : "Task unassigned successfully",
      });
    } catch (error) {
      logger.error("Error assigning task:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to assign task",
      });
    }
  },
);

// Get my assigned tasks
router.get(
  "/my/assigned",
  authenticateToken as any,
  async (req: any, res: Response) => {
    try {
      const userId = req.user.userId;
      const { status, priority } = req.query;

      const whereCondition: any = {
        assigneeId: userId,
      };

      if (status) {
        whereCondition.status = status;
      }

      if (priority) {
        whereCondition.priority = priority;
      }

      const tasks = await prisma.task.findMany({
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
          reporter: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { priority: "desc" },
          { dueDate: "asc" },
          { createdAt: "desc" },
        ],
      });

      const serializedTasks = tasks.map((task) => serializeDecimalFields(task));

      return res.json({
        success: true,
        tasks: serializedTasks,
        count: tasks.length,
      });
    } catch (error) {
      logger.error("Error fetching assigned tasks:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch assigned tasks",
      });
    }
  },
);

// Delete task
router.delete(
  "/:taskId",
  authenticateToken as any,
  async (req: any, res: Response) => {
    try {
      const { taskId } = req.params;
      const userId = req.user.userId;

      const task = await checkTaskAccess(taskId, userId);

      if (!task) {
        return res.status(404).json({
          success: false,
          error: "Task not found or access denied",
        });
      }

      // Only task reporter, project owner, or team owner can delete
      const canDelete =
        task.reporterId === userId ||
        task.project.ownerId === userId ||
        task.project.team.ownerId === userId;

      if (!canDelete) {
        return res.status(403).json({
          success: false,
          error:
            "Only task reporter, project owner, or team owner can delete tasks",
        });
      }

      // Delete task
      await prisma.task.delete({
        where: { id: taskId },
      });

      // Notify team members
      task.project.team.members.forEach((member) => {
        ioRef?.to(`user-${member.userId}`).emit("task:deleted", {
          taskId,
          title: task.title,
          projectName: task.project.name,
        });
      });

      logger.info(`Task deleted: ${taskId} by user ${userId}`);

      return res.json({
        success: true,
        message: "Task deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting task:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete task",
      });
    }
  },
);

export default router;
