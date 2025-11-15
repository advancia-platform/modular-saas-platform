"use client";

import { adminApi } from "@/lib/adminApi";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Eye,
  RefreshCw,
  Shield,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { toast } from "react-hot-toast";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Offender {
  identifier: string;
  count: number;
  type: "user" | "ip";
}

interface GroupStat {
  group: string;
  offenderCount: number;
}

interface TrendDataPoint {
  minute: number;
  timestamp: number;
  count: number;
}

interface GlobalTrends {
  success: boolean;
  group: string;
  trends: TrendDataPoint[];
  totalRequests: number;
}

interface OffenderTrends {
  success: boolean;
  identifier: string;
  group: string;
  trends: TrendDataPoint[];
  totalRequests: number;
}

interface RateLimitData {
  success: boolean;
  group: string;
  offenders: Offender[];
  availableGroups: GroupStat[];
  totalOffenders: number;
}

export default function RateLimitsPage() {
  const [data, setData] = useState<RateLimitData | null>(null);
  const [selectedGroup, setSelectedGroup] = useState("admin");
  const [selectedOffender, setSelectedOffender] = useState<string | null>(null);
  const [globalTrends, setGlobalTrends] = useState<GlobalTrends | null>(null);
  const [offenderTrends, setOffenderTrends] = useState<OffenderTrends | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearingId, setClearingId] = useState<string | null>(null);
  const [showTrends, setShowTrends] = useState(false);

  useEffect(() => {
    fetchRateLimits();
    fetchGlobalTrends();
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedOffender) {
      fetchOffenderTrends();
    }
  }, [selectedOffender, selectedGroup]);

  async function fetchRateLimits() {
    try {
      setLoading(true);
      const response = await adminApi.get(
        `/admin/rate-limits?group=${selectedGroup}&limit=50`
      );
      setData(response);
    } catch (error: any) {
      console.error("Failed to fetch rate limits:", error);
      toast.error(error.message || "Failed to fetch rate limit data");
    } finally {
      setLoading(false);
    }
  }

  async function fetchGlobalTrends() {
    try {
      const response = await adminApi.get(
        `/admin/global-trends?group=${selectedGroup}&minutesBack=60`
      );
      setGlobalTrends(response);
    } catch (error: any) {
      console.error("Failed to fetch global trends:", error);
    }
  }

  async function fetchOffenderTrends() {
    if (!selectedOffender) return;

    try {
      const response = await adminApi.get(
        `/admin/rate-limit-trends?group=${selectedGroup}&identifier=${selectedOffender}&minutesBack=60`
      );
      setOffenderTrends(response);
    } catch (error: any) {
      console.error("Failed to fetch offender trends:", error);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([
      fetchRateLimits(),
      fetchGlobalTrends(),
      selectedOffender ? fetchOffenderTrends() : Promise.resolve(),
    ]);
    setRefreshing(false);
    toast.success("Rate limit data refreshed");
  }

  function handleOffenderClick(identifier: string) {
    setSelectedOffender(identifier);
    setShowTrends(true);
  }

  async function handleClearLimit(identifier: string) {
    if (!confirm(`Clear rate limit for ${identifier}?`)) return;

    try {
      setClearingId(identifier);
      await adminApi.post("/admin/rate-limits/clear", {
        group: selectedGroup,
        identifier,
      });
      toast.success(`Rate limit cleared for ${identifier}`);
      await fetchRateLimits();
    } catch (error: any) {
      console.error("Failed to clear rate limit:", error);
      toast.error(error.message || "Failed to clear rate limit");
    } finally {
      setClearingId(null);
    }
  }

  const getGroupIcon = (group: string) => {
    switch (group) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "auth":
      case "auth-strict":
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getGroupColor = (group: string) => {
    switch (group) {
      case "admin":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "auth":
      case "auth-strict":
        return "bg-red-100 text-red-800 border-red-200";
      case "payments":
        return "bg-green-100 text-green-800 border-green-200";
      case "crypto":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const totalViolations =
    data?.offenders.reduce((sum, o) => sum + o.count, 0) || 0;
  const uniqueOffenders = data?.totalOffenders || 0;
  const userOffenders =
    data?.offenders.filter((o) => o.type === "user").length || 0;
  const ipOffenders =
    data?.offenders.filter((o) => o.type === "ip").length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-10 w-10 text-blue-600" />
              Rate Limit Monitor
            </h1>
            <p className="text-gray-600 mt-2">
              Track and manage API abuse attempts across all systems
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Total Violations
                </p>
                <p className="text-3xl font-bold mt-2">{totalViolations}</p>
              </div>
              <AlertTriangle className="h-12 w-12 text-blue-200 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Unique Offenders
                </p>
                <p className="text-3xl font-bold mt-2">{uniqueOffenders}</p>
              </div>
              <Users className="h-12 w-12 text-purple-200 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  User Accounts
                </p>
                <p className="text-3xl font-bold mt-2">{userOffenders}</p>
              </div>
              <Users className="h-12 w-12 text-green-200 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">
                  IP Addresses
                </p>
                <p className="text-3xl font-bold mt-2">{ipOffenders}</p>
              </div>
              <Activity className="h-12 w-12 text-orange-200 opacity-50" />
            </div>
          </div>
        </div>

        {/* Group Selector */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Filter by Route Group
          </h2>
          <div className="flex flex-wrap gap-3">
            {data?.availableGroups.map((groupStat) => (
              <button
                key={groupStat.group}
                onClick={() => setSelectedGroup(groupStat.group)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  selectedGroup === groupStat.group
                    ? getGroupColor(groupStat.group) + " shadow-md"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {getGroupIcon(groupStat.group)}
                <span className="font-medium capitalize">
                  {groupStat.group}
                </span>
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedGroup === groupStat.group
                      ? "bg-white/30"
                      : "bg-gray-100"
                  }`}
                >
                  {groupStat.offenderCount}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Trend Charts */}
        {showTrends && globalTrends && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Global Trends Chart */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Global Traffic Trends
                </h2>
                <span className="text-sm text-gray-500">Last 60 minutes</span>
              </div>
              <div className="h-64">
                {globalTrends.trends.length > 0 ? (
                  <Line
                    data={{
                      labels: globalTrends.trends.map((t) =>
                        new Date(t.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      ),
                      datasets: [
                        {
                          label: `Global Abuse Traffic (${selectedGroup})`,
                          data: globalTrends.trends.map((t) => t.count),
                          borderColor: "rgb(59, 130, 246)",
                          backgroundColor: "rgba(59, 130, 246, 0.1)",
                          fill: true,
                          tension: 0.4,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          mode: "index",
                          intersect: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            precision: 0,
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No trend data available
                  </div>
                )}
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Total requests:{" "}
                <span className="font-semibold">
                  {globalTrends.totalRequests}
                </span>
              </div>
            </div>

            {/* Offender Trends Chart */}
            {offenderTrends && selectedOffender && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-red-600" />
                    Offender Activity
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedOffender(null);
                      setOffenderTrends(null);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    ✕ Close
                  </button>
                </div>
                <div className="mb-2">
                  <span className="text-xs text-gray-500">Identifier:</span>
                  <span className="ml-2 text-sm font-mono text-gray-900">
                    {selectedOffender}
                  </span>
                </div>
                <div className="h-64">
                  {offenderTrends.trends.length > 0 ? (
                    <Line
                      data={{
                        labels: offenderTrends.trends.map((t) =>
                          new Date(t.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        ),
                        datasets: [
                          {
                            label: `Requests from ${selectedOffender}`,
                            data: offenderTrends.trends.map((t) => t.count),
                            borderColor: "rgb(239, 68, 68)",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            fill: true,
                            tension: 0.4,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            mode: "index",
                            intersect: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              precision: 0,
                            },
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No trend data available
                    </div>
                  )}
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  Total violations:{" "}
                  <span className="font-semibold">
                    {offenderTrends.totalRequests}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Offenders Table */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Top Offenders -{" "}
              {selectedGroup.charAt(0).toUpperCase() + selectedGroup.slice(1)}
            </h2>
          </div>

          {data?.offenders && data.offenders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Identifier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Violation Count
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.offenders.map((offender, index) => (
                    <tr
                      key={`${offender.identifier}-${index}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            offender.type === "user"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {offender.type === "user" ? (
                            <Users className="h-3 w-3 mr-1" />
                          ) : (
                            <Activity className="h-3 w-3 mr-1" />
                          )}
                          {offender.type === "user" ? "User" : "IP"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono text-gray-900">
                          {offender.identifier}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-semibold text-red-600">
                            {offender.count}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            violations
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleClearLimit(offender.identifier)}
                          disabled={clearingId === offender.identifier}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Clear
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                No rate limit violations detected
              </p>
              <p className="text-gray-400 text-sm mt-2">
                All systems operating normally
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
