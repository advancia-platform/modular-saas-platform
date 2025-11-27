import { verify } from "jsonwebtoken";
import { Socket, Server as SocketIOServer } from "socket.io";
import { config } from "../jobs/config";
import { logger } from "../logger";

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  tenantId?: string;
  role?: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupAuthentication();
    this.setupEventHandlers();
  }

  private setupAuthentication(): void {
    this.io.use((socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace("Bearer ", "");

        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const decoded = verify(token, config.jwtSecret) as any;

        socket.userId = decoded.userId;
        socket.tenantId = decoded.tenantId;
        socket.role = decoded.role;

        logger.info(
          {
            userId: socket.userId,
            socketId: socket.id,
            role: socket.role,
          },
          "Socket authenticated",
        );

        next();
      } catch (error) {
        logger.warn(
          {
            socketId: socket.id,
            error: error.message,
          },
          "Socket authentication failed",
        );

        next(new Error("Authentication failed"));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      if (!socket.userId) return;

      // Track connected user
      this.addUserConnection(socket.userId, socket.id);

      // Join user-specific room
      socket.join(`user:${socket.userId}`);

      // Join tenant room if applicable
      if (socket.tenantId) {
        socket.join(`tenant:${socket.tenantId}`);
      }

      // Join role-based rooms
      if (socket.role) {
        socket.join(`role:${socket.role}`);
      }

      logger.info(
        {
          userId: socket.userId,
          socketId: socket.id,
          totalConnections: this.getConnectedSocketsCount(socket.userId),
        },
        "User connected via WebSocket",
      );

      // Handle join-room event for backwards compatibility
      socket.on("join-room", (room: string) => {
        if (
          room === `user-${socket.userId}` ||
          room === `user:${socket.userId}`
        ) {
          socket.join(room);
          socket.emit("room-joined", room);
        }
      });

      // Handle presence events
      socket.on("user-typing", (data) => {
        socket.broadcast.to(`tenant:${socket.tenantId}`).emit("user-typing", {
          userId: socket.userId,
          ...data,
        });
      });

      socket.on("user-stopped-typing", (data) => {
        socket.broadcast
          .to(`tenant:${socket.tenantId}`)
          .emit("user-stopped-typing", {
            userId: socket.userId,
            ...data,
          });
      });

      // Handle disconnection
      socket.on("disconnect", (reason) => {
        this.removeUserConnection(socket.userId!, socket.id);

        logger.info(
          {
            userId: socket.userId,
            socketId: socket.id,
            reason,
            remainingConnections: this.getConnectedSocketsCount(socket.userId!),
          },
          "User disconnected from WebSocket",
        );
      });
    });
  }

  private addUserConnection(userId: string, socketId: string): void {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socketId);
  }

  private removeUserConnection(userId: string, socketId: string): void {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  private getConnectedSocketsCount(userId: string): number {
    return this.connectedUsers.get(userId)?.size || 0;
  }

  // Public methods for emitting events

  // Emit to specific user
  public emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
    logger.debug(
      {
        targetUserId: userId,
        event,
        dataKeys: Object.keys(data || {}),
      },
      "Event emitted to user",
    );
  }

  // Emit to tenant
  public emitToTenant(tenantId: string, event: string, data: any): void {
    this.io.to(`tenant:${tenantId}`).emit(event, data);
    logger.debug(
      {
        targetTenant: tenantId,
        event,
        dataKeys: Object.keys(data || {}),
      },
      "Event emitted to tenant",
    );
  }

  // Emit to role
  public emitToRole(role: string, event: string, data: any): void {
    this.io.to(`role:${role}`).emit(event, data);
    logger.debug(
      {
        targetRole: role,
        event,
        dataKeys: Object.keys(data || {}),
      },
      "Event emitted to role",
    );
  }

  // Emit to all connected users
  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
    logger.debug(
      {
        event,
        dataKeys: Object.keys(data || {}),
      },
      "Event broadcasted to all users",
    );
  }

  // Transaction notifications
  public notifyTransactionCreated(userId: string, transaction: any): void {
    this.emitToUser(userId, "transaction:created", {
      type: "transaction",
      action: "created",
      data: transaction,
      timestamp: new Date().toISOString(),
    });
  }

  public notifyTransactionUpdated(userId: string, transaction: any): void {
    this.emitToUser(userId, "transaction:updated", {
      type: "transaction",
      action: "updated",
      data: transaction,
      timestamp: new Date().toISOString(),
    });
  }

  public notifyTransactionStatusChanged(
    userId: string,
    transactionId: string,
    status: string,
  ): void {
    this.emitToUser(userId, "transaction:status-changed", {
      type: "transaction",
      action: "status_changed",
      transactionId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  // Payment notifications
  public notifyPaymentReceived(userId: string, payment: any): void {
    this.emitToUser(userId, "payment:received", {
      type: "payment",
      action: "received",
      data: payment,
      timestamp: new Date().toISOString(),
    });
  }

  public notifyPaymentProcessed(userId: string, payment: any): void {
    this.emitToUser(userId, "payment:processed", {
      type: "payment",
      action: "processed",
      data: payment,
      timestamp: new Date().toISOString(),
    });
  }

  // Balance notifications
  public notifyBalanceUpdated(userId: string, balance: any): void {
    this.emitToUser(userId, "balance:updated", {
      type: "balance",
      action: "updated",
      data: balance,
      timestamp: new Date().toISOString(),
    });
  }

  // Security notifications
  public notifySecurityEvent(
    userId: string,
    event: string,
    details: any,
  ): void {
    this.emitToUser(userId, "security:alert", {
      type: "security",
      event,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  public notifyLogin(userId: string, loginDetails: any): void {
    this.emitToUser(userId, "auth:login", {
      type: "auth",
      action: "login",
      details: loginDetails,
      timestamp: new Date().toISOString(),
    });
  }

  // Admin notifications
  public notifyAdmins(event: string, data: any): void {
    this.emitToRole("ADMIN", `admin:${event}`, {
      type: "admin",
      event,
      data,
      timestamp: new Date().toISOString(),
    });

    this.emitToRole("SUPER_ADMIN", `admin:${event}`, {
      type: "admin",
      event,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // System notifications
  public notifySystemAlert(
    level: "info" | "warning" | "error",
    message: string,
    details?: any,
  ): void {
    this.emitToRole("ADMIN", "system:alert", {
      type: "system",
      level,
      message,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  // Get connection stats
  public getConnectionStats(): {
    totalConnections: number;
    connectedUsers: number;
    userConnections: Record<string, number>;
  } {
    const totalConnections = Array.from(this.connectedUsers.values()).reduce(
      (sum, sockets) => sum + sockets.size,
      0,
    );

    const userConnections: Record<string, number> = {};
    this.connectedUsers.forEach((sockets, userId) => {
      userConnections[userId] = sockets.size;
    });

    return {
      totalConnections,
      connectedUsers: this.connectedUsers.size,
      userConnections,
    };
  }

  // Check if user is connected
  public isUserConnected(userId: string): boolean {
    return (
      this.connectedUsers.has(userId) &&
      this.connectedUsers.get(userId)!.size > 0
    );
  }
}

// Export singleton instance
let webSocketService: WebSocketService;

export function initializeWebSocketService(
  io: SocketIOServer,
): WebSocketService {
  webSocketService = new WebSocketService(io);
  return webSocketService;
}

export function getWebSocketService(): WebSocketService {
  if (!webSocketService) {
    throw new Error(
      "WebSocket service not initialized. Call initializeWebSocketService first.",
    );
  }
  return webSocketService;
}
