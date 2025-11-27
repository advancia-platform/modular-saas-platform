# NOWPayments Usage Examples

This page demonstrates how to integrate NOWPayments into your frontend application.

## Quick Start

Import and use the NOWPayments components in your React application:

```tsx
import { NOWPaymentsWidget, PaymentButton, PaymentDemo } from '@/components';

// Simple usage with payment button
<PaymentButton
  orderId="order_123"
  amount={100}
  currency="USD"
  description="Premium subscription"
  onSuccess={(data) => console.log('Payment successful:', data)}
  onError={(error) => console.error('Payment failed:', error)}
/>

// Advanced widget with full cryptocurrency selection
<NOWPaymentsWidget
  amount={250}
  currency="EUR"
  orderId="premium_order_456"
  description="Premium plan upgrade"
  onSuccess={handlePaymentSuccess}
  onError={handlePaymentError}
  className="max-w-lg mx-auto"
/>
```

## Component Examples

### 1. Basic Payment Button

The enhanced PaymentButton component now includes NOWPayments alongside Stripe and Cryptomus:

```tsx
import PaymentButton from '@/components/PaymentButton';

function CheckoutPage() {
  const handleSuccess = () => {
    // Redirect to success page or update UI
    router.push('/payment-success');
  };

  const handleError = (error: string) => {
    toast.error(`Payment failed: ${error}`);
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Choose Payment Method</h2>
      <PaymentButton
        orderId={`order_${userId}_${Date.now()}`}
        amount={99.99}
        currency="USD"
        description="Premium subscription - 1 year"
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
}
```

### 2. Advanced NOWPayments Widget

For more control over the crypto payment experience:

```tsx
import NOWPaymentsWidget from '@/components/NOWPaymentsWidget';

function CryptoCheckout() {
  const [paymentData, setPaymentData] = useState(null);
  
  const handlePaymentSuccess = (data: any) => {
    setPaymentData(data);
    // Store payment info and redirect
    localStorage.setItem('paymentInvoiceId', data.invoice_id);
    window.open(data.invoice_url, '_blank');
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    toast.error('Payment initialization failed. Please try again.');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        Cryptocurrency Payment
      </h1>
      
      <NOWPaymentsWidget
        amount={199.99}
        currency="USD"
        orderId={`crypto_order_${Date.now()}`}
        description="Annual Pro Plan - Crypto Payment"
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />

      {paymentData && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800">Payment Initiated!</h3>
          <p className="text-green-700">
            Invoice ID: {paymentData.invoice_id}
          </p>
          <p className="text-sm text-green-600">
            Complete your payment in the opened tab.
          </p>
        </div>
      )}
    </div>
  );
}
```

### 3. Full Payment Demo

Use the comprehensive demo page to showcase all payment options:

```tsx
import PaymentDemo from '@/components/PaymentDemo';

function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <PaymentDemo />
      </div>
    </div>
  );
}
```

## API Integration Examples

### Direct API Calls

If you prefer to use the API directly without the React components:

```typescript
// Get supported cryptocurrencies
async function getSupportedCurrencies() {
  const response = await fetch('/api/nowpayments/currencies', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  return data.currencies;
}

// Get payment estimate
async function getPaymentEstimate(amount: number, fromCurrency: string, toCurrency: string) {
  const response = await fetch('/api/nowpayments/estimate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      currency_from: fromCurrency,
      currency_to: toCurrency,
      amount_from: amount,
    }),
  });
  
  const data = await response.json();
  return data.estimate;
}

// Create payment invoice
async function createPaymentInvoice(paymentDetails: {
  price_amount: number;
  price_currency: string;
  pay_currency: string;
  order_id: string;
  order_description?: string;
}) {
  const response = await fetch('/api/nowpayments/create-invoice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(paymentDetails),
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Redirect user to payment page
    window.open(data.invoice_url, '_blank');
    return data;
  } else {
    throw new Error(data.error || 'Payment creation failed');
  }
}
```

### Custom Hooks

Create reusable hooks for NOWPayments functionality:

```typescript
// hooks/useNOWPayments.ts
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export function useNOWPayments() {
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState<string[]>([]);

  const fetchCurrencies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/nowpayments/currencies');
      const data = await response.json();
      
      if (data.success) {
        setCurrencies(data.currencies);
      } else {
        toast.error('Failed to load cryptocurrencies');
      }
    } catch (error) {
      toast.error('Network error loading cryptocurrencies');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPayment = useCallback(async (paymentData: any) => {
    try {
      setLoading(true);
      const response = await fetch('/api/nowpayments/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    currencies,
    fetchCurrencies,
    createPayment,
  };
}

// Usage in component
function PaymentForm() {
  const { loading, currencies, fetchCurrencies, createPayment } = useNOWPayments();
  
  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  const handleSubmit = async (formData: any) => {
    try {
      const paymentData = await createPayment(formData);
      window.open(paymentData.invoice_url, '_blank');
    } catch (error) {
      // Error already handled in hook
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## Payment Status Monitoring

Monitor payment status updates using Socket.IO:

```typescript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function PaymentMonitor({ invoiceId, userId }: { invoiceId: string; userId: string }) {
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000');
    
    // Join user-specific room
    socket.emit('join-room', `user-${userId}`);

    // Listen for payment updates
    socket.on('nowpayments-update', (data) => {
      if (data.invoice_id === invoiceId) {
        setPaymentStatus(data.payment_status);
        
        if (data.payment_status === 'finished') {
          toast.success('Payment completed successfully!');
          // Redirect or update UI
        } else if (data.payment_status === 'failed') {
          toast.error('Payment failed. Please try again.');
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [invoiceId, userId]);

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold">Payment Status</h3>
      <p className="text-sm text-gray-600">Invoice: {invoiceId}</p>
      <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${
        paymentStatus === 'finished' ? 'bg-green-100 text-green-800' :
        paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
      </div>
    </div>
  );
}
```

## Styling Customization

Customize the appearance of NOWPayments components:

```tsx
// Custom styled wrapper
function CustomNOWPaymentsWidget(props: any) {
  return (
    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8 rounded-2xl shadow-2xl">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl">
        <NOWPaymentsWidget
          {...props}
          className="bg-transparent border-0"
        />
      </div>
    </div>
  );
}

// Dark mode support
function ThemedPaymentButton(props: any) {
  const { isDark } = useTheme();
  
  return (
    <div className={isDark ? 'dark' : ''}>
      <PaymentButton
        {...props}
        className={`${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
      />
    </div>
  );
}
```

## Error Handling

Implement comprehensive error handling:

```typescript
function PaymentErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('nowpayments')) {
        setHasError(true);
        setError(event.error.message);
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800">Payment Error</h3>
        <p className="text-red-700 mt-2">{error}</p>
        <button
          onClick={() => {
            setHasError(false);
            setError(null);
          }}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

// Usage
<PaymentErrorBoundary>
  <NOWPaymentsWidget {...paymentProps} />
</PaymentErrorBoundary>
```

## Production Considerations

### Environment Variables

Ensure these environment variables are set:

```bash
# Frontend (.env.local)
NEXT_PUBLIC_BACKEND_URL=https://your-api-domain.com

# Backend (.env)
NOWPAYMENTS_API_KEY=your_production_api_key
NOWPAYMENTS_IPN_SECRET=your_webhook_secret
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-api-domain.com
```

### Security

- Always validate webhook signatures
- Use HTTPS for all webhook endpoints
- Implement rate limiting on payment endpoints
- Log all payment activities for audit purposes

### Performance

- Cache cryptocurrency lists
- Implement request debouncing for estimates
- Use loading states for better UX
- Optimize bundle size by code splitting

---

For more examples and advanced usage, see the [NOWPayments Integration Guide](../docs/NOWPAYMENTS_INTEGRATION.md).
