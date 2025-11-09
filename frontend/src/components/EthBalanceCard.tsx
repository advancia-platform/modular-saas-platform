"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface EthBalanceCardProps {
  walletAddress?: string;
  className?: string;
}

interface EthData {
  balance: number;
  usdValue: number;
  priceChange24h: number;
}

export default function EthBalanceCard({ walletAddress, className = "" }: EthBalanceCardProps) {
  const [ethData, setEthData] = useState<EthData>({
    balance: 0,
    usdValue: 0,
    priceChange24h: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ethPrice, setEthPrice] = useState(0);

  // Fetch ETH price from CoinGecko
  const fetchEthPrice = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true"
      );
      const data = await response.json();
      return {
        price: data.ethereum.usd,
        change24h: data.ethereum.usd_24h_change,
      };
    } catch (err) {
      console.error("Error fetching ETH price:", err);
      return { price: 0, change24h: 0 };
    }
  };

  // Fetch ETH balance from backend
  const fetchEthBalance = async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch ETH price first
      const priceData = await fetchEthPrice();
      setEthPrice(priceData.price);

      // Fetch balance from backend
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_URL}/api/eth/balance/${walletAddress}`);

      if (!response.ok) {
        throw new Error("Failed to fetch ETH balance");
      }

      const data = await response.json();
      const balance = data.balance || 0;

      setEthData({
        balance,
        usdValue: balance * priceData.price,
        priceChange24h: priceData.change24h,
      });
    } catch (err) {
      console.error("Error fetching ETH data:", err);
      setError((err as Error).message || "Failed to load ETH balance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEthBalance();

    // Refresh balance every 30 seconds
    const interval = setInterval(fetchEthBalance, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  if (!walletAddress) {
    return (
      <div className={`bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Ethereum (ETH)</h3>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">⟠</span>
          </div>
        </div>
        <p className="text-white/80 text-sm">No ETH wallet connected</p>
        <button className="mt-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm transition-colors">
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-md p-6 ${className} animate-pulse`}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-white/20 rounded w-32"></div>
          <div className="w-10 h-10 bg-white/20 rounded-full"></div>
        </div>
        <div className="h-8 bg-white/20 rounded w-40 mb-2"></div>
        <div className="h-5 bg-white/20 rounded w-24"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Ethereum (ETH)</h3>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">⟠</span>
          </div>
        </div>
        <p className="text-red-200 text-sm">{error}</p>
        <button
          onClick={fetchEthBalance}
          className="mt-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const isPositiveChange = ethData.priceChange24h >= 0;

  return (
    <div className={`bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Ethereum (ETH)</h3>
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <span className="text-2xl">⟠</span>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-2">
        <p className="text-3xl font-bold text-white">
          {ethData.balance.toFixed(4)} <span className="text-xl">ETH</span>
        </p>
      </div>

      {/* USD Value */}
      <div className="flex items-center justify-between">
        <p className="text-white/90 text-lg font-medium">
          ${ethData.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>

        {/* 24h Change */}
        <div className={`flex items-center gap-1 ${isPositiveChange ? "text-green-200" : "text-red-200"}`}>
          {isPositiveChange ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isPositiveChange ? "+" : ""}
            {ethData.priceChange24h.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* ETH Price */}
      <div className="mt-3 pt-3 border-t border-white/20">
        <p className="text-white/70 text-xs">
          1 ETH = ${ethPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Wallet Address (truncated) */}
      <div className="mt-3 pt-3 border-t border-white/20">
        <p className="text-white/60 text-xs font-mono">
          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
          Deposit
        </button>
        <button className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
          Withdraw
        </button>
      </div>
    </div>
  );
}
