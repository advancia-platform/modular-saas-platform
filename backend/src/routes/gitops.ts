// gitops.ts - Backend API routes for ArgoCD, Prometheus, and Grafana integration
// Provides secure proxy endpoints for the frontend to connect to GitOps services

import axios, { AxiosResponse } from "axios";
import { Request, Response, Router } from "express";
import logger from "../logger";
import { allowRoles, authenticateToken } from "../middleware/auth";

const router = Router();

// Configuration from environment variables
const ARGOCD_SERVER =
  process.env.ARGOCD_SERVER_URL || "https://argocd.default.svc.cluster.local";
const ARGOCD_TOKEN = process.env.ARGOCD_AUTH_TOKEN;
const PROMETHEUS_URL =
  process.env.PROMETHEUS_URL ||
  "http://prometheus.monitoring.svc.cluster.local:9090";
const GRAFANA_URL =
  process.env.GRAFANA_URL || "http://grafana.monitoring.svc.cluster.local:3000";
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;

// Create axios instances with default configurations
const argoCDAxios = axios.create({
  baseURL: ARGOCD_SERVER,
  timeout: 30000,
  headers: {
    Authorization: `Bearer ${ARGOCD_TOKEN}`,
    "Content-Type": "application/json",
  },
});

const prometheusAxios = axios.create({
  baseURL: PROMETHEUS_URL,
  timeout: 15000,
});

const grafanaAxios = axios.create({
  baseURL: GRAFANA_URL,
  timeout: 15000,
  headers: GRAFANA_API_KEY
    ? {
        Authorization: `Bearer ${GRAFANA_API_KEY}`,
        "Content-Type": "application/json",
      }
    : {},
});

// Middleware to validate GitOps integration is enabled
const validateGitOpsEnabled = (req: Request, res: Response, next: any) => {
  if (!ARGOCD_TOKEN && !process.env.DISABLE_GITOPS_AUTH) {
    return res.status(503).json({
      error: "GitOps integration not configured",
      message: "ARGOCD_AUTH_TOKEN environment variable is required",
    });
  }
  next();
};

// GET /api/gitops/applications - List ArgoCD applications
router.get(
  "/applications",
  authenticateToken,
  allowRoles("admin", "operator"),
  validateGitOpsEnabled,
  async (req: Request, res: Response) => {
    try {
      logger.info("Fetching ArgoCD applications", {
        user: (req as any).user?.id,
        endpoint: "/api/gitops/applications",
      });

      const response: AxiosResponse = await argoCDAxios.get(
        "/api/v1/applications",
      );

      // Filter applications to only include those relevant to this project
      const filteredApps =
        response.data.items?.filter(
          (app: any) =>
            app.metadata?.name?.includes("ai-agent") ||
            app.metadata?.name?.includes("advancia") ||
            app.spec?.source?.repoURL?.includes("modular-saas-platform"),
        ) || [];

      res.json({
        items: filteredApps,
        total: filteredApps.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error("Failed to fetch ArgoCD applications", {
        error: error.message,
        stack: error.stack,
        user: (req as any).user?.id,
      });

      if (error.response?.status === 401) {
        return res.status(401).json({
          error: "ArgoCD authentication failed",
          message: "Invalid ArgoCD token",
        });
      }

      res.status(500).json({
        error: "Failed to fetch applications",
        message: error.message,
      });
    }
  },
);

// GET /api/gitops/applications/:name - Get specific application details
router.get(
  "/applications/:name",
  authenticateToken,
  allowRoles("admin", "operator"),
  validateGitOpsEnabled,
  async (req: Request, res: Response) => {
    try {
      const { name } = req.params;

      logger.info("Fetching ArgoCD application details", {
        applicationName: name,
        user: (req as any).user?.id,
      });

      const [appResponse, eventsResponse] = await Promise.allSettled([
        argoCDAxios.get(`/api/v1/applications/${name}`),
        argoCDAxios.get(`/api/v1/applications/${name}/events`),
      ]);

      const application =
        appResponse.status === "fulfilled" ? appResponse.value.data : null;
      const events =
        eventsResponse.status === "fulfilled"
          ? eventsResponse.value.data.items
          : [];

      if (!application) {
        return res.status(404).json({
          error: "Application not found",
          name,
        });
      }

      res.json({
        application,
        events: events.slice(0, 10), // Last 10 events
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error("Failed to fetch ArgoCD application details", {
        applicationName: req.params.name,
        error: error.message,
        user: (req as any).user?.id,
      });

      res.status(500).json({
        error: "Failed to fetch application details",
        message: error.message,
      });
    }
  },
);

// POST /api/gitops/applications/:name/sync - Sync application
router.post(
  "/applications/:name/sync",
  authenticateToken,
  allowRoles("admin"),
  validateGitOpsEnabled,
  async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const { dryRun = false, prune = false, force = false } = req.body;

      logger.info("Initiating ArgoCD application sync", {
        applicationName: name,
        user: (req as any).user?.id,
        dryRun,
        prune,
        force,
      });

      const syncRequest = {
        revision: "HEAD",
        dryRun,
        syncOptions: {
          items: prune ? ["PruneLast=true"] : [],
          force,
        },
      };

      const response: AxiosResponse = await argoCDAxios.post(
        `/api/v1/applications/${name}/sync`,
        syncRequest,
      );

      logger.info("ArgoCD application sync initiated", {
        applicationName: name,
        operationId: response.data.metadata?.uid,
        user: (req as any).user?.id,
      });

      res.json({
        success: true,
        operation: response.data,
        message: `Sync initiated for application ${name}`,
      });
    } catch (error: any) {
      logger.error("Failed to sync ArgoCD application", {
        applicationName: req.params.name,
        error: error.message,
        user: (req as any).user?.id,
      });

      res.status(500).json({
        error: "Failed to sync application",
        message: error.message,
      });
    }
  },
);

// POST /api/gitops/applications/:name/rollback - Rollback application
router.post(
  "/applications/:name/rollback",
  authenticateToken,
  allowRoles("admin"),
  validateGitOpsEnabled,
  async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const { revision } = req.body;

      logger.info("Initiating ArgoCD application rollback", {
        applicationName: name,
        targetRevision: revision,
        user: (req as any).user?.id,
      });

      // Get current application to find previous revision if not specified
      let targetRevision = revision;
      if (!targetRevision) {
        const appResponse = await argoCDAxios.get(
          `/api/v1/applications/${name}`,
        );
        const history = appResponse.data.status?.history || [];
        if (history.length < 2) {
          return res.status(400).json({
            error: "No previous revision available for rollback",
          });
        }
        targetRevision = history[history.length - 2].revision;
      }

      const rollbackRequest = {
        revision: targetRevision,
        syncOptions: {
          items: ["PruneLast=true"],
        },
      };

      const response: AxiosResponse = await argoCDAxios.post(
        `/api/v1/applications/${name}/sync`,
        rollbackRequest,
      );

      logger.info("ArgoCD application rollback initiated", {
        applicationName: name,
        targetRevision,
        operationId: response.data.metadata?.uid,
        user: (req as any).user?.id,
      });

      res.json({
        success: true,
        operation: response.data,
        targetRevision,
        message: `Rollback initiated for application ${name} to revision ${targetRevision}`,
      });
    } catch (error: any) {
      logger.error("Failed to rollback ArgoCD application", {
        applicationName: req.params.name,
        error: error.message,
        user: (req as any).user?.id,
      });

      res.status(500).json({
        error: "Failed to rollback application",
        message: error.message,
      });
    }
  },
);

// GET /api/gitops/prometheus/query - Proxy Prometheus queries
router.get(
  "/prometheus/query",
  authenticateToken,
  allowRoles("admin", "operator"),
  async (req: Request, res: Response) => {
    try {
      const { query, time } = req.query;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          error: "Query parameter is required",
        });
      }

      logger.debug("Proxying Prometheus query", {
        query,
        time,
        user: (req as any).user?.id,
      });

      const params: any = { query };
      if (time) params.time = time;

      const response: AxiosResponse = await prometheusAxios.get(
        "/api/v1/query",
        {
          params,
        },
      );

      res.json(response.data);
    } catch (error: any) {
      logger.error("Failed to query Prometheus", {
        query: req.query.query,
        error: error.message,
        user: (req as any).user?.id,
      });

      res.status(500).json({
        error: "Failed to query Prometheus",
        message: error.message,
      });
    }
  },
);

// GET /api/gitops/prometheus/query_range - Proxy Prometheus range queries
router.get(
  "/prometheus/query_range",
  authenticateToken,
  allowRoles("admin", "operator"),
  async (req: Request, res: Response) => {
    try {
      const { query, start, end, step } = req.query;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          error: "Query parameter is required",
        });
      }

      const response: AxiosResponse = await prometheusAxios.get(
        "/api/v1/query_range",
        {
          params: { query, start, end, step },
        },
      );

      res.json(response.data);
    } catch (error: any) {
      logger.error("Failed to query Prometheus range", {
        query: req.query.query,
        error: error.message,
        user: (req as any).user?.id,
      });

      res.status(500).json({
        error: "Failed to query Prometheus range",
        message: error.message,
      });
    }
  },
);

// GET /api/gitops/grafana/dashboards - List Grafana dashboards
router.get(
  "/grafana/dashboards",
  authenticateToken,
  allowRoles("admin", "operator"),
  async (req: Request, res: Response) => {
    try {
      logger.debug("Fetching Grafana dashboards", {
        user: (req as any).user?.id,
      });

      const response: AxiosResponse = await grafanaAxios.get("/api/search", {
        params: {
          type: "dash-db",
          tag: "ai-agent",
          limit: 50,
        },
      });

      const dashboards = response.data.map((dashboard: any) => ({
        id: dashboard.id,
        uid: dashboard.uid,
        title: dashboard.title,
        url: dashboard.url,
        tags: dashboard.tags || [],
        isStarred: dashboard.isStarred || false,
      }));

      res.json(dashboards);
    } catch (error: any) {
      logger.error("Failed to fetch Grafana dashboards", {
        error: error.message,
        user: (req as any).user?.id,
      });

      // Return empty array if Grafana is not available
      if (error.code === "ECONNREFUSED" || error.response?.status === 401) {
        return res.json([]);
      }

      res.status(500).json({
        error: "Failed to fetch Grafana dashboards",
        message: error.message,
      });
    }
  },
);

// GET /api/gitops/health - GitOps services health check
router.get(
  "/health",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const healthChecks = await Promise.allSettled([
        // ArgoCD health
        argoCDAxios
          .get("/api/version", { timeout: 5000 })
          .then(() => ({ service: "argocd", status: "healthy" })),
        // Prometheus health
        prometheusAxios
          .get("/api/v1/status/config", { timeout: 5000 })
          .then(() => ({ service: "prometheus", status: "healthy" })),
        // Grafana health
        grafanaAxios
          .get("/api/health", { timeout: 5000 })
          .then(() => ({ service: "grafana", status: "healthy" })),
      ]);

      const healthStatus = healthChecks.map((result, index) => {
        const services = ["argocd", "prometheus", "grafana"];
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          return {
            service: services[index],
            status: "unhealthy",
            error: result.reason?.message || "Connection failed",
          };
        }
      });

      const overallHealth = healthStatus.every((h) => h.status === "healthy")
        ? "healthy"
        : "degraded";

      res.json({
        status: overallHealth,
        services: healthStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch (error: any) {
      logger.error("Health check failed", {
        error: error.message,
        user: (req as any).user?.id,
      });

      res.status(500).json({
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },
);

// GET /api/gitops/cluster-info - Get cluster information
router.get(
  "/cluster-info",
  authenticateToken,
  allowRoles("admin", "operator"),
  async (req: Request, res: Response) => {
    try {
      logger.info("Fetching cluster information", {
        user: (req as any).user?.id,
      });

      const [clusterResponse, versionResponse] = await Promise.allSettled([
        argoCDAxios.get("/api/v1/clusters"),
        argoCDAxios.get("/api/version"),
      ]);

      const clusters =
        clusterResponse.status === "fulfilled"
          ? clusterResponse.value.data.items
          : [];
      const version =
        versionResponse.status === "fulfilled"
          ? versionResponse.value.data
          : {};

      res.json({
        clusters: clusters.map((cluster: any) => ({
          name: cluster.name,
          server: cluster.server,
          version: cluster.serverVersion,
          connectionState: cluster.connectionState,
          info: cluster.info,
        })),
        argoCDVersion: version,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error("Failed to fetch cluster information", {
        error: error.message,
        user: (req as any).user?.id,
      });

      res.status(500).json({
        error: "Failed to fetch cluster information",
        message: error.message,
      });
    }
  },
);

export default router;
