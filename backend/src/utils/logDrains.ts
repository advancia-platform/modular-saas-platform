import * as Sentry from "@sentry/node";
import { Request, Response, Router } from "express";

/**
 * Log Drains Handler
 * Receives logs from external platforms (Vercel, Heroku, etc.) and forwards to Sentry
 */

export const logDrainsRouter = Router();

// Vercel Log Drain types
interface VercelLogMessage {
  id: string;
  message: string;
  timestamp: number;
  type: "stdout" | "stderr";
  source: "build" | "static" | "external" | "lambda";
  projectId: string;
  deploymentId: string;
  buildId?: string;
  host: string;
  path?: string;
  entrypoint?: string;
  requestId?: string;
  statusCode?: number;
  proxy?: {
    timestamp: number;
    region: string;
    path: string;
    host: string;
    method: string;
    userAgent: string[];
    referer: string;
    statusCode: number;
    clientIp: string;
    cacheId?: string;
  };
}

interface HerokuLogMessage {
  id: string;
  created_at: string;
  message: string;
  app_name: string;
  dyno: string;
  log_type: "router" | "app" | "heroku";
}

/**
 * Vercel Log Drain Endpoint
 * Configure in Vercel Dashboard: Settings > Log Drains > Add Log Drain
 * URL: https://your-backend.com/api/logs/vercel
 * Secret: VERCEL_LOG_DRAIN_SECRET
 */
logDrainsRouter.post("/vercel", async (req: Request, res: Response) => {
  try {
    // Verify the request is from Vercel
    const vercelSignature = req.headers["x-vercel-signature"];
    const secret = process.env.VERCEL_LOG_DRAIN_SECRET;

    if (secret && vercelSignature) {
      const crypto = await import("crypto");
      const expectedSignature = crypto
        .createHmac("sha1", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (vercelSignature !== expectedSignature) {
        console.warn("[LogDrain] Invalid Vercel signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
    }

    const logs: VercelLogMessage[] = Array.isArray(req.body)
      ? req.body
      : [req.body];

    for (const log of logs) {
      const level = log.type === "stderr" ? "error" : "info";
      const message = `[Vercel/${log.source}] ${log.message}`;

      // Forward to Sentry
      if (level === "error") {
        Sentry.logger.error(message, {
          source: "vercel",
          logType: log.source,
          projectId: log.projectId,
          deploymentId: log.deploymentId,
          host: log.host,
          path: log.path,
          requestId: log.requestId,
          statusCode: log.statusCode,
          timestamp: new Date(log.timestamp).toISOString(),
        });
      } else {
        Sentry.logger.info(message, {
          source: "vercel",
          logType: log.source,
          projectId: log.projectId,
          deploymentId: log.deploymentId,
          host: log.host,
          timestamp: new Date(log.timestamp).toISOString(),
        });
      }

      // Also log proxy/edge information if available
      if (log.proxy) {
        Sentry.logger.info(
          `[Vercel/Edge] ${log.proxy.method} ${log.proxy.path}`,
          {
            source: "vercel-edge",
            region: log.proxy.region,
            statusCode: log.proxy.statusCode,
            clientIp: log.proxy.clientIp,
            userAgent: log.proxy.userAgent?.join(", "),
            timestamp: new Date(log.proxy.timestamp).toISOString(),
          },
        );
      }
    }

    res.status(200).json({ received: logs.length });
  } catch (error) {
    console.error("[LogDrain] Error processing Vercel logs:", error);
    Sentry.captureException(error);
    res.status(500).json({ error: "Failed to process logs" });
  }
});

/**
 * Heroku Log Drain Endpoint
 * Configure via Heroku CLI: heroku drains:add https://your-backend.com/api/logs/heroku -a your-app
 */
logDrainsRouter.post("/heroku", async (req: Request, res: Response) => {
  try {
    // Heroku sends logs as text/plain with syslog format
    const rawBody = req.body;
    let logs: HerokuLogMessage[] = [];

    if (typeof rawBody === "string") {
      // Parse Heroku syslog format
      const lines = rawBody.split("\n").filter((line: string) => line.trim());
      logs = lines.map((line: string) => parseHerokuLog(line));
    } else if (Array.isArray(rawBody)) {
      logs = rawBody;
    }

    for (const log of logs) {
      if (!log.message) continue;

      const isError =
        log.message.toLowerCase().includes("error") ||
        log.message.toLowerCase().includes("fatal") ||
        log.message.toLowerCase().includes("exception");

      const message = `[Heroku/${log.dyno || "app"}] ${log.message}`;

      if (isError) {
        Sentry.logger.error(message, {
          source: "heroku",
          appName: log.app_name,
          dyno: log.dyno,
          logType: log.log_type,
          timestamp: log.created_at,
        });
      } else {
        Sentry.logger.info(message, {
          source: "heroku",
          appName: log.app_name,
          dyno: log.dyno,
          logType: log.log_type,
          timestamp: log.created_at,
        });
      }
    }

    res.status(200).json({ received: logs.length });
  } catch (error) {
    console.error("[LogDrain] Error processing Heroku logs:", error);
    Sentry.captureException(error);
    res.status(500).json({ error: "Failed to process logs" });
  }
});

/**
 * Generic Log Drain Endpoint
 * For custom log forwarding from any source
 */
logDrainsRouter.post("/generic", async (req: Request, res: Response) => {
  try {
    const { logs, source, apiKey } = req.body;

    // Validate API key if configured
    if (
      process.env.LOG_DRAIN_API_KEY &&
      apiKey !== process.env.LOG_DRAIN_API_KEY
    ) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    const logEntries = Array.isArray(logs) ? logs : [logs];

    for (const log of logEntries) {
      const level = log.level || "info";
      const message = log.message || JSON.stringify(log);

      const logData = {
        source: source || "generic",
        ...log.metadata,
        timestamp: log.timestamp || new Date().toISOString(),
      };

      switch (level) {
        case "error":
          Sentry.logger.error(message, logData);
          break;
        case "warn":
        case "warning":
          Sentry.logger.warn(message, logData);
          break;
        case "debug":
          Sentry.logger.debug(message, logData);
          break;
        default:
          Sentry.logger.info(message, logData);
      }
    }

    res.status(200).json({ received: logEntries.length });
  } catch (error) {
    console.error("[LogDrain] Error processing generic logs:", error);
    Sentry.captureException(error);
    res.status(500).json({ error: "Failed to process logs" });
  }
});

/**
 * OpenTelemetry-compatible log ingestion endpoint
 * Receives OTLP logs format
 */
logDrainsRouter.post("/otlp", async (req: Request, res: Response) => {
  try {
    const { resourceLogs } = req.body;

    if (!resourceLogs || !Array.isArray(resourceLogs)) {
      return res.status(400).json({ error: "Invalid OTLP format" });
    }

    let count = 0;

    for (const resourceLog of resourceLogs) {
      const resource = resourceLog.resource?.attributes || [];
      const resourceAttrs: Record<string, string> = {};

      for (const attr of resource) {
        resourceAttrs[attr.key] =
          attr.value?.stringValue || attr.value?.intValue || "";
      }

      for (const scopeLog of resourceLog.scopeLogs || []) {
        for (const logRecord of scopeLog.logRecords || []) {
          const severity = getSeverityFromOTLP(logRecord.severityNumber);
          const message = logRecord.body?.stringValue || "";
          const attributes: Record<string, unknown> = {
            source: "otlp",
            serviceName: resourceAttrs["service.name"] || "unknown",
            ...resourceAttrs,
          };

          // Parse log record attributes
          for (const attr of logRecord.attributes || []) {
            attributes[attr.key] =
              attr.value?.stringValue || attr.value?.intValue || "";
          }

          switch (severity) {
            case "error":
            case "fatal":
              Sentry.logger.error(message, attributes);
              break;
            case "warn":
              Sentry.logger.warn(message, attributes);
              break;
            case "debug":
            case "trace":
              Sentry.logger.debug(message, attributes);
              break;
            default:
              Sentry.logger.info(message, attributes);
          }

          count++;
        }
      }
    }

    res.status(200).json({ received: count });
  } catch (error) {
    console.error("[LogDrain] Error processing OTLP logs:", error);
    Sentry.captureException(error);
    res.status(500).json({ error: "Failed to process logs" });
  }
});

/**
 * Health check for log drain endpoints
 */
logDrainsRouter.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    endpoints: ["/vercel", "/heroku", "/generic", "/otlp"],
    sentryEnabled: !!process.env.SENTRY_DSN,
  });
});

// Helper function to parse Heroku syslog format
function parseHerokuLog(line: string): HerokuLogMessage {
  // Heroku syslog format: <priority>version timestamp hostname app_name dyno message
  const match = line.match(/^<\d+>\d+ (\S+) (\S+) (\S+) (\S+) - (.*)$/);

  if (match) {
    return {
      id: crypto.randomUUID?.() || Date.now().toString(),
      created_at: match[1],
      app_name: match[3],
      dyno: match[4],
      message: match[5],
      log_type: match[4].startsWith("router") ? "router" : "app",
    };
  }

  return {
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    message: line,
    app_name: "unknown",
    dyno: "unknown",
    log_type: "app",
  };
}

// Helper function to convert OTLP severity number to string
function getSeverityFromOTLP(severityNumber: number): string {
  // OTLP severity numbers: https://opentelemetry.io/docs/specs/otel/logs/data-model/#severity-fields
  if (severityNumber >= 21) return "fatal";
  if (severityNumber >= 17) return "error";
  if (severityNumber >= 13) return "warn";
  if (severityNumber >= 9) return "info";
  if (severityNumber >= 5) return "debug";
  return "trace";
}

export default logDrainsRouter;
