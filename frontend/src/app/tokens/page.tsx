"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Wallet,
  TrendingUp,
  DollarSign
} from "lucide-react";

interface TokenWallet {
  id: string;
  userId: string;
  balance: string;
  tokenType: string;
  lockedBalance: string;
  lifetimeEarned: string;
  createdAt: string;
  updatedAt: string;
}

interface TokenTransaction {
  id: string;
  walletId: string;
  amount: string;
  type: string;
  status: string;
  description: string | null;
  createdAt: string;
}

export default function TokensPage() {
  const [wallet, setWallet] = useState<TokenWallet | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [cashoutAmount, setCashoutAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const userId = localStorage.getItem("userId") || "demo-user";
      const token = localStorage.getItem("token");

      const [walletRes, historyRes] = await Promise.all([
        fetch(`http://localhost:4000/api/tokens/balance/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:4000/api/tokens/history/${userId}?limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWallet(walletData);
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setTransactions(historyData.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!wallet || !withdrawAmount || !withdrawAddress) {
      alert("Please enter amount and address");
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:4000/api/tokens/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: wallet.userId,
          amount: withdrawAmount,
          toAddress: withdrawAddress,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || "Withdrawal initiated!");
        setWithdrawAmount("");
        setWithdrawAddress("");
        fetchWalletData();
      } else {
        alert(data.error || "Withdrawal failed");
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      alert("Failed to process withdrawal");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCashout = async () => {
    if (!wallet || !cashoutAmount) {
      alert("Please enter amount to cash out");
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:4000/api/tokens/cashout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: wallet.userId,
          amount: cashoutAmount,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || `Cashed out $${data.usdReceived}!`);
        setCashoutAmount("");
        fetchWalletData();
      } else {
        alert(data.error || "Cashout failed");
      }
    } catch (error) {
      console.error("Cashout error:", error);
      alert("Failed to process cashout");
    } finally {
      setIsProcessing(false);
    }
  };

  const conversionRate = 0.10; // 1 token = $0.10

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading wallet...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Wallet className="w-10 h-10" />
            Token Wallet
          </h1>
          <p className="text-blue-200">
            Manage your Advancia tokens and rewards
          </p>
        </motion.div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Coins className="w-8 h-8" />
              <span className="text-sm opacity-90">Available</span>
            </div>
            <div className="text-4xl font-bold mb-2">
              {parseFloat(wallet?.balance || "0").toFixed(2)}
            </div>
            <div className="text-sm opacity-90">
              ≈ ${(parseFloat(wallet?.balance || "0") * conversionRate).toFixed(2)} USD
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8" />
              <span className="text-sm opacity-90">Lifetime Earned</span>
            </div>
            <div className="text-4xl font-bold mb-2">
              {parseFloat(wallet?.lifetimeEarned || "0").toFixed(2)}
            </div>
            <div className="text-sm opacity-90">Total tokens earned</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8" />
              <span className="text-sm opacity-90">Locked</span>
            </div>
            <div className="text-4xl font-bold mb-2">
              {parseFloat(wallet?.lockedBalance || "0").toFixed(2)}
            </div>
            <div className="text-sm opacity-90">Reserved for pending</div>
          </motion.div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Withdraw */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ArrowUpRight className="w-6 h-6" />
              Withdraw to Blockchain
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-blue-200 mb-2 text-sm">Amount</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-blue-200 mb-2 text-sm">
                  Wallet Address (0x...)
                </label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400"
                  placeholder="0x..."
                />
              </div>
              <button
                onClick={handleWithdraw}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all"
              >
                {isProcessing ? "Processing..." : "Withdraw"}
              </button>
            </div>
          </motion.div>

          {/* Cashout */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ArrowDownLeft className="w-6 h-6" />
              Cash Out to USD
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-blue-200 mb-2 text-sm">
                  Token Amount
                </label>
                <input
                  type="number"
                  value={cashoutAmount}
                  onChange={(e) => setCashoutAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400"
                  placeholder="0.00"
                />
                {cashoutAmount && (
                  <p className="text-sm text-green-300 mt-2">
                    You'll receive: ${(parseFloat(cashoutAmount) * conversionRate).toFixed(2)} USD
                  </p>
                )}
              </div>
              <div className="bg-blue-500/20 rounded-lg p-3">
                <p className="text-sm text-blue-200">
                  <strong>Conversion Rate:</strong> 1 token = $0.10 USD
                </p>
              </div>
              <button
                onClick={handleCashout}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
              >
                {isProcessing ? "Processing..." : "Cash Out"}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
        >
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <History className="w-6 h-6" />
            Transaction History
          </h3>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-blue-200 text-center py-8">
                No transactions yet. Start earning tokens!
              </p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        parseFloat(tx.amount) > 0
                          ? "bg-green-500/20"
                          : "bg-red-500/20"
                      }`}
                    >
                      {parseFloat(tx.amount) > 0 ? (
                        <ArrowDownLeft className="w-5 h-5 text-green-400" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {tx.description || tx.type}
                      </div>
                      <div className="text-sm text-blue-200">
                        {new Date(tx.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-bold ${
                        parseFloat(tx.amount) > 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {parseFloat(tx.amount) > 0 ? "+" : ""}
                      {parseFloat(tx.amount).toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-200">
                      {tx.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
