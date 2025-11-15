# 🔄 Frontend Payment Integration Guide

This guide shows how to integrate the unified payment system into any feature that requires payment.

## 🎯 Quick Start

### 1. Import the PaymentButton Component

```tsx
import PaymentButton from "@/components/PaymentButton";
```

### 2. Use in Your Feature

```tsx
function MyFeature() {
  const orderId = `feature_${Date.now()}`;

  return (
    <div>
      <h2>Purchase Feature</h2>
      <p>Price: $29.99</p>

      <PaymentButton
        orderId={orderId}
        amount={29.99}
        currency="usd"
        description="Feature purchase"
      />
    </div>
  );
}
```

### 3. Handle Success/Failure Redirects

The system automatically redirects users to:

- **Success**: `/payments/success?orderId=...`
- **Cancel/Failure**: `/payments/cancel?orderId=...`

## 📋 Component API

### PaymentButton Props

```tsx
interface PaymentButtonProps {
  orderId: string; // Unique order identifier
  amount: number; // Payment amount
  currency: string; // 'usd', 'usdt', 'btc', 'eth', etc.
  description?: string; // Optional payment description
  onSuccess?: () => void; // Optional success callback
  onError?: (error: string) => void; // Optional error callback
}
```

## 🔄 Payment Flow

1. **User clicks payment button** → Component calls `/api/payments/create-session`
2. **Backend creates session** → Returns redirect URL for Stripe or Cryptomus
3. **User redirected** → Completes payment on provider's site
4. **Webhook processes payment** → Updates database, credits wallets
5. **User redirected back** → Success or cancel page

## 💡 Integration Examples

### Subscription Upgrade

```tsx
function SubscriptionUpgrade() {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleUpgrade = () => {
    if (!selectedPlan) return;

    const orderId = `sub_upgrade_${Date.now()}`;

    return (
      <PaymentButton
        orderId={orderId}
        amount={selectedPlan.price}
        currency="usd"
        description={`${selectedPlan.name} subscription`}
        onSuccess={() => {
          // Optional: Track conversion
          analytics.track("subscription_upgraded", { plan: selectedPlan.name });
        }}
      />
    );
  };

  return (
    <div>
      {/* Plan selection UI */}
      {handleUpgrade()}
    </div>
  );
}
```

### Token Purchase

```tsx
function TokenPurchase({ tokenAmount, price }) {
  const orderId = `token_purchase_${Date.now()}`;

  return (
    <div className="token-purchase-card">
      <h3>Buy {tokenAmount} ADVP Tokens</h3>
      <p>Price: ${price}</p>

      <PaymentButton
        orderId={orderId}
        amount={price}
        currency="usd"
        description={`${tokenAmount} ADVP tokens`}
      />
    </div>
  );
}
```

### Crypto Top-up

```tsx
function CryptoTopup({ amount, currency }) {
  const orderId = `crypto_topup_${Date.now()}`;

  return (
    <div className="crypto-topup">
      <h3>
        Add {amount} {currency.toUpperCase()}
      </h3>

      <PaymentButton
        orderId={orderId}
        amount={amount}
        currency={currency}
        description={`${currency.toUpperCase()} top-up`}
      />
    </div>
  );
}
```

### Service Purchase

```tsx
function ServicePurchase({ service }) {
  const orderId = `service_${service.id}_${Date.now()}`;

  return (
    <div className="service-purchase">
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      <p>Price: ${service.price}</p>

      <PaymentButton
        orderId={orderId}
        amount={service.price}
        currency="usd"
        description={service.name}
      />
    </div>
  );
}
```

## 🎨 Styling

The PaymentButton component includes:

- **Loading states** with spinners
- **Disabled states** during processing
- **Responsive design** for mobile/desktop
- **Provider-specific icons** (💳 for Stripe, ₿ for Crypto)

## 🔍 Payment Status Checking

For advanced use cases, you can manually check payment status:

```tsx
async function checkPaymentStatus(orderId: string) {
  const response = await fetch(`/api/payment-status?orderId=${orderId}`);
  const status = await response.json();

  return status; // { status: 'confirmed' | 'pending' | 'failed', ... }
}
```

## 🚨 Error Handling

The component handles errors automatically, but you can customize:

```tsx
<PaymentButton
  orderId={orderId}
  amount={29.99}
  currency="usd"
  onError={(error) => {
    // Custom error handling
    toast.error(`Payment failed: ${error}`);
    // Log to analytics
    analytics.track("payment_error", { error, orderId });
  }}
/>
```

## 📊 Analytics Integration

Track payment events:

```tsx
<PaymentButton
  orderId={orderId}
  amount={29.99}
  currency="usd"
  onSuccess={() => {
    analytics.track("payment_initiated", {
      orderId,
      amount: 29.99,
      currency: "usd",
      feature: "subscription_upgrade",
    });
  }}
/>
```

## 🔧 Backend Integration

The frontend automatically calls:

- **POST** `/api/payments/create-session`

With body:

```json
{
  "orderId": "order_12345",
  "amount": 29.99,
  "currency": "usd",
  "provider": "stripe"
}
```

Response:

```json
{
  "redirectUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_...",
  "orderId": "order_12345",
  "provider": "stripe",
  "amount": 29.99,
  "currency": "usd"
}
```

## ✅ Best Practices

1. **Generate unique orderIds** - Use timestamps or UUIDs
2. **Validate amounts** - Server-side validation required
3. **Handle all states** - Success, cancel, and error scenarios
4. **Test both providers** - Stripe and Cryptomus flows
5. **Monitor webhooks** - Ensure backend processing works
6. **User feedback** - Clear loading and success states

## 🎯 Ready-to-Use Features

Your app now supports payments for:

- ✅ Subscriptions
- ✅ Token purchases
- ✅ Crypto top-ups
- ✅ Service bookings
- ✅ Premium features
- ✅ Any monetization model

Just import `PaymentButton` and pass the required props!
