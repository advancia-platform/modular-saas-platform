# 🔄 Unified Payment Integration Strategy

This guide outlines how to integrate Stripe and Cryptomus payments consistently across all features in your application.

## 🎯 Overview

Every payment feature (subscriptions, purchases, credits, upgrades) should use a unified API that automatically routes to the appropriate payment provider based on user preference.

## 🛠️ Backend API Endpoints

### `POST /api/payments/create-session`

Creates a payment session for any provider.

**Request Body:**

```json
{
  "amount": 25.0,
  "currency": "usd",
  "provider": "stripe", // or "cryptomus"
  "orderId": "order_12345",
  "description": "Premium subscription"
}
```

**Response:**

```json
{
  "redirectUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_...",
  "orderId": "order_12345",
  "provider": "stripe",
  "amount": 25.0,
  "currency": "usd"
}
```

**Usage in Features:**

```javascript
// Any feature that needs payment
const response = await fetch("/api/payments/create-session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    amount: 25.0,
    currency: "usd",
    provider: user.selectedProvider || "stripe",
    orderId: `order_${Date.now()}`,
    description: "Feature purchase",
  }),
});

const { redirectUrl } = await response.json();
window.location.href = redirectUrl; // Redirect user to payment
```

## 🔄 Payment Flow

1. **User initiates payment** → Feature calls `/api/payments/create-session`
2. **Backend creates session** → Stripe checkout or Cryptomus invoice
3. **User redirected** → Completes payment on provider's site
4. **Webhook received** → Backend processes payment automatically
5. **User redirected back** → Success page with confirmation

## 📊 Transaction Service Layer

Clean, reusable functions for payment processing:

```javascript
import {
  recordTransaction,
  creditAdminWallet,
  creditUserCryptoWallet,
  creditUserUsdBalance,
  emitPaymentNotification,
} from "../services/transactionService.js";

// In webhook handlers
await recordTransaction({
  provider: "stripe",
  orderId: session.id,
  amount: 25.0,
  currency: "USD",
  userId: userId,
});

await creditAdminWallet(25.0, "USD");
await creditUserUsdBalance(userId, 25.0);
emitPaymentNotification(userId, {
  provider: "stripe",
  amount: 25.0,
  currency: "USD",
});
```

## 🎛️ Webhook Handlers

### Stripe Webhook (`/api/stripe/webhook`)

- Verifies signature
- Records transaction
- Credits admin wallet
- Credits user USD balance
- Emits real-time notification

### Cryptomus Webhook (`/api/cryptomus/webhook`)

- Verifies HMAC signature
- Updates crypto payment status
- Records transaction
- Credits admin wallet
- Credits user crypto wallet
- Emits real-time notification

## 📱 Frontend Integration

### Payment Status Polling

```javascript
// Poll for payment confirmation
const checkPaymentStatus = async (orderId) => {
  const response = await fetch(`/api/payment-status?orderId=${orderId}`);
  const status = await response.json();

  if (status.status === "confirmed") {
    // Payment successful - update UI
    showSuccessMessage();
  } else if (status.status === "failed") {
    // Payment failed - show error
    showErrorMessage();
  } else {
    // Still pending - poll again
    setTimeout(() => checkPaymentStatus(orderId), 2000);
  }
};
```

### Success/Cancel Pages

- **Success**: `/payments/success?orderId=...&session_id=...`
- **Cancel**: `/payments/cancel?orderId=...`

## 🧪 Testing

### Test Scripts

```bash
# Test individual providers
cd backend
node testStripeWebhook.js
node testCryptomusWebhook.js

# Test both providers together
node testUnifiedWebhook.js
```

### Manual Testing

1. Create payment session via API
2. Use test scripts to simulate webhooks
3. Check database for correct records
4. Verify real-time notifications

## 🔒 Security

- **Signature Verification**: All webhooks verify cryptographic signatures
- **Order ID Validation**: Prevents duplicate processing
- **User Authentication**: Payment creation requires auth
- **Amount Validation**: Server-side amount validation

## 📈 Benefits

- **Consistency**: All features use same payment flow
- **Flexibility**: Easy to add new payment providers
- **Maintainability**: Centralized payment logic
- **Reliability**: Comprehensive error handling and logging
- **User Experience**: Unified payment flow across features

## 🚀 Adding New Payment Features

1. **Choose provider**: Stripe for fiat, Cryptomus for crypto
2. **Call unified API**: `/api/payments/create-session`
3. **Handle redirects**: Success/cancel URLs
4. **Poll status**: Use existing payment status API
5. **Update UI**: Show confirmation on success

That's it! Your payment system now scales automatically with new features.
