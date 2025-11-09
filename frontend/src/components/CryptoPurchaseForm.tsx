"use client";

import { useState } from "react";
import LiveCryptoPrice from "./LiveCryptoPrice";

interface CryptoPurchaseFormProps {
  onSuccess?: () => void;
}

interface OrderDetails {
  id: string;
  cryptoType: string;
  cryptoAmount: number;
  totalUsd: number;
  adminAddress: string;
}

export default function CryptoPurchaseForm({ onSuccess }: CryptoPurchaseFormProps) {
  const [cryptoType, setCryptoType] = useState("BTC");
  const [usdAmount, setUsdAmount] = useState("");
  const [currentPrice, setCurrentPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  const processingFee = 2.5; // 2.5%
  const minPurchase = 10;

  const calculateAmounts = () => {
    const usd = parseFloat(usdAmount) || 0;
    const fee = (usd * processingFee) / 100;
    const total = usd + fee;
    const cryptoAmount = currentPrice > 0 ? usd / currentPrice : 0;
    
    return { fee, total, cryptoAmount };
  };

  const { fee, total, cryptoAmount } = calculateAmounts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const usd = parseFloat(usdAmount);

    if (!usd || usd < minPurchase) {
      setError(`Minimum purchase amount is $${minPurchase}`);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/crypto/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cryptoType,
          usdAmount: usd,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create purchase order");
      }

      setSuccess(true);
      setOrderDetails(data);
      setUsdAmount("");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create purchase order";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Message */}
      {success && orderDetails && (
        <div className="mb-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                Purchase Order Created! 🎉
              </h3>
              <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
                <p><strong>Order ID:</strong> {orderDetails.id}</p>
                <p><strong>Crypto Amount:</strong> {orderDetails.cryptoAmount?.toFixed(8)} {orderDetails.cryptoType}</p>
                <p><strong>USD Paid:</strong> ${orderDetails.totalUsd?.toFixed(2)}</p>
                <p><strong>Status:</strong> <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-semibold">PENDING</span></p>
              </div>
              <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Admin wallet address:</p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded break-all">
                    {orderDetails.adminAddress}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(orderDetails.adminAddress);
                      alert("Address copied!");
                    }}
                    className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Your order is pending admin approval. You&apos;ll be notified once approved.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
        {/* Crypto Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Cryptocurrency
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["BTC", "ETH", "USDT", "LTC"].map((crypto) => (
              <button
                key={crypto}
                type="button"
                onClick={() => setCryptoType(crypto)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  cryptoType === crypto
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{crypto}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {crypto === "BTC" && "Bitcoin"}
                    {crypto === "ETH" && "Ethereum"}
                    {crypto === "USDT" && "Tether"}
                    {crypto === "LTC" && "Litecoin"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Price Display */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current {cryptoType} Price:</div>
          <LiveCryptoPrice cryptoType={cryptoType} onPriceUpdate={setCurrentPrice} />
        </div>

        {/* USD Amount Input */}
        <div>
          <label htmlFor="usdAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount in USD
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
              $
            </span>
            <input
              type="number"
              id="usdAmount"
              value={usdAmount}
              onChange={(e) => setUsdAmount(e.target.value)}
              placeholder={`Minimum $${minPurchase}`}
              step="0.01"
              min={minPurchase}
              className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Minimum purchase: ${minPurchase}
          </p>
        </div>

        {/* Calculation Summary */}
        {usdAmount && parseFloat(usdAmount) >= minPurchase && (
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-3">
              Purchase Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Purchase Amount:</span>
                <span className="font-medium">${parseFloat(usdAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Processing Fee ({processingFee}%):</span>
                <span className="font-medium">${fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-900 dark:text-white font-semibold pt-2 border-t border-indigo-200 dark:border-indigo-700">
                <span>Total USD:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-indigo-900 dark:text-indigo-100 font-bold pt-2 border-t border-indigo-200 dark:border-indigo-700">
                <span>You&apos;ll Receive:</span>
                <span>{cryptoAmount.toFixed(8)} {cryptoType}</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !usdAmount || parseFloat(usdAmount) < minPurchase}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            `Purchase ${cryptoType}`
          )}
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Your USD balance will be deducted immediately. Crypto will be credited after admin approval.
        </p>
      </form>
    </div>
  );
}
