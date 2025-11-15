"use client";

import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  amount: string;
  currency: string;
  status: string;
  provider: string;
  createdAt: string;
  description?: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  loading?: boolean;
  title?: string;
}

interface SortField {
  field: keyof Transaction;
  order: "asc" | "desc";
}

interface Filters {
  status?: string;
  provider?: string;
  currency?: string;
  searchTerm?: string;
}

interface ViewPreferences {
  sortFields: SortField[];
  filters: Filters;
  pagination: {
    page: number;
    pageSize: number;
  };
  showAdvancedSort: boolean;
}

const STORAGE_KEY = "transactionTableViewPreferences";

const DEFAULT_PREFERENCES: ViewPreferences = {
  sortFields: [{ field: "createdAt", order: "desc" }],
  filters: {},
  pagination: { page: 1, pageSize: 10 },
  showAdvancedSort: false,
};

export default function TransactionTable({
  transactions,
  loading = false,
  title = "Transactions",
}: TransactionTableProps) {
  const [preferences, setPreferences] =
    useState<ViewPreferences>(DEFAULT_PREFERENCES);
  const [showFilters, setShowFilters] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ViewPreferences;
        setPreferences(parsed);
      }
    } catch (error) {
      console.error("Failed to load view preferences:", error);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error("Failed to save view preferences:", error);
    }
  }, [preferences]);

  // Multi-field sort function
  const sortTransactionsMulti = (
    transactions: Transaction[],
    sortFields: SortField[]
  ): Transaction[] => {
    return [...transactions].sort((a, b) => {
      for (const { field, order } of sortFields) {
        const aValue = a[field];
        const bValue = b[field];

        // Handle null/undefined
        if (aValue == null && bValue == null) continue;
        if (aValue == null) return order === "asc" ? 1 : -1;
        if (bValue == null) return order === "asc" ? -1 : 1;

        let cmp = 0;

        // Strings
        if (typeof aValue === "string" && typeof bValue === "string") {
          // Special handling for dates
          if (field === "createdAt") {
            cmp = new Date(aValue).getTime() - new Date(bValue).getTime();
          } else {
            cmp = aValue.localeCompare(bValue);
          }
        }
        // Numbers or fallback
        else {
          cmp = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }

        if (cmp !== 0) {
          return order === "asc" ? cmp : -cmp;
        }
        // If equal, continue to next field
      }
      return 0;
    });
  };

  // Apply filters
  const filteredTransactions = transactions.filter((tx) => {
    const { status, provider, currency, searchTerm } = preferences.filters;

    if (status && tx.status.toLowerCase() !== status.toLowerCase())
      return false;
    if (provider && tx.provider.toLowerCase() !== provider.toLowerCase())
      return false;
    if (currency && tx.currency.toLowerCase() !== currency.toLowerCase())
      return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        tx.id.toLowerCase().includes(term) ||
        tx.amount.toLowerCase().includes(term) ||
        (tx.description && tx.description.toLowerCase().includes(term));
      if (!matchesSearch) return false;
    }

    return true;
  });

  // Apply sorting
  const sortedTransactions = sortTransactionsMulti(
    filteredTransactions,
    preferences.sortFields
  );

  // Apply pagination
  const totalPages = Math.ceil(
    sortedTransactions.length / preferences.pagination.pageSize
  );
  const startIndex =
    (preferences.pagination.page - 1) * preferences.pagination.pageSize;
  const paginatedTransactions = sortedTransactions.slice(
    startIndex,
    startIndex + preferences.pagination.pageSize
  );

  const updatePreferences = (updates: Partial<ViewPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const updateSortField = (index: number, updates: Partial<SortField>) => {
    const newFields = [...preferences.sortFields];
    newFields[index] = { ...newFields[index], ...updates };
    updatePreferences({ sortFields: newFields });
  };

  const addSortField = () => {
    if (preferences.sortFields.length < 4) {
      updatePreferences({
        sortFields: [
          ...preferences.sortFields,
          { field: "amount", order: "asc" },
        ],
      });
    }
  };

  const removeSortField = (index: number) => {
    if (preferences.sortFields.length > 1) {
      updatePreferences({
        sortFields: preferences.sortFields.filter((_, i) => i !== index),
      });
    }
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    const newFilters = { ...preferences.filters };
    if (value === "") {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    updatePreferences({
      filters: newFilters,
      pagination: { ...preferences.pagination, page: 1 },
    });
  };

  const clearFilters = () => {
    updatePreferences({
      filters: {},
      pagination: { ...preferences.pagination, page: 1 },
    });
  };

  const goToPage = (page: number) => {
    updatePreferences({ pagination: { ...preferences.pagination, page } });
  };

  const changePageSize = (pageSize: number) => {
    updatePreferences({ pagination: { page: 1, pageSize } });
  };

  const resetToDefault = () => {
    setPreferences(DEFAULT_PREFERENCES);
    setShowFilters(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear preferences:", error);
    }
  };

  const getFieldLabel = (field: keyof Transaction): string => {
    const labels: Record<keyof Transaction, string> = {
      createdAt: "Date Created",
      amount: "Amount",
      status: "Status",
      provider: "Payment Provider",
      currency: "Currency",
      id: "Transaction ID",
      description: "Description",
    };
    return labels[field] || field;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getProviderBadge = (provider: string) => {
    const styles = {
      stripe: "bg-blue-100 text-blue-800",
      cryptomus: "bg-purple-100 text-purple-800",
      default: "bg-gray-100 text-gray-800",
    };

    return (
      styles[provider.toLowerCase() as keyof typeof styles] || styles.default
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-200 dark:bg-gray-700 rounded"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
              title="Toggle filters"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
              {Object.keys(preferences.filters).length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-purple-500 rounded-full">
                  {Object.keys(preferences.filters).length}
                </span>
              )}
            </button>
            <button
              onClick={resetToDefault}
              className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Reset all preferences"
            >
              <svg
                className="w-4 h-4 inline mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset
            </button>
            <button
              onClick={() =>
                updatePreferences({
                  showAdvancedSort: !preferences.showAdvancedSort,
                })
              }
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-1"
            >
              {preferences.showAdvancedSort ? "Simple Sort" : "Advanced Sort"}
              {preferences.sortFields.length > 1 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
                  {preferences.sortFields.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Filters
              </h4>
              {Object.keys(preferences.filters).length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Search..."
                value={preferences.filters.searchTerm || ""}
                onChange={(e) => updateFilter("searchTerm", e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-900"
              />
              <select
                value={preferences.filters.status || ""}
                onChange={(e) => updateFilter("status", e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-900"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <select
                value={preferences.filters.provider || ""}
                onChange={(e) => updateFilter("provider", e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-900"
              >
                <option value="">All Providers</option>
                <option value="stripe">Stripe</option>
                <option value="cryptomus">Cryptomus</option>
              </select>
              <select
                value={preferences.filters.currency || ""}
                onChange={(e) => updateFilter("currency", e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-900"
              >
                <option value="">All Currencies</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
          </div>
        )}

        {!preferences.showAdvancedSort ? (
          // Simple sort (single field)
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Sort by:
            </span>
            <select
              value={preferences.sortFields[0]?.field || "createdAt"}
              onChange={(e) =>
                updateSortField(0, {
                  field: e.target.value as keyof Transaction,
                })
              }
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-800"
            >
              <option value="createdAt">{getFieldLabel("createdAt")}</option>
              <option value="amount">{getFieldLabel("amount")}</option>
              <option value="status">{getFieldLabel("status")}</option>
              <option value="provider">{getFieldLabel("provider")}</option>
              <option value="currency">{getFieldLabel("currency")}</option>
              <option value="id">{getFieldLabel("id")}</option>
            </select>
            <select
              value={preferences.sortFields[0]?.order || "desc"}
              onChange={(e) =>
                updateSortField(0, { order: e.target.value as "asc" | "desc" })
              }
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-800"
            >
              <option value="desc">↓ Descending</option>
              <option value="asc">↑ Ascending</option>
            </select>
          </div>
        ) : (
          // Advanced sort (multiple fields)
          <div className="space-y-2">
            {preferences.sortFields.map((sortField, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-12">
                  {index === 0 ? "Sort by" : "then"}
                </span>
                <select
                  value={sortField.field}
                  onChange={(e) =>
                    updateSortField(index, {
                      field: e.target.value as keyof Transaction,
                    })
                  }
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-800 flex-1"
                >
                  <option value="createdAt">
                    {getFieldLabel("createdAt")}
                  </option>
                  <option value="amount">{getFieldLabel("amount")}</option>
                  <option value="status">{getFieldLabel("status")}</option>
                  <option value="provider">{getFieldLabel("provider")}</option>
                  <option value="currency">{getFieldLabel("currency")}</option>
                  <option value="id">{getFieldLabel("id")}</option>
                </select>
                <select
                  value={sortField.order}
                  onChange={(e) =>
                    updateSortField(index, {
                      order: e.target.value as "asc" | "desc",
                    })
                  }
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-800"
                >
                  <option value="asc">↑ Asc</option>
                  <option value="desc">↓ Desc</option>
                </select>
                {preferences.sortFields.length > 1 && (
                  <button
                    onClick={() => removeSortField(index)}
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Remove"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {preferences.sortFields.length < 4 && (
              <button
                onClick={addSortField}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add sort field
              </button>
            )}
            {preferences.sortFields.length > 1 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Active sort:</span>{" "}
                  {preferences.sortFields
                    .map(
                      (sf, i) =>
                        `${i > 0 ? "→ " : ""}${getFieldLabel(sf.field)} (${
                          sf.order === "asc" ? "↑" : "↓"
                        })`
                    )
                    .join(" ")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Provider
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No transactions found
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {transaction.amount} {transaction.currency}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getProviderBadge(
                        transaction.provider
                      )}`}
                    >
                      {transaction.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        transaction.status
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {transaction.description || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {sortedTransactions.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Showing {startIndex + 1} to{" "}
              {Math.min(
                startIndex + preferences.pagination.pageSize,
                sortedTransactions.length
              )}{" "}
              of {sortedTransactions.length}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({filteredTransactions.length} filtered from {transactions.length}{" "}
              total)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Per page:
              </label>
              <select
                value={preferences.pagination.pageSize}
                onChange={(e) => changePageSize(Number(e.target.value))}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-900"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(1)}
                disabled={preferences.pagination.page === 1}
                className="px-2 py-1 text-sm font-medium rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="First page"
              >
                «
              </button>
              <button
                onClick={() => goToPage(preferences.pagination.page - 1)}
                disabled={preferences.pagination.page === 1}
                className="px-3 py-1 text-sm font-medium rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ‹ Prev
              </button>

              <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                Page {preferences.pagination.page} of {totalPages}
              </span>

              <button
                onClick={() => goToPage(preferences.pagination.page + 1)}
                disabled={preferences.pagination.page >= totalPages}
                className="px-3 py-1 text-sm font-medium rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next ›
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={preferences.pagination.page >= totalPages}
                className="px-2 py-1 text-sm font-medium rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last page"
              >
                »
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
