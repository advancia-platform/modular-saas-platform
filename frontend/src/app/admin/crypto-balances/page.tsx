"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Coins,
  TrendingUp,
  Plus,
  Minus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";

type SessionUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

interface CryptoBalance {
  userId: string;
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  color: string;
}

const CRYPTO_TYPES = [
  { symbol: "TRUMP", name: "Trump Coin", color: "from-red-500 to-orange-600", price: 0.50 },
  { symbol: "XLM", name: "Stellar", color: "from-blue-400 to-cyan-500", price: 0.12 },
  { symbol: "XRP", name: "Ripple", color: "from-gray-600 to-slate-700", price: 0.52 },
  { symbol: "DOGE", name: "Dogecoin", color: "from-yellow-500 to-amber-600", price: 0.08 },
  { symbol: "SHIB", name: "Shiba Inu", color: "from-orange-400 to-red-500", price: 0.000008 },
  { symbol: "ADA", name: "Cardano", color: "from-blue-500 to-indigo-600", price: 0.35 },
  { symbol: "DOT", name: "Polkadot", color: "from-pink-500 to-rose-600", price: 5.20 },
  { symbol: "MATIC", name: "Polygon", color: "from-purple-500 to-violet-600", price: 0.85 },
];

export default function CryptoBalanceAdmin() {
  const { data: session } = useSession();
  const sessionUser = session?.user as SessionUser | undefined;
  const [balances, setBalances] = useState<CryptoBalance[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<string>("TRUMP");
  const [amount, setAmount] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check admin access
  const userRole = sessionUser?.role || sessionUser?.email;
  const isAdmin = userRole === "admin" || 
                  sessionUser?.email === "admin@advancia.com" ||
                  sessionUser?.email?.includes("admin");

  useEffect(() => {
    if (!isAdmin) return;
    loadBalances();
  }, [isAdmin]);

  const loadBalances = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/crypto-balances");
      if (response.ok) {
        const data = await response.json();
        setBalances(data.balances || []);
      }
    } catch (error) {
      console.error("Failed to load balances:", error);
    } finally {
      setLoading(false);
    }
  };

  const addBalance = async () => {
    if (!userEmail || !amount || parseFloat(amount) <= 0) {
      setMessage({ type: "error", text: "Please enter valid email and amount" });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/crypto-balances/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail,
          symbol: selectedCrypto,
          amount: parseFloat(amount),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ type: "success", text: `Added ${amount} ${selectedCrypto} to ${userEmail}` });
        setAmount("");
        setUserEmail("");
        loadBalances();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to add balance" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const deductBalance = async () => {
    if (!userEmail || !amount || parseFloat(amount) <= 0) {
      setMessage({ type: "error", text: "Please enter valid email and amount" });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/crypto-balances/deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail,
          symbol: selectedCrypto,
          amount: parseFloat(amount),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ type: "success", text: `Deducted ${amount} ${selectedCrypto} from ${userEmail}` });
        setAmount("");
        setUserEmail("");
        loadBalances();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to deduct balance" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
              <p className="text-red-600">
                This page is only accessible to administrators.
              </p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const selectedCryptoInfo = CRYPTO_TYPES.find(c => c.symbol === selectedCrypto);

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Crypto Balance Manager
            </h1>
            <p className="text-gray-600">
              Manage user cryptocurrency balances (excluding BTC, ETH, USDT)
            </p>
          </motion.div>

          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-xl ${
                message.type === "success"
                  ? "bg-green-50 border-2 border-green-200 text-green-700"
                  : "bg-red-50 border-2 border-red-200 text-red-700"
              }`}
            >
              {message.text}
            </motion.div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Balance Manager */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${selectedCryptoInfo?.color || "from-gray-400 to-gray-600"}`}>
                  <Coins className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add/Deduct Balance</h2>
                  <p className="text-sm text-gray-500">Manage user crypto holdings</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Crypto Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cryptocurrency
                  </label>
                  <select
                    value={selectedCrypto}
                    onChange={(e) => setSelectedCrypto(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    {CRYPTO_TYPES.map((crypto) => (
                      <option key={crypto.symbol} value={crypto.symbol}>
                        {crypto.name} ({crypto.symbol}) - ${crypto.price}
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Email
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount ({selectedCrypto})
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                  {amount && selectedCryptoInfo && (
                    <p className="text-xs text-gray-500 mt-1">
                      ≈ ${(parseFloat(amount) * selectedCryptoInfo.price).toFixed(2)} USD
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={addBalance}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 touch-manipulation"
                  >
                    <Plus className="h-5 w-5" />
                    Add
                  </button>
                  <button
                    onClick={deductBalance}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 touch-manipulation"
                  >
                    <Minus className="h-5 w-5" />
                    Deduct
                  </button>
                </div>

                <button
                  onClick={loadBalances}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 touch-manipulation"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh Balances
                </button>
              </div>
            </motion.div>

            {/* Current Balances */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Active Balances</h2>
                  <p className="text-sm text-gray-500">{balances.length} users with crypto</p>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto space-y-3">
                {balances.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Coins className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No balances found</p>
                  </div>
                ) : (
                  balances.map((balance, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{balance.userId}</p>
                          <p className="text-sm text-gray-500">{balance.name}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${
                          CRYPTO_TYPES.find(c => c.symbol === balance.symbol)?.color || "from-gray-400 to-gray-600"
                        } text-white`}>
                          {balance.symbol}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900">
                          {balance.balance.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">
                          ≈ ${balance.usdValue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6"
          >
            <h3 className="font-bold text-blue-900 mb-2">ℹ️ Important Notes:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• BTC, ETH, and USDT are managed separately via Stripe integration</li>
              <li>• These balances are for display and internal tracking only</li>
              <li>• Changes take effect immediately for the user</li>
              <li>• All transactions are logged for audit purposes</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </SidebarLayout>
  );
}
