"use client";

import { useState, useEffect } from "react";
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  AlertCircle,
} from "lucide-react";

interface SystemHealthProps {
  systemStatus: any;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  threshold: { warning: number; critical: number };
}

function MetricCard({ icon, label, value, unit, threshold }: MetricCardProps) {
  const getStatusColor = () => {
    if (value >= threshold.critical) return "text-red-500";
    if (value >= threshold.warning) return "text-yellow-500";
    return "text-green-500";
  };

  const getProgressColor = () => {
    if (value >= threshold.critical) return "bg-red-500";
    if (value >= threshold.warning) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="bg-muted/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className={`text-sm font-bold ${getStatusColor()}`}>
          {value.toFixed(1)}
          {unit}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      {value >= threshold.warning && (
        <div className="flex items-center mt-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3 h-3 mr-1" />
          {value >= threshold.critical ? "Critical" : "Warning"} threshold
          reached
        </div>
      )}
    </div>
  );
}

export default function SystemHealth({ systemStatus }: SystemHealthProps) {
  const [metrics, setMetrics] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
  });

  useEffect(() => {
    if (systemStatus?.system_metrics) {
      const sm = systemStatus.system_metrics;
      setMetrics({
        cpu: sm.cpu_usage_percent || 0,
        memory: sm.memory_usage_percent || 0,
        disk: sm.disk_usage_percent || 0,
        network: Math.min(
          (sm.network_bytes_sent + sm.network_bytes_recv) / 1000000,
          100,
        ), // MB/s approximation
      });
    }
  }, [systemStatus]);

  const thresholds = {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    disk: { warning: 85, critical: 95 },
    network: { warning: 80, critical: 95 },
  };

  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Cpu className="w-6 h-6 text-primary mr-3" />
        System Health
      </h2>

      <div className="space-y-4">
        <MetricCard
          icon={<Cpu className="w-4 h-4 text-blue-500" />}
          label="CPU Usage"
          value={metrics.cpu}
          unit="%"
          threshold={thresholds.cpu}
        />

        <MetricCard
          icon={<MemoryStick className="w-4 h-4 text-purple-500" />}
          label="Memory"
          value={metrics.memory}
          unit="%"
          threshold={thresholds.memory}
        />

        <MetricCard
          icon={<HardDrive className="w-4 h-4 text-green-500" />}
          label="Disk Usage"
          value={metrics.disk}
          unit="%"
          threshold={thresholds.disk}
        />

        <MetricCard
          icon={<Network className="w-4 h-4 text-orange-500" />}
          label="Network"
          value={metrics.network}
          unit="MB/s"
          threshold={thresholds.network}
        />
      </div>

      {systemStatus && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="text-foreground">
                {new Date(systemStatus.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {systemStatus.system_metrics && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>
                  Available Memory:{" "}
                  {systemStatus.system_metrics.memory_available_gb?.toFixed(1)}
                  GB
                </div>
                <div>
                  Process Count: {systemStatus.system_metrics.process_count}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
