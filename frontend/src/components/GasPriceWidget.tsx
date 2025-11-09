"use client";

import { useState, useEffect } from "react";
import { Flame, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface GasPriceData {
  gasPriceGwei: number;
  timestamp: number;
  trend?: "up" | "down" | "stable";
}

export default function GasPriceWidget() {
  const [gasPrice, setGasPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [trend, setTrend] = useState<"up" | "down" | "stable">("stable");

  const fetchGasPrice = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_URL}/api/eth/gas-price`);

      if (!response.ok) {
        throw new Error("Failed to fetch gas price");
      }

      const data: GasPriceData = await response.json();
      const newGasPrice = data.gasPriceGwei;

      // Update trend based on history
      if (history.length > 0) {
        const lastPrice = history[history.length - 1];
        if (newGasPrice > lastPrice * 1.05) {
          setTrend("up");
        } else if (newGasPrice < lastPrice * 0.95) {
          setTrend("down");
        } else {
          setTrend("stable");
        }
      }

      setGasPrice(newGasPrice);
      setHistory((prev) => [...prev.slice(-9), newGasPrice]); // Keep last 10 readings
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching gas price:", err);
      setError((err as Error).message || "Failed to load gas price");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGasPrice();

    // Update every 15 seconds
    const interval = setInterval(fetchGasPrice, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getGasPriceLevel = (gwei: number): { label: string; color: string } => {
    if (gwei < 20) return { label: "Low", color: "text-green-400" };
    if (gwei < 50) return { label: "Medium", color: "text-yellow-400" };
    if (gwei < 100) return { label: "High", color: "text-orange-400" };
    return { label: "Very High", color: "text-red-400" };
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-red-400" />;
      case "down":
        return <TrendingDown className="w-3 h-3 text-green-400" />;
      default:
        return <Activity className="w-3 h-3 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg px-4 py-2 flex items-center gap-2 animate-pulse">
        <Flame className="w-4 h-4 text-orange-400" />
        <div className="h-4 bg-gray-700 rounded w-20"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-700 transition-colors" onClick={fetchGasPrice}>
        <Flame className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-400">Gas: --</span>
      </div>
    );
  }

  const priceLevel = getGasPriceLevel(gasPrice);

  return (
    <div className="bg-gray-800 rounded-lg px-4 py-2 flex items-center gap-3 hover:bg-gray-700 transition-colors cursor-pointer group" title="Click to refresh">
      {/* Gas Icon */}
      <Flame className="w-4 h-4 text-orange-400" />

      {/* Gas Price */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white">{gasPrice.toFixed(1)} <span className="text-xs text-gray-400">Gwei</span></span>
        
        {/* Trend Indicator */}
        {getTrendIcon()}
      </div>

      {/* Price Level Badge */}
      <span className={`text-xs font-medium ${priceLevel.color}`}>{priceLevel.label}</span>

      {/* Mini Sparkline (optional visual) */}
      {history.length > 1 && (
        <div className="flex items-end gap-0.5 h-4 ml-1">
          {history.slice(-5).map((price, index) => {
            const maxPrice = Math.max(...history);
            const minPrice = Math.min(...history);
            const range = maxPrice - minPrice;
            const normalizedHeight = range > 0 ? ((price - minPrice) / range) * 100 : 50;
            
            return (
              <div
                key={index}
                className="w-1 bg-orange-400 rounded-sm opacity-60"
                style={{ height: `${Math.max(normalizedHeight, 20)}%` }}
              />
            );
          })}
        </div>
      )}

      {/* Refresh indicator on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          fetchGasPrice();
        }}
        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white text-xs"
      >
        ↻
      </button>
    </div>
  );
}
