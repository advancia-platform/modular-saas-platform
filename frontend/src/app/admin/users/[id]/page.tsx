"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import RequireRole from "@/components/RequireRole";
import adminApi from "@/lib/adminApi";
import UserProfileCard from "@/components/admin/UserProfileCard";
import UserBalanceCard from "@/components/admin/UserBalanceCard";
import AdminBalanceManager from "@/components/AdminBalanceManager";

interface UserData {
  profile: {
    id: string;
    email: string;
    username: string;
    name: string;
    role: string;
    status: string;
    verified: boolean;
    createdAt: string;
    lastLogin: string | null;
  };
  balances: {
    usd: string;
    btc: string;
    eth: string;
    usdt: string;
    tokenBalance: string;
    tokenType: string;
    lifetimeEarned: string;
    lockedBalance: string;
  };
  tier: {
    currentTier: string;
    points: number;
    lifetimePoints: number;
  };
  transactions: Array<{
    id: string;
    amount: string;
    type: string;
    status: string;
    description: string | null;
    createdAt: string;
  }>;
  kyc: {
    status: string;
    documents: unknown[];
  };
}

interface ActivityLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  performedBy: string | null;
  timestamp: string;
  ipAddress: string | null;
  metadata: unknown;
}

interface ActivityResponse {
  items: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type Tab = "Overview" | "Transactions" | "Activity";

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityLoading, setActivityLoading] = useState(false);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await adminApi.get<UserData>(
        `/api/admin/users/${userId}`
      );
      setUserData(response.data);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      setActivityLoading(true);
      const response = await adminApi.get<ActivityResponse>(
        `/api/admin/users/${userId}/activity`,
        { params: { page: activityPage, pageSize: 10 } }
      );
      setActivityLogs(response.data.items);
      setActivityTotal(response.data.total);
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
      toast.error("Failed to load activity logs");
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      void fetchUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (userId && activeTab === "Activity") {
      void fetchActivityLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeTab, activityPage]);

  const handleSuspendToggle = async () => {
    if (!userData) return;
    setIsSuspending(true);
    try {
      const newStatus =
        userData.profile.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      await adminApi.patch(`/api/admin/users/${userId}/status`, {
        status: newStatus,
      });
      toast.success(`User ${newStatus.toLowerCase()}`);
      setShowSuspendModal(false);
      await fetchUserData();
    } catch (error) {
      console.error("Failed to update user status:", error);
      toast.error("Failed to update user status");
    } finally {
      setIsSuspending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value || "0");
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  if (loading) {
    return (
      <RequireRole roles={["ADMIN"]}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        </div>
      </RequireRole>
    );
  }

  if (!userData) {
    return (
      <RequireRole roles={["ADMIN"]}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <p className="text-gray-600">User not found</p>
              <button
                onClick={() => router.push("/admin/users")}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Back to Users
              </button>
            </div>
          </div>
        </div>
      </RequireRole>
    );
  }

  return (
    <RequireRole roles={["ADMIN"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => router.push("/admin/users")}
              className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
            >
              ← Back to Users
            </button>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                User Details
              </h1>
              <button
                onClick={() => setShowSuspendModal(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  userData.profile.status === "ACTIVE"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {userData.profile.status === "ACTIVE"
                  ? "Suspend User"
                  : "Activate User"}
              </button>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6 bg-white rounded-xl shadow-md p-2 flex gap-2"
          >
            {(["Overview", "Transactions", "Activity"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                aria-label={`Switch to ${tab} tab`}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </motion.div>

          {/* Tab Content */}
          {activeTab === "Overview" && (
            <div className="space-y-6">
              {/* Two-column layout for cards (stacked on mobile) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UserProfileCard
                  profile={userData.profile}
                  onUpdate={fetchUserData}
                />
                <UserBalanceCard
                  balances={userData.balances}
                  tier={userData.tier}
                />
              </div>

              {/* Admin Balance Manager */}
              <AdminBalanceManager
                userId={userId}
                currentBalances={{
                  usd: userData.balances.usd || "0",
                  btc: userData.balances.btc || "0",
                  eth: userData.balances.eth || "0",
                  usdt: userData.balances.usdt || "0",
                }}
                onBalanceUpdated={fetchUserData}
              />

              {/* KYC Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">KYC Status</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Verification Status
                      </label>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          userData.kyc.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : userData.kyc.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {userData.kyc.status}
                      </span>
                    </div>
                    {userData.kyc.status === "PENDING" && (
                          <div className="flex gap-2">
                          <button
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                            onClick={() =>
                            toast("KYC approval not yet implemented")
                            }
                          >
                            Approve
                          </button>
                          <button
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                            onClick={() => {
                            toast("KYC rejection not yet implemented");
                            }}
                          >
                            Reject
                          </button>
                          </div>
                    )}
                  </div>
                  {userData.kyc.documents.length === 0 && (
                    <p className="mt-4 text-gray-500 text-sm">
                      No KYC documents submitted.
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === "Transactions" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">
                  Recent Transactions
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userData.transactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      userData.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(tx.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 uppercase">
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${
                                tx.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : tx.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {tx.description || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "Activity" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Activity Log</h2>
                <p className="text-white/80 text-sm">
                  Audit trail of actions performed on this user
                </p>
              </div>
              <div className="p-6">
                {activityLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : activityLogs.length === 0 ? (
                  <p className="text-center text-gray-500 py-12">
                    No activity logs found for this user
                  </p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Timestamp
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Resource
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              IP Address
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Performed By
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {activityLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(log.timestamp)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {log.resourceType}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {log.resourceId.substring(0, 12)}...
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {log.ipAddress || "—"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {log.performedBy
                                  ? log.performedBy.substring(0, 12) + "..."
                                  : "System"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing {activityLogs.length} of {activityTotal} logs
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setActivityPage((p) => Math.max(1, p - 1))
                          }
                          disabled={activityPage === 1}
                          aria-label="Previous page"
                          className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-600">
                          Page {activityPage} of{" "}
                          {Math.ceil(activityTotal / 10) || 1}
                        </span>
                        <button
                          onClick={() => setActivityPage((p) => p + 1)}
                          disabled={
                            activityPage >= Math.ceil(activityTotal / 10)
                          }
                          aria-label="Next page"
                          className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Suspend Confirmation Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {userData.profile.status === "ACTIVE"
                ? "Suspend User?"
                : "Activate User?"}
            </h3>
            <p className="text-gray-600 mb-6">
              {userData.profile.status === "ACTIVE"
                ? "Are you sure you want to suspend this user? They will not be able to access their account."
                : "Are you sure you want to activate this user? They will regain full access to their account."}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSuspendModal(false)}
                disabled={isSuspending}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendToggle}
                disabled={isSuspending}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  userData.profile.status === "ACTIVE"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                } ${isSuspending ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isSuspending
                  ? "Processing..."
                  : userData.profile.status === "ACTIVE"
                  ? "Suspend"
                  : "Activate"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </RequireRole>
  );
}
