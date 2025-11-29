'use client';

import PaymentWidget from '@/components/PaymentWidget';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PaymentWidgetContent() {
  const searchParams = useSearchParams();

  const amount = parseFloat(searchParams?.get('amount') || '0');
  const currency = searchParams?.get('currency') || 'USD';
  const theme = (searchParams?.get('theme') || 'dark') as 'light' | 'dark';
  const merchantId = searchParams?.get('merchantId') || undefined;
  const color = searchParams?.get('color') || '#8B5CF6';
  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${
        theme === 'dark' ? 'bg-slate-900' : 'bg-gray-100'
      }`}
    >
      <PaymentWidget
        amount={amount}
        currency={currency}
        theme={theme}
        merchantId={merchantId}
        primaryColor={color}
        onSuccess={(paymentId) => {
          // Post message to parent window for iframe embedding
          if (window.parent !== window) {
            window.parent.postMessage({ type: 'advancia:payment:success', paymentId }, '*');
          }
        }}
        onError={(error) => {
          if (window.parent !== window) {
            window.parent.postMessage({ type: 'advancia:payment:error', error }, '*');
          }
        }}
      />
    </div>
  );
}

export default function EmbedPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <PaymentWidgetContent />
    </Suspense>
  );
}
