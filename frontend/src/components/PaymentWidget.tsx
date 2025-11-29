'use client';

import { useState } from 'react';

interface PaymentWidgetProps {
  amount?: number;
  currency?: string;
  merchantId?: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  theme?: 'light' | 'dark';
  primaryColor?: string;
}

/**
 * Embeddable Payment Widget
 * Can be embedded on external websites via iframe or script tag
 *
 * Usage (iframe):
 * <iframe src="https://advancia.app/embed/payment?amount=100&currency=USD" />
 *
 * Usage (script):
 * <script src="https://advancia.app/widget.js"></script>
 * <div id="advancia-payment" data-amount="100" data-currency="USD"></div>
 */
export default function PaymentWidget({
  amount = 0,
  currency = 'USD',
  merchantId,
  onSuccess,
  onError,
  theme = 'dark',
  primaryColor = '#8B5CF6',
}: PaymentWidgetProps) {
  const [step, setStep] = useState<'amount' | 'method' | 'processing' | 'success' | 'error'>(
    'amount'
  );
  const [inputAmount, setInputAmount] = useState(amount.toString());
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'crypto' | 'bank'>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const isDark = theme === 'dark';

  const paymentMethods = [
    { id: 'card', name: 'Credit Card', icon: '💳', description: 'Visa, Mastercard, Amex' },
    { id: 'crypto', name: 'Cryptocurrency', icon: '₿', description: 'BTC, ETH, USDT' },
    { id: 'bank', name: 'Bank Transfer', icon: '🏦', description: 'Wire transfer' },
  ];

  const handleSubmit = async () => {
    setIsLoading(true);
    setStep('processing');
    setError(null);

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(inputAmount),
          currency,
          method: selectedMethod,
          merchantId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      setPaymentId(data.paymentId);
      setStep('success');
      onSuccess?.(data.paymentId);
    } catch (err: any) {
      setError(err.message);
      setStep('error');
      onError?.(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const containerClass = isDark
    ? 'bg-slate-900 text-white border-slate-700'
    : 'bg-white text-gray-900 border-gray-200';

  const inputClass = isDark
    ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-400'
    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500';

  return (
    <div className={`w-full max-w-md mx-auto rounded-2xl border ${containerClass} p-6 shadow-xl`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: primaryColor }}
          >
            A
          </div>
          <span className="font-semibold">Advancia Pay</span>
        </div>
        <div className="text-sm opacity-60">Secure Payment</div>
      </div>

      {/* Amount Step */}
      {step === 'amount' && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium mb-2 block">Amount</span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium">
                {currency === 'USD' ? '$' : currency}
              </span>
              <input
                type="number"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-lg font-semibold ${inputClass}`}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </label>

          <button
            onClick={() => setStep('method')}
            disabled={!inputAmount || parseFloat(inputAmount) <= 0}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: primaryColor }}
          >
            Continue
          </button>
        </div>
      )}

      {/* Payment Method Step */}
      {step === 'method' && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <span className="text-2xl font-bold">
              {currency === 'USD' ? '$' : currency}
              {parseFloat(inputAmount).toFixed(2)}
            </span>
          </div>

          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id as any)}
                className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 ${
                  selectedMethod === method.id
                    ? `border-2`
                    : isDark
                      ? 'border-slate-700 hover:border-slate-600'
                      : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  borderColor: selectedMethod === method.id ? primaryColor : undefined,
                }}
              >
                <span className="text-2xl">{method.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{method.name}</div>
                  <div className="text-sm opacity-60">{method.description}</div>
                </div>
                {selectedMethod === method.id && (
                  <div
                    className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={() => setStep('amount')}
              className={`flex-1 py-3 rounded-xl font-medium border ${
                isDark ? 'border-slate-600' : 'border-gray-300'
              }`}
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-xl font-semibold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Pay Now
            </button>
          </div>
        </div>
      )}

      {/* Processing Step */}
      {step === 'processing' && (
        <div className="text-center py-8">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 animate-pulse"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <div
              className="w-full h-full rounded-full animate-spin border-4 border-t-transparent"
              style={{ borderColor: `${primaryColor}40`, borderTopColor: 'transparent' }}
            />
          </div>
          <h3 className="text-xl font-semibold mb-2">Processing Payment</h3>
          <p className="opacity-60">Please wait...</p>
        </div>
      )}

      {/* Success Step */}
      {step === 'success' && (
        <div className="text-center py-8">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl"
            style={{ backgroundColor: '#10B981' }}
          >
            ✓
          </div>
          <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
          <p className="opacity-60 mb-4">Transaction ID: {paymentId}</p>
          <button
            onClick={() => {
              setStep('amount');
              setInputAmount('');
            }}
            className="py-2 px-6 rounded-xl font-medium border"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            Make Another Payment
          </button>
        </div>
      )}

      {/* Error Step */}
      {step === 'error' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl bg-red-500">
            ✕
          </div>
          <h3 className="text-xl font-semibold mb-2">Payment Failed</h3>
          <p className="opacity-60 mb-4">{error}</p>
          <button
            onClick={() => setStep('method')}
            className="py-2 px-6 rounded-xl font-semibold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-current/10 flex items-center justify-center gap-2 text-xs opacity-40">
        <span>🔒 Secured by Advancia</span>
        <span>•</span>
        <span>PCI DSS Compliant</span>
      </div>
    </div>
  );
}

/**
 * Widget embed script for external sites
 * Add this to public/widget.js
 */
export const widgetEmbedScript = `
(function() {
  var containers = document.querySelectorAll('[data-advancia-payment]');
  containers.forEach(function(container) {
    var iframe = document.createElement('iframe');
    var amount = container.dataset.amount || '';
    var currency = container.dataset.currency || 'USD';
    var theme = container.dataset.theme || 'dark';
    var merchantId = container.dataset.merchantId || '';

    iframe.src = 'https://advancia.app/embed/payment?' +
      'amount=' + amount +
      '&currency=' + currency +
      '&theme=' + theme +
      '&merchantId=' + merchantId;
    iframe.style.width = '100%';
    iframe.style.maxWidth = '400px';
    iframe.style.height = '500px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '16px';
    iframe.allow = 'payment';

    container.appendChild(iframe);
  });
})();
`;
