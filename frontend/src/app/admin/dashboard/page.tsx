"use client";

import AdminNav from "@/components/AdminNav";
import { adminApi } from "@/lib/api";
import {
  Activity,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditForm, setCreditForm] = useState({ userId: "", amount: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    // Use the new API client with auto-refresh
    adminApi
      .getDashboardStats()
      .then((response) => {
        setStats(response.data as DashboardStats);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard stats:", err);
        setLoading(false);
      });

    // Fetch wallets and transactions
    fetchWallets();
    fetchTransactions();
  }, [router]);

  const fetchWallets = async () => {
    try {
      const response = await fetch("/api/admin/wallets");
      if (response.ok) {
        const data = await response.json();
        setWallets(data);
      }
    } catch (error) {
      console.error("Error fetching wallets:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/admin/transactions");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleCreditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditForm.userId || !creditForm.amount) return;

    setCreditLoading(true);
    try {
      const response = await fetch("/api/admin/credit-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: creditForm.userId,
          amount: parseFloat(creditForm.amount),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`User credited successfully: ${JSON.stringify(data)}`);
        setCreditForm({ userId: "", amount: "" });
        fetchWallets(); // Refresh wallet balances
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error crediting user:", error);
      alert("Failed to credit user");
    } finally {
      setCreditLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-white mb-8">
            Admin Dashboard
          </h1>

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
              <h3 className="text-gray-400 text-sm font-medium mb-1">
                Total Users
              </h3>
              <p className="text-3xl font-bold text-white">
                {stats?.totalUsers || 0}
              </p>
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
              <h3 className="text-gray-400 text-sm font-medium mb-1">
                Total Revenue
              </h3>
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
              <h3 className="text-gray-400 text-sm font-medium mb-1">
                Transactions
              </h3>
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
              <h3 className="text-gray-400 text-sm font-medium mb-1">
                Pending Withdrawals
              </h3>
              <p className="text-3xl font-bold text-white">
                {stats?.pendingWithdrawals || 0}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                ${stats?.pendingWithdrawalAmount?.toLocaleString() || 0} total
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6 mb-8">
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

          {/* Admin Wallets */}
          <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              💰 Admin Wallets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {wallets.map((wallet: any) => (
                <div key={wallet.id} className="bg-slate-700/50 rounded-lg p-4">
                  <div className="text-gray-400 text-sm font-medium mb-1">
                    {wallet.currency}
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ${wallet.balance?.toFixed(2) || "0.00"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Credit */}
          <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              ⚡ Manual Credit
            </h2>
            <form
              onSubmit={handleCreditUser}
              className="flex flex-col sm:flex-row gap-4"
            >
              <input
                type="text"
                placeholder="User ID"
                value={creditForm.userId}
                onChange={(e) =>
                  setCreditForm((prev) => ({ ...prev, userId: e.target.value }))
                }
                className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={creditForm.amount}
                onChange={(e) =>
                  setCreditForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
              <button
                type="submit"
                disabled={creditLoading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg font-medium transition-colors"
              >
                {creditLoading ? "Processing..." : "Credit User"}
              </button>
            </form>
          </div>

          {/* All Transactions */}
          <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              📊 All Transactions
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Currency
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600/50">
                  {transactions.slice(0, 20).map((tx: any) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {tx.orderId || "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {tx.user?.firstName} {tx.user?.lastName} (
                        {tx.userId?.slice(0, 8)}...)
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.provider === "stripe"
                              ? "bg-blue-100 text-blue-800"
                              : tx.provider === "cryptomus"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {tx.provider || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-white font-medium">
                        ${tx.amount?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {tx.currency}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.status === "completed" ||
                            tx.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : tx.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {transactions.length > 20 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => router.push("/admin/transactions")}
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                >
                  View all transactions →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
