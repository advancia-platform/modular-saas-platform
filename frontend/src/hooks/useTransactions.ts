'use client'

import { useState, useEffect } from 'react'
import io, { Socket } from 'socket.io-client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface Transaction {
  id: string
  userId: string
  amount: number
  type: 'credit' | 'debit' | 'transfer' | 'bonus'
  status: 'pending' | 'completed' | 'failed'
  description?: string
  timestamp: string
}

export function useTransactions(userId: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`${API_URL}/api/transactions/recent/${userId}`)
        if (!response.ok) throw new Error('Failed to fetch transactions')
        
        const data = await response.json()
        setTransactions(data)
      } catch (err) {
        // Silent error logging for admin monitoring
        console.error('[ADMIN] Transactions fetch error:', err, { userId, timestamp: new Date().toISOString() })
        
        // Report to admin endpoint (RPA monitoring)
        fetch(`${API_URL}/api/admin/error-report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type: 'transactions_fetch_error',
            message: err instanceof Error ? err.message : 'Unknown error',
            timestamp: new Date().toISOString()
          })
        }).catch(() => {/* Silent fail */})
        
        // Set generic message (shown as loading, not error to user)
        setError('Syncing transactions...')
        
        // Set empty array for new users (show empty state)
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()

    // Setup Socket.IO for real-time transaction updates
    const socket: Socket = io(API_URL)
    
    socket.on('connect', () => {
      console.log('Socket connected for transaction updates')
      socket.emit('join-room', userId)
    })

    socket.on('transaction-created', (transaction: Transaction) => {
      console.log('New transaction received:', transaction)
      setTransactions(prev => [transaction, ...prev])
    })

    socket.on('global-transaction', (transaction: Transaction) => {
      console.log('Global transaction broadcast:', transaction)
    })

    return () => {
      socket.disconnect()
    }
  }, [userId])

  return { transactions, loading, error }
}
