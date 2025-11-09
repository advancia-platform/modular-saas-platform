"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface Transaction {
  id: string;
  userId: string;
  currency: string;
  amount: number;
  type: "credit" | "debit" | "ADMIN_ADJUSTMENT";
  description?: string;
  adminUser?: string;
  createdAt: string;
}

const AdminTransactionTable: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState<string>("All");
  const [admin, setAdmin] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
        }/api/admin/transactions`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      setTransactions(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
      toast.error("Error loading transaction history");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = () => {
    let list = [...transactions];
    if (currency !== "All") {
      list = list.filter((t) => {
        // Extract currency from description or use a default matching strategy
        const desc = t.description?.toUpperCase() || "";
        return desc.includes(currency);
      });
    }
    if (admin) {
      list = list.filter(
        (t) =>
          t.adminUser?.toLowerCase().includes(admin.toLowerCase()) ||
          t.description?.toLowerCase().includes(admin.toLowerCase())
      );
    }
    setFiltered(list);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, admin, transactions]);

  const getTransactionType = (type: string, amount: number) => {
    if (type === "ADMIN_ADJUSTMENT") {
      return amount > 0 ? "credit" : "debit";
    }
    return type;
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg mt-6">
      <h2 className="text-2xl font-semibold mb-4">Admin Transaction History</h2>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          aria-label="Filter transactions by currency"
          className="border rounded p-2"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option>All</option>
          <option>USD</option>
          <option>BTC</option>
          <option>ETH</option>
          <option>USDT</option>
          <option>TRUMP</option>
        </select>

        <input
          type="text"
          className="border rounded p-2"
          placeholder="Filter by admin name..."
          value={admin}
          onChange={(e) => setAdmin(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading transactions...</div>
      ) : filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Currency</th>
                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Type</th>
                <th className="p-2 border">User ID</th>
                <th className="p-2 border">Description</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const transType = getTransactionType(t.type, Number(t.amount));
                return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="border p-2">
                      {format(new Date(t.createdAt), "MMM d, yyyy h:mm a")}
                    </td>
                    <td className="border p-2 uppercase">
                      {t.description?.match(/(USD|BTC|ETH|USDT)/i)?.[0] ||
                        "N/A"}
                    </td>
                    <td
                      className={`border p-2 font-medium ${
                        transType === "credit"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transType === "credit" ? "+" : "-"}{" "}
                      {Math.abs(Number(t.amount)).toFixed(2)}
                    </td>
                    <td className="border p-2 capitalize">
                      {t.type.replace("_", " ")}
                    </td>
                    <td className="border p-2 text-xs font-mono">
                      {t.userId.slice(0, 8)}...
                    </td>
                    <td className="border p-2">{t.description || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-10">
          No transactions found
        </div>
      )}
    </div>
  );
};

export default AdminTransactionTable;
