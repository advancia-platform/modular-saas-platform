'use client'

import { motion } from 'framer-motion'
import { Banknote, Info, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface LoanCardProps {
  availableCredit: number
  interestRate: number
  delay?: number
}

export default function LoanCard({ availableCredit, interestRate, delay = 0 }: LoanCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [processing, setProcessing] = useState(false)
  const router = useRouter()

  const handleApplyLoan = () => {
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      router.push('/loans')
    }, 500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.03 }}
      onHoverStart={() => setShowTooltip(true)}
      onHoverEnd={() => setShowTooltip(false)}
      className="relative overflow-hidden rounded-xl shadow-lg p-6 bg-gradient-to-br from-emerald-50 to-teal-100 border border-emerald-200"
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/30 rounded-full blur-2xl" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-medium text-slate-600">Available Credit</p>
            <motion.div
              animate={{ rotate: showTooltip ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <Info className="w-4 h-4 text-emerald-600" />
            </motion.div>
          </div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: 'spring' }}
            className="space-y-1"
          >
            <span className="text-3xl font-bold text-slate-800 block">
              ${availableCredit.toFixed(2)}
            </span>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-600 font-semibold">
                {interestRate}% APR
              </span>
            </div>
          </motion.div>
        </div>

        <motion.div
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-emerald-400 to-teal-600 p-3 rounded-lg shadow-md"
        >
          <Banknote className="w-6 h-6 text-white" />
        </motion.div>
      </div>

      {/* Demo Badge */}
      <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
        COMING SOON
      </div>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: showTooltip ? 1 : 0, y: showTooltip ? 0 : -10 }}
        className="absolute left-0 right-0 -bottom-24 mx-4 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-10"
      >
        <p className="font-semibold mb-1">Feature Coming Soon:</p>
        <p className="text-slate-300">
          We&apos;re building a loan platform with rates starting at {interestRate}% APR, flexible terms, and instant approvals. Click to see what&apos;s planned!
        </p>
      </motion.div>

      {/* Preview Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleApplyLoan}
        disabled={processing}
        className={`w-full mt-4 py-3 rounded-lg font-semibold transition-all ${
          processing
            ? 'bg-emerald-400 text-slate-800 cursor-wait'
            : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg active:scale-95'
        }`}
      >
        {processing ? 'Loading...' : 'View Feature Preview'}
      </motion.button>
    </motion.div>
  )
}
