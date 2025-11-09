"use client";

import { useEffect, useState } from "react";

interface Balance {
  usdBalance: number;
  btcBalance: number;
  ethBalance: number;
  usdtBalance: number;
  ltcBalance: number;
}

interface TokenBalance {
  tokenType: string;
  balance: string;
}

interface PriceData {
  symbol: string;
  price: string;
}

export default function BalanceOverview() {
  const [balances, setBalances] = useState<Balance>({
    usdBalance: 0,
    btcBalance: 0,
    ethBalance: 0,
    usdtBalance: 0,
    ltcBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchBalances();
    fetchPrices();
  }, []);

  const fetchBalances = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      // Fetch user data
      const userResponse = await fetch(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userResponse.json();

      // Fetch token wallet
      const tokensResponse = await fetch(`/api/tokens/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tokensData = await tokensResponse.json();

      const tokenBalances = {
        btcBalance: 0,
        ethBalance: 0,
        usdtBalance: 0,
        ltcBalance: 0,
      };

      tokensData.forEach((token: TokenBalance) => {
        if (token.tokenType === "BTC") tokenBalances.btcBalance = parseFloat(token.balance);
        if (token.tokenType === "ETH") tokenBalances.ethBalance = parseFloat(token.balance);
        if (token.tokenType === "USDT") tokenBalances.usdtBalance = parseFloat(token.balance);
        if (token.tokenType === "LTC") tokenBalances.ltcBalance = parseFloat(token.balance);
      });

      setBalances({
        usdBalance: parseFloat(userData.usdBalance),
        ...tokenBalances,
      });
    } catch (error) {
      console.error("Error fetching balances:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    try {
      const response = await fetch("/api/crypto/prices");
      const data = await response.json();
      
      const priceMap: Record<string, number> = {};
      data.forEach((item: PriceData) => {
        priceMap[item.symbol] = parseFloat(item.price);
      });
      setPrices(priceMap);
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  };

  const calculateTotalValue = () => {
    const btcValue = balances.btcBalance * (prices.BTC || 0);
    const ethValue = balances.ethBalance * (prices.ETH || 0);
    const usdtValue = balances.usdtBalance * (prices.USDT || 1);
    const ltcValue = balances.ltcBalance * (prices.LTC || 0);
    
    return balances.usdBalance + btcValue + ethValue + usdtValue + ltcValue;
  };

  const totalValue = calculateTotalValue();

  const balanceCards = [
    {
      name: "USD Balance",
      symbol: "USD",
      balance: balances.usdBalance,
      value: balances.usdBalance,
      color: "bg-green-500",
      icon: "💵",
      decimals: 2,
    },
    {
      name: "Bitcoin",
      symbol: "BTC",
      balance: balances.btcBalance,
      value: balances.btcBalance * (prices.BTC || 0),
      color: "bg-orange-500",
      icon: "₿",
      decimals: 8,
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      balance: balances.ethBalance,
      value: balances.ethBalance * (prices.ETH || 0),
      color: "bg-blue-500",
      icon: "Ξ",
      decimals: 8,
    },
    {
      name: "Tether",
      symbol: "USDT",
      balance: balances.usdtBalance,
      value: balances.usdtBalance * (prices.USDT || 1),
      color: "bg-teal-500",
      icon: "₮",
      decimals: 6,
    },
    {
      name: "Litecoin",
      symbol: "LTC",
      balance: balances.ltcBalance,
      value: balances.ltcBalance * (prices.LTC || 0),
      color: "bg-gray-500",
      icon: "Ł",
      decimals: 8,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Portfolio Value */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-100 text-sm font-medium mb-1">Total Portfolio Value</p>
            <h2 className="text-4xl font-bold">${totalValue.toFixed(2)}</h2>
          </div>
          <div className="text-5xl opacity-20">💰</div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {balanceCards.map((card) => (
          <div
            key={card.symbol}
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {card.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{card.symbol}</p>
              </div>
              <div className={`${card.color} w-12 h-12 rounded-full flex items-center justify-center text-2xl text-white`}>
                {card.icon}
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.symbol === "USD" 
                    ? `$${card.balance.toFixed(card.decimals)}`
                    : card.balance.toFixed(card.decimals)}
                </p>
                {card.symbol !== "USD" && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {card.symbol}
                  </p>
                )}
              </div>

              {card.symbol !== "USD" && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">USD Value</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${card.value.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
