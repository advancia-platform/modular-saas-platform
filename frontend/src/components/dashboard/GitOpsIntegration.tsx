// GitOpsIntegration.tsx - React component for live ArgoCD and observability integration
// This component provides real-time GitOps status, metrics, and operational controls

import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  ExternalLink,
  Eye,
  GitBranch,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Shield,
  XCircle,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// Types for ArgoCD API responses
interface Application {
  metadata: {
    name: string;
    namespace: string;
  };
  status: {
    sync: {
      status: 'Synced' | 'OutOfSync' | 'Unknown';
      revision: string;
    };
    health: {
      status: 'Healthy' | 'Progressing' | 'Degraded' | 'Suspended' | 'Missing' | 'Unknown';
    };
    operationState?: {
      phase: 'Running' | 'Error' | 'Failed' | 'Succeeded' | 'Terminating';
      startedAt: string;
      finishedAt?: string;
    };
  };
  spec: {
    source: {
      repoURL: string;
      targetRevision: string;
      path: string;
    };
  };
}

interface PrometheusMetric {
  metric: { [key: string]: string };
  values: [number, string][];
}

interface GrafanaDashboard {
  id: number;
  uid: string;
  title: string;
  url: string;
}

// Environment configuration from Kubernetes ConfigMap
const config = {
  ARGOCD_SERVER_URL: process.env.ARGOCD_SERVER_URL || '/argocd',
  PROMETHEUS_URL: process.env.PROMETHEUS_URL || '/api/prometheus',
  GRAFANA_URL: process.env.GRAFANA_URL || '/grafana',
  API_BASE_URL: process.env.API_BASE_URL || '/api',
  ENABLE_ARGOCD_INTEGRATION: process.env.ENABLE_ARGOCD_INTEGRATION === 'true',
  ENABLE_PROMETHEUS_METRICS: process.env.ENABLE_PROMETHEUS_METRICS === 'true',
  ENABLE_GRAFANA_EMBED: process.env.ENABLE_GRAFANA_EMBED === 'true',
};

export default function GitOpsIntegration() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [metrics, setMetrics] = useState<{ [key: string]: PrometheusMetric[] }>({});
  const [dashboards, setDashboards] = useState<GrafanaDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch ArgoCD Applications
  const fetchApplications = useCallback(async () => {
    if (!config.ENABLE_ARGOCD_INTEGRATION) return;

    try {
      const response = await fetch(`${config.API_BASE_URL}/argocd/applications`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch applications: ${response.statusText}`);
      }

      const data = await response.json();
      setApplications(data.items || []);
    } catch (err) {
      console.error('Error fetching ArgoCD applications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Fetch Prometheus Metrics
  const fetchMetrics = useCallback(async () => {
    if (!config.ENABLE_PROMETHEUS_METRICS) return;

    try {
      const queries = [
        'up{job="ai-agent-frontend"}',
        'http_requests_total{job="ai-agent-frontend"}',
        'http_request_duration_seconds{job="ai-agent-frontend"}',
        'container_memory_usage_bytes{pod=~"ai-agent.*"}',
        'rate(container_cpu_usage_seconds_total{pod=~"ai-agent.*"}[5m])',
      ];

      const metricsData: { [key: string]: PrometheusMetric[] } = {};

      for (const query of queries) {
        const response = await fetch(
          `${config.API_BASE_URL}/prometheus/query?query=${encodeURIComponent(query)}`,
          {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          }
        );

        if (response.ok) {
          const data = await response.json();
          metricsData[query] = data.data?.result || [];
        }
      }

      setMetrics(metricsData);
    } catch (err) {
      console.error('Error fetching Prometheus metrics:', err);
    }
  }, []);

  // Fetch Grafana Dashboards
  const fetchDashboards = useCallback(async () => {
    if (!config.ENABLE_GRAFANA_EMBED) return;

    try {
      const response = await fetch(`${config.API_BASE_URL}/grafana/dashboards`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setDashboards(
          data.filter(
            (d: GrafanaDashboard) =>
              d.title.toLowerCase().includes('ai-agent') ||
              d.title.toLowerCase().includes('frontend')
          )
        );
      }
    } catch (err) {
      console.error('Error fetching Grafana dashboards:', err);
    }
  }, []);

  // Sync Application
  const syncApplication = async (appName: string) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/argocd/applications/${appName}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to sync application: ${response.statusText}`);
      }

      // Refresh data after sync
      await fetchApplications();
    } catch (err) {
      console.error('Error syncing application:', err);
      setError(err instanceof Error ? err.message : 'Sync failed');
    }
  };

  // Rollback Application
  const rollbackApplication = async (appName: string) => {
    try {
      const response = await fetch(
        `${config.API_BASE_URL}/argocd/applications/${appName}/rollback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to rollback application: ${response.statusText}`);
      }

      await fetchApplications();
    } catch (err) {
      console.error('Error rolling back application:', err);
      setError(err instanceof Error ? err.message : 'Rollback failed');
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchApplications(), fetchMetrics(), fetchDashboards()]);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchApplications, fetchMetrics, fetchDashboards]);

  // Status indicators
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Synced':
      case 'Healthy':
      case 'Succeeded':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'OutOfSync':
      case 'Progressing':
      case 'Running':
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'Degraded':
      case 'Failed':
      case 'Error':
        return 'text-red-500 bg-red-50 border-red-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Synced':
      case 'Healthy':
      case 'Succeeded':
        return <CheckCircle className="w-4 h-4" />;
      case 'OutOfSync':
      case 'Progressing':
      case 'Running':
        return <Clock className="w-4 h-4" />;
      case 'Degraded':
      case 'Failed':
      case 'Error':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-gray-600">Loading GitOps status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-blue-500" />
            GitOps Dashboard
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                autoRefresh
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              Auto-refresh
            </button>

            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
            >
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
              <option value={300000}>5m</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchApplications();
              fetchMetrics();
              fetchDashboards();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
          >
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {applications.map((app) => (
          <motion.div
            key={app.metadata.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">{app.metadata.name}</h3>
                  <p className="text-sm text-gray-500">{app.metadata.namespace}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(app.status.sync.status)}`}
                  >
                    {getStatusIcon(app.status.sync.status)}
                    {app.status.sync.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Health</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(app.status.health.status)}`}
                  >
                    {getStatusIcon(app.status.health.status)}
                    {app.status.health.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revision</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {app.status.sync.revision?.substring(0, 8) || 'N/A'}
                  </code>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Source</span>
                  <span className="text-xs text-gray-500 truncate max-w-32">
                    {app.spec.source.path}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => syncApplication(app.metadata.name)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sync
                </button>

                <button
                  onClick={() => rollbackApplication(app.metadata.name)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors text-sm"
                >
                  <RotateCcw className="w-3 h-3" />
                  Rollback
                </button>

                <button
                  onClick={() =>
                    setSelectedApp(selectedApp === app.metadata.name ? null : app.metadata.name)
                  }
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm ml-auto"
                >
                  <Eye className="w-3 h-3" />
                  Details
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Metrics Overview */}
      {config.ENABLE_PROMETHEUS_METRICS && Object.keys(metrics).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Live Metrics
            </h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(metrics).map(([query, data]) => (
                <div key={query} className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {data.length > 0 ? data[0].values?.[0]?.[1] || '0' : '0'}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {query.includes('up')
                      ? 'Uptime'
                      : query.includes('http_requests')
                        ? 'Requests'
                        : query.includes('duration')
                          ? 'Response Time'
                          : query.includes('memory')
                            ? 'Memory Usage'
                            : query.includes('cpu')
                              ? 'CPU Usage'
                              : 'Metric'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grafana Dashboards */}
      {config.ENABLE_GRAFANA_EMBED && dashboards.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Observability Dashboards
            </h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboards.map((dashboard) => (
                <a
                  key={dashboard.uid}
                  href={`${config.GRAFANA_URL}/d/${dashboard.uid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>

                  <div className="flex-1">
                    <div className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                      {dashboard.title}
                    </div>
                    <div className="text-sm text-gray-500">View in Grafana</div>
                  </div>

                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-500" />
          Quick Actions
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href={`${config.ARGOCD_SERVER_URL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition-shadow group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <GitBranch className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
              ArgoCD UI
            </span>
          </a>

          <a
            href={`${config.GRAFANA_URL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition-shadow group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">
              Grafana
            </span>
          </a>

          <a
            href={`${config.PROMETHEUS_URL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition-shadow group"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">
              Prometheus
            </span>
          </a>

          <button
            onClick={() => window.open('/api/health', '_blank')}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition-shadow group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600">
              Health Check
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
