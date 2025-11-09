"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Server,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  RefreshCw,
} from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";

type SessionUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

interface SystemStatus {
  overall: {
    status: "operational" | "degraded" | "down";
    alertLevel: "none" | "warning" | "danger";
    timestamp: string;
  };
  services: Array<{
    serviceName: string;
    status: string;
    responseTime?: number;
    uptime?: number;
    statusMessage: string;
    alertLevel: string;
  }>;
}

interface Alert {
  id: string;
  severity: string;
  alertType: string;
  title: string;
  description: string;
  serviceName?: string;
  createdAt: string;
  [key: string]: unknown;
}

interface MonitoringData {
  summary: {
    totalAlerts: number;
    criticalAlerts: number;
    highAlerts: number;
    servicesDown: number;
    servicesDegraded: number;
  };
  statuses: Alert[];
  unresolvedAlerts: Alert[];
  recentResolved: Alert[];
  timestamp: string;
}

export default function SystemMonitoringPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const sessionUser = session?.user as SessionUser | undefined;
  
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [monitoring, setMonitoring] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/");
      return;
    }

    const userRole = sessionUser?.role || sessionUser?.email;
    const isAdmin = userRole === "admin" || 
                    sessionUser?.email === "admin@advancia.com" ||
                    sessionUser?.email?.includes("admin");

    if (!isAdmin) {
      alert("⛔ Access Denied: Admin privileges required");
      router.push("/");
      return;
    }
  }, [session, status, router, sessionUser]);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch system status
      const statusResponse = await fetch("http://localhost:4000/api/system/status");
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setSystemStatus(statusData);
      }

      // Fetch monitoring data
      const monitoringResponse = await fetch("http://localhost:4000/api/system/monitoring");
      if (monitoringResponse.ok) {
        const monitoringData = await monitoringResponse.json();
        setMonitoring(monitoringData);
      }
    } catch (error) {
      console.error("Error fetching monitoring data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  const getStatusIcon = (status: string, alertLevel: string) => {
    if (status === "down" || alertLevel === "danger") {
      return <XCircle className="text-red-500" size={24} />;
    } else if (status === "degraded" || alertLevel === "warning") {
      return <AlertTriangle className="text-yellow-500" size={24} />;
    }
    return <CheckCircle className="text-green-500" size={24} />;
  };

  const getStatusColor = (status: string, alertLevel: string) => {
    if (status === "down" || alertLevel === "danger") {
      return "bg-red-50 border-red-200 text-red-700";
    } else if (status === "degraded" || alertLevel === "warning") {
      return "bg-yellow-50 border-yellow-200 text-yellow-700";
    }
    return "bg-green-50 border-green-200 text-green-700";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-700";
      case "high":
        return "bg-orange-100 text-orange-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Activity className="text-blue-400" size={40} />
                <h1 className="text-4xl font-bold text-white">System Monitoring</h1>
              </div>
              <p className="text-slate-300">
                Real-time system status and health monitoring
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <RefreshCw className={refreshing ? "animate-spin" : ""} size={20} />
              Refresh
            </button>
          </div>

          {/* Overall Status */}
          {systemStatus && (
            <div className={`p-6 rounded-2xl border-2 mb-6 ${getStatusColor(systemStatus.overall.status, systemStatus.overall.alertLevel)}`}>
              <div className="flex items-center gap-4">
                {getStatusIcon(systemStatus.overall.status, systemStatus.overall.alertLevel)}
                <div>
                  <h2 className="text-2xl font-bold">
                    {systemStatus.overall.status === "operational" ? "All Systems Operational" : 
                     systemStatus.overall.status === "degraded" ? "System Performance Degraded" : 
                     "System Down"}
                  </h2>
                  <p className="text-sm opacity-80">
                    Last updated: {new Date(systemStatus.overall.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          {monitoring && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 shadow-lg"
              >
                <AlertCircle className="text-blue-500 mb-2" size={24} />
                <p className="text-sm text-gray-600">Total Alerts</p>
                <p className="text-3xl font-bold">{monitoring.summary.totalAlerts}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-4 shadow-lg"
              >
                <XCircle className="text-red-500 mb-2" size={24} />
                <p className="text-sm text-gray-600">Critical Alerts</p>
                <p className="text-3xl font-bold text-red-600">{monitoring.summary.criticalAlerts}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-4 shadow-lg"
              >
                <AlertTriangle className="text-orange-500 mb-2" size={24} />
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-3xl font-bold text-orange-600">{monitoring.summary.highAlerts}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-4 shadow-lg"
              >
                <Server className="text-gray-500 mb-2" size={24} />
                <p className="text-sm text-gray-600">Services Down</p>
                <p className="text-3xl font-bold">{monitoring.summary.servicesDown}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl p-4 shadow-lg"
              >
                <Activity className="text-yellow-500 mb-2" size={24} />
                <p className="text-sm text-gray-600">Degraded</p>
                <p className="text-3xl font-bold text-yellow-600">{monitoring.summary.servicesDegraded}</p>
              </motion.div>
            </div>
          )}

          {/* Service Status */}
          {systemStatus && (
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
              <div className="p-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Server size={28} />
                  Service Status
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {systemStatus.services.map((service, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border-2 ${getStatusColor(service.status, service.alertLevel)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(service.status, service.alertLevel)}
                          <div>
                            <h3 className="font-bold text-lg capitalize">{service.serviceName}</h3>
                            <p className="text-sm opacity-80">{service.statusMessage}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {service.responseTime !== undefined && (
                            <p className="text-sm">
                              <span className="font-semibold">Response:</span> {service.responseTime}ms
                            </p>
                          )}
                          {service.uptime !== undefined && (
                            <p className="text-sm">
                              <span className="font-semibold">Uptime:</span> {service.uptime}%
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Unresolved Alerts */}
          {monitoring && monitoring.unresolvedAlerts.length > 0 && (
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-red-600 to-orange-600 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <AlertCircle size={28} />
                  Unresolved Alerts
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {monitoring.unresolvedAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 border-2 border-gray-200 rounded-xl hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                              {alert.severity.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-500">{alert.alertType}</span>
                          </div>
                          <h3 className="font-bold text-gray-800 mb-1">{alert.title}</h3>
                          <p className="text-sm text-gray-600">{alert.description}</p>
                          {alert.serviceName && (
                            <p className="text-sm text-gray-500 mt-2">
                              Service: <span className="font-semibold">{alert.serviceName}</span>
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(alert.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
