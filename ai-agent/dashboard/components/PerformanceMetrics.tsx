"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Zap, Target, Clock } from "lucide-react";

interface PerformanceMetricsProps {
  systemStatus: any;
}

interface PerformanceData {
  timestamp: string;
  responseTime: number;
  threatsProcessed: number;
  actionsExecuted: number;
  cpuUsage: number;
}

export default function PerformanceMetrics({
  systemStatus,
}: PerformanceMetricsProps) {
  const [performanceHistory, setPerformanceHistory] = useState<
    PerformanceData[]
  >([]);
  const [currentMetrics, setCurrentMetrics] = useState({
    avgResponseTime: 0,
    threatsPerMinute: 0,
    actionSuccessRate: 100,
    systemLoad: 0,
  });

  useEffect(() => {
    if (systemStatus) {
      // Update current metrics
      const agentMetrics = systemStatus.agent_metrics || {};
      const systemMetrics = systemStatus.system_metrics || {};

      setCurrentMetrics({
        avgResponseTime: agentMetrics.average_response_time_ms || 0,
        threatsPerMinute: agentMetrics.threats_processed_per_minute || 0,
        actionSuccessRate: agentMetrics.action_success_rate || 100,
        systemLoad: systemMetrics.cpu_usage_percent || 0,
      });

      // Add to performance history (keep last 20 data points)
      const newDataPoint: PerformanceData = {
        timestamp: new Date().toLocaleTimeString(),
        responseTime: agentMetrics.average_response_time_ms || 0,
        threatsProcessed: agentMetrics.threats_processed_total || 0,
        actionsExecuted: agentMetrics.actions_executed_total || 0,
        cpuUsage: systemMetrics.cpu_usage_percent || 0,
      };

      setPerformanceHistory((prev) => {
        const updated = [...prev, newDataPoint];
        return updated.slice(-20); // Keep only last 20 points
      });
    }
  }, [systemStatus]);

  const getMetricStatus = (
    value: number,
    thresholds: { good: number; warning: number },
  ) => {
    if (value <= thresholds.good) return "text-green-500";
    if (value <= thresholds.warning) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <TrendingUp className="w-6 h-6 text-primary mr-3" />
        Performance Metrics
      </h2>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-muted/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Response Time</span>
            </div>
            <span
              className={`text-lg font-bold ${getMetricStatus(
                currentMetrics.avgResponseTime,
                { good: 100, warning: 500 },
              )}`}
            >
              {currentMetrics.avgResponseTime.toFixed(1)}ms
            </span>
          </div>
          <div className="text-xs text-muted-foreground">Target: &lt;100ms</div>
        </div>

        <div className="bg-muted/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Threats/Min</span>
            </div>
            <span className="text-lg font-bold text-foreground">
              {currentMetrics.threatsPerMinute.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">Processing rate</div>
        </div>

        <div className="bg-muted/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Success Rate</span>
            </div>
            <span
              className={`text-lg font-bold ${
                currentMetrics.actionSuccessRate >= 95
                  ? "text-green-500"
                  : "text-yellow-500"
              }`}
            >
              {currentMetrics.actionSuccessRate.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-muted-foreground">Action execution</div>
        </div>

        <div className="bg-muted/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">System Load</span>
            </div>
            <span
              className={`text-lg font-bold ${getMetricStatus(
                currentMetrics.systemLoad,
                { good: 30, warning: 70 },
              )}`}
            >
              {currentMetrics.systemLoad.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-muted-foreground">CPU utilization</div>
        </div>
      </div>

      {/* Performance Trend Chart */}
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-3">Response Time Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={performanceHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis
              dataKey="timestamp"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              label={{ value: "ms", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
              formatter={(value: number) => [
                `${value.toFixed(1)}ms`,
                "Response Time",
              ]}
            />
            <Line
              type="monotone"
              dataKey="responseTime"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 3 }}
              activeDot={{
                r: 5,
                stroke: "hsl(var(--primary))",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Summary */}
      <div className="bg-muted/10 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-2">Performance Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-muted-foreground">Avg Response</div>
            <div className="font-medium">
              {currentMetrics.avgResponseTime.toFixed(1)}ms
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Uptime</div>
            <div className="font-medium">
              {systemStatus
                ? `${Math.floor(systemStatus.uptime_seconds / 3600)}h ${Math.floor((systemStatus.uptime_seconds % 3600) / 60)}m`
                : "N/A"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Status</div>
            <div
              className={`font-medium ${
                systemStatus?.overall_status === "healthy"
                  ? "text-green-500"
                  : systemStatus?.overall_status === "warning"
                    ? "text-yellow-500"
                    : "text-red-500"
              }`}
            >
              {systemStatus?.overall_status?.toUpperCase() || "UNKNOWN"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
