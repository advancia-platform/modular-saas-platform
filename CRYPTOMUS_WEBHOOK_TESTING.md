# 📡 Cryptomus Webhook Test Payloads

Use these payloads to test your webhook handler locally before going live.

## 🧪 Test Scripts

### Signature Generator Script

```javascript
// generateSignature.js
const crypto = require("crypto");

// Replace with your Cryptomus API key
const CRYPTOMUS_API_KEY = process.env.CRYPTOMUS_API_KEY || "test_api_key";

// Example payload (same as webhook body)
const payload = {
  order_id: "order_12345",
  amount: "10.00",
  currency: "USDT",
  status: "paid",
  transaction_id: "txn_test_67890",
  network: "TRC20",
  created_at: "2025-11-15T00:05:00Z",
};

// Convert payload to JSON string
const jsonPayload = JSON.stringify(payload);

// Generate HMAC SHA256 signature
const signature = crypto
  .createHmac("sha256", CRYPTOMUS_API_KEY)
  .update(jsonPayload)
  .digest("hex");

console.log("Payload:", jsonPayload);
console.log("Signature:", signature);
```

### Automated Test Harness Script

```javascript
// testCryptomusWebhook.js
const crypto = require("crypto");
const fetch = require("node-fetch"); // install with: npm install node-fetch

// Replace with your Cryptomus API key
const CRYPTOMUS_API_KEY = process.env.CRYPTOMUS_API_KEY || "test_api_key";

// Replace with your webhook endpoint
const WEBHOOK_URL = "https://advanciapayledger.com/api/cryptomus/webhook";

// Example payload
const payload = {
  order_id: "order_12345",
  amount: "10.00",
  currency: "USDT",
  status: "paid",
  transaction_id: "txn_test_67890",
  network: "TRC20",
  created_at: new Date().toISOString(),
};

// Generate signature
const jsonPayload = JSON.stringify(payload);
const signature = crypto
  .createHmac("sha256", CRYPTOMUS_API_KEY)
  .update(jsonPayload)
  .digest("hex");

// Send POST request to webhook
(async () => {
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cryptomus-signature": signature,
      },
      body: jsonPayload,
    });

    const data = await res.json();
    console.log("Webhook response:", data);
  } catch (err) {
    console.error("Error sending webhook:", err);
  }
})();
```

### Stripe Test Harness Script

```javascript
// testStripeWebhook.js
import crypto from "crypto";

// Replace with your Stripe webhook secret (from Dashboard)
const STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_secret";

// Replace with your webhook endpoint
const WEBHOOK_URL =
  process.env.WEBHOOK_URL || "http://localhost:4000/api/stripe/webhook";

// Example Stripe event payload
const payload = {
  id: "evt_test_123",
  object: "event",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_456",
      object: "checkout.session",
      client_reference_id: "order_12345",
      amount_total: 1000, // cents
      currency: "usd",
      payment_status: "paid",
    },
  },
};

// Convert payload to string
const jsonPayload = JSON.stringify(payload);

// Generate Stripe signature (simplified for testing)
// Stripe signs with a timestamp + payload
const timestamp = Math.floor(Date.now() / 1000);
const signedPayload = `${timestamp}.${jsonPayload}`;
const signature = crypto
  .createHmac("sha256", STRIPE_WEBHOOK_SECRET)
  .update(signedPayload)
  .digest("hex");

// Build header value
const stripeSignatureHeader = `t=${timestamp},v1=${signature}`;

(async () => {
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Stripe-Signature": stripeSignatureHeader,
      },
      body: jsonPayload,
    });

    const data = await res.json();
    console.log("Webhook response:", data);
  } catch (err) {
    console.error("Error sending webhook:", err);
  }
})();
```

### Unified Test Runner Script

```javascript
// testUnifiedWebhook.js
import crypto from "crypto";

// --- Config ---
const CRYPTOMUS_API_KEY = process.env.CRYPTOMUS_API_KEY || "test_api_key";
const STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_secret";

const CRYPTOMUS_WEBHOOK_URL =
  process.env.CRYPTOMUS_WEBHOOK_URL ||
  "http://localhost:4000/api/cryptomus/webhook";
const STRIPE_WEBHOOK_URL =
  process.env.STRIPE_WEBHOOK_URL || "http://localhost:4000/api/stripe/webhook";

// --- Cryptomus Test Payload ---
const cryptomusPayload = {
  order_id: "order_cryptomus_123",
  amount: "5.00",
  currency: "USDT",
  status: "paid",
  transaction_id: "txn_crypto_test_001",
  network: "TRC20",
  created_at: new Date().toISOString(),
};

// Generate Cryptomus signature
const cryptomusSignature = crypto
  .createHmac("sha256", CRYPTOMUS_API_KEY)
  .update(JSON.stringify(cryptomusPayload))
  .digest("hex");

// --- Stripe Test Payload ---
const stripePayload = {
  id: "evt_test_123",
  object: "event",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_456",
      object: "checkout.session",
      client_reference_id: "order_stripe_456",
      amount_total: 2000, // cents
      currency: "usd",
      payment_status: "paid",
    },
  },
};

const stripeJson = JSON.stringify(stripePayload);
const timestamp = Math.floor(Date.now() / 1000);
const signedPayload = `${timestamp}.${stripeJson}`;
const stripeSignature = crypto
  .createHmac("sha256", STRIPE_WEBHOOK_SECRET)
  .update(signedPayload)
  .digest("hex");
const stripeSignatureHeader = `t=${timestamp},v1=${stripeSignature}`;

// --- Send Requests ---
(async () => {
  try {
    console.log("Sending Cryptomus test webhook...");
    const resCrypto = await fetch(CRYPTOMUS_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cryptomus-signature": cryptomusSignature,
      },
      body: JSON.stringify(cryptomusPayload),
    });
    console.log("Cryptomus response:", await resCrypto.json());

    console.log("Sending Stripe test webhook...");
    const resStripe = await fetch(STRIPE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Stripe-Signature": stripeSignatureHeader,
      },
      body: stripeJson,
    });
    console.log("Stripe response:", await resStripe.json());
  } catch (err) {
    console.error("Error sending test webhooks:", err);
  }
})();
```

### How to Use All Scripts

#### For Signature Generation Only:

1. Run the script in the backend directory:
   ```bash
   cd backend
   node generateSignature.js
   ```
2. Copy the signature output for use in Postman or manual cURL requests.

#### For Individual Provider Testing:

1. **Cryptomus testing:**
   ```bash
   cd backend
   CRYPTOMUS_API_KEY=your_api_key node testCryptomusWebhook.js
   ```
2. **Stripe testing:**
   ```bash
   cd backend
   STRIPE_WEBHOOK_SECRET=your_webhook_secret node testStripeWebhook.js
   ```

#### For Unified Testing (Both Providers):

1. Run the unified test runner:
   ```bash
   cd backend
   CRYPTOMUS_API_KEY=your_api_key STRIPE_WEBHOOK_SECRET=your_webhook_secret node testUnifiedWebhook.js
   ```
2. For production testing, set webhook URLs:
   ```bash
   cd backend
   CRYPTOMUS_API_KEY=your_api_key \
   STRIPE_WEBHOOK_SECRET=your_webhook_secret \
   CRYPTOMUS_WEBHOOK_URL=https://yourdomain.com/api/cryptomus/webhook \
   STRIPE_WEBHOOK_URL=https://yourdomain.com/api/stripe/webhook \
   node testUnifiedWebhook.js
   ```
3. Check backend logs and database for successful webhook processing.

### cURL Test Commands

```bash
# Calculate signature first (replace YOUR_API_KEY)
echo -n '{"order_id":"order_12345","amount":"10.00","currency":"USDT","status":"paid","transaction_id":"txn_test_67890","network":"TRC20","created_at":"2025-11-15T00:05:00Z"}' | openssl dgst -sha256 -hmac "YOUR_API_KEY" -hex | cut -d' ' -f2

# Then use the signature in the curl command
curl -X POST https://advanciapayledger.com/api/cryptomus/webhook \
  -H "Content-Type: application/json" \
  -H "cryptomus-signature: CALCULATED_SIGNATURE_HERE" \
  -d '{
    "order_id": "order_12345",
    "amount": "10.00",
    "currency": "USDT",
    "status": "paid",
    "transaction_id": "txn_test_67890",
    "network": "TRC20",
    "created_at": "2025-11-15T00:05:00Z"
  }'
```

## 📋 Sample Payloads

### ✅ Successful Payment

```json
{
  "order_id": "order_12345",
  "amount": "25.00",
  "currency": "USDT",
  "status": "paid",
  "transaction_id": "txn_abc_789",
  "network": "TRC20",
  "created_at": "2025-11-15T00:05:00Z"
}
```

### ⏳ Pending Payment

```json
{
  "order_id": "order_67890",
  "amount": "50.00",
  "currency": "BTC",
  "status": "pending",
  "transaction_id": "txn_def_012",
  "network": "BTC",
  "created_at": "2025-11-15T00:10:00Z"
}
```

### ❌ Failed/Cancelled Payment

```json
{
  "order_id": "order_99999",
  "amount": "15.00",
  "currency": "ETH",
  "status": "cancelled",
  "transaction_id": "txn_ghi_345",
  "network": "ERC20",
  "created_at": "2025-11-15T00:15:00Z"
}
```

### 💰 Overpaid Payment

```json
{
  "order_id": "order_11111",
  "amount": "100.50",
  "currency": "USDT",
  "status": "paid_over",
  "transaction_id": "txn_jkl_678",
  "network": "TRC20",
  "created_at": "2025-11-15T00:20:00Z"
}
```

## 🔍 Expected Responses

### Success Response

```json
{
  "received": true
}
```

### Error Responses

```json
// Invalid signature
{
  "error": "Invalid signature"
}

// Payment not found
{
  "error": "Payment not found"
}

// Internal error
{
  "error": "Internal server error"
}
```

## 🐛 Debugging Tips

### Check Backend Logs

```bash
# Monitor webhook logs
tail -f backend/logs/app.log | grep -i webhook

# Check for signature verification
tail -f backend/logs/app.log | grep -i "signature"
```

### Verify Database Changes

```sql
-- Check latest transactions
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5;

-- Check admin wallet updates
SELECT * FROM admin_wallets ORDER BY updated_at DESC;

-- Check user wallet updates
SELECT * FROM crypto_wallets WHERE updated_at > NOW() - INTERVAL '5 minutes';
```

### Test Payment Status API

```bash
# Test the frontend API
curl "http://localhost:3000/api/payment-status?orderId=test-order-67890"
```

## 📊 Webhook Event Flow

1. **Cryptomus sends webhook** → POST to `/api/cryptomus/webhook`
2. **Signature verification** → HMAC-SHA256 check
3. **Payment lookup** → Find record in `crypto_payments` table
4. **Status update** → Update payment status to 'paid'
5. **Transaction creation** → Create record in `transactions` table
6. **Admin wallet credit** → Update `admin_wallets` table
7. **User wallet credit** → Update `crypto_wallets` table
8. **Real-time notification** → Socket.IO emit to user
9. **Response** → HTTP 200 with success message

---

**Test Environment Setup:**

1. **Start backend:** `cd backend && npm run dev`
2. **Start frontend:** `cd frontend && npm run dev`
3. **Run automated test:**
   ```bash
   cd backend
   CRYPTOMUS_API_KEY=your_test_key node testCryptomusWebhook.js
   ```
4. **Check logs and database** for successful processing
5. **Test payment status API:**
   ```bash
   curl "http://localhost:3000/api/payment-status?orderId=order_12345"
   ```

**Production Notes:**

- Use HTTPS URLs only for production webhook endpoints
- Monitor webhook delivery in Cryptomus dashboard
- Set up alerts for failed webhook deliveries
- Test with small amounts first before enabling full production payments

---

## 📊 Prisma Schema Reference

Your existing Prisma schema already includes the necessary models for webhook processing:

### AdminWallet Model (for central ledger)

```prisma
model AdminWallet {
  id          String   @id @default(uuid())
  currency    String   // USD, BTC, ETH, USDT, etc.
  balance     Decimal  @default(0)
  totalIn     Decimal  @default(0)  // Total received
  totalOut    Decimal  @default(0)  // Total credited to users
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  transactions AdminWalletTransaction[]

  @@unique([currency])
  @@map("admin_wallets")
}
```

### Transaction Model (for payment records)

```prisma
model Transaction {
  id          String   @id @default(uuid())
  userId      String
  amount      Float
  type        String
  description String?
  category    String?
  status      String   @default("completed")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  Invoice     Invoice?

  @@index([userId])
  @@index([createdAt])
  @@map("transactions")
}
```

### Webhook Processing Flow

1. **Webhook received** → Signature verified
2. **Transaction created** → Record saved to `transactions` table
3. **Admin wallet credited** → Balance updated in `admin_wallets` table
4. **User wallet credited** → User's crypto balance updated
5. **Real-time notification** → Socket.IO event emitted
6. **Response sent** → HTTP 200 with success confirmation
