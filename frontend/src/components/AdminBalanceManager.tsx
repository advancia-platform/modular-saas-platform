"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { adminApi } from "@/utils/api";

interface AdminBalanceManagerProps {
  userId: string;
  currentBalances: {
    usd: string;
    btc: string;
    eth: string;
    usdt: string;
  };
  onBalanceUpdated?: () => void;
}

export default function AdminBalanceManager({
  userId,
  currentBalances,
  onBalanceUpdated,
}: AdminBalanceManagerProps) {
  const [currency, setcurrency] = useState<string>("USD");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleAddBalance = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      const response: any = await adminApi.post(
        `/admin/users/${userId}/update-balance`,
        {
          currency,
          amount: parseFloat(amount),
          description: description || `Admin added ${amount} ${currency}`,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setAmount("");
        setDescription("");

        // Notify parent to refresh balances
        if (onBalanceUpdated) {
          onBalanceUpdated();
        }
      } else {
        toast.error(response.data.error || "Failed to add balance");
      }
    } catch (error: unknown) {
      console.error("Error adding balance:", error);
      let errorMessage = "Failed to add balance";
      if (error && typeof error === "object" && "response" in error) {
        const responseError = error as {
          response?: { data?: { error?: string } };
        };
        errorMessage = responseError.response?.data?.error || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mt-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 -mx-6 -mt-6 px-6 py-4 rounded-t-xl mb-6">
        <h3 className="text-xl font-bold text-white">Add Balance</h3>
        <p className="text-white/80 text-sm">
          Add USD, BTC, ETH, or USDT to user&apos;s balance
        </p>
      </div>

      {/* Current Balances */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase">USD Balance</p>
          <p className="text-lg font-bold text-gray-900">
            ${parseFloat(currentBalances.usd).toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase">BTC Balance</p>
          <p className="text-lg font-bold text-gray-900">
            {parseFloat(currentBalances.btc).toFixed(8)} BTC
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase">ETH Balance</p>
          <p className="text-lg font-bold text-gray-900">
            {parseFloat(currentBalances.eth).toFixed(6)} ETH
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase">USDT Balance</p>
          <p className="text-lg font-bold text-gray-900">
            {parseFloat(currentBalances.usdt).toFixed(2)} USDT
          </p>
        </div>
      </div>

      {/* Add Balance Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Balance Type
          </label>
          <select
            value={currency}
            onChange={(e) => setcurrency(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            aria-label="Select balance type"
          >
            <option value="USD">USD ($)</option>
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="USDT">Tether (USDT)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Enter ${currency} amount`}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            aria-label="Amount to add"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Reason for adding balance"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            aria-label="Description"
          />
        </div>

        <button
          onClick={handleAddBalance}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Adding...
            </span>
          ) : (
            `Add ${amount || "0"} ${currency}`
          )}
        </button>
      </div>

      {/* Info Banner */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> All balance additions are logged in the audit
          trail and will trigger a real-time update for the user.
        </p>
      </div>
    </div>
  );
}


