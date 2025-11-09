"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { adminApi } from "@/utils/api";
import RequireRole from "@/components/RequireRole";

interface WithdrawalRequest {
  id: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
  cryptoType: string;
  cryptoAmount: string;
  usdEquivalent: string;
  withdrawalAddress: string;
  status: string;
  adminNotes?: string;
  txHash?: string;
  networkFee?: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<string | null>(
    null
  );
  const [actionNotes, setActionNotes] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [networkFee, setNetworkFee] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  const fetchWithdrawals = React.useCallback(async () => {
    try {
      setLoading(true);
      const url = filterStatus ? `/withdrawals/admin/all?status=${filterStatus}` : "/withdrawals/admin/all"; const response: any = await adminApi.get(url);

      if (response.data && Array.isArray(response.data.withdrawals)) {
        setWithdrawals(response.data.withdrawals);
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      toast.error("Failed to load withdrawal requests");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    void fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleAction = async (
    withdrawalId: string,
    action: "approve" | "reject"
  ) => {
    if (!actionNotes && action === "reject") {
      toast.error("Please provide a reason for rejection");
      return;
    }

    if (action === "approve" && !txHash) {
      toast.error("Please provide transaction hash for approval");
      return;
    }

    setProcessing(true);

    try {
      const response: any = await adminApi.patch(
        `/withdrawals/admin/${withdrawalId}`,
        {
          action,
          adminNotes: actionNotes || undefined,
          txHash: txHash || undefined,
          networkFee: networkFee ? parseFloat(networkFee) : undefined,
        }
      );

      if (response.data.success) {
        toast.success(
          action === "approve"
            ? "Withdrawal approved successfully"
            : "Withdrawal rejected and balance refunded"
        );
        setSelectedWithdrawal(null);
        setActionNotes("");
        setTxHash("");
        setNetworkFee("");
        fetchWithdrawals(); // Refresh list
      }
    } catch (error: unknown) {
      console.error("Error processing withdrawal:", error);
      let errorMessage = "Failed to process withdrawal";
      if (error && typeof error === "object" && "response" in error) {
        const responseError = error as {
          response?: { data?: { error?: string } };
        };
        errorMessage = responseError.response?.data?.error || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${
          statusColors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <RequireRole roles={["ADMIN"]}>
      <div className="min-h-screen bg-gray-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-md p-6 mb-6">
            <h1 className="text-3xl font-bold text-white">
              Withdrawal Requests
            </h1>
            <p className="text-white/80 mt-2">
              Manage user withdrawal requests for USD, BTC, ETH, and USDT
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <div className="flex gap-2 overflow-x-auto">
              {["all", "pending", "completed", "rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() =>
                    setFilterStatus(status === "all" ? "" : status)
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filterStatus === (status === "all" ? "" : status)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Withdrawals List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">
                No {filterStatus || ""} withdrawal requests found
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <motion.div
                  key={withdrawal.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {withdrawal.user.email}
                        </h3>
                        <p className="text-sm text-gray-500">
                          @{withdrawal.user.username}
                        </p>
                      </div>
                      {getStatusBadge(withdrawal.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Amount
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {parseFloat(withdrawal.cryptoAmount).toFixed(
                            withdrawal.cryptoType === "BTC"
                              ? 8
                              : withdrawal.cryptoType === "ETH"
                              ? 6
                              : 2
                          )}{" "}
                          {withdrawal.cryptoType}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          USD Equivalent
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          ${parseFloat(withdrawal.usdEquivalent).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Requested At
                        </p>
                        <p className="text-sm text-gray-900">
                          {formatDate(withdrawal.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Withdrawal Address
                        </p>
                        <p className="text-xs text-gray-900 font-mono truncate">
                          {withdrawal.withdrawalAddress || "—"}
                        </p>
                      </div>
                    </div>

                    {withdrawal.txHash && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 uppercase mb-1">
                          Transaction Hash
                        </p>
                        <p className="text-sm text-gray-900 font-mono break-all">
                          {withdrawal.txHash}
                        </p>
                      </div>
                    )}

                    {withdrawal.adminNotes && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 uppercase mb-1">
                          Admin Notes
                        </p>
                        <p className="text-sm text-gray-700">
                          {withdrawal.adminNotes}
                        </p>
                      </div>
                    )}

                    {withdrawal.status === "pending" && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {selectedWithdrawal === withdrawal.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={actionNotes}
                              onChange={(e) => setActionNotes(e.target.value)}
                              placeholder="Admin notes (required for rejection)"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                              type="text"
                              value={txHash}
                              onChange={(e) => setTxHash(e.target.value)}
                              placeholder="Transaction hash (required for approval)"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                              type="number"
                              step="any"
                              value={networkFee}
                              onChange={(e) => setNetworkFee(e.target.value)}
                              placeholder="Network fee (optional)"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleAction(withdrawal.id, "approve")
                                }
                                disabled={processing}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                {processing ? "Processing..." : "Approve"}
                              </button>
                              <button
                                onClick={() =>
                                  handleAction(withdrawal.id, "reject")
                                }
                                disabled={processing}
                                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                {processing
                                  ? "Processing..."
                                  : "Reject & Refund"}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedWithdrawal(null);
                                  setActionNotes("");
                                  setTxHash("");
                                  setNetworkFee("");
                                }}
                                className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedWithdrawal(withdrawal.id)}
                            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                          >
                            Process Withdrawal
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </RequireRole>
  );
}
