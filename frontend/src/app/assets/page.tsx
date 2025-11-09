"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Wallet,
  CreditCard,
  Heart,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowUpRight,
  DollarSign,
  Bitcoin,
  Coins,
  Activity,
  PieChart,
} from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";

type SessionUser = {
  id?: string;
  name?: string;
  email?: string;
};

interface Asset {
  id: string;
  category: "fiat" | "crypto" | "cards" | "medbed";
  name: string;
  value: number;
  currency: string;
  icon: typeof Wallet;
  color: string;
  change?: number;
  status?: string;
}

export default function AssetsPage() {
  const { data: session } = useSession();
  const sessionUser = session?.user as SessionUser | undefined;
  const [hideBalances, setHideBalances] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "fiat" | "crypto" | "cards" | "medbed">("all");

  // Mock assets data - would come from API in production
  const assets: Asset[] = useMemo(() => [
    // Fiat/Cash
    {
      id: "fiat-1",
      category: "fiat",
      name: "Main Balance",
      value: 5250.00,
      currency: "USD",
      icon: Wallet,
      color: "from-blue-500 to-cyan-600",
      change: 12.5,
    },
    {
      id: "fiat-2",
      category: "fiat",
      name: "Bonus Earnings",
      value: 842.50,
      currency: "USD",
      icon: DollarSign,
      color: "from-amber-500 to-yellow-600",
      change: 8.3,
    },
    
    // Crypto
    {
      id: "crypto-1",
      category: "crypto",
      name: "Bitcoin",
      value: 0.15,
      currency: "BTC",
      icon: Bitcoin,
      color: "from-orange-500 to-amber-600",
      change: 5.2,
    },
    {
      id: "crypto-2",
      category: "crypto",
      name: "Ethereum",
      value: 2.5,
      currency: "ETH",
      icon: Coins,
      color: "from-purple-500 to-indigo-600",
      change: -2.1,
    },
    {
      id: "crypto-3",
      category: "crypto",
      name: "Stellar",
      value: 15420.50,
      currency: "XLM",
      icon: Coins,
      color: "from-blue-400 to-cyan-500",
      change: 15.7,
    },
    {
      id: "crypto-4",
      category: "crypto",
      name: "Ripple",
      value: 2850.75,
      currency: "XRP",
      icon: Coins,
      color: "from-gray-600 to-slate-700",
      change: 3.4,
    },
    {
      id: "crypto-5",
      category: "crypto",
      name: "Trump Coin",
      value: 100000,
      currency: "TRUMP",
      icon: Coins,
      color: "from-red-500 to-orange-600",
      change: 45.8,
    },

    // Debit Cards
    {
      id: "card-1",
      category: "cards",
      name: "Virtual Card",
      value: 2500.00,
      currency: "USD",
      icon: CreditCard,
      color: "from-green-500 to-emerald-600",
      status: "Active",
    },
    {
      id: "card-2",
      category: "cards",
      name: "Physical Card",
      value: 1200.00,
      currency: "USD",
      icon: CreditCard,
      color: "from-violet-500 to-purple-600",
      status: "Active",
    },

    // Med Bed Rewards
    {
      id: "medbed-1",
      category: "medbed",
      name: "Recovery Rewards",
      value: 450.00,
      currency: "USD",
      icon: Heart,
      color: "from-pink-500 to-rose-600",
      status: "Available",
    },
    {
      id: "medbed-2",
      category: "medbed",
      name: "Session Credits",
      value: 3,
      currency: "Credits",
      icon: Activity,
      color: "from-teal-500 to-cyan-600",
      status: "3 Sessions",
    },
  ], []);

  // Calculate totals
  const totals = useMemo(() => {
    const fiatTotal = assets
      .filter(a => a.category === "fiat" || a.category === "cards" || a.category === "medbed")
      .filter(a => a.currency === "USD")
      .reduce((sum, asset) => sum + asset.value, 0);

    const cryptoCount = assets.filter(a => a.category === "crypto").length;
    const cardsCount = assets.filter(a => a.category === "cards").length;
    const medbedRewards = assets.filter(a => a.category === "medbed" && a.currency === "USD")
      .reduce((sum, asset) => sum + asset.value, 0);

    return {
      total: fiatTotal,
      cryptoAssets: cryptoCount,
      activeCards: cardsCount,
      medbedRewards,
    };
  }, [assets]);

  const filteredAssets = selectedCategory === "all" 
    ? assets 
    : assets.filter(a => a.category === selectedCategory);

  const categories = [
    { id: "all" as const, label: "All Assets", icon: PieChart },
    { id: "fiat" as const, label: "Cash", icon: Wallet },
    { id: "crypto" as const, label: "Crypto", icon: Bitcoin },
    { id: "cards" as const, label: "Cards", icon: CreditCard },
    { id: "medbed" as const, label: "Med Bed", icon: Heart },
  ];

  const formatValue = (value: number, currency: string) => {
    if (hideBalances) return "••••••";
    
    if (currency === "USD") {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (currency === "BTC" || currency === "ETH") {
      return `${value.toFixed(4)} ${currency}`;
    } else if (currency === "Credits") {
      return `${value} ${currency}`;
    }
    return `${value.toLocaleString()} ${currency}`;
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  My Assets
                </h1>
                <p className="text-slate-600 mt-2">
                  Welcome back, {sessionUser?.name || sessionUser?.email?.split('@')[0] || "User"}! 
                  Here&apos;s your complete portfolio overview.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setHideBalances(!hideBalances)}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 rounded-xl font-semibold text-slate-700 hover:border-blue-500 transition-colors"
              >
                {hideBalances ? <EyeOff size={20} /> : <Eye size={20} />}
                {hideBalances ? "Show Balances" : "Hide Balances"}
              </motion.button>
            </div>
          </div>

          {/* Total Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <Wallet size={32} className="opacity-80" />
                <RefreshCw size={20} className="opacity-60 hover:opacity-100 cursor-pointer" />
              </div>
              <p className="text-sm opacity-90 mb-1">Total Balance</p>
              <p className="text-3xl font-bold">
                {hideBalances ? "••••••" : `$${totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              </p>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <TrendingUp size={16} />
                <span>+12.5% this month</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg"
            >
              <Bitcoin size={32} className="text-orange-500 mb-4" />
              <p className="text-sm text-slate-600 mb-1">Crypto Assets</p>
              <p className="text-3xl font-bold text-slate-900">{totals.cryptoAssets}</p>
              <p className="text-sm text-slate-500 mt-2">Cryptocurrencies</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg"
            >
              <CreditCard size={32} className="text-green-500 mb-4" />
              <p className="text-sm text-slate-600 mb-1">Active Cards</p>
              <p className="text-3xl font-bold text-slate-900">{totals.activeCards}</p>
              <p className="text-sm text-slate-500 mt-2">Debit Cards</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg"
            >
              <Heart size={32} className="text-pink-500 mb-4" />
              <p className="text-sm text-slate-600 mb-1">Med Bed Rewards</p>
              <p className="text-3xl font-bold text-slate-900">
                {hideBalances ? "••••" : `$${totals.medbedRewards.toFixed(0)}`}
              </p>
              <p className="text-sm text-slate-500 mt-2">Available to claim</p>
            </motion.div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-500"
                }`}
              >
                <cat.icon size={20} />
                {cat.label}
              </motion.button>
            ))}
          </div>

          {/* Assets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredAssets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.03 }}
                  className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  {/* Asset Icon */}
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${asset.color} mb-4`}>
                    <asset.icon size={28} className="text-white" />
                  </div>

                  {/* Asset Name */}
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{asset.name}</h3>

                  {/* Asset Value */}
                  <p className="text-3xl font-bold text-slate-900 mb-3">
                    {formatValue(asset.value, asset.currency)}
                  </p>

                  {/* Additional Info */}
                  <div className="flex items-center justify-between">
                    {asset.change !== undefined && (
                      <div className={`flex items-center gap-1 text-sm font-semibold ${
                        asset.change >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {asset.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {Math.abs(asset.change)}%
                      </div>
                    )}
                    {asset.status && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        {asset.status}
                      </span>
                    )}
                    {!asset.change && !asset.status && (
                      <span className="text-sm text-slate-500">{asset.currency}</span>
                    )}
                    <ArrowUpRight size={20} className="text-slate-400" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              + Add Funds
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              Transfer Assets
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              View Reports
            </motion.button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
