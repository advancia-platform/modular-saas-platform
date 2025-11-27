'use client';

import { motion } from 'framer-motion';

interface FinanceFlowLoadingProps {
  message?: string;
}

export default function FinanceFlowLoading({
  message = 'Loading FinanceFlow Dashboard...',
}: FinanceFlowLoadingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        {/* Animated logo/icon */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-16 h-16 mx-auto mb-6 relative"
        >
          <div className="w-full h-full border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>

          {/* Inner spinning element */}
          <motion.div
            animate={{ rotate: [360, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-2 border-2 border-purple-200 border-b-purple-500 rounded-full"
          ></motion.div>
        </motion.div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-slate-700 font-semibold text-lg mb-2">{message}</p>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="text-slate-500 text-sm"
          >
            Preparing your financial insights...
          </motion.p>
        </motion.div>

        {/* Progress indicators */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex items-center justify-center gap-2"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{
                scale: [1, 1.5, 1],
                backgroundColor: ['#cbd5e1', '#3b82f6', '#cbd5e1'],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: index * 0.2,
                ease: 'easeInOut',
              }}
              className="w-2 h-2 rounded-full bg-slate-300"
            ></motion.div>
          ))}
        </motion.div>

        {/* Feature preview cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto"
        >
          {[
            { icon: '💰', title: 'Balance Overview', desc: 'Track your total assets' },
            { icon: '📊', title: 'Analytics', desc: 'View spending patterns' },
            { icon: '🎯', title: 'Goals', desc: 'Monitor savings targets' },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 + index * 0.1 }}
              className="bg-white bg-opacity-70 backdrop-blur-sm border border-white border-opacity-50 rounded-xl p-4 text-center shadow-sm"
            >
              <div className="text-2xl mb-2">{feature.icon}</div>
              <p className="font-medium text-slate-700 text-sm">{feature.title}</p>
              <p className="text-xs text-slate-500 mt-1">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Subtle hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="text-xs text-slate-400 mt-8 max-w-md mx-auto"
        >
          Secure financial management powered by modern technology
        </motion.p>
      </div>
    </div>
  );
}
