"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Wallet {
  balance: number;
  lifetimeEarned: number;
  staked: number;
  pendingRewards: number;
  lockedBalance?: number;
}

interface ChartDataPoint {
  date: string;
  price: number;
}

export default function TokenWalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [transferForm, setTransferForm] = useState({ toEmail: "", amount: "", message: "" });
  const [buyForm, setBuyForm] = useState({ usdAmount: "" });
  const [stakeForm, setStakeForm] = useState({ amount: "", duration: "30" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWallet();
    fetchChart();
  }, []);

  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/tokens/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setWallet(data.wallet);
    } catch (error) {
      console.error("Fetch wallet error:", error);
    }
  };

  const fetchChart = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/tokens/chart?days=30", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setChartData(data.history);
    } catch (error) {
      console.error("Fetch chart error:", error);
    }
  };

  const handleWithdraw = async (amount: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/tokens/withdraw", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      alert(data.message || data.error);
      if (data.success) fetchWallet();
    } catch {
      alert("Withdrawal failed");
    }
    setLoading(false);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/tokens/transfer", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toEmail: transferForm.toEmail,
          amount: parseFloat(transferForm.amount),
          message: transferForm.message,
        }),
      });
      const data = await res.json();
      alert(data.message || data.error);
      if (data.success) {
        fetchWallet();
        setTransferForm({ toEmail: "", amount: "", message: "" });
      }
    } catch {
      alert("Transfer failed");
    }
    setLoading(false);
  };

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/tokens/buy", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usdAmount: parseFloat(buyForm.usdAmount) }),
      });
      const data = await res.json();
      alert(data.message || data.error);
      if (data.success) {
        fetchWallet();
        setBuyForm({ usdAmount: "" });
      }
    } catch {
      alert("Purchase failed");
    }
    setLoading(false);
  };

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/tokens/stake", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(stakeForm.amount),
          duration: parseInt(stakeForm.duration),
        }),
      });
      const data = await res.json();
      alert(data.message || data.error);
      if (data.success) {
        fetchWallet();
        setStakeForm({ amount: "", duration: "30" });
      }
    } catch {
      alert("Staking failed");
    }
    setLoading(false);
  };

  if (!wallet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Token Wallet
        </h1>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 mb-1">Available Balance</div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{wallet.balance.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">Tokens</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-purple-500">
            <div className="text-sm text-gray-600 mb-1">Locked Balance</div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">{(wallet.lockedBalance || 0).toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">Staking</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-green-500">
            <div className="text-sm text-gray-600 mb-1">Lifetime Earned</div>
            <div className="text-2xl sm:text-3xl font-bold text-green-600">{wallet.lifetimeEarned.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">All Time</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-orange-500">
            <div className="text-sm text-gray-600 mb-1">Token Value</div>
            <div className="text-2xl sm:text-3xl font-bold text-orange-600">${(wallet.balance * 0.1).toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">USD Equivalent</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex min-w-max">
              {["overview", "transfer", "buy", "stake"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium capitalize whitespace-nowrap ${
                    activeTab === tab
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-4">Token Price Chart (30 Days)</h3>
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="price" stroke="#3B82F6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <button
                      onClick={() => {
                        const amount = prompt("Enter amount to withdraw:");
                        if (amount) handleWithdraw(parseFloat(amount));
                      }}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition text-sm sm:text-base"
                    >
                      Withdraw to USD
                    </button>
                    <button
                      onClick={() => setActiveTab("transfer")}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-purple-700 transition text-sm sm:text-base"
                    >
                      Transfer Tokens
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Tab */}
            {activeTab === "transfer" && (
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Email</label>
                  <input
                    type="email"
                    value={transferForm.toEmail}
                    onChange={(e) => setTransferForm({ ...transferForm, toEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
                  <textarea
                    value={transferForm.message}
                    onChange={(e) => setTransferForm({ ...transferForm, message: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Transfer Tokens"}
                </button>
              </form>
            )}

            {/* Buy Tab */}
            {activeTab === "buy" && (
              <form onSubmit={handleBuy} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">USD Amount</label>
                  <input
                    type="number"
                    value={buyForm.usdAmount}
                    onChange={(e) => setBuyForm({ usdAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min="1"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    You will receive: {buyForm.usdAmount ? (parseFloat(buyForm.usdAmount) * 10).toLocaleString() : 0} tokens
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Buy Tokens"}
                </button>
              </form>
            )}

            {/* Stake Tab */}
            {activeTab === "stake" && (
              <form onSubmit={handleStake} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Stake</label>
                  <input
                    type="number"
                    value={stakeForm.amount}
                    onChange={(e) => setStakeForm({ ...stakeForm, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Days)</label>
                  <select
                    value={stakeForm.duration}
                    onChange={(e) => setStakeForm({ ...stakeForm, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="7">7 Days (3% APY)</option>
                    <option value="30">30 Days (5% APY)</option>
                    <option value="90">90 Days (8% APY)</option>
                    <option value="180">180 Days (12% APY)</option>
                  </select>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Estimated Reward: {stakeForm.amount ? (parseFloat(stakeForm.amount) * 0.05 * (parseInt(stakeForm.duration) / 365)).toFixed(2) : 0} tokens
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Stake Tokens"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
