'use client';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRightLeft,
  Bitcoin,
  Check,
  CreditCard,
  Globe,
  Lock,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type PaymentProvider = 'stripe' | 'cryptomus' | 'nowpayments' | 'alchemypay';

export default function CheckoutPage() {
  const [amount, setAmount] = useState<number>(100);
  const [selectedMethod, setSelectedMethod] = useState<PaymentProvider>('stripe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const quickAmounts = [50, 100, 250, 500, 1000, 2500];

  const handleCheckout = async () => {
    if (!token) {
      setError('Please log in to continue');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Determine the API endpoint based on provider
      let endpoint = '/api/payments/checkout-session';
      let body: Record<string, unknown> = { amount, provider: selectedMethod };

      switch (selectedMethod) {
        case 'stripe':
          endpoint = '/api/payments/checkout-session';
          body = { amount, provider: 'stripe' };
          break;
        case 'cryptomus':
          endpoint = '/api/cryptomus/create-invoice';
          body = { amount, currency: 'USD' };
          break;
        case 'nowpayments':
          endpoint = '/api/nowpayments/create-invoice';
          body = { amount, currency: 'usd', payCurrency: 'btc' };
          break;
        case 'alchemypay':
          endpoint = '/api/alchemypay/create-payment';
          body = { amount, cryptoCurrency: 'USDT', fiatCurrency: 'USD' };
          break;
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || 'Checkout failed');
      }

      const data = await res.json();

      // Handle different response formats
      const redirectUrl = data.redirectUrl || data.paymentUrl || data.url || data.invoice_url;

      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else if (data.address) {
        // For crypto payments that return an address instead of URL
        // Redirect to a payment status page
        window.location.href = `/payments/crypto-pending?orderId=${data.orderId || data.id}&address=${data.address}&amount=${data.amount}`;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: 'stripe' as PaymentProvider,
      name: 'Credit / Debit Card',
      icon: <CreditCard className="w-6 h-6" />,
      description: 'Visa, Mastercard, Amex, Apple Pay',
      logos: ['💳', '🍎'],
      badge: 'Most Popular',
      badgeColor: 'bg-blue-500',
    },
    {
      id: 'cryptomus' as PaymentProvider,
      name: 'Cryptomus',
      icon: <Bitcoin className="w-6 h-6" />,
      description: 'BTC, ETH, USDT, LTC + more',
      logos: ['₿', 'Ξ', '₮'],
      badge: 'Low Fees',
      badgeColor: 'bg-green-500',
    },
    {
      id: 'nowpayments' as PaymentProvider,
      name: 'NOWPayments',
      icon: <Globe className="w-6 h-6" />,
      description: '200+ cryptocurrencies supported',
      logos: ['🌐', '₿', '🪙'],
      badge: '200+ Coins',
      badgeColor: 'bg-purple-500',
    },
    {
      id: 'alchemypay' as PaymentProvider,
      name: 'Alchemy Pay',
      icon: <ArrowRightLeft className="w-6 h-6" />,
      description: 'Fiat ↔ Crypto On/Off Ramp',
      logos: ['💵', '↔️', '₿'],
      badge: 'Fiat Ramp',
      badgeColor: 'bg-amber-500',
    },
  ];

  const bonus = Math.floor(amount * 0.15);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-purple-300 hover:text-purple-100 transition mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Secured Checkout</h1>
          <p className="text-purple-200">
            Add funds to your account with military-grade encryption
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Checkout Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Amount Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Select Amount</h2>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt)}
                    className={`py-3 px-4 rounded-lg font-semibold transition ${
                      amount === amt
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl px-12 py-4 text-2xl font-bold text-white focus:outline-none focus:border-purple-500"
                  placeholder="Enter amount"
                />
              </div>

              {/* Bonus Display */}
              {bonus > 0 && (
                <div className="mt-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-400 font-semibold">🎉 15% Bonus Applied!</p>
                      <p className="text-slate-300 text-sm">
                        You'll receive ${amount + bonus} total
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-green-400">+${bonus}</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Payment Method Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Choose Payment Method</h2>

              <div className="grid sm:grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`relative p-4 rounded-xl border-2 transition ${
                      selectedMethod === method.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-slate-700 bg-slate-900/30 hover:border-slate-600'
                    }`}
                  >
                    {/* Badge */}
                    {method.badge && (
                      <span
                        className={`absolute -top-2 -right-2 ${method.badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full`}
                      >
                        {method.badge}
                      </span>
                    )}
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-3 rounded-lg ${
                          selectedMethod === method.id
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {method.icon}
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-semibold text-white">{method.name}</h3>
                        <p className="text-xs text-slate-400">{method.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-1 text-lg mt-2">
                      {method.logos.map((logo, idx) => (
                        <span key={idx} className="opacity-70">
                          {logo}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
              >
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Checkout Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={handleCheckout}
              disabled={loading || amount < 10}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                `Complete Purchase - $${amount}`
              )}
            </motion.button>

            {/* Security Badges */}
            <div className="flex items-center justify-center space-x-6 text-slate-400 text-sm">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Encrypted & Secure</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>PCI Compliant</span>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 sticky top-6"
            >
              <h2 className="text-xl font-semibold text-white mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-slate-700">
                <div className="flex justify-between text-slate-300">
                  <span>Deposit Amount</span>
                  <span className="font-semibold">${amount.toFixed(2)}</span>
                </div>
                {bonus > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>15% Bonus</span>
                    <span className="font-semibold">+${bonus.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span>Processing Fee</span>
                  <span className="font-semibold">$0.00</span>
                </div>
              </div>

              <div className="flex justify-between text-xl font-bold text-white mb-6">
                <span>Total Credit</span>
                <span className="text-green-400">${(amount + bonus).toFixed(2)}</span>
              </div>

              {/* Benefits */}
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-white text-sm mb-3">All plans include:</h3>
                {[
                  '30-day money-back guarantee',
                  'Instant account credit',
                  'No hidden fees',
                  '24/7 customer support',
                  'Bank-level encryption',
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-slate-300 text-sm">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-slate-700">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {['🔒', '✓', '💳'].map((emoji, idx) => (
                    <div key={idx} className="bg-slate-900/50 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">{emoji}</div>
                      <div className="text-xs text-slate-400">
                        {['Secure', 'Verified', 'Trusted'][idx]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trustpilot Widget */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                  </div>
                  <p className="text-slate-400 text-sm mb-2">Excellent • 4.8 out of 5</p>
                  <p className="text-slate-500 text-xs">Based on 10,000+ reviews on Trustpilot</p>
                </div>
              </div>

              {/* Money-back Guarantee Badge */}
              <div className="mt-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 text-center">
                <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <h4 className="font-semibold text-white mb-1">30-Day Money-Back Guarantee</h4>
                <p className="text-xs text-slate-300">Full refund if you're not satisfied</p>
              </div>

              {/* Terms */}
              <p className="text-xs text-slate-500 mt-6 text-center">
                By completing this purchase, you agree to our{' '}
                <Link href="/terms" className="text-purple-400 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-purple-400 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
