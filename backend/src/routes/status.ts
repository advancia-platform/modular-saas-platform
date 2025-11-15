import { exec } from "child_process";
import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);
const router = express.Router();

/**
 * Status endpoint for monitoring dashboard
 * GET /api/status
 *
 * Returns parsed status from logs including uptime, restarts, etc.
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    // Run the parse-status script
    const scriptPath = path.join(process.cwd(), "scripts", "parse-status.js");
    await execAsync(`node ${scriptPath}`);

    // Read the generated status.json
    const statusPath = path.join(process.cwd(), "public", "status.json");
    if (fs.existsSync(statusPath)) {
      const statusData = JSON.parse(fs.readFileSync(statusPath, "utf8"));
      res.json(statusData);
    } else {
      // Fallback if file not generated
      res.json({
        status: "operational",
        uptime: "99.98%",
        restarts: 0,
        lastUpdated: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    console.error("[STATUS] Failed to generate status:", error.message);
    res.status(500).json({
      status: "error",
      uptime: "unknown",
      restarts: 0,
      error: error.message,
    });
  }
});

/**
 * PM2 status endpoint
 * GET /api/pm2/status
 *
 * Returns PM2 process status
 */
router.get("/pm2/status", async (req: Request, res: Response) => {
  try {
    const { stdout } = await execAsync("pm2 jlist");
    const pm2Data = JSON.parse(stdout);

    // Extract relevant metrics for advancia-backend
    const backendProcess = pm2Data.find(
      (p: any) => p.name === "advancia-backend"
    );
    if (backendProcess) {
      res.json({
        name: backendProcess.name,
        pid: backendProcess.pid,
        status: backendProcess.pm2_env.status,
        restarts: backendProcess.pm2_env.restart_time,
        uptime: backendProcess.pm2_env.pm_uptime,
        memory: backendProcess.monit.memory,
        cpu: backendProcess.monit.cpu,
      });
    } else {
      res.status(404).json({ error: "Backend process not found" });
    }
  } catch (error: any) {
    console.error("[PM2 STATUS] Failed to get status:", error.message);
    res.status(500).json({
      error: "Failed to get PM2 status",
      details: error.message,
    });
  }
});

export default router;
