import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import prisma from "../prismaClient";

let isShuttingDown = false;

export function setupGracefulShutdown(
  server: HTTPServer,
  io: SocketIOServer
): void {
  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      console.log(`[${signal}] Already shutting down, ignoring...`);
      return;
    }

    isShuttingDown = true;
    console.log(`[${signal}] Graceful shutdown initiated...`);

    // Stop accepting new connections
    server.close(() => {
      console.log("[SHUTDOWN] HTTP server closed");
    });

    // Give existing requests 15 seconds to complete
    const shutdownTimeout = setTimeout(() => {
      console.error("[SHUTDOWN] Forcing shutdown after timeout");
      process.exit(1);
    }, 15000);

    try {
      // Disconnect all socket connections gracefully
      console.log("[SHUTDOWN] Closing WebSocket connections...");
      io.emit("server-shutdown", {
        message: "Server is restarting. Please refresh in a moment.",
      });

      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for messages to send
      io.close(() => {
        console.log("[SHUTDOWN] Socket.IO connections closed");
      });

      // Close database connections
      console.log("[SHUTDOWN] Disconnecting database...");
      await prisma.$disconnect();
      console.log("[SHUTDOWN] Database disconnected");

      clearTimeout(shutdownTimeout);
      console.log("[SHUTDOWN] Graceful shutdown complete");
      process.exit(0);
    } catch (error) {
      console.error("[SHUTDOWN] Error during graceful shutdown:", error);
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  };

  // Handle various termination signals
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    console.error("[CRITICAL] Uncaught Exception:", error);

    // Don't exit immediately - try graceful shutdown
    if (!isShuttingDown) {
      shutdown("uncaughtException");
    }
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    console.error(
      "[CRITICAL] Unhandled Rejection at:",
      promise,
      "reason:",
      reason
    );

    // Log but don't crash - service should stay up
    // Only shutdown if it's a critical error
    if (reason instanceof Error && reason.message.includes("ECONNREFUSED")) {
      console.error("[CRITICAL] Database connection lost, initiating shutdown");
      shutdown("unhandledRejection");
    }
  });

  console.log("[STARTUP] Graceful shutdown handlers registered");
}

// Health check for PM2/process managers
export function sendReadySignal(): void {
  if (process.send) {
    process.send("ready");
    console.log("[STARTUP] Process ready signal sent to PM2");
  }
}
