'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface PaymentFormProps {
  onSuccess?: () => void;
}

interface Transaction {
  id: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
}

export default function StripePaymentForm({ onSuccess }: PaymentFormProps) {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch recent transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

        const response = await fetch(`${apiUrl}/api/payments/history?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setRecentTransactions(data.payments || []);
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      }
    };

    fetchTransactions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !amount || !currency || !email) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(`${apiUrl}/api/payments/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          amount: parseFloat(amount),
          currency: currency.toUpperCase(),
          email,
          description: description || 'Payment via Stripe',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank');
        toast.success('✅ Stripe checkout opened in new tab!');
      }

      setUserId('');
      setAmount('');
      setEmail('');
      setDescription('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const getCurrencyIcon = (curr: string) => {
    const icons: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
      CHF: 'Fr',
      CNY: '¥',
    };
    return icons[curr] || '$';
  };

  return (
    <div
      className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} shadow-lg rounded-xl p-6 border ${darkMode ? 'border-blue-400/30' : 'border-blue-500/20'} transition-colors duration-300`}
    >
      {/* Header with Dark Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-blue-600">💳</span>
          Stripe Payment
        </h2>

        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-700'} hover:scale-110 transition-transform`}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Info Banner */}
      <div
        className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} border ${darkMode ? 'border-blue-700' : 'border-blue-200'}`}
      >
        <div className="flex items-center gap-2 text-sm">
          <span className="text-blue-600 text-lg">🔒</span>
          <span className={darkMode ? 'text-blue-300' : 'text-blue-800'}>
            Secure payment processing by Stripe
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* User ID */}
        <div>
          <label
            htmlFor="userId-input"
            className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            User ID *
          </label>
          <input
            id="userId-input"
            type="text"
            placeholder="Enter user ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
            required
            disabled={loading}
            aria-required="true"
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email-input"
            className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Email Address *
          </label>
          <input
            id="email-input"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
            required
            disabled={loading}
            aria-required="true"
          />
        </div>

        {/* Amount & Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="amount-input"
              className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Amount *
            </label>
            <input
              id="amount-input"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
              required
              disabled={loading}
              aria-required="true"
            />
          </div>

          <div>
            <label
              htmlFor="currency-select"
              className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Currency *
            </label>
            <select
              id="currency-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              disabled={loading}
              aria-label="Select currency"
            >
              <option value="USD">$ US Dollar (USD)</option>
              <option value="EUR">€ Euro (EUR)</option>
              <option value="GBP">£ British Pound (GBP)</option>
              <option value="JPY">¥ Japanese Yen (JPY)</option>
              <option value="CAD">C$ Canadian Dollar (CAD)</option>
              <option value="AUD">A$ Australian Dollar (AUD)</option>
              <option value="CHF">Fr Swiss Franc (CHF)</option>
              <option value="CNY">¥ Chinese Yuan (CNY)</option>
            </select>
          </div>
        </div>

        {/* Description (Optional) */}
        <div>
          <label
            htmlFor="description-input"
            className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Description{' '}
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              (Optional)
            </span>
          </label>
          <input
            id="description-input"
            type="text"
            placeholder="Payment description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
            disabled={loading}
          />
        </div>

        {/* Amount Preview */}
        {amount && (
          <div
            className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <div className="text-center">
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Total Amount
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {getCurrencyIcon(currency)}
                {parseFloat(amount).toFixed(2)} {currency}
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 px-6 rounded-lg font-bold text-white text-lg transition-all ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
          }`}
          aria-label="Submit payment request"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                role="status"
                aria-label="Loading"
              ></div>
              Processing...
            </div>
          ) : (
            '🚀 Pay with Stripe'
          )}
        </button>
      </form>

      {/* Transaction History Toggle */}
      <button
        type="button"
        onClick={() => setShowHistory(!showHistory)}
        className={`w-full mt-4 py-2 px-4 rounded-lg font-semibold transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
        aria-controls="transaction-history"
        aria-label={`${showHistory ? 'Hide' : 'Show'} recent transactions`}
      >
        {showHistory ? '▼' : '▶'} Recent Payments ({recentTransactions.length})
      </button>

      {/* Transaction History */}
      {showHistory && (
        <div
          id="transaction-history"
          className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}
        >
          {recentTransactions.length === 0 ? (
            <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No recent payments
            </p>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className={`p-3 rounded-lg flex items-center justify-between ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💳</span>
                    <div>
                      <p
                        className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        {getCurrencyIcon(tx.currency)}
                        {tx.amount} {tx.currency}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(tx.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      tx.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : tx.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info Panel */}
      <div
        className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}
      >
        <h3
          className={`text-sm font-semibold mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}
        >
          ℹ️ Stripe Information
        </h3>
        <ul className={`text-xs space-y-1 ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
          <li>• Industry-leading security and fraud prevention</li>
          <li>• Supports credit/debit cards, Apple Pay, Google Pay</li>
          <li>• PCI DSS Level 1 certified</li>
          <li>• Instant payment confirmation</li>
        </ul>
      </div>

      {/* Keyboard Navigation Hint */}
      <div
        className={`mt-4 text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
        role="note"
      >
        💡 Tip: Use Tab to navigate, Enter to submit
      </div>
    </div>
  );
}
