'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface SummaryCardProps {
  title: string
  value: number
  icon: React.ReactNode
  iconBg: string
  gradient: string
  delay?: number
  clickable?: boolean
  badge?: React.ReactNode
  onClick?: () => void
}

export default function SummaryCard({
  title,
  value,
  icon,
  iconBg,
  gradient,
  delay = 0,
  clickable = false,
  badge,
  onClick
}: SummaryCardProps) {
  const countRef = useRef<HTMLSpanElement>(null)

  // Animated counter
  useEffect(() => {
    if (!countRef.current) return

    const target = value
    const duration = 1000
    const start = 0
    const increment = target / (duration / 16)
    let current = start

    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        current = target
        clearInterval(timer)
      }
      if (countRef.current) {
        countRef.current.textContent = `$${current.toFixed(2)}`
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      whileHover={{ 
        scale: 1.03,
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
      }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl shadow-lg p-6 
        bg-gradient-to-br ${gradient}
        border border-slate-200
        ${clickable ? 'hover:cursor-pointer hover:border-primary-300' : ''}
      `}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: 'spring' }}
            className="flex items-baseline gap-2"
          >
            <span 
              ref={countRef}
              className="text-3xl font-bold text-slate-800 animate-counter-up"
            >
              ${value.toFixed(2)}
            </span>
            {badge}
          </motion.div>
        </div>

        <motion.div
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className={`${iconBg} p-3 rounded-lg shadow-md`}
        >
          <div className="text-white">
            {icon}
          </div>
        </motion.div>
      </div>

      {/* Hover glow effect */}
      {clickable && (
        <motion.div
          className="absolute inset-0 bg-primary-400/10 rounded-xl opacity-0"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  )
}
