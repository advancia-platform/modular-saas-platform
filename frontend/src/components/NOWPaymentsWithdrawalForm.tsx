'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface WithdrawalFormProps {
  onSuccess?: () => void;
}

interface ExchangeRate {
  usd: number;
  lastUpdated: number;
}

interface Transaction {
  id: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
}

export default function NOWPaymentsWithdrawalForm({ onSuccess }: WithdrawalFormProps) {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BTC');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, ExchangeRate>>({});
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const cryptos = [
          'bitcoin',
          'ethereum',
          'tether',
          'usd-coin',
          'binancecoin',
          'litecoin',
          'tron',
          'monero',
          'ripple',
          'dogecoin',
        ];
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${cryptos.join(',')}&vs_currencies=usd`
        );
        const data = await response.json();

        const rates: Record<string, ExchangeRate> = {
          BTC: { usd: data.bitcoin?.usd || 0, lastUpdated: Date.now() },
          ETH: { usd: data.ethereum?.usd || 0, lastUpdated: Date.now() },
          USDT: { usd: data.tether?.usd || 0, lastUpdated: Date.now() },
          USDC: { usd: data['usd-coin']?.usd || 0, lastUpdated: Date.now() },
          BNB: { usd: data.binancecoin?.usd || 0, lastUpdated: Date.now() },
          LTC: { usd: data.litecoin?.usd || 0, lastUpdated: Date.now() },
          TRX: { usd: data.tron?.usd || 0, lastUpdated: Date.now() },
          XMR: { usd: data.monero?.usd || 0, lastUpdated: Date.now() },
          XRP: { usd: data.ripple?.usd || 0, lastUpdated: Date.now() },
          DOGE: { usd: data.dogecoin?.usd || 0, lastUpdated: Date.now() },
        };

        setExchangeRates(rates);
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch recent transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

        const response = await fetch(`${apiUrl}/api/crypto/withdrawals?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setRecentTransactions(data.withdrawals || []);
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      }
    };

    fetchTransactions();
  }, []);

  const usdValue =
    amount && exchangeRates[currency]
      ? (parseFloat(amount) * exchangeRates[currency].usd).toFixed(2)
      : '0.00';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !amount || !currency || !address) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const response = await fetch(`${apiUrl}/api/nowpayments/withdrawal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          amount: parseFloat(amount),
          currency: currency.toUpperCase(),
          address,
          network: network || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create withdrawal');
      }

      toast.success('✅ NOWPayments withdrawal created successfully!');

      setUserId('');
      setAmount('');
      setAddress('');
      setNetwork('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.message || 'Failed to create withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const getCryptoIcon = (symbol: string) => {
    const icons: Record<string, string> = {
      BTC: '₿',
      ETH: 'Ξ',
      USDT: '₮',
      USDC: '$',
      BNB: '🔶',
      LTC: 'Ł',
      TRX: '🔺',
      XMR: '🔒',
      XRP: '💧',
      DOGE: '🐕',
    };
    return icons[symbol] || '🪙';
  };

  return (
    <div
      className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} shadow-lg rounded-xl p-6 border ${darkMode ? 'border-pink-400/30' : 'border-pink-500/20'} transition-colors duration-300`}
    >
      {/* Header with Dark Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-pink-600">🌟</span>
          NOWPayments Withdrawal
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

      {/* Exchange Rate Banner */}
      {exchangeRates[currency] && (
        <div
          className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-pink-900/30' : 'bg-pink-50'} border ${darkMode ? 'border-pink-700' : 'border-pink-200'}`}
        >
          <div className="flex items-center justify-between text-sm">
            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
              {getCryptoIcon(currency)} {currency} Price:
            </span>
            <span className="font-bold text-pink-600">
              ${exchangeRates[currency].usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {amount && (
            <div className="mt-1 text-xs text-right text-pink-600 font-semibold">
              ≈ ${usdValue} USD
            </div>
          )}
        </div>
      )}

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
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
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
              step="0.00000001"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
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
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              disabled={loading}
              aria-label="Select cryptocurrency"
            >
              <option value="BTC">₿ Bitcoin (BTC)</option>
              <option value="ETH">Ξ Ethereum (ETH)</option>
              <option value="USDT">₮ Tether (USDT)</option>
              <option value="USDC">$ USD Coin (USDC)</option>
              <option value="BNB">🔶 Binance Coin (BNB)</option>
              <option value="LTC">Ł Litecoin (LTC)</option>
              <option value="TRX">🔺 TRON (TRX)</option>
              <option value="XMR">🔒 Monero (XMR)</option>
              <option value="XRP">💧 Ripple (XRP)</option>
              <option value="DOGE">🐕 Dogecoin (DOGE)</option>
            </select>
          </div>
        </div>

        {/* Wallet Address */}
        <div>
          <label
            htmlFor="address-input"
            className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Wallet Address *
          </label>
          <input
            id="address-input"
            type="text"
            placeholder="Enter destination wallet address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-mono text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
            required
            disabled={loading}
            aria-required="true"
          />
        </div>

        {/* Network (Optional) */}
        <div>
          <label
            htmlFor="network-select"
            className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Network{' '}
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              (Optional)
            </span>
          </label>
          <select
            id="network-select"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            disabled={loading}
            aria-label="Select blockchain network"
          >
            <option value="">🔄 Auto-detect</option>
            <option value="BTC">🟠 Bitcoin</option>
            <option value="ETH">🔷 Ethereum (ERC-20)</option>
            <option value="BSC">🟡 Binance Smart Chain (BEP-20)</option>
            <option value="TRX">🔴 TRON (TRC-20)</option>
            <option value="POLYGON">🟣 Polygon (MATIC)</option>
            <option value="ARBITRUM">🔵 Arbitrum</option>
            <option value="OPTIMISM">🔴 Optimism</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 px-6 rounded-lg font-bold text-white text-lg transition-all ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
          }`}
          aria-label="Submit withdrawal request"
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
            '🚀 Send Payout'
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
        {showHistory ? '▼' : '▶'} Recent Transactions ({recentTransactions.length})
      </button>

      {/* Transaction History */}
      {showHistory && (
        <div
          id="transaction-history"
          className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}
        >
          {recentTransactions.length === 0 ? (
            <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No recent transactions
            </p>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className={`p-3 rounded-lg flex items-center justify-between ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCryptoIcon(tx.currency)}</span>
                    <div>
                      <p
                        className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}
                      >
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
        className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-pink-900/30 border border-pink-700' : 'bg-pink-50 border border-pink-200'}`}
      >
        <h3
          className={`text-sm font-semibold mb-2 ${darkMode ? 'text-pink-300' : 'text-pink-900'}`}
        >
          ℹ️ NOWPayments Information
        </h3>
        <ul className={`text-xs space-y-1 ${darkMode ? 'text-pink-200' : 'text-pink-800'}`}>
          <li>• Supports 200+ cryptocurrencies</li>
          <li>• Fast processing (typically within 1 hour)</li>
          <li>• Transaction fee: 0.5%</li>
          <li>• Non-custodial and secure</li>
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
