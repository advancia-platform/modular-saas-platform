// Load environment variables FIRST
import dotenv from "dotenv";
dotenv.config();

console.log("🚀 Minimal backend starting...");
console.log("📍 Working directory:", process.cwd());
console.log("🔧 Node version:", process.version);

import express from "express";

const app = express();
const port = Number(process.env.PORT) || 4000;

// Basic middleware
app.use(express.json());

// Simple health endpoint
app.get("/health", (req, res) => {
  console.log("Health endpoint hit");
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "Backend is running",
  });
});

// Start server with error handling
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running on 0.0.0.0:${port}`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
});

server.on("error", (err) => {
  console.error("❌ Server error:", err);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled rejection:", reason);
});
