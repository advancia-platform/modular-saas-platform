"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Filter,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardRouteGuard from "@/components/DashboardRouteGuard";
import { Toaster, toast } from "react-hot-toast";

interface EthActivityItem {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  txHash: string | null;
  amountEth: number;
  status: string;
  confirmations: number;
  timestamp: string;
  note?: string | null;
}

const humanizeTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const statusStyles: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  PROCESSING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const typeStyles: Record<"DEPOSIT" | "WITHDRAWAL", string> = {
  DEPOSIT: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  WITHDRAWAL: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
};

const defaultAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

type FilterOption = "ALL" | "DEPOSIT" | "WITHDRAWAL";

export default function EthTransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<EthActivityItem[]>([]);
  const [filter, setFilter] = useState<FilterOption>("ALL");
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    if (address) {
      fetchTransactions(address);
    }
  }, [address]);

  const loadTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        setAddress(defaultAddress);
        toast("Using demo wallet address", { icon: "ℹ️" });
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setAddress(defaultAddress);
        toast.error("Unable to load wallet address");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setAddress(data.ethWalletAddress || defaultAddress);
    } catch (error) {
      console.error("Error loading user address:", error);
      toast.error("Error loading user data");
      setAddress(defaultAddress);
    }
  };

  const fetchTransactions = async (walletAddress: string) => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(
        `${API_URL}/api/eth/transactions?address=${encodeURIComponent(walletAddress)}`
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error || "Failed to fetch activity";
        throw new Error(message);
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error((error as Error).message || "Unable to load activity");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    if (filter === "ALL") {
      return transactions;
    }
    return transactions.filter((item) => item.type === filter);
  }, [filter, transactions]);

  const renderStatusBadge = (status: string) => {
    const normalizedStatus = status.toUpperCase();
    const style = statusStyles[normalizedStatus] || "bg-gray-100 text-gray-600";
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${style}`}>
        {normalizedStatus}
      </span>
    );
  };

  const renderTypeBadge = (type: "DEPOSIT" | "WITHDRAWAL") => {
    const icon = type === "DEPOSIT" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${typeStyles[type]}`}
      >
        {icon}
        {type}
      </span>
    );
  };

  return (
    <DashboardRouteGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Toaster position="top-right" />

          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  ETH Transaction History
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Track every deposit and withdrawal associated with your wallet.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Wallet: <span className="font-mono">{address || defaultAddress}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Filter</span>
                <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {["ALL", "DEPOSIT", "WITHDRAWAL"].map((option) => (
                    <button
                      key={option}
                      onClick={() => setFilter(option as FilterOption)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                        filter === option
                          ? "bg-indigo-600 text-white"
                          : "bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {option === "ALL" && <Filter className="w-3.5 h-3.5" />}
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-500 dark:text-gray-400">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading activity...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📄</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No activity found
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Deposits and withdrawals will appear here once they are initiated.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors hover:border-indigo-500 dark:hover:border-indigo-400"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {renderTypeBadge(item.type)}
                      {renderStatusBadge(item.status)}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.confirmations} confirmations
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {humanizeTime(item.timestamp)}
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.amountEth.toFixed(4)} ETH
                      </p>
                      {item.note && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.note}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {item.txHash ? (
                        <a
                          href={`https://etherscan.io/tx/${item.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                        >
                          View on Etherscan
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Pending assignment
                        </span>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                        {item.txHash ? `TX: ${item.txHash}` : "Awaiting broadcast"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardRouteGuard>
  );
}
