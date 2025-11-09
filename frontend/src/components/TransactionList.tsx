'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react'
import { useState, ChangeEvent } from 'react'

interface Transaction {
  id: string
  userId: string
  amount: number
  type: 'credit' | 'debit' | 'transfer' | 'bonus'
  status: 'pending' | 'completed' | 'failed'
  description?: string
  timestamp: string
}

interface TransactionListProps {
  transactions: Transaction[]
  loading: boolean
}

export default function TransactionList({ transactions, loading }: TransactionListProps) {
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit' | 'bonus'>('all')

  const handleFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFilter(event.target.value as 'all' | 'credit' | 'debit' | 'bonus')
  }
  
  const filteredTransactions = transactions.filter(tx => 
    filter === 'all' ? true : tx.type === filter
  )

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-teal-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Transactions</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <select
              value={filter}
              onChange={handleFilterChange}
              className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-medium outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="credit">Credits</option>
              <option value="debit">Debits</option>
              <option value="bonus">Bonus</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No transactions found</p>
          </div>
        ) : (
          filteredTransactions.slice(0, 10).map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
            >
              <div className="flex items-center gap-4">
                <div className={`
                  p-3 rounded-lg
                  ${tx.type === 'credit' ? 'bg-green-100' : 
                    tx.type === 'debit' ? 'bg-red-100' : 'bg-amber-100'}
                `}>
                  {tx.type === 'credit' ? (
                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-red-600" />
                  )}
                </div>
                
                <div>
                  <p className="font-semibold text-slate-800">
                    {tx.description || `${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} Transaction`}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(tx.timestamp).toLocaleString()}
                  </p>
                  <span className={`
                    inline-block text-xs px-2 py-1 rounded-full mt-1
                    ${tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'}
                  `}>
                    {tx.status}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className={`
                  text-lg font-bold
                  ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}
                `}>
                  {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
