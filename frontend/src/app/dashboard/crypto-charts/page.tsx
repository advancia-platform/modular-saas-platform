"use client";

import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ChartDataPoint {
  time: string;
  price: number;
  high?: number;
  low?: number;
  volume?: number;
}

interface Rates {
  [key: string]: number;
}

interface SwapPreview {
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  feePercent?: number;
}

export default function CryptoChartsPage() {
  const [activeSymbol, setActiveSymbol] = useState("BTC");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [rates, setRates] = useState<Rates>({});
  const [swapForm, setSwapForm] = useState({
    fromSymbol: "BTC",
    toSymbol: "ETH",
    amount: "",
  });
  const [swapPreview, setSwapPreview] = useState<SwapPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("charts");

  const fetchSwapPreview = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        fromSymbol: swapForm.fromSymbol,
        toSymbol: swapForm.toSymbol,
        amount: swapForm.amount,
      });
      const res = await fetch(`/api/crypto/swap/preview?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSwapPreview(data);
    } catch {
      console.error("Swap preview error");
    }
  }, [swapForm]);

  useEffect(() => {
    fetchChart(activeSymbol);
    fetchRates();
  }, [activeSymbol]);

  useEffect(() => {
    if (swapForm.amount && parseFloat(swapForm.amount) > 0) {
      fetchSwapPreview();
    }
  }, [swapForm, fetchSwapPreview]);

  const fetchChart = async (symbol: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/crypto/chart/${symbol}?days=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setChartData(data.history);
    } catch (error) {
      console.error("Fetch chart error:", error);
    }
  };

  const fetchRates = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/crypto/rates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setRates(data.rates);
    } catch (error) {
      console.error("Fetch rates error:", error);
    }
  };

  const handleSwap = async () => {
    if (!swapForm.amount || parseFloat(swapForm.amount) <= 0) {
      alert("Enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/crypto/swap", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromSymbol: swapForm.fromSymbol,
          toSymbol: swapForm.toSymbol,
          amount: parseFloat(swapForm.amount),
        }),
      });
      const data = await res.json();
      alert(data.message || data.error);
      if (data.success) {
        setSwapForm({ ...swapForm, amount: "" });
        setSwapPreview(null);
      }
    } catch {
      alert("Swap failed");
    }
    setLoading(false);
  };

  const cryptoSymbols = [
    { symbol: "BTC", name: "Bitcoin", icon: "₿" },
    { symbol: "ETH", name: "Ethereum", icon: "Ξ" },
    { symbol: "USDT", name: "Tether", icon: "₮" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Crypto Trading
        </h1>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab("charts")}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium ${
                  activeTab === "charts"
                    ? "border-b-2 border-purple-500 text-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Price Charts
              </button>
              <button
                onClick={() => setActiveTab("swap")}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium ${
                  activeTab === "swap"
                    ? "border-b-2 border-purple-500 text-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Swap
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Charts Tab */}
            {activeTab === "charts" && (
              <div className="space-y-6">
                {/* Symbol Selector */}
                <div className="flex flex-wrap gap-3">
                  {cryptoSymbols.map((crypto) => (
                    <button
                      key={crypto.symbol}
                      onClick={() => setActiveSymbol(crypto.symbol)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                        activeSymbol === crypto.symbol
                          ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <span className="text-xl">{crypto.icon}</span>
                      <span className="font-semibold">{crypto.symbol}</span>
                    </button>
                  ))}
                </div>

                {/* Current Price */}
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-6 text-white">
                  <div className="text-sm opacity-90 mb-1">{activeSymbol} Current Price</div>
                  <div className="text-4xl font-bold mb-2">
                    ${rates[activeSymbol]?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                  </div>
                  <div className="text-sm opacity-90">
                    {chartData.length > 0 && (
                      <span className={((chartData[chartData.length - 1].price - chartData[0].price) / chartData[0].price * 100) >= 0 ? "text-green-300" : "text-red-300"}>
                        {((chartData[chartData.length - 1].price - chartData[0].price) / chartData[0].price * 100).toFixed(2)}% (30d)
                      </span>
                    )}
                  </div>
                </div>

                {/* Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">30-Day Price History</h3>
                  <div className="h-80 bg-gray-50 rounded-lg p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="price" stroke="#8B5CF6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {chartData.length > 0 && (
                    <>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-xs text-gray-600 mb-1">24h High</div>
                        <div className="text-lg font-bold text-gray-900">
                          ${chartData[chartData.length - 1].high}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-xs text-gray-600 mb-1">24h Low</div>
                        <div className="text-lg font-bold text-gray-900">
                          ${chartData[chartData.length - 1].low}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-xs text-gray-600 mb-1">24h Volume</div>
                        <div className="text-lg font-bold text-gray-900">
                          ${((chartData[chartData.length - 1]?.volume ?? 0) / 1000000).toFixed(2)}M
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-xs text-gray-600 mb-1">Market</div>
                        <div className="text-lg font-bold text-gray-900">24/7</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Swap Tab */}
            {activeTab === "swap" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Instant Crypto Swap</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Swap your cryptocurrencies instantly with a 0.5% fee
                  </p>

                  {/* From */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                      <div className="flex gap-2">
                        <select
                          value={swapForm.fromSymbol}
                          onChange={(e) => setSwapForm({ ...swapForm, fromSymbol: e.target.value })}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          {cryptoSymbols.map((crypto) => (
                            <option key={crypto.symbol} value={crypto.symbol}>
                              {crypto.icon} {crypto.name} ({crypto.symbol})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={swapForm.amount}
                          onChange={(e) => setSwapForm({ ...swapForm, amount: e.target.value })}
                          placeholder="0.00"
                          className="w-32 px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      {rates[swapForm.fromSymbol] && swapForm.amount && (
                        <div className="text-sm text-gray-600 mt-1">
                          ≈ ${(parseFloat(swapForm.amount) * rates[swapForm.fromSymbol]).toFixed(2)} USD
                        </div>
                      )}
                    </div>

                    {/* Swap Icon */}
                    <div className="flex justify-center">
                      <div className="bg-white rounded-full p-2 border-2 border-purple-300">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </div>

                    {/* To */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                      <select
                        value={swapForm.toSymbol}
                        onChange={(e) => setSwapForm({ ...swapForm, toSymbol: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {cryptoSymbols.filter(c => c.symbol !== swapForm.fromSymbol).map((crypto) => (
                          <option key={crypto.symbol} value={crypto.symbol}>
                            {crypto.icon} {crypto.name} ({crypto.symbol})
                          </option>
                        ))}
                      </select>
                      {swapPreview && (
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="font-semibold text-purple-600">
                            You&apos;ll receive: {swapPreview.toAmount.toFixed(6)} {swapForm.toSymbol}
                          </div>
                          <div className="text-gray-600">
                            Rate: 1 {swapForm.fromSymbol} = {swapPreview.rate.toFixed(6)} {swapForm.toSymbol}
                          </div>
                          <div className="text-gray-600">
                            Fee: ${swapPreview.fee.toFixed(2)} ({swapPreview.feePercent}%)
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSwap}
                      disabled={loading || !swapForm.amount || parseFloat(swapForm.amount) <= 0}
                      className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-lg hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50 font-semibold"
                    >
                      {loading ? "Processing..." : "Swap Now"}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 text-xl">⚠️</span>
                    <div className="text-sm text-yellow-800">
                      <div className="font-semibold mb-1">Important Notes:</div>
                      <ul className="list-disc list-inside space-y-1">
                        <li>All swaps are final and cannot be reversed</li>
                        <li>0.5% fee applies to all swaps</li>
                        <li>Prices update in real-time</li>
                        <li>Minimum swap amount: 0.001</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
