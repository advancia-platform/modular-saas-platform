"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Shield, AlertTriangle, Activity, Clock } from "lucide-react";

interface ThreatEvent {
  id: string;
  name: string;
  severity: string;
  timestamp: string;
  source: string;
  actions_taken: string[];
  status: string;
}

interface ThreatVisualizationProps {
  threats: ThreatEvent[];
}

const SEVERITY_COLORS = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

export default function ThreatVisualization({
  threats,
}: ThreatVisualizationProps) {
  const [severityData, setSeverityData] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);

  useEffect(() => {
    // Process severity distribution
    const severityCount = threats.reduce(
      (acc, threat) => {
        acc[threat.severity] = (acc[threat.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const severityChartData = Object.entries(severityCount).map(
      ([severity, count]) => ({
        name: severity.charAt(0).toUpperCase() + severity.slice(1),
        value: count,
        color: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS],
      }),
    );

    setSeverityData(severityChartData);

    // Process timeline data (last 24 hours)
    const now = new Date();
    const hourlyData: Record<number, number> = {};

    for (let i = 0; i < 24; i++) {
      hourlyData[i] = 0;
    }

    threats.forEach((threat) => {
      const threatTime = new Date(threat.timestamp);
      const hoursAgo = Math.floor(
        (now.getTime() - threatTime.getTime()) / (1000 * 60 * 60),
      );

      if (hoursAgo >= 0 && hoursAgo < 24) {
        hourlyData[23 - hoursAgo]++;
      }
    });

    const timelineChartData = Object.entries(hourlyData).map(
      ([hour, count]) => ({
        hour: `${hour}:00`,
        threats: count,
      }),
    );

    setTimelineData(timelineChartData);
  }, [threats]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "medium":
        return <Shield className="w-4 h-4 text-yellow-500" />;
      default:
        return <Shield className="w-4 h-4 text-green-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Activity className="w-6 h-6 text-primary mr-3" />
          Threat Detection
        </h2>
        <div className="text-sm text-muted-foreground">
          {threats.length} threats detected
        </div>
      </div>

      {/* Threat Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(SEVERITY_COLORS).map(([severity, color]) => {
          const count = threats.filter((t) => t.severity === severity).length;
          return (
            <div key={severity} className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium capitalize">
                  {severity}
                </span>
                {getSeverityIcon(severity)}
              </div>
              <div className="text-2xl font-bold" style={{ color }}>
                {count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Severity Distribution */}
        <div>
          <h3 className="text-sm font-medium mb-3">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 24-Hour Timeline */}
        <div>
          <h3 className="text-sm font-medium mb-3">24-Hour Threat Timeline</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis
                dataKey="hour"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Bar
                dataKey="threats"
                fill="hsl(var(--primary))"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Threats List */}
      <div>
        <h3 className="text-sm font-medium mb-3 flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          Recent Threats
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {threats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No threats detected recently</p>
              <p className="text-xs">System is secure</p>
            </div>
          ) : (
            threats.slice(0, 10).map((threat) => (
              <div
                key={threat.id}
                className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  {getSeverityIcon(threat.severity)}
                  <div>
                    <div className="font-medium text-sm">{threat.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {threat.source} • {formatTimestamp(threat.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-xs px-2 py-1 rounded ${
                      threat.status === "resolved"
                        ? "bg-green-900/50 text-green-400"
                        : "bg-blue-900/50 text-blue-400"
                    }`}
                  >
                    {threat.status}
                  </div>
                  {threat.actions_taken.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {threat.actions_taken.length} actions taken
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
