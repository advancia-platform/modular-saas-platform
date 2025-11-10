"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { adminApi } from "@/lib/api";
import {
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

interface DashboardStats {
  totalUsers?: number;
  userGrowth?: number;
  newUsersThisWeek?: number;
  totalRevenue?: number;
  revenueGrowth?: number;
  revenueThisMonth?: number;
  totalTransactions?: number;
  transactionsToday?: number;
  pendingWithdrawals?: number;
  pendingWithdrawalAmount?: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    // Use the new API client with auto-refresh
    adminApi.getDashboardStats()
      .then((response) => {
        setStats(response.data as DashboardStats);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard stats:", err);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <AdminNav />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Users */}
            <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-purple-400" />
                <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4" />
                  {stats?.userGrowth || 0}%
                </span>
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">Total Users</h3>
              <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
              <p className="text-gray-500 text-xs mt-2">
                +{stats?.newUsersThisWeek || 0} this week
              </p>
            </div>

            {/* Total Revenue */}
            <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-green-400" />
                <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4" />
                  {stats?.revenueGrowth || 0}%
                </span>
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">Total Revenue</h3>
              <p className="text-3xl font-bold text-white">
                ${stats?.totalRevenue?.toLocaleString() || 0}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                ${stats?.revenueThisMonth?.toLocaleString() || 0} this month
              </p>
            </div>

            {/* Transactions */}
            <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">Transactions</h3>
              <p className="text-3xl font-bold text-white">
                {stats?.totalTransactions?.toLocaleString() || 0}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                {stats?.transactionsToday || 0} today
              </p>
            </div>

            {/* Pending Withdrawals */}
            <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">Pending Withdrawals</h3>
              <p className="text-3xl font-bold text-white">
                {stats?.pendingWithdrawals || 0}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                ${stats?.pendingWithdrawalAmount?.toLocaleString() || 0} total
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => router.push("/admin/users")}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Manage Users
              </button>
              <button
                onClick={() => router.push("/admin/withdrawals")}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Review Withdrawals
              </button>
              <button
                onClick={() => router.push("/admin/analytics")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                View Analytics
              </button>
              <button
                onClick={() => router.push("/admin/settings")}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
