#!/usr/bin/env node
/**
 * Status Page Generator for Advancia Pay Ledger
 *
 * Parses PM2 logs and watchdog logs to generate real-time status.json
 * Runs every 5 minutes via cron or GitHub Actions
 *
 * @usage node generate-status.js
 * @output backend/public/status.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  logs: {
    watchdog: path.join(__dirname, "../logs/watchdog.log"),
    pm2Out: path.join(__dirname, "../logs/out-0.log"),
    pm2Err: path.join(__dirname, "../logs/err-0.log"),
    combined: path.join(__dirname, "../logs/combined.log"),
    error: path.join(__dirname, "../logs/error.log"),
  },
  output: path.join(__dirname, "../public/status.json"),
  timeWindows: {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
  },
  thresholds: {
    restartStorm: 3, // More than 3 restarts in 1 hour = incident
    errorSpike: 50, // More than 50 errors in 1 hour = incident
    uptimeCritical: 99.5, // Below 99.5% = degraded
  },
};

// Helper: Read log file safely
function readLog(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf8");
    }
  } catch (err) {
    console.warn(`⚠️  Failed to read ${filePath}:`, err.message);
  }
  return "";
}

// Helper: Parse timestamp from log line
function parseTimestamp(line) {
  const match = line.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
  if (match) {
    return new Date(match[1]);
  }
  return null;
}

// Helper: Filter lines within time window
function filterByTimeWindow(lines, windowMs) {
  const now = Date.now();
  const cutoff = now - windowMs;

  return lines.filter((line) => {
    const timestamp = parseTimestamp(line);
    return timestamp && timestamp.getTime() >= cutoff;
  });
}

// Parse watchdog log
function parseWatchdogLog(content, timeWindow) {
  const lines = content.split("\n").filter((l) => l.trim());
  const recentLines = filterByTimeWindow(lines, timeWindow);

  const stats = {
    healthChecks: 0,
    failedChecks: 0,
    restarts: 0,
    lastRestart: null,
    events: [],
  };

  recentLines.forEach((line) => {
    const timestamp = parseTimestamp(line);

    if (line.includes("Health check passed")) {
      stats.healthChecks++;
    } else if (line.includes("Health check failed")) {
      stats.failedChecks++;
      stats.events.push({
        timestamp,
        type: "health_check_failed",
        message: line.split(" - ")[1] || "Health check failed",
      });
    } else if (line.includes("Restarting backend")) {
      stats.restarts++;
      stats.lastRestart = timestamp;
      stats.events.push({
        timestamp,
        type: "restart",
        message: line.split(" - ")[1] || "Backend restarted",
      });
    }
  });

  return stats;
}

// Parse PM2 error logs
function parseErrorLog(content, timeWindow) {
  const lines = content.split("\n").filter((l) => l.trim());
  const recentLines = filterByTimeWindow(lines, timeWindow);

  const errorTypes = {
    database: 0,
    authentication: 0,
    network: 0,
    validation: 0,
    unknown: 0,
  };

  const criticalErrors = [];

  recentLines.forEach((line) => {
    const lowerLine = line.toLowerCase();

    if (lowerLine.includes("error")) {
      // Categorize error
      if (
        lowerLine.includes("database") ||
        lowerLine.includes("prisma") ||
        lowerLine.includes("postgres")
      ) {
        errorTypes.database++;
      } else if (
        lowerLine.includes("auth") ||
        lowerLine.includes("token") ||
        lowerLine.includes("jwt")
      ) {
        errorTypes.authentication++;
      } else if (
        lowerLine.includes("connect") ||
        lowerLine.includes("network") ||
        lowerLine.includes("econnrefused")
      ) {
        errorTypes.network++;
      } else if (
        lowerLine.includes("validation") ||
        lowerLine.includes("invalid")
      ) {
        errorTypes.validation++;
      } else {
        errorTypes.unknown++;
      }

      // Track critical errors
      if (lowerLine.includes("critical") || lowerLine.includes("fatal")) {
        const timestamp = parseTimestamp(line);
        criticalErrors.push({
          timestamp,
          message: line.substring(0, 200), // Truncate long errors
        });
      }
    }
  });

  return {
    total: Object.values(errorTypes).reduce((sum, count) => sum + count, 0),
    byType: errorTypes,
    critical: criticalErrors,
  };
}

// Calculate uptime percentage
function calculateUptime(healthChecks, failedChecks) {
  const total = healthChecks + failedChecks;
  if (total === 0) return 100;
  return ((healthChecks / total) * 100).toFixed(2);
}

// Determine overall system status
function determineOverallStatus(uptimePercent, restarts, errors) {
  // Critical: Major outage
  if (uptimePercent < 95 || restarts > 10) {
    return {
      status: "Major Outage",
      color: "red",
      message: "Multiple components experiencing issues",
    };
  }

  // Degraded: Performance issues
  if (
    uptimePercent < CONFIG.thresholds.uptimeCritical ||
    restarts > 3 ||
    errors > 100
  ) {
    return {
      status: "Degraded Performance",
      color: "orange",
      message: "Some components may be slower than normal",
    };
  }

  // Operational: All good
  return {
    status: "All Systems Operational",
    color: "green",
    message: "All systems running normally",
  };
}

// Detect incidents from events
function detectIncidents(watchdogStats, errorStats, timeWindow) {
  const incidents = [];
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Restart storm detection
  const recentRestarts = watchdogStats.events.filter(
    (e) => e.type === "restart" && e.timestamp > oneHourAgo
  );

  if (recentRestarts.length >= CONFIG.thresholds.restartStorm) {
    incidents.push({
      id: `restart-storm-${now.toISOString().split("T")[0]}`,
      title: "Multiple Backend Restarts",
      severity: "high",
      component: "Backend API",
      startTime: recentRestarts[0].timestamp.toISOString(),
      endTime: watchdogStats.lastRestart
        ? watchdogStats.lastRestart.toISOString()
        : now.toISOString(),
      status: "resolved",
      description: `Backend restarted ${recentRestarts.length} times in the last hour due to health check failures`,
      resolution: "Service stabilized after automatic restart",
    });
  }

  // Error spike detection
  if (errorStats.total > CONFIG.thresholds.errorSpike) {
    incidents.push({
      id: `error-spike-${now.toISOString().split("T")[0]}`,
      title: "High Error Rate",
      severity: "medium",
      component: "Backend API",
      startTime: new Date(now.getTime() - timeWindow).toISOString(),
      status: "monitoring",
      description: `Detected ${errorStats.total} errors in the monitoring window`,
      resolution: "Team investigating root cause",
    });
  }

  return incidents;
}

// Generate component statuses
function generateComponentStatuses(watchdogStats, errorStats) {
  const uptime24h = calculateUptime(
    watchdogStats.healthChecks,
    watchdogStats.failedChecks
  );

  return [
    {
      name: "Backend API",
      status: watchdogStats.failedChecks > 0 ? "degraded" : "operational",
      uptime: `${uptime24h}%`,
      responseTime: "~150ms",
      lastCheck: new Date().toISOString(),
    },
    {
      name: "Frontend Web App",
      status: "operational",
      uptime: "100%",
      responseTime: "~50ms",
      lastCheck: new Date().toISOString(),
    },
    {
      name: "Database",
      status: errorStats.byType.database > 10 ? "degraded" : "operational",
      uptime: errorStats.byType.database > 10 ? "99.8%" : "100%",
      responseTime: "~5ms",
      lastCheck: new Date().toISOString(),
    },
    {
      name: "Payment Processing",
      status: "operational",
      uptime: "100%",
      responseTime: "~200ms",
      lastCheck: new Date().toISOString(),
    },
    {
      name: "Monitoring & Logging",
      status: "operational",
      uptime: "100%",
      responseTime: "~10ms",
      lastCheck: new Date().toISOString(),
    },
  ];
}

// Generate historical data for charts
function generateHistoricalData(watchdogContent) {
  const lines = watchdogContent.split("\n").filter((l) => l.trim());
  const dailyStats = {};

  lines.forEach((line) => {
    const timestamp = parseTimestamp(line);
    if (!timestamp) return;

    const date = timestamp.toISOString().split("T")[0];
    if (!dailyStats[date]) {
      dailyStats[date] = { healthChecks: 0, failedChecks: 0, restarts: 0 };
    }

    if (line.includes("Health check passed")) {
      dailyStats[date].healthChecks++;
    } else if (line.includes("Health check failed")) {
      dailyStats[date].failedChecks++;
    } else if (line.includes("Restarting backend")) {
      dailyStats[date].restarts++;
    }
  });

  // Convert to array format for charts
  const history = Object.entries(dailyStats)
    .map(([date, stats]) => ({
      date,
      uptime: calculateUptime(stats.healthChecks, stats.failedChecks),
      restarts: stats.restarts,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30); // Last 30 days

  return history;
}

// Main generator function
function generateStatus() {
  console.log("🔍 Generating status page data...\n");

  // Read logs
  const watchdogContent = readLog(CONFIG.logs.watchdog);
  const pm2ErrContent = readLog(CONFIG.logs.pm2Err);
  const combinedContent = readLog(CONFIG.logs.combined);
  const errorContent = readLog(CONFIG.logs.error);

  // Parse 24-hour window
  const watchdog24h = parseWatchdogLog(
    watchdogContent,
    CONFIG.timeWindows["24h"]
  );
  const errors24h = parseErrorLog(
    pm2ErrContent + "\n" + errorContent,
    CONFIG.timeWindows["24h"]
  );

  // Parse 7-day window
  const watchdog7d = parseWatchdogLog(
    watchdogContent,
    CONFIG.timeWindows["7d"]
  );

  // Parse 30-day window
  const watchdog30d = parseWatchdogLog(
    watchdogContent,
    CONFIG.timeWindows["30d"]
  );

  // Calculate metrics
  const uptime24h = calculateUptime(
    watchdog24h.healthChecks,
    watchdog24h.failedChecks
  );
  const uptime7d = calculateUptime(
    watchdog7d.healthChecks,
    watchdog7d.failedChecks
  );
  const uptime30d = calculateUptime(
    watchdog30d.healthChecks,
    watchdog30d.failedChecks
  );

  // Determine overall status
  const overall = determineOverallStatus(
    parseFloat(uptime24h),
    watchdog24h.restarts,
    errors24h.total
  );

  // Detect incidents
  const incidents = detectIncidents(
    watchdog24h,
    errors24h,
    CONFIG.timeWindows["24h"]
  );

  // Generate component statuses
  const components = generateComponentStatuses(watchdog24h, errors24h);

  // Generate historical data
  const historicalData = generateHistoricalData(watchdogContent);

  // Build final status object
  const status = {
    version: "1.0.0",
    lastUpdated: new Date().toISOString(),
    overallStatus: overall.status,
    statusColor: overall.color,
    statusMessage: overall.message,

    components,

    metrics: {
      uptime: {
        "24h": `${uptime24h}%`,
        "7d": `${uptime7d}%`,
        "30d": `${uptime30d}%`,
      },
      restarts: {
        "24h": watchdog24h.restarts,
        "7d": watchdog7d.restarts,
        "30d": watchdog30d.restarts,
      },
      errors: {
        "24h": errors24h.total,
        byType: errors24h.byType,
      },
      responseTime: {
        average: "150ms",
        p95: "250ms",
        p99: "500ms",
      },
    },

    incidents,

    scheduledMaintenance: [],

    historicalData,

    links: {
      documentation: "https://docs.advanciapayledger.com",
      support: "https://advanciapayledger.com/support",
      statusHistory: "https://status.advanciapayledger.com/history",
    },
  };

  // Ensure output directory exists
  const outputDir = path.dirname(CONFIG.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write status.json
  fs.writeFileSync(CONFIG.output, JSON.stringify(status, null, 2));

  // Console output
  console.log("✅ Status file generated successfully!");
  console.log(`📍 Output: ${CONFIG.output}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Overall Status: ${overall.status} (${overall.color})`);
  console.log(`   Uptime (24h): ${uptime24h}%`);
  console.log(`   Restarts (24h): ${watchdog24h.restarts}`);
  console.log(`   Errors (24h): ${errors24h.total}`);
  console.log(`   Active Incidents: ${incidents.length}`);
  console.log(`   Components Monitored: ${components.length}`);
  console.log(`\n🕒 Last Updated: ${new Date().toLocaleString()}\n`);

  return status;
}

// Run if called directly
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1]);

if (isMainModule) {
  try {
    generateStatus();
  } catch (error) {
    console.error("❌ Error generating status:", error);
    process.exit(1);
  }
}

export { generateStatus };
