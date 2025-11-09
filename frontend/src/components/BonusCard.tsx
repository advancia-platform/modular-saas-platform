'use client'

import { motion } from 'framer-motion'
import { Gift, Info } from 'lucide-react'
import { useState } from 'react'

interface BonusCardProps {
  earnings: number
  percentage: number
  delay?: number
}

export default function BonusCard({ earnings, percentage, delay = 0 }: BonusCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)

  const handleClaimBonus = () => {
    setClaiming(true)
    setTimeout(() => {
      setClaiming(false)
      setClaimed(true)
      setTimeout(() => setClaimed(false), 3000)
    }, 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.03 }}
      onHoverStart={() => setShowTooltip(true)}
      onHoverEnd={() => setShowTooltip(false)}
      className="relative overflow-hidden rounded-xl shadow-lg p-6 bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200"
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/30 rounded-full blur-2xl" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-medium text-slate-600">Bonus Earnings</p>
            <motion.div
              animate={{ rotate: showTooltip ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <Info className="w-4 h-4 text-amber-600" />
            </motion.div>
          </div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: 'spring' }}
            className="space-y-1"
          >
            <span className="text-3xl font-bold text-slate-800 block">
              ${earnings.toFixed(2)}
            </span>
            <span className="text-sm text-amber-600 font-semibold">
              {percentage}% this month
            </span>
          </motion.div>
        </div>

        <motion.div
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-amber-400 to-amber-600 p-3 rounded-lg shadow-md"
        >
          <Gift className="w-6 h-6 text-white" />
        </motion.div>
      </div>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: showTooltip ? 1 : 0, y: showTooltip ? 0 : -10 }}
        className="absolute left-0 right-0 -bottom-20 mx-4 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-10"
      >
        <p className="font-semibold mb-1">How bonuses work:</p>
        <p className="text-slate-300">
          Earn {percentage}% on every credit transaction. Bonuses are calculated monthly and added to your earnings balance.
        </p>
      </motion.div>

      {/* Claim Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClaimBonus}
        disabled={claiming || claimed}
        className={`w-full mt-4 py-3 rounded-lg font-semibold transition-all ${
          claimed 
            ? 'bg-green-500 text-white' 
            : claiming
            ? 'bg-amber-400 text-slate-800 cursor-wait'
            : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:shadow-lg'
        }`}
      >
        {claimed ? '✓ Bonus Claimed!' : claiming ? 'Processing...' : `Claim $${earnings.toFixed(2)} Bonus`}
      </motion.button>
    </motion.div>
  )
}
