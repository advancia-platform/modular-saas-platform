'use client'

import { motion } from 'framer-motion'
import { X, Wallet, Gift, Award, DollarSign } from 'lucide-react'

interface Balance {
  balance_main: number
  earnings: number
  referral: number
  total: number
}

interface BalanceDropdownProps {
  balance: Balance
  onClose: () => void
}

export default function BalanceDropdown({ balance, onClose }: BalanceDropdownProps) {
  const items = [
    {
      label: 'Main Account',
      value: balance.balance_main,
      icon: <Wallet className="w-5 h-5" />,
      color: 'text-primary-600',
      bg: 'bg-primary-50'
    },
    {
      label: 'Earnings',
      value: balance.earnings,
      icon: <Gift className="w-5 h-5" />,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    {
      label: 'Rewards / Adjustments',
      value: balance.referral,
      icon: <Award className="w-5 h-5" />,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-teal-500 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Balance Breakdown</h3>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
          
          <div className="flex items-baseline gap-2">
            <DollarSign className="w-6 h-6" />
            <span className="text-4xl font-bold">{balance.total.toFixed(2)}</span>
          </div>
          <p className="text-primary-100 text-sm mt-1">Total Available Balance</p>
        </div>

        {/* Breakdown Items */}
        <div className="p-6 space-y-3">
          {items.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`${item.bg} p-2 rounded-lg`}>
                  <span className={item.color}>
                    {item.icon}
                  </span>
                </div>
                <span className="font-medium text-slate-700">{item.label}</span>
              </div>
              <span className={`font-bold ${item.color}`}>
                ${item.value.toFixed(2)}
              </span>
            </motion.div>
          ))}

          {/* Total Line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="pt-4 border-t-2 border-slate-200"
          >
            <div className="flex items-center justify-between text-lg">
              <span className="font-bold text-slate-800">Total Available</span>
              <span className="font-bold text-primary-600">
                ${balance.total.toFixed(2)}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 text-center">
          <p className="text-xs text-slate-600">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
