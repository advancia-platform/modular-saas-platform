'use client';

import { motion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Eye,
  EyeOff,
  MoreVertical,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';

interface FinanceFlowWidgetProps {
  totalBalance: number;
  monthlyChange: number;
  bonusEarnings: number;
  hideBalance?: boolean;
  onToggleBalance?: () => void;
  className?: string;
}

export default function FinanceFlowWidget({
  totalBalance,
  monthlyChange,
  bonusEarnings,
  hideBalance = false,
  onToggleBalance,
  className = '',
}: FinanceFlowWidgetProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`bg-gradient-to-br from-purple-500 via-blue-600 to-purple-700 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden ${className}`}
    >
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white bg-opacity-10 rounded-full translate-y-10 -translate-x-10"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isHovered ? 360 : 0 }}
              transition={{ duration: 0.6 }}
              className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center"
            >
              <Wallet className="w-6 h-6" />
            </motion.div>
            <div>
              <p className="text-sm opacity-90 font-medium">Total Balance</p>
              <p className="text-xs opacity-75">All accounts combined</p>
            </div>
          </div>

          {onToggleBalance && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleBalance}
              className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 rounded-xl text-sm font-medium backdrop-blur-sm border border-white border-opacity-30 hover:bg-opacity-30 transition-all duration-200"
            >
              {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {hideBalance ? 'Show' : 'Hide'}
            </motion.button>
          )}
        </div>

        {/* Main Balance */}
        <div className="mb-6">
          <motion.p
            key={hideBalance ? 'hidden' : 'visible'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-3 tracking-tight"
          >
            {hideBalance
              ? '••••••••'
              : `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </motion.p>

          {/* Monthly Change */}
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                monthlyChange >= 0
                  ? 'bg-green-500 bg-opacity-20 text-green-100 border border-green-300 border-opacity-30'
                  : 'bg-red-500 bg-opacity-20 text-red-100 border border-red-300 border-opacity-30'
              }`}
            >
              {monthlyChange >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {monthlyChange >= 0 ? '+' : ''}
              {Math.abs(monthlyChange)}%
            </motion.div>
            <span className="text-sm opacity-90">this month</span>
          </div>
        </div>

        {/* Balance Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <div className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-4 h-4 text-green-300" />
              <span className="text-sm opacity-90">Income</span>
            </div>
            <p className="text-lg font-bold">
              {hideBalance
                ? '••••'
                : `$${(totalBalance * 0.75).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            </p>
            <p className="text-xs opacity-75">+5.2% vs last month</p>
          </div>

          <div className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight className="w-4 h-4 text-red-300" />
              <span className="text-sm opacity-90">Expenses</span>
            </div>
            <p className="text-lg font-bold">
              {hideBalance
                ? '••••'
                : `$${(totalBalance * 0.55).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            </p>
            <p className="text-xs opacity-75">-2.1% vs last month</p>
          </div>
        </motion.div>

        {/* Bonus Earnings */}
        {bonusEarnings > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-opacity-20 border border-yellow-300 border-opacity-30 rounded-xl p-4 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-yellow-200" />
                  <span className="text-sm font-medium opacity-90">Bonus Earnings</span>
                </div>
                <p className="text-xl font-bold">
                  {hideBalance ? '••••' : `$${bonusEarnings.toLocaleString()}`}
                </p>
                <p className="text-xs opacity-75">This month</p>
              </div>

              <div className="w-12 h-12 bg-yellow-500 bg-opacity-20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-200" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2 mt-6"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl py-3 px-4 text-sm font-medium hover:bg-opacity-30 transition-all duration-200 backdrop-blur-sm"
          >
            View Details
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-white text-purple-600 rounded-xl py-3 px-4 text-sm font-medium hover:bg-opacity-95 transition-all duration-200"
          >
            Transactions
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl flex items-center justify-center hover:bg-opacity-30 transition-all duration-200 backdrop-blur-sm"
          >
            <MoreVertical className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>

      {/* Animated glow effect */}
      <motion.div
        animate={{
          scale: [1, 1.02, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-20 rounded-2xl blur-xl -z-10"
      />
    </motion.div>
  );
}
