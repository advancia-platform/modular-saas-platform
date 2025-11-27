"use client";

import AdminControls from "@/components/AdminControls";
import AlertPanel from "@/components/AlertPanel";
import PerformanceMetrics from "@/components/PerformanceMetrics";
import SystemHealth from "@/components/SystemHealth";
import ThreatVisualization from "@/components/ThreatVisualization";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SystemStatus {
  overall_status: string;
  timestamp: string;
  system_metrics?: any;
  agent_metrics?: any;
  active_alerts: any[];
  alert_summary: {
    critical: number;
    high: number;
    total_active: number;
  };
  uptime_seconds: number;
}

interface ThreatEvent {
  id: string;
  name: string;
  severity: string;
  timestamp: string;
  source: string;
  actions_taken: string[];
  status: string;
}

export default function Dashboard() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [recentThreats, setRecentThreats] = useState<ThreatEvent[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    const socketInstance = io("ws://localhost:8001", {
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("Connected to AI Agent Integration Server");
      setIsConnected(true);
      setConnectionError(null);

      // Join monitoring room
      socketInstance.emit("request_live_data", { room: "monitoring" });
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setConnectionError(
        "Failed to connect to AI agent server. Please ensure the integration server is running.",
      );
      setIsConnected(false);
    });

    // Listen for health updates
    socketInstance.on("health-update", (data: SystemStatus) => {
      console.log("Health update received:", data);
      setSystemStatus(data);
    });

    // Listen for threat alerts
    socketInstance.on("threat-alert", (threat: ThreatEvent) => {
      console.log("Threat alert received:", threat);
      setRecentThreats((prev) => [threat, ...prev.slice(0, 9)]); // Keep last 10 threats
    });

    // Listen for system status
    socketInstance.on("system-status", (data: any) => {
      console.log("System status received:", data);
      // Handle system status updates
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.close();
    };
  }, []);

  // Fetch initial data from REST API
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch health status
        const healthResponse = await fetch("/api/v1/health");
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          setSystemStatus(healthData);
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };

    fetchInitialData();
  }, []);

  if (connectionError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Connection Error
          </h2>
          <p className="text-muted-foreground mb-4">{connectionError}</p>
          <div className="bg-muted/50 rounded p-4 text-sm">
            <p className="font-medium mb-2">To start the integration server:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Navigate to the ai-agent/monitoring directory</li>
              <li>
                Run:{" "}
                <code className="bg-background px-1 rounded">
                  python integration_server.py
                </code>
              </li>
              <li>Refresh this dashboard</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Connection Status */}
      <div className="mb-6">
        <div
          className={`flex items-center space-x-2 text-sm ${
            isConnected ? "text-green-400" : "text-red-400"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          ></div>
          <span>{isConnected ? "Connected to AI Agent" : "Disconnected"}</span>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-6 h-6 bg-primary rounded mr-3"></span>
              System Overview
            </h2>
            {systemStatus ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      systemStatus.overall_status === "healthy"
                        ? "bg-green-900/50 text-green-400"
                        : systemStatus.overall_status === "warning"
                          ? "bg-yellow-900/50 text-yellow-400"
                          : "bg-red-900/50 text-red-400"
                    }`}
                  >
                    {systemStatus.overall_status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Uptime:</span>
                  <span className="text-foreground">
                    {Math.floor(systemStatus.uptime_seconds / 3600)}h{" "}
                    {Math.floor((systemStatus.uptime_seconds % 3600) / 60)}m
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Active Alerts:</span>
                  <span
                    className={`font-medium ${
                      systemStatus.alert_summary.critical > 0
                        ? "text-red-400"
                        : systemStatus.alert_summary.high > 0
                          ? "text-yellow-400"
                          : "text-green-400"
                    }`}
                  >
                    {systemStatus.alert_summary.total_active}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">
                Loading system status...
              </div>
            )}
          </div>
        </div>

        <div>
          <SystemHealth systemStatus={systemStatus} />
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Threat Visualization */}
        <div className="space-y-6">
          <ThreatVisualization threats={recentThreats} />
          <AlertPanel alerts={systemStatus?.active_alerts || []} />
        </div>

        {/* Performance and Controls */}
        <div className="space-y-6">
          <PerformanceMetrics systemStatus={systemStatus} />
          <AdminControls socket={socket} isConnected={isConnected} />
        </div>
      </div>
    </div>
  );
}
