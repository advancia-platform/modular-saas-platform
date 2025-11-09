"use client";

import { useState, useEffect } from "react";

interface CryptoPrices {
  BTC: number;
  ETH: number;
  LTC: number;
  USDT: number;
}

interface LiveCryptoPriceProps {
  cryptoType: string;
  onPriceUpdate?: (price: number) => void;
}

export default function LiveCryptoPrice({ cryptoType, onPriceUpdate }: LiveCryptoPriceProps) {
  const [prices, setPrices] = useState<CryptoPrices | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch("/api/crypto/prices");
        if (response.ok) {
          const data = await response.json();
          setPrices(data.prices);
          setLastUpdate(new Date(data.timestamp));
          
          // Notify parent component of price update
          if (onPriceUpdate && data.prices[cryptoType]) {
            onPriceUpdate(data.prices[cryptoType]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch crypto prices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    
    // Refresh prices every 10 seconds
    const interval = setInterval(fetchPrices, 10000);
    
    return () => clearInterval(interval);
  }, [cryptoType, onPriceUpdate]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
    );
  }

  if (!prices || !prices[cryptoType as keyof CryptoPrices]) {
    return (
      <div className="text-red-600 dark:text-red-400">
        Price unavailable
      </div>
    );
  }

  const currentPrice = prices[cryptoType as keyof CryptoPrices];
  const timeAgo = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);

  return (
    <div className="flex items-center space-x-2">
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
          Live
        </span>
        <span>{timeAgo < 60 ? `${timeAgo}s ago` : 'Just now'}</span>
      </div>
    </div>
  );
}
