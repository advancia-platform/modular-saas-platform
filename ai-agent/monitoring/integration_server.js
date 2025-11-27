// Node.js Socket.IO Integration Server
// Simple alternative to Python FastAPI server

const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = createServer(app);

// Configure CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3002",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: "http://localhost:3002",
    credentials: true,
  }),
);
app.use(express.json());

// Mock system data generator
function generateSystemHealth() {
  return {
    cpu: Math.floor(Math.random() * 100),
    memory: Math.floor(Math.random() * 100),
    disk: Math.floor(Math.random() * 100),
    network: Math.floor(Math.random() * 100),
    timestamp: new Date().toISOString(),
    status: Math.random() > 0.8 ? "warning" : "normal",
  };
}

function generateThreatData() {
  const threats = ["Malware", "Phishing", "DDoS", "Ransomware", "Brute Force"];
  const severities = ["Low", "Medium", "High", "Critical"];

  return {
    type: threats[Math.floor(Math.random() * threats.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    source: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    timestamp: new Date().toISOString(),
    blocked: Math.random() > 0.3,
  };
}

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Dashboard connected:", socket.id);

  // Send initial data
  socket.emit("system-health", generateSystemHealth());
  socket.emit("threat-detected", generateThreatData());

  // Send periodic updates
  const systemHealthInterval = setInterval(() => {
    socket.emit("system-health", generateSystemHealth());
  }, 2000);

  const threatInterval = setInterval(() => {
    if (Math.random() > 0.7) {
      // 30% chance of new threat
      socket.emit("threat-detected", generateThreatData());
    }
  }, 3000);

  // Handle admin actions
  socket.on("admin-action", (data) => {
    console.log("Admin action received:", data);
    socket.emit("action-response", {
      action: data.action,
      success: true,
      timestamp: new Date().toISOString(),
    });
  });

  // Cleanup on disconnect
  socket.on("disconnect", () => {
    console.log("Dashboard disconnected:", socket.id);
    clearInterval(systemHealthInterval);
    clearInterval(threatInterval);
  });
});

// REST API endpoints
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    server: "Node.js Integration Server",
  });
});

app.get("/api/system-status", (req, res) => {
  res.json(generateSystemHealth());
});

app.post("/api/admin/action", (req, res) => {
  const { action, params } = req.body;
  console.log("REST Admin action:", action, params);

  res.json({
    success: true,
    action,
    timestamp: new Date().toISOString(),
    result: `Action ${action} executed successfully`,
  });
});

// Start server
const PORT = process.env.PORT || 8001;
server.listen(PORT, () => {
  console.log(`🚀 Integration Server running on port ${PORT}`);
  console.log(`📊 Dashboard should connect to: http://localhost:${PORT}`);
  console.log(`🔗 Socket.IO endpoint: http://localhost:${PORT}/socket.io/`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down integration server...");
  server.close(() => {
    console.log("Integration server stopped.");
  });
});
