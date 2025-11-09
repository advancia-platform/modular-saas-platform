"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";

interface TokenWalletProps {
  userId: string;
}

interface WalletBalance {
  balance: string;
  lockedBalance: string;
  availableBalance: string;
  lifetimeEarned: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  status: string;
  description: string | null;
  createdAt: string;
  toAddress?: string | null;
  fromUserId?: string | null;
}

export default function TokenWallet({ userId }: TokenWalletProps) {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showCashout, setShowCashout] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [cashoutAmount, setCashoutAmount] = useState("");
  const [transferAddress, setTransferAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/tokens/balance/${userId}`);
      const data = await res.json();
      setBalance(data);
    } catch (error: unknown) {
      console.error("Error fetching balance:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/tokens/history/${userId}?limit=20`);
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (error: unknown) {
      console.error("Error fetching transactions:", error);
    }
  }, [userId]);

  useEffect(() => {
    void fetchBalance();
    void fetchTransactions();
  }, [fetchBalance, fetchTransactions]);

  // Socket.io connection for real-time updates
  useEffect(() => {
    const socketInstance = io(API_URL, {
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("✅ Connected to token wallet socket");
      socketInstance.emit("join-room", userId);
    });

    socketInstance.on("token-balance-update", (data) => {
      console.log("💰 Real-time balance update:", data);
      setBalance((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          balance: data.balance,
          availableBalance: data.availableBalance,
          lifetimeEarned: data.lifetimeEarned || prev.lifetimeEarned,
        };
      });
      // Refresh transactions to show new entries
      void fetchTransactions();
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Disconnected from token wallet socket");
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [userId, API_URL, fetchTransactions]);

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawAddress) return;
    
    setProcessing(true);
    try {
      const res = await fetch("http://localhost:4000/api/tokens/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount: withdrawAmount,
          toAddress: withdrawAddress,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: "success", text: "Withdrawal successful!" });
        setWithdrawAmount("");
        setWithdrawAddress("");
        setShowWithdraw(false);
        fetchBalance();
        fetchTransactions();
      } else {
        setMessage({ type: "error", text: data.error || "Withdrawal failed" });
      }
    } catch (error: unknown) {
      console.error("Error processing withdrawal:", error);
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setProcessing(false);
    }
  };

  const handleCashout = async () => {
    if (!cashoutAmount) return;
    
    setProcessing(true);
    try {
      const res = await fetch("http://localhost:4000/api/tokens/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount: cashoutAmount,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        const usdValue = (parseFloat(cashoutAmount) * 0.10).toFixed(2);
        setMessage({ type: "success", text: `Cashed out $${usdValue}!` });
        setCashoutAmount("");
        setShowCashout(false);
        fetchBalance();
        fetchTransactions();
      } else {
        setMessage({ type: "error", text: data.error || "Cashout failed" });
      }
    } catch (error: unknown) {
      console.error("Error processing cashout:", error);
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setProcessing(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || !transferAddress) return;
    
    setProcessing(true);
    try {
      const res = await fetch("http://localhost:4000/api/tokens/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: userId,
          toUserId: transferAddress,
          amount: transferAmount,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: "success", text: "Transfer successful!" });
        setTransferAmount("");
        setTransferAddress("");
        setShowTransfer(false);
        fetchBalance();
        fetchTransactions();
      } else {
        setMessage({ type: "error", text: data.error || "Transfer failed" });
      }
    } catch (error: unknown) {
      console.error("Error processing transfer:", error);
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gold via-amber-400 to-yellow-500 rounded-2xl p-8 text-navy shadow-2xl"
      >
        <h2 className="text-2xl font-bold mb-4">ADVANCIA Wallet</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm opacity-90">Available Balance</p>
            <p className="text-5xl font-bold">
              {parseFloat(balance?.availableBalance || "0").toLocaleString()} ADV
            </p>
            <p className="text-sm opacity-75 mt-1">
              ≈ ${(parseFloat(balance?.availableBalance || "0") * 0.10).toFixed(2)} USD
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="opacity-75">Total Balance</p>
              <p className="font-semibold">{parseFloat(balance?.balance || "0").toLocaleString()} ADV</p>
            </div>
            <div>
              <p className="opacity-75">Locked</p>
              <p className="font-semibold">{parseFloat(balance?.lockedBalance || "0").toLocaleString()} ADV</p>
            </div>
            <div>
              <p className="opacity-75">Lifetime Earned</p>
              <p className="font-semibold">{parseFloat(balance?.lifetimeEarned || "0").toLocaleString()} ADV</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowWithdraw(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg transition-colors"
        >
          Withdraw
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCashout(true)}
          className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg transition-colors"
        >
          Cash Out
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowTransfer(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg transition-colors"
        >
          Transfer
        </motion.button>
      </div>

      {/* Message Display */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-xl ${
              message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-navy mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          ) : (
            transactions.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-semibold text-navy capitalize">{tx.type.replace("_", " ")}</p>
                  <p className="text-sm text-gray-500">{tx.description || "No description"}</p>
                  <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      ["earn", "bonus", "reward", "referral"].includes(tx.type)
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {["earn", "bonus", "reward", "referral"].includes(tx.type) ? "+" : "-"}
                    {parseFloat(tx.amount).toLocaleString()} ADV
                  </p>
                  <p className={`text-xs ${tx.status === "completed" ? "text-green-600" : "text-yellow-600"}`}>
                    {tx.status}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdraw && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowWithdraw(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-navy mb-4">Withdraw Tokens</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (ADV)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">Fee: 1% (includes gas fees)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="0x..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleWithdraw}
                    disabled={processing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold transition-colors"
                  >
                    {processing ? "Processing..." : "Confirm Withdrawal"}
                  </button>
                  <button
                    onClick={() => setShowWithdraw(false)}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cashout Modal */}
      <AnimatePresence>
        {showCashout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCashout(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-navy mb-4">Cash Out to USD</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (ADV)</label>
                  <input
                    type="number"
                    value={cashoutAmount}
                    onChange={(e) => setCashoutAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You&apos;ll receive: ${(parseFloat(cashoutAmount || "0") * 0.10 * 0.98).toFixed(2)} USD (2% fee)
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Exchange rate: 1 ADV = $0.10 USD</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCashout}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold transition-colors"
                  >
                    {processing ? "Processing..." : "Confirm Cash Out"}
                  </button>
                  <button
                    onClick={() => setShowCashout(false)}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer Modal */}
      <AnimatePresence>
        {showTransfer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowTransfer(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-navy mb-4">Transfer Tokens</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (ADV)</label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipient User ID</label>
                  <input
                    type="text"
                    value={transferAddress}
                    onChange={(e) => setTransferAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="user123..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleTransfer}
                    disabled={processing}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold transition-colors"
                  >
                    {processing ? "Processing..." : "Send Transfer"}
                  </button>
                  <button
                    onClick={() => setShowTransfer(false)}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
