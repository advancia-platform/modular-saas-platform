"use client";

import { motion } from "framer-motion";

interface UserBalances {
  usd: string;
  tokenBalance: string;
  tokenType: string;
  lifetimeEarned: string;
  lockedBalance: string;
}

interface UserTier {
  currentTier: string;
  points: number;
  lifetimePoints: number;
}

interface UserBalanceCardProps {
  balances: UserBalances;
  tier: UserTier;
}

export default function UserBalanceCard({
  balances,
  tier,
}: UserBalanceCardProps) {
  const formatCurrency = (value: string) => {
    const num = parseFloat(value || "0");
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatTokens = (value: string) => {
    const num = parseFloat(value || "0");
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const getTierColor = (tierName: string) => {
    const colors: Record<string, string> = {
      bronze: "bg-amber-100 text-amber-800",
      silver: "bg-gray-100 text-gray-800",
      gold: "bg-yellow-100 text-yellow-800",
      platinum: "bg-blue-100 text-blue-800",
      diamond: "bg-purple-100 text-purple-800",
    };
    return colors[tierName.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-xl shadow-md overflow-hidden"
    >
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white">Balances & Tier</h2>
      </div>
      <div className="p-6 space-y-6">
        {/* USD Balance */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <label className="block text-sm font-medium text-green-700 mb-1">
            USD Balance
          </label>
          <p className="text-3xl font-bold text-green-900">
            {formatCurrency(balances.usd)}
          </p>
        </div>

        {/* Token Balances */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4">
            <label className="block text-sm font-medium text-indigo-700 mb-1">
              {balances.tokenType} Tokens
            </label>
            <p className="text-2xl font-bold text-indigo-900">
              {formatTokens(balances.tokenBalance)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <label className="block text-sm font-medium text-purple-700 mb-1">
              Locked Tokens
            </label>
            <p className="text-2xl font-bold text-purple-900">
              {formatTokens(balances.lockedBalance)}
            </p>
          </div>
        </div>

        {/* Lifetime Earned */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
          <label className="block text-sm font-medium text-amber-700 mb-1">
            Lifetime Tokens Earned
          </label>
          <p className="text-2xl font-bold text-amber-900">
            {formatTokens(balances.lifetimeEarned)}
          </p>
        </div>

        {/* Tier Information */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Current Tier
            </label>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium uppercase ${getTierColor(
                tier.currentTier
              )}`}
            >
              {tier.currentTier}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-gray-500 mb-1">Current Points</label>
              <p className="font-semibold text-gray-900">
                {tier.points.toLocaleString()}
              </p>
            </div>
            <div>
              <label className="block text-gray-500 mb-1">
                Lifetime Points
              </label>
              <p className="font-semibold text-gray-900">
                {tier.lifetimePoints.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
