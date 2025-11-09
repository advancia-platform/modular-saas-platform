'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  fullScreen?: boolean
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  const spinner = (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className={`${sizeClasses[size]} rounded-full border-4 border-gray-200 border-t-blue-600`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {message && <p className="text-gray-600 text-sm font-medium">{message}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

interface ErrorAlertProps {
  title?: string
  message: string
  onDismiss?: () => void
  type?: 'error' | 'warning' | 'info'
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Error',
  message,
  onDismiss,
  type = 'error',
}) => {
  const bgColors = {
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  }

  const textColors = {
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
  }

  const iconColors = {
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  }

  const icons = {
    error: '⚠️',
    warning: '⚠️',
    info: 'ℹ️',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`${bgColors[type]} border rounded-lg p-4 mb-4`}
    >
      <div className="flex items-start gap-3">
        <span className={`${iconColors[type]} text-xl flex-shrink-0`}>{icons[type]}</span>
        <div className="flex-1">
          <h3 className={`${textColors[type]} font-semibold mb-1`}>{title}</h3>
          <p className={`${textColors[type]} text-sm`}>{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${textColors[type]} hover:opacity-70 flex-shrink-0`}
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
    </motion.div>
  )
}

interface SkeletonProps {
  count?: number
  height?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ count = 3, height = 'h-4' }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`${height} bg-gray-200 rounded`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      ))}
    </div>
  )
}
