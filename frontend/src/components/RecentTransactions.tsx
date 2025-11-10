"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  fromUserId?: string;
  toUserId?: string;
  description?: string;
  category?: string;
}

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    type: "",
    category: "",
    minAmount: "",
    maxAmount: "",
    status: "",
    search: "",
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      const response = await fetch(`/api/transactions/${userId}?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/analytics/transactions/filter?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching filtered transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExporting(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('format', format);

      const response = await fetch(`/api/analytics/transactions/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Export failed');
      }
    } catch (error) {
      console.error("Error exporting transactions:", error);
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      type: "",
      category: "",
      minAmount: "",
      maxAmount: "",
      status: "",
      search: "",
    });
    fetchTransactions();
  };

  const getTransactionIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "DEPOSIT":
        return { icon: "💳", color: "text-green-600 dark:text-green-400" };
      case "WITHDRAWAL":
        return { icon: "📤", color: "text-red-600 dark:text-red-400" };
      case "TRANSFER":
        return { icon: "💸", color: "text-blue-600 dark:text-blue-400" };
      case "PURCHASE":
        return { icon: "🛒", color: "text-purple-600 dark:text-purple-400" };
      case "REWARD":
        return { icon: "🎁", color: "text-yellow-600 dark:text-yellow-400" };
      default:
        return { icon: "📊", color: "text-gray-600 dark:text-gray-400" };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200";
      case "PENDING":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200";
      case "FAILED":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Recent Transactions
        </h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Recent Transactions
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium flex items-center px-3 py-1.5 border border-indigo-300 dark:border-indigo-600 rounded-lg transition"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm font-medium flex items-center px-3 py-1.5 border border-green-300 dark:border-green-600 rounded-lg transition disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium flex items-center px-3 py-1.5 border border-red-300 dark:border-red-600 rounded-lg transition disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF
          </button>
          <Link
            href="/transactions"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium flex items-center"
          >
            View All
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="DEPOSIT">Deposit</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="TRANSFER">Transfer</option>
                <option value="PURCHASE">Purchase</option>
                <option value="REWARD">Reward</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Min Amount</label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Max Amount</label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                placeholder="1000.00"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <input
                type="text"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                placeholder="e.g., payment"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Description..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={fetchFilteredTransactions}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No transactions yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start by making a deposit or purchase
          </p>
          <Link
            href="/crypto/buy"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Buy Crypto
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const { icon, color } = getTransactionIcon(transaction.type);
            return (
              <div
                key={transaction.id}
                className="flex items-center space-x-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <div className={`text-3xl ${color}`}>{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {transaction.type}
                    </p>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(
                        transaction.status
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(transaction.createdAt)}
                  </p>
                  {transaction.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                      {transaction.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      transaction.type === "DEPOSIT" || transaction.type === "REWARD"
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {transaction.type === "DEPOSIT" || transaction.type === "REWARD" ? "+" : ""}$
                    {transaction.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
