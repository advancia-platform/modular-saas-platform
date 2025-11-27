"use client";

import { useState } from "react";
import { AlertTriangle, X, Clock, CheckCircle } from "lucide-react";

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  timestamp: string;
  component: string;
  resolved?: boolean;
}

interface AlertPanelProps {
  alerts: Alert[];
}

const SEVERITY_CONFIG = {
  critical: {
    color: "border-red-500 bg-red-950/20 text-red-400",
    icon: <AlertTriangle className="w-4 h-4" />,
    bgColor: "bg-red-900/50",
  },
  high: {
    color: "border-orange-500 bg-orange-950/20 text-orange-400",
    icon: <AlertTriangle className="w-4 h-4" />,
    bgColor: "bg-orange-900/50",
  },
  medium: {
    color: "border-yellow-500 bg-yellow-950/20 text-yellow-400",
    icon: <AlertTriangle className="w-4 h-4" />,
    bgColor: "bg-yellow-900/50",
  },
  low: {
    color: "border-blue-500 bg-blue-950/20 text-blue-400",
    icon: <AlertTriangle className="w-4 h-4" />,
    bgColor: "bg-blue-900/50",
  },
};

export default function AlertPanel({ alerts }: AlertPanelProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set(),
  );
  const [showResolved, setShowResolved] = useState(false);

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Filter alerts
  const visibleAlerts = alerts.filter((alert) => {
    if (dismissedAlerts.has(alert.id)) return false;
    if (alert.resolved && !showResolved) return false;
    return true;
  });

  // Group alerts by severity
  const alertsBySeverity = visibleAlerts.reduce(
    (acc, alert) => {
      if (!acc[alert.severity]) acc[alert.severity] = [];
      acc[alert.severity].push(alert);
      return acc;
    },
    {} as Record<string, Alert[]>,
  );

  const severityOrder = ["critical", "high", "medium", "low"];

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <AlertTriangle className="w-6 h-6 text-primary mr-3" />
          Active Alerts
        </h2>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded"
            />
            <span>Show resolved</span>
          </label>
          <div className="text-sm text-muted-foreground">
            {visibleAlerts.length} alerts
          </div>
        </div>
      </div>

      {visibleAlerts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
          <p className="font-medium">All clear!</p>
          <p className="text-xs">No active alerts detected</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {severityOrder.map((severity) => {
            const severityAlerts = alertsBySeverity[severity] || [];
            if (severityAlerts.length === 0) return null;

            return (
              <div key={severity}>
                {/* Severity Group Header */}
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG]
                        ?.bgColor
                    }`}
                  >
                    {severity.toUpperCase()} ({severityAlerts.length})
                  </div>
                </div>

                {/* Alerts in this severity */}
                <div className="space-y-2 mb-4">
                  {severityAlerts.map((alert) => {
                    const config =
                      SEVERITY_CONFIG[
                        alert.severity as keyof typeof SEVERITY_CONFIG
                      ];

                    return (
                      <div
                        key={alert.id}
                        className={`border-l-4 rounded-lg p-4 ${config?.color} relative`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="mt-0.5">{config?.icon}</div>
                            <div className="flex-1">
                              <div className="font-medium text-sm mb-1">
                                {alert.message}
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <span>Component:</span>
                                  <span className="font-medium">
                                    {alert.component}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {formatTimestamp(alert.timestamp)}
                                  </span>
                                </div>
                              </div>
                              {alert.resolved && (
                                <div className="mt-2 flex items-center space-x-1 text-xs text-green-400">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Resolved</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {!alert.resolved && (
                            <button
                              onClick={() => handleDismissAlert(alert.id)}
                              className="ml-2 p-1 rounded hover:bg-muted/20 transition-colors"
                              title="Dismiss alert"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alert Summary */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="grid grid-cols-4 gap-4 text-center text-xs">
          {severityOrder.map((severity) => {
            const count = alertsBySeverity[severity]?.length || 0;
            const config =
              SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];

            return (
              <div key={severity}>
                <div
                  className={`text-lg font-bold ${config?.color.split(" ")[2]}`}
                >
                  {count}
                </div>
                <div className="text-muted-foreground capitalize">
                  {severity}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
