"use client";
import { useCallback, useEffect, useState } from "react";
import RequireRole from "@/components/RequireRole";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PlatformSummary {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  suspendedUsers: number;
  pendingApprovals: number;
  today: {
    newUsers: number;
    transactions: number;
  };
}

interface TransactionData {
  dates: string[];
  volumes: number[];
  counts: number[];
  summary: {
    totalVolume: number;
    totalCount: number;
    avgVolume: number;
  };
}

interface UserData {
  dates: string[];
  newUsers: number[];
  totalUsers: number[];
  summary: {
    totalUsers: number;
    activeUsers: number;
    newUsersInPeriod: number;
    growthRate: number;
  };
}

interface RevenueData {
  dates: string[];
  revenue: number[];
  currencyDistribution: Record<string, number>;
  summary: {
    totalRevenue: number;
    avgDailyRevenue: number;
  };
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [transactions, setTransactions] = useState<TransactionData | null>(null);
  const [users, setUsers] = useState<UserData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [days, setDays] = useState(30);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const [summaryRes, transactionsRes, usersRes, revenueRes] = await Promise.all([
        fetch(`${apiUrl}/api/analytics/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/api/analytics/transactions?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/api/analytics/users?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/api/analytics/revenue?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!summaryRes.ok || !transactionsRes.ok || !usersRes.ok || !revenueRes.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const [summaryData, transactionsData, usersData, revenueData] = await Promise.all([
        summaryRes.json(),
        transactionsRes.json(),
        usersRes.json(),
        revenueRes.json(),
      ]);

      setSummary(summaryData);
      setTransactions(transactionsData);
      setUsers(usersData);
      setRevenue(revenueData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load analytics";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <RequireRole roles={["ADMIN"]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </RequireRole>
    );
  }

  if (error) {
    return (
      <RequireRole roles={["ADMIN"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error</h2>
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </RequireRole>
    );
  }

  return (
    <RequireRole roles={["ADMIN"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {summary.totalUsers.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      +{summary.today.newUsers} today
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {summary.activeUsers.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Last 7 days
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {summary.totalTransactions.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      +{summary.today.transactions} today
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-600 dark:text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Volume</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${summary.totalVolume.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      All time
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transaction Volume Chart */}
            {transactions && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Transaction Volume
                </h2>
                <Line
                  data={{
                    labels: transactions.dates.map((d) =>
                      new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    ),
                    datasets: [
                      {
                        label: "Volume ($)",
                        data: transactions.volumes,
                        borderColor: "rgb(147, 51, 234)",
                        backgroundColor: "rgba(147, 51, 234, 0.1)",
                        fill: true,
                        tension: 0.4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `$${(context.parsed.y ?? 0).toLocaleString()}`,
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `$${value}`,
                        },
                      },
                    },
                  }}
                />
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Total: ${transactions.summary.totalVolume.toLocaleString()} • Average: $
                  {transactions.summary.avgVolume.toFixed(2)}
                </div>
              </div>
            )}

            {/* User Growth Chart */}
            {users && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  User Growth
                </h2>
                <Line
                  data={{
                    labels: users.dates.map((d) =>
                      new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    ),
                    datasets: [
                      {
                        label: "Total Users",
                        data: users.totalUsers,
                        borderColor: "rgb(34, 197, 94)",
                        backgroundColor: "rgba(34, 197, 94, 0.1)",
                        fill: true,
                        tension: 0.4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  New users: {users.summary.newUsersInPeriod} • Growth rate:{" "}
                  {users.summary.growthRate}%
                </div>
              </div>
            )}

            {/* Transaction Count Chart */}
            {transactions && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Transaction Count
                </h2>
                <Bar
                  data={{
                    labels: transactions.dates.map((d) =>
                      new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    ),
                    datasets: [
                      {
                        label: "Transactions",
                        data: transactions.counts,
                        backgroundColor: "rgba(59, 130, 246, 0.8)",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Total transactions: {transactions.summary.totalCount.toLocaleString()}
                </div>
              </div>
            )}

            {/* Revenue Distribution Chart */}
            {revenue && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Currency Distribution
                </h2>
                <div className="flex justify-center">
                  <div className="w-64 h-64">
                    <Doughnut
                      data={{
                        labels: Object.keys(revenue.currencyDistribution),
                        datasets: [
                          {
                            data: Object.values(revenue.currencyDistribution),
                            backgroundColor: [
                              "rgba(147, 51, 234, 0.8)",
                              "rgba(245, 158, 11, 0.8)",
                              "rgba(34, 197, 94, 0.8)",
                              "rgba(59, 130, 246, 0.8)",
                              "rgba(239, 68, 68, 0.8)",
                            ],
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            position: "bottom",
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) =>
                                `${context.label}: ${context.parsed.toLocaleString()}`,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                  Total revenue: ${revenue.summary.totalRevenue.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
