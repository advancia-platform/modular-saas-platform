# 🌟 NOWPayments Integration Guide

## Overview

This guide provides comprehensive instructions for setting up and using the NOWPayments integration in Advancia Pay Ledger. NOWPayments enables accepting 150+ cryptocurrencies with instant settlements and enterprise-grade security.

## 🚀 Features

- **150+ Cryptocurrencies**: Bitcoin, Ethereum, Tether, Binance Coin, Cardano, Polkadot, Litecoin, and more
- **Instant Settlements**: Real-time payment processing with automatic currency conversion
- **Low Fees**: Industry-leading rates starting from 0.5% with transparent pricing
- **Enterprise Security**: HMAC-SHA512 webhook verification, non-custodial architecture
- **Global Reach**: Worldwide cryptocurrency acceptance with regulatory compliance
- **Real-time Updates**: Socket.IO integration for live payment status updates

## 🔧 Installation & Configuration

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# NOWPayments API Configuration (Required)
NOWPAYMENTS_API_KEY=your_api_key_here
NOWPAYMENTS_IPN_SECRET=your_webhook_secret

# Optional: Enable sandbox mode for testing
NODE_ENV=development  # Enables NOWPayments sandbox
```

### 2. Database Schema

NOWPayments transactions are logged in the existing transaction tables. No additional schema changes required.

### 3. Backend Setup

The NOWPayments routes are automatically registered when the environment variables are present:

```typescript
// backend/src/index.ts
app.use("/api/nowpayments", nowpaymentsRouter); // Auto-enabled
```

## 📊 API Endpoints

### Get Supported Currencies

```http
GET /api/nowpayments/currencies
```

**Response:**

```json
{
  "success": true,
  "currencies": ["btc", "eth", "usdt", "bnb", "ada", ...]
}
```

### Get Minimum Payment Amount

```http
GET /api/nowpayments/min-amount/:currency
```

**Response:**

```json
{
  "success": true,
  "min_amount": "0.001",
  "currency": "btc"
}
```

### Get Payment Estimate

```http
POST /api/nowpayments/estimate
Content-Type: application/json

{
  "currency_from": "usd",
  "currency_to": "btc",
  "amount_from": 100
}
```

**Response:**

```json
{
  "success": true,
  "currency_from": "usd",
  "amount_from": 100,
  "currency_to": "btc",
  "estimated_amount": 0.0023456
}
```

### Create Payment Invoice

```http
POST /api/nowpayments/create-invoice
Content-Type: application/json

{
  "price_amount": 100,
  "price_currency": "usd",
  "pay_currency": "btc",
  "order_id": "order_123",
  "order_description": "Payment for services"
}
```

**Response:**

```json
{
  "success": true,
  "invoice_id": "5731217031",
  "invoice_url": "https://nowpayments.io/payment/?iid=5731217031",
  "order_id": "order_123",
  "pay_amount": 0.0023456,
  "pay_currency": "btc"
}
```

### Payment Status Webhook

```http
POST /api/nowpayments/webhook
Content-Type: application/json
nowpayments-sig-hmacsha512: <signature>

{
  "payment_id": "5577342885",
  "invoice_id": "5731217031",
  "payment_status": "finished",
  "pay_address": "3N2AyYHqAPMRZEwmqRgdeadJ8KPrTjJxJw",
  "price_amount": 100,
  "price_currency": "usd",
  "pay_amount": 0.0023456,
  "pay_currency": "btc",
  "order_id": "order_123",
  "outcome_amount": 99.5,
  "outcome_currency": "usd"
}
```

## 💻 Frontend Components

### NOWPaymentsWidget Component

The main payment widget with cryptocurrency selection:

```tsx
import NOWPaymentsWidget from '@/components/NOWPaymentsWidget';

<NOWPaymentsWidget
  amount={100}
  currency="USD"
  orderId="order_123"
  description="Payment for services"
  onSuccess={(data) => {
    console.log('Payment successful:', data);
    // Handle success (e.g., redirect to success page)
  }}
  onError={(error) => {
    console.error('Payment failed:', error);
    // Handle error (e.g., show error message)
  }}
  className="max-w-md"
/>
```

### Enhanced PaymentButton

The updated payment button includes NOWPayments:

```tsx
import PaymentButton from '@/components/PaymentButton';

<PaymentButton
  orderId="order_123"
  amount={100}
  currency="USD"
  description="Payment for services"
  onSuccess={() => console.log('Payment initiated')}
  onError={(error) => console.error('Payment error:', error)}
/>
```

### PaymentDemo Page

A comprehensive demo showcasing all payment options:

```tsx
import PaymentDemo from '@/components/PaymentDemo';

<PaymentDemo />
```

## 🔐 Security Features

### Webhook Signature Verification

All webhooks are verified using HMAC-SHA512:

```typescript
const signature = crypto
  .createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');

const providedSignature = req.headers['nowpayments-sig-hmacsha512'] as string;
const isValidSignature = signature === providedSignature;
```

### Environment Protection

- Sandbox mode automatically enabled in development
- API keys validated on startup
- Comprehensive error handling and logging

### Audit Trail

All payment transactions are logged with:

- Payment ID and invoice ID
- User information (if authenticated)
- Transaction amounts and currencies
- Payment status changes
- Webhook verification results

## 📱 Payment Flow

### 1. User Initiates Payment

```typescript
// Frontend component triggers payment creation
const response = await fetch('/api/nowpayments/create-invoice', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    price_amount: 100,
    price_currency: 'USD',
    pay_currency: 'btc',
    order_id: 'order_123'
  })
});
```

### 2. NOWPayments Invoice Creation

```typescript
// Backend creates invoice with NOWPayments
const invoice = await createInvoice({
  price_amount: 100,
  price_currency: 'USD',
  pay_currency: 'btc',
  order_id: 'order_123',
  ipn_callback_url: 'https://yourdomain.com/api/nowpayments/webhook'
});
```

### 3. User Pays on NOWPayments

- User redirected to NOWPayments checkout page
- Selects wallet and confirms payment
- Payment processed on blockchain

### 4. Webhook Notification

```typescript
// Backend receives payment status updates
app.post('/api/nowpayments/webhook', (req, res) => {
  // Verify signature
  // Update payment status in database
  // Emit Socket.IO event to frontend
  // Process order fulfillment
});
```

### 5. Order Completion

- Payment status updated in real-time via Socket.IO
- Order fulfillment triggered automatically
- User receives confirmation notification

## 🧪 Testing

### Sandbox Mode

NOWPayments automatically uses sandbox mode when `NODE_ENV !== "production"`:

```bash
# Enable sandbox mode
NODE_ENV=development

# Sandbox API endpoint
https://api-sandbox.nowpayments.io/v1
```

### Test API Keys

Use NOWPayments sandbox credentials for testing:

- API Key: Contact NOWPayments for sandbox credentials
- Webhook Secret: Generated in NOWPayments sandbox dashboard

### Integration Testing

```typescript
// Test currency fetching
const currencies = await fetch('/api/nowpayments/currencies');

// Test payment estimation
const estimate = await fetch('/api/nowpayments/estimate', {
  method: 'POST',
  body: JSON.stringify({
    currency_from: 'usd',
    currency_to: 'btc',
    amount_from: 100
  })
});

// Test invoice creation
const invoice = await fetch('/api/nowpayments/create-invoice', {
  method: 'POST',
  body: JSON.stringify({
    price_amount: 100,
    price_currency: 'usd',
    pay_currency: 'btc',
    order_id: 'test_123'
  })
});
```

## 🚨 Troubleshooting

### Common Issues

#### 1. API Key Not Found

```
Error: NOWPayments API key not configured
```

**Solution**: Add `NOWPAYMENTS_API_KEY` to your `.env` file.

#### 2. Webhook Signature Verification Failed

```
Error: Invalid webhook signature
```

**Solution**: Verify `NOWPAYMENTS_IPN_SECRET` matches your NOWPayments dashboard settings.

#### 3. Currency Not Supported

```
Error: Minimum amount not available for currency
```

**Solution**: Check currency code is correct and supported using `/api/nowpayments/currencies`.

#### 4. Sandbox Mode Issues

```
Error: Invalid API key for production
```

**Solution**: Ensure using correct API keys for environment (sandbox vs production).

### Debug Logging

Enable debug logging in development:

```typescript
// Only logs in development mode
function logDev(message: string, data?: any) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[NOWPayments] ${message}`, data || "");
  }
}
```

### Health Check

Verify NOWPayments integration status:

```bash
curl -X GET "http://localhost:4000/api/nowpayments/currencies" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🌍 Production Deployment

### Environment Configuration

```bash
# Production environment variables
NODE_ENV=production
NOWPAYMENTS_API_KEY=your_production_api_key
NOWPAYMENTS_IPN_SECRET=your_production_webhook_secret
```

### Webhook URL Configuration

Configure your webhook URL in the NOWPayments dashboard:

```
https://yourdomain.com/api/nowpayments/webhook
```

### SSL Certificate

Ensure your webhook endpoint has a valid SSL certificate as required by NOWPayments.

### Monitoring

Monitor payment transactions using:

- Application logs
- Sentry error tracking
- Custom Prometheus metrics
- Database audit logs

## 📈 Analytics & Monitoring

### Custom Metrics

NOWPayments integration includes Prometheus metrics:

```typescript
// Track payment operations
const nowpaymentsOpsCounter = new client.Counter({
  name: 'nowpayments_operations_total',
  help: 'Total NOWPayments operations',
  labelNames: ['operation', 'status', 'currency']
});

// Track payment amounts
const nowpaymentsAmountHistogram = new client.Histogram({
  name: 'nowpayments_payment_amount_usd',
  help: 'NOWPayments payment amounts in USD',
  buckets: [1, 10, 50, 100, 500, 1000, 5000]
});
```

### Database Queries

Query payment statistics:

```sql
-- Total NOWPayments volume
SELECT 
  COUNT(*) as payment_count,
  SUM(amount) as total_volume,
  currency
FROM transactions 
WHERE provider = 'nowpayments'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY currency;

-- Payment success rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM transactions
WHERE provider = 'nowpayments'
GROUP BY status;
```

## 📚 Additional Resources

- [NOWPayments Official Documentation](https://nowpayments.io/doc/)
- [NOWPayments API Reference](https://documenter.getpostman.com/view/7907941/S1a32n38)
- [Webhook Integration Guide](https://nowpayments.io/doc/webhooks)
- [Supported Cryptocurrencies List](https://nowpayments.io/supported-coins/)

---

For technical support or questions about the NOWPayments integration, please open an issue in the repository or contact the development team.
