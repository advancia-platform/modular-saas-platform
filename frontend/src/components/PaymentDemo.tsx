'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import NOWPaymentsWidget from './NOWPaymentsWidget';
import PaymentButton from './PaymentButton';

export default function PaymentDemo() {
  const [amount, setAmount] = useState(100);
  const [currency, setCurrency] = useState('USD');
  const [orderId] = useState(`demo_${Date.now()}`);
  const [activeTab, setActiveTab] = useState<'simple' | 'advanced'>('simple');

  const handlePaymentSuccess = (data: any) => {
    toast.success('Payment initiated successfully!');
    console.log('Payment data:', data);
  };

  const handlePaymentError = (error: string) => {
    toast.error(`Payment failed: ${error}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🌟 NOWPayments Integration Demo
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Experience seamless cryptocurrency payments with 150+ supported currencies,
          instant settlements, and enterprise-grade security.
        </p>
      </div>

      {/* Payment Amount Configuration */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Configure Payment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="1"
              max="10000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order ID
            </label>
            <input
              type="text"
              value={orderId}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('simple')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'simple'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Simple Payment Buttons
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'advanced'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Advanced NOWPayments Widget
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'simple' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Quick Payment Options
            </h3>
            <p className="text-gray-600 mb-6">
              Choose from multiple payment providers including our featured NOWPayments integration.
            </p>
            <PaymentButton
              orderId={orderId}
              amount={amount}
              currency={currency}
              description={`Demo payment of ${amount} ${currency}`}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>

          {/* Features Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
              <div className="text-blue-600 text-3xl mb-3">💳</div>
              <h4 className="font-semibold text-gray-800 mb-2">Stripe Payments</h4>
              <p className="text-sm text-gray-600">
                Traditional card payments with industry-leading security and global reach.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg">
              <div className="text-orange-600 text-3xl mb-3">₿</div>
              <h4 className="font-semibold text-gray-800 mb-2">Cryptomus</h4>
              <p className="text-sm text-gray-600">
                Custodial crypto payments with BTC, ETH, and USDT support.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-lg">
              <div className="text-purple-600 text-3xl mb-3">🌟</div>
              <h4 className="font-semibold text-gray-800 mb-2">NOWPayments</h4>
              <p className="text-sm text-gray-600">
                150+ cryptocurrencies, instant settlements, and the lowest fees in the industry.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'advanced' && (
        <div className="space-y-6">
          <NOWPaymentsWidget
            orderId={orderId}
            amount={amount}
            currency={currency}
            description={`Demo payment of ${amount} ${currency} via NOWPayments`}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            className="max-w-2xl mx-auto"
          />

          {/* NOWPayments Advantages */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              Why Choose NOWPayments?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 text-xl">⚡</span>
                </div>
                <h4 className="font-semibold text-gray-800">Instant Settlements</h4>
                <p className="text-sm text-gray-600 mt-2">
                  Receive payments instantly with automatic currency conversion.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 text-xl">💰</span>
                </div>
                <h4 className="font-semibold text-gray-800">Low Fees</h4>
                <p className="text-sm text-gray-600 mt-2">
                  Industry-leading low fees starting from just 0.5%.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 text-xl">🔐</span>
                </div>
                <h4 className="font-semibold text-gray-800">Enterprise Security</h4>
                <p className="text-sm text-gray-600 mt-2">
                  Military-grade encryption and non-custodial architecture.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-pink-600 text-xl">🌍</span>
                </div>
                <h4 className="font-semibold text-gray-800">Global Reach</h4>
                <p className="text-sm text-gray-600 mt-2">
                  150+ cryptocurrencies supporting worldwide transactions.
                </p>
              </div>
            </div>
          </div>

          {/* Technical Integration Info */}
          <div className="bg-gray-50 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Technical Integration Details
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span><strong>API Endpoint:</strong> /api/nowpayments/*</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span><strong>Webhook Support:</strong> Real-time payment status updates</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span><strong>Signature Verification:</strong> HMAC-SHA512 webhook validation</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                <span><strong>Database Integration:</strong> Full audit trail and transaction logging</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 border-t pt-6">
        <p>
          This is a demonstration of the NOWPayments integration.
          In production, ensure all environment variables are properly configured.
        </p>
      </div>
    </div>
  );
}
