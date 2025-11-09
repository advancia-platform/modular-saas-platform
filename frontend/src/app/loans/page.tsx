'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Banknote, Clock, AlertCircle, CheckCircle, Calendar, Percent } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

interface Loan {
  id: string
  amount: number
  interestRate: number
  termMonths: number
  monthlyPayment: number
  remainingBalance: number
  status: 'active' | 'paid' | 'defaulted' | 'pending'
  startDate: string
  dueDate: string
  purpose: string
}

interface LoanOffer {
  amount: number
  interestRate: number
  termMonths: number
  monthlyPayment: number
}

export default function LoansPage() {
  const { status } = useSession()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loanOffers, setLoanOffers] = useState<LoanOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<LoanOffer | null>(null)
  const [loanPurpose, setLoanPurpose] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login')
    }
    if (status === 'authenticated') {
      loadLoans()
      loadLoanOffers()
    }
  }, [status])

  const loadLoans = async () => {
    try {
      const res = await fetch('/api/loans')
      if (res.ok) {
        const data = await res.json()
        setLoans(data.loans || [])
      }
    } catch (error) {
      console.error('Failed to load loans:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLoanOffers = async () => {
    try {
      const res = await fetch('/api/loans/offers')
      if (res.ok) {
        const data = await res.json()
        setLoanOffers(data.offers || [])
      }
    } catch (error) {
      console.error('Failed to load loan offers:', error)
    }
  }

  const applyForLoan = async () => {
    if (!selectedOffer || !loanPurpose.trim()) {
      setMessage({ type: 'error', text: 'Please select a loan offer and provide a purpose' })
      return
    }

    setApplying(true)
    setMessage(null)

    try {
      const res = await fetch('/api/loans/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedOffer.amount,
          interestRate: selectedOffer.interestRate,
          termMonths: selectedOffer.termMonths,
          purpose: loanPurpose
        })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Loan application submitted successfully!' })
        setSelectedOffer(null)
        setLoanPurpose('')
        loadLoans()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to apply for loan' })
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setApplying(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'from-blue-500 to-cyan-600'
      case 'paid': return 'from-green-500 to-emerald-600'
      case 'pending': return 'from-yellow-500 to-amber-600'
      case 'defaulted': return 'from-red-500 to-rose-600'
      default: return 'from-gray-500 to-slate-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-slate-200"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-400 to-teal-600 p-3 rounded-lg">
              <Banknote className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Loan Center
            </h1>
          </div>
          <p className="text-slate-600">
            Access flexible financing options with competitive rates and transparent terms
          </p>
        </motion.div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{message.text}</span>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Loan Offers */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-slate-200"
          >
            <h2 className="text-xl font-bold text-slate-800 mb-4">Available Loan Offers</h2>
            <div className="space-y-4">
              {loanOffers.map((offer, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedOffer(offer)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedOffer === offer
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400'
                      : 'bg-slate-50 border border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">${offer.amount.toLocaleString()}</h3>
                      <p className="text-sm text-slate-600">{offer.termMonths} months term</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <Percent className="w-4 h-4" />
                        {offer.interestRate}% APR
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Monthly Payment:</span>
                    <span className="font-bold text-slate-800">${offer.monthlyPayment.toFixed(2)}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Application Form */}
            {selectedOffer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Loan Purpose
                  </label>
                  <textarea
                    value={loanPurpose}
                    onChange={(e) => setLoanPurpose(e.target.value)}
                    placeholder="e.g., Home improvement, debt consolidation, business expansion..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <button
                  onClick={applyForLoan}
                  disabled={applying || !loanPurpose.trim()}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applying ? 'Processing...' : 'Apply for Loan'}
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* Active Loans */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-slate-200"
          >
            <h2 className="text-xl font-bold text-slate-800 mb-4">Your Loans</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {loans.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Banknote className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No active loans</p>
                </div>
              ) : (
                loans.map((loan) => (
                  <motion.div
                    key={loan.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-800">{loan.purpose}</h3>
                        <p className="text-xs text-slate-500">ID: {loan.id.slice(0, 8)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getStatusColor(loan.status)}`}>
                        {loan.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-600 text-xs">Original Amount</p>
                        <p className="font-bold text-slate-800">${loan.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-xs">Remaining</p>
                        <p className="font-bold text-slate-800">${loan.remainingBalance.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-xs">Monthly Payment</p>
                        <p className="font-bold text-slate-800">${loan.monthlyPayment.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-xs">Interest Rate</p>
                        <p className="font-bold text-emerald-600">{loan.interestRate}% APR</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Due: {new Date(loan.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{loan.termMonths} months</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
