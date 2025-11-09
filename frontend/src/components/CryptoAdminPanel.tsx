"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

interface AdminSettings {
  btcAddress?: string;
  ethAddress?: string;
  usdtAddress?: string;
  exchangeRateBtc?: number;
  exchangeRateEth?: number;
  exchangeRateUsdt?: number;
  processingFeePercent?: number;
  minPurchaseAmount?: number;
}

interface CryptoOrder {
  id: string;
  user: {
    email: string;
    username: string;
  };
  cryptoType: string;
  usdAmount: number;
  cryptoAmount: number;
  totalUsd: number;
  status: string;
  userWalletAddress?: string;
  txHash?: string;
  createdAt: string;
}

interface Withdrawal {
  id: string;
  user: {
    email: string;
    username: string;
  };
  cryptoType: string;
  cryptoAmount: number;
  usdEquivalent: number;
  withdrawalAddress: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
}

export default function CryptoAdminPanel() {
  const [settings, setSettings] = useState<AdminSettings>({});
  const [orders, setOrders] = useState<CryptoOrder[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"settings" | "orders" | "withdrawals">("settings");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, ordersRes, withdrawalsRes] = await Promise.all([
        fetch("http://localhost:4000/api/crypto/admin/settings"),
        fetch("http://localhost:4000/api/crypto/admin/orders?status=pending"),
        fetch("http://localhost:4000/api/crypto/admin/withdrawals?status=pending"),
      ]);

      const settingsData = await settingsRes.json();
      const ordersData = await ordersRes.json();
      const withdrawalsData = await withdrawalsRes.json();

      setSettings(settingsData);
      setOrders(ordersData.orders || []);
      setWithdrawals(withdrawalsData.withdrawals || []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/crypto/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Failed to update");

      toast.success("Settings updated successfully!");
    } catch {
      toast.error("Failed to update settings");
    }
  };

  const completeOrder = async (orderId: string, txHash: string, notes: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/crypto/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          txHash,
          adminNotes: notes,
        }),
      });

      if (!response.ok) throw new Error("Failed to complete order");

      toast.success("Order marked as completed!");
      fetchData();
    } catch {
      toast.error("Failed to complete order");
    }
  };

  const approveWithdrawal = async (withdrawalId: string, approved: boolean, notes: string) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/crypto/admin/withdrawals/${withdrawalId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: approved ? "approved" : "rejected",
            adminNotes: notes,
            adminApprovedBy: "admin-id-here", // TODO: Get from session
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update withdrawal");

      toast.success(`Withdrawal ${approved ? "approved" : "rejected"}!`);
      fetchData();
    } catch {
      toast.error("Failed to update withdrawal");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">🪙 Crypto Admin Panel</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {["settings", "orders", "withdrawals"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "settings" | "orders" | "withdrawals")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {tab === "orders" && orders.length > 0 && (
                <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs mr-2">
                  {orders.length}
                </span>
              )}
              {tab === "withdrawals" && withdrawals.length > 0 && (
                <span className="bg-yellow-500 text-white rounded-full px-2 py-1 text-xs mr-2">
                  {withdrawals.length}
                </span>
              )}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Admin Wallet Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wallet Addresses */}
              <div>
                <label className="block text-gray-300 mb-2">Bitcoin Address</label>
                <input
                  type="text"
                  value={settings.btcAddress || ""}
                  onChange={(e) => setSettings({ ...settings, btcAddress: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500"
                  placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Ethereum Address</label>
                <input
                  type="text"
                  value={settings.ethAddress || ""}
                  onChange={(e) => setSettings({ ...settings, ethAddress: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500"
                  placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">USDT Address</label>
                <input
                  type="text"
                  value={settings.usdtAddress || ""}
                  onChange={(e) => setSettings({ ...settings, usdtAddress: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500"
                  placeholder="TJRabPrwbZy45FFMrCLZcRdWWF7E6mWvJ"
                />
              </div>

              {/* Exchange Rates */}
              <div>
                <label className="block text-gray-300 mb-2">BTC/USD Rate</label>
                <input
                  type="number"
                  value={settings.exchangeRateBtc || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, exchangeRateBtc: Number(e.target.value) })
                  }
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500"
                  placeholder="45000"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">ETH/USD Rate</label>
                <input
                  type="number"
                  value={settings.exchangeRateEth || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, exchangeRateEth: Number(e.target.value) })
                  }
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500"
                  placeholder="2800"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">USDT/USD Rate</label>
                <input
                  type="number"
                  value={settings.exchangeRateUsdt || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, exchangeRateUsdt: Number(e.target.value) })
                  }
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500"
                  placeholder="1.00"
                />
              </div>

              {/* Fees */}
              <div>
                <label className="block text-gray-300 mb-2">Processing Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.processingFeePercent || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, processingFeePercent: Number(e.target.value) })
                  }
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500"
                  placeholder="2.5"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Minimum Purchase ($)</label>
                <input
                  type="number"
                  value={settings.minPurchaseAmount || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, minPurchaseAmount: Number(e.target.value) })
                  }
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500"
                  placeholder="10"
                />
              </div>
            </div>

            <button
              onClick={updateSettings}
              className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all"
            >
              💾 Save Settings
            </button>
          </motion.div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              Pending Crypto Orders ({orders.length})
            </h2>

            {orders.length === 0 ? (
              <p className="text-gray-400">No pending orders</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} onComplete={completeOrder} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === "withdrawals" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              Pending Withdrawals ({withdrawals.length})
            </h2>

            {withdrawals.length === 0 ? (
              <p className="text-gray-400">No pending withdrawals</p>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <WithdrawalCard
                    key={withdrawal.id}
                    withdrawal={withdrawal}
                    onApprove={approveWithdrawal}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Order Card Component
function OrderCard({
  order,
  onComplete,
}: {
  order: CryptoOrder;
  onComplete: (id: string, txHash: string, notes: string) => void;
}) {
  const [txHash, setTxHash] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white font-bold text-lg">
            {Number(order.cryptoAmount).toFixed(8)} {order.cryptoType}
          </h3>
          <p className="text-gray-400">{order.user.email}</p>
        </div>
        <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p className="text-gray-400">USD Amount</p>
          <p className="text-white font-bold">${Number(order.totalUsd).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-400">User Wallet</p>
          <p className="text-white font-mono text-xs">
            {order.userWalletAddress || "Not provided"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <input
          type="text"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="Enter transaction hash"
          className="w-full bg-gray-600 text-white rounded px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Admin notes (optional)"
          className="w-full bg-gray-600 text-white rounded px-3 py-2 text-sm"
        />
        <button
          onClick={() => {
            if (!txHash) {
              toast.error("Transaction hash is required");
              return;
            }
            onComplete(order.id, txHash, notes);
          }}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded"
        >
          ✅ Mark as Completed
        </button>
      </div>
    </div>
  );
}

// Withdrawal Card Component
function WithdrawalCard({
  withdrawal,
  onApprove,
}: {
  withdrawal: Withdrawal;
  onApprove: (id: string, approved: boolean, notes: string) => void;
}) {
  const [notes, setNotes] = useState("");

  return (
    <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white font-bold text-lg">
            {Number(withdrawal.cryptoAmount).toFixed(8)} {withdrawal.cryptoType}
          </h3>
          <p className="text-gray-400">{withdrawal.user.email}</p>
        </div>
        <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">
          {withdrawal.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p className="text-gray-400">USD Equivalent</p>
          <p className="text-white font-bold">${Number(withdrawal.usdEquivalent).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-400">Withdrawal Address</p>
          <p className="text-white font-mono text-xs break-all">{withdrawal.withdrawalAddress}</p>
        </div>
      </div>

      <div className="space-y-2">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Approval/rejection reason"
          className="w-full bg-gray-600 text-white rounded px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(withdrawal.id, true, notes)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded"
          >
            ✅ Approve
          </button>
          <button
            onClick={() => onApprove(withdrawal.id, false, notes || "Rejected by admin")}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded"
          >
            ❌ Reject
          </button>
        </div>
      </div>
    </div>
  );
}

