"use client";

import { useEffect, useState } from "react";

interface StatusData {
  version: string;
  lastUpdated: string;
  overallStatus: string;
  statusMessage: string;
  components: Component[];
  metrics: Metrics;
  incidents: Incident[];
  scheduledMaintenance: any[];
  historicalData: HistoricalData;
}

interface Component {
  id: string;
  name: string;
  status: string;
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
  uptime90d?: number;
  responseTime?: {
    avg: number;
    median: number;
    p95: number;
    p99: number;
  };
  lastIncident?: string | null;
}

interface Metrics {
  totalRestarts24h: number;
  totalRestarts7d: number;
  totalRestarts30d: number;
  totalErrors24h: number;
  totalErrors7d: number;
  totalErrors30d: number;
  avgResponseTime24h: number;
  avgResponseTime7d: number;
  avgResponseTime30d: number;
}

interface Incident {
  id: string;
  timestamp: string;
  component: string;
  severity: string;
  title: string;
  description: string;
  duration: number | null;
  status: string;
  resolution: string | null;
  impactedUsers: number | null;
  updates: { timestamp: string; message: string }[];
}

interface HistoricalData {
  dailyUptime: { date: string; uptime: string }[];
  dailyRestarts: { date: string; count: number }[];
}

export default function StatusPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/status.json");
        if (!response.ok) throw new Error("Failed to fetch status");
        const data = await response.json();
        setStatus(data);
        setError(null);
      } catch (err) {
        setError("Unable to load status data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (statusValue: string) => {
    const colors: Record<string, string> = {
      operational: "text-green-600",
      active: "text-green-600",
      degraded: "text-yellow-600",
      "partial-outage": "text-orange-600",
      outage: "text-red-600",
      maintenance: "text-blue-600",
    };
    return colors[statusValue] || "text-gray-600";
  };

  const getStatusIcon = (statusValue: string) => {
    const icons: Record<string, string> = {
      operational: "🟢",
      active: "🟢",
      degraded: "🟡",
      "partial-outage": "🟠",
      outage: "🔴",
      maintenance: "🔵",
    };
    return icons[statusValue] || "⚪";
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      outage: "bg-red-100 text-red-800 border-red-200",
      degraded: "bg-yellow-100 text-yellow-800 border-yellow-200",
      "partial-outage": "bg-orange-100 text-orange-800 border-orange-200",
      investigating: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return colors[severity] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "Ongoing";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading status...</p>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <p className="text-red-600 text-xl font-semibold">⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-3">
            🏢 Advancia Status
          </h1>
          <p className="text-lg text-gray-600">
            Real-time system health and uptime transparency
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {timeAgo(status.lastUpdated)}
          </p>
        </div>

        {/* Overall Status */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-gray-200">
          <div className="text-center">
            <div className="text-7xl mb-4 animate-pulse">
              {getStatusIcon(status.overallStatus)}
            </div>
            <h2
              className={`text-4xl font-bold ${getStatusColor(
                status.overallStatus
              )}`}
            >
              {status.statusMessage}
            </h2>
          </div>
        </div>

        {/* Component Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Component Status
          </h3>
          <div className="space-y-4">
            {status.components.map((component) => (
              <div
                key={component.id}
                className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-3xl">
                    {getStatusIcon(component.status)}
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {component.name}
                    </h4>
                    <p
                      className={`text-sm font-medium ${getStatusColor(
                        component.status
                      )}`}
                    >
                      {component.status.charAt(0).toUpperCase() +
                        component.status.slice(1).replace("-", " ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {component.uptime24h}%
                  </p>
                  <p className="text-xs text-gray-500">24h uptime</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Uptime Metrics */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Uptime Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {status.components[0] && (
              <>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-4xl font-bold text-green-700">
                    {status.components[0].uptime24h}%
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Last 24 hours</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-4xl font-bold text-blue-700">
                    {status.components[0].uptime7d}%
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Last 7 days</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-4xl font-bold text-purple-700">
                    {status.components[0].uptime30d}%
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Last 30 days</p>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <p className="text-4xl font-bold text-indigo-700">
                    {status.components[0].uptime90d}%
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Last 90 days</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Response Time */}
        {status.components[0]?.responseTime && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Response Time (Last 24h)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-4xl font-bold text-gray-900">
                  {status.components[0].responseTime.avg}ms
                </p>
                <p className="text-sm text-gray-600 mt-2">Average</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-4xl font-bold text-gray-900">
                  {status.components[0].responseTime.median}ms
                </p>
                <p className="text-sm text-gray-600 mt-2">Median</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-4xl font-bold text-gray-900">
                  {status.components[0].responseTime.p95}ms
                </p>
                <p className="text-sm text-gray-600 mt-2">95th Percentile</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-4xl font-bold text-gray-900">
                  {status.components[0].responseTime.p99}ms
                </p>
                <p className="text-sm text-gray-600 mt-2">99th Percentile</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Incidents */}
        {status.incidents.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Recent Incidents
            </h3>
            <div className="space-y-4">
              {status.incidents.map((incident) => (
                <div
                  key={incident.id}
                  className={`p-5 rounded-lg border-2 ${getSeverityColor(
                    incident.severity
                  )}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">
                        {getStatusIcon(incident.severity)} {incident.title}
                      </h4>
                      <p className="text-sm opacity-80 mt-1">
                        {new Date(incident.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold border">
                      {incident.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm mb-3">{incident.description}</p>
                  <div className="flex items-center flex-wrap gap-4 text-sm">
                    <span className="font-medium">
                      Duration: {formatDuration(incident.duration)}
                    </span>
                    {incident.impactedUsers && (
                      <span className="font-medium">
                        Users affected: {incident.impactedUsers}
                      </span>
                    )}
                  </div>
                  {incident.resolution && (
                    <p className="text-sm mt-3 p-3 bg-white rounded font-medium">
                      ✓ Resolution: {incident.resolution}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Maintenance */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Scheduled Maintenance
          </h3>
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">✓ No scheduled maintenance at this time</p>
            <p className="text-sm mt-2">
              We'll notify you in advance of any planned downtime
            </p>
          </div>
        </div>

        {/* Subscribe */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-8 border border-blue-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Subscribe to Updates
          </h3>
          <p className="text-gray-600 mb-6">
            Get notified about incidents, maintenance, and system updates
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-md">
              📧 Email Alerts
            </button>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold shadow-md">
              💬 Slack Integration
            </button>
            <button className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold shadow-md">
              📡 RSS Feed
            </button>
            <button className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-semibold shadow-md">
              🔗 Webhook
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Powered by Advancia Monitoring System</p>
          <p className="mt-1">
            Updated every 5 minutes • Data retention: 90 days
          </p>
        </div>
      </div>
    </div>
  );
}
