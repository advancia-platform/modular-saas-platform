'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface Currency {
  symbol: string;
  name: string;
  min_amount?: number;
}

interface NOWPaymentsWidgetProps {
  orderId?: string;
  amount: number;
  currency?: string;
  description?: string;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function NOWPaymentsWidget({
  orderId = `order_${Date.now()}`,
  amount,
  currency = 'USD',
  description = 'Payment via NOWPayments',
  onSuccess,
  onError,
  className = '',
}: NOWPaymentsWidgetProps) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('btc');
  const [loading, setLoading] = useState(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [estimatedAmount, setEstimatedAmount] = useState<number | null>(null);
  const [minAmount, setMinAmount] = useState<number | null>(null);

  // Popular cryptocurrencies for quick selection
  const popularCryptos = [
    { symbol: 'btc', name: 'Bitcoin', icon: '₿' },
    { symbol: 'eth', name: 'Ethereum', icon: 'Ξ' },
    { symbol: 'usdt', name: 'Tether USD', icon: '₮' },
    { symbol: 'usdc', name: 'USD Coin', icon: '💵' },
    { symbol: 'bnb', name: 'Binance Coin', icon: '🟡' },
    { symbol: 'ada', name: 'Cardano', icon: '🔵' },
    { symbol: 'dot', name: 'Polkadot', icon: '🔴' },
    { symbol: 'ltc', name: 'Litecoin', icon: 'Ł' },
  ];

  // Fetch available currencies on mount
  useEffect(() => {
    fetchCurrencies();
  }, []);

  // Fetch estimated amount when currency changes
  useEffect(() => {
    if (selectedCurrency) {
      fetchEstimate();
      fetchMinAmount();
    }
  }, [selectedCurrency, amount, currency]);

  async function fetchCurrencies() {
    try {
      const response = await fetch('/api/nowpayments/currencies');
      const data = await response.json();

      if (data.success && data.currencies) {
        const currencyList = data.currencies.map((symbol: string) => ({
          symbol: symbol.toLowerCase(),
          name: symbol.toUpperCase(),
        }));
        setCurrencies(currencyList);
      }
    } catch (error) {
      console.error('Failed to fetch currencies:', error);
      toast.error('Failed to load payment currencies');
    } finally {
      setLoadingCurrencies(false);
    }
  }

  async function fetchEstimate() {
    try {
      const response = await fetch(`/api/nowpayments/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency_from: currency.toLowerCase(),
          currency_to: selectedCurrency,
          amount_from: amount,
        }),
      });

      const data = await response.json();
      if (data.success && data.estimated_amount) {
        setEstimatedAmount(data.estimated_amount);
      }
    } catch (error) {
      console.error('Failed to fetch estimate:', error);
    }
  }

  async function fetchMinAmount() {
    try {
      const response = await fetch(`/api/nowpayments/min-amount/${selectedCurrency}`);
      const data = await response.json();

      if (data.success && data.min_amount) {
        setMinAmount(parseFloat(data.min_amount));
      }
    } catch (error) {
      console.error('Failed to fetch minimum amount:', error);
    }
  }

  async function createPayment() {
    setLoading(true);

    try {
      const response = await fetch('/api/nowpayments/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_amount: amount,
          price_currency: currency,
          pay_currency: selectedCurrency,
          order_id: orderId,
          order_description: description,
        }),
      });

      const data = await response.json();

      if (data.success && data.invoice_url) {
        // Redirect to NOWPayments checkout page
        window.open(data.invoice_url, '_blank');
        toast.success('Payment page opened in new tab');
        onSuccess?.(data);
      } else {
        const errorMsg = data.error || 'Failed to create payment';
        toast.error(errorMsg);
        onError?.(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Payment failed';
      toast.error(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  if (loadingCurrencies) {
    return (
      <div className={`p-6 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading payment options...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
          <span className="text-white text-lg font-bold">🌟</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">NOWPayments</h3>
          <p className="text-sm text-gray-600">150+ cryptocurrencies supported</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Popular Cryptocurrencies */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Popular Cryptocurrencies
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {popularCryptos.map((crypto) => (
              <button
                key={crypto.symbol}
                onClick={() => setSelectedCurrency(crypto.symbol)}
                className={`p-3 text-sm rounded-lg border transition-all ${
                  selectedCurrency === crypto.symbol
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="text-lg mb-1">{crypto.icon}</div>
                <div className="font-medium">{crypto.symbol.toUpperCase()}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Currency Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or choose from {currencies.length}+ cryptocurrencies
          </label>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Select cryptocurrency</option>
            {currencies.map((curr) => (
              <option key={curr.symbol} value={curr.symbol}>
                {curr.name} ({curr.symbol.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Payment Details */}
        {selectedCurrency && (
          <div className="bg-white p-4 rounded-lg border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">You pay:</span>
                <div className="font-bold text-lg">
                  {amount} {currency.toUpperCase()}
                </div>
              </div>
              <div>
                <span className="text-gray-600">You receive:</span>
                <div className="font-bold text-lg">
                  {estimatedAmount ? (
                    `~${estimatedAmount} ${selectedCurrency.toUpperCase()}`
                  ) : (
                    <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
                  )}
                </div>
              </div>
            </div>

            {minAmount && (
              <div className="mt-3 text-xs text-gray-500">
                Minimum amount: {minAmount} {selectedCurrency.toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Payment Button */}
        <button
          onClick={createPayment}
          disabled={loading || !selectedCurrency || !estimatedAmount}
          className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-lg transition-all"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating Payment...
            </>
          ) : (
            <>
              <span>🚀</span>
              Pay with {selectedCurrency ? selectedCurrency.toUpperCase() : 'Crypto'}
            </>
          )}
        </button>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-600 mt-4">
          <div>
            <div className="text-green-600 font-semibold">✓ Instant</div>
            <div>Settlement</div>
          </div>
          <div>
            <div className="text-blue-600 font-semibold">✓ Low Fees</div>
            <div>0.5% - 1%</div>
          </div>
          <div>
            <div className="text-purple-600 font-semibold">✓ Secure</div>
            <div>Non-custodial</div>
          </div>
        </div>
      </div>
    </div>
  );
}
