# 🚀 Advancia Pay Ledger - API Gateway Worker

Enterprise-grade API Gateway running on Cloudflare Workers Edge Network.

## 🎯 Features

### ✅ Security

-   **JWT Authentication** - Validates bearer tokens with backend
-   **Rate Limiting** - Per-user, per-IP, tiered limits
-   **CORS Handling** - Configurable cross-origin policies
-   **API Key Validation** - Internal service authentication

### ✅ Performance

-   **Edge Caching** - Response caching at 300+ global locations
-   **Parallel Requests** - Dashboard aggregation with Promise.all()
-   **Request Coalescing** - Deduplicates identical concurrent requests
-   **Sub-10ms Latency** - Average response time

### ✅ Routing

-   **Multi-API Aggregation** - Stripe, Cryptomus, CoinGecko, Binance
-   **Smart Proxying** - Routes to backend, payment providers, or generates at edge
-   **Public/Private Routes** - Flexible authentication requirements
-   **Path-based Routing** - Clean URL patterns

### ✅ Monitoring

-   **Request Logging** - All requests logged to Cloudflare Analytics
-   **Error Tracking** - Centralized error handling
-   **Rate Limit Metrics** - Per-user consumption tracking

---

## 📋 API Routes

### Public Routes (No Auth)

```
GET  /health                    - Health check
GET  /api/public/prices         - Crypto prices (BTC, ETH, USDT)
GET  /api/public/status         - Service status
```

### Protected Routes (JWT Required)

```
GET  /api/dashboard             - Aggregated dashboard data
GET  /api/payments/stripe/*     - Stripe payment operations
POST /api/payments/crypto/*     - Cryptomus crypto payments
GET  /api/crypto?symbol=BTC     - Multi-source crypto prices
GET  /api/prices                - Real-time price feed
GET  /api/trust-score/me        - User trust score
*    /api/**                    - Proxy to backend
```

---

## 🚀 Deployment

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create KV Namespace for Rate Limiting

```bash
wrangler kv:namespace create RATE_LIMIT_KV
wrangler kv:namespace create RATE_LIMIT_KV --preview
```

Copy the namespace IDs to `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "abc123..."  # Your production namespace ID
preview_id = "def456..."  # Your preview namespace ID
```

### 4. Set Environment Variables

```bash
# Cloudflare Dashboard → Workers → advancia-api-gateway → Settings → Variables

# Production secrets (encrypted)
wrangler secret put BACKEND_URL
wrangler secret put INTERNAL_API_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put CRYPTOMUS_API_KEY
wrangler secret put CRYPTOMUS_MERCHANT_ID
```

**Required Variables:**

```
BACKEND_URL = https://api.advanciapayledger.com
INTERNAL_API_KEY = <generate secure random key>
STRIPE_SECRET_KEY = sk_live_...
CRYPTOMUS_API_KEY = your-cryptomus-api-key
CRYPTOMUS_MERCHANT_ID = your-merchant-id
```

### 5. Deploy Worker

```bash
cd cloudflare-api-gateway
npm install
wrangler deploy --env production
```

### 6. Configure Custom Domain

```bash
# In Cloudflare Dashboard:
# 1. Workers → advancia-api-gateway → Settings → Triggers
# 2. Add Custom Domain: api.advanciapayledger.com
# 3. DNS record will be created automatically
```

---

## 🧪 Testing

### Local Development

```bash
npm run dev
# Worker runs at http://localhost:8787
```

### Test Health Check

```powershell
Invoke-RestMethod http://localhost:8787/health
```

### Test Public API

```powershell
Invoke-RestMethod "http://localhost:8787/api/public/prices"
```

### Test Protected Route (with JWT)

```powershell
$token = "your-jwt-token"
Invoke-RestMethod -Uri "http://localhost:8787/api/dashboard" `
  -Headers @{Authorization="Bearer $token"}
```

### Test Rate Limiting

```powershell
# Send 15 requests (exceeds anonymous limit of 10/min)
1..15 | ForEach-Object {
  Invoke-RestMethod "http://localhost:8787/api/public/prices"
}
# Should see 429 error after 10th request
```

---

## 📊 Rate Limits

| Tier          | Requests/Minute | Use Case            |
| ------------- | --------------- | ------------------- |
| Anonymous     | 10              | Public API access   |
| Authenticated | 100             | Regular users       |
| Premium       | 1000            | Premium subscribers |

Rate limits reset every 60 seconds.

---

## 🔐 Authentication

### JWT Token Validation

Gateway validates JWTs with backend `/api/auth/verify` endpoint:

```javascript
POST https://api.advanciapayledger.com/api/auth/verify
Headers: {
  "Content-Type": "application/json",
  "X-API-Key": "internal-key"
}
Body: {
  "token": "user-jwt-token"
}
```

**Response:**

```json
{
  "valid": true,
  "user": {
    "userId": "user-123",
    "role": "USER",
    "tier": "authenticated"
  }
}
```

---

## 📈 Dashboard Aggregation

Single API call fetches all dashboard data in parallel:

```javascript
GET /api/dashboard
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
  "success": true,
  "dashboard": {
    "user": { "id": "...", "email": "..." },
    "wallets": [
      { "currency": "BTC", "balance": "0.5" },
      { "currency": "ETH", "balance": "2.1" }
    ],
    "recentTransactions": [...],
    "prices": {
      "bitcoin": { "usd": 45000 },
      "ethereum": { "usd": 3000 }
    },
    "trustScore": {
      "overallScore": 750,
      "level": "Gold"
    },
    "timestamp": "2025-11-18T..."
  }
}
```

---

## 🛠️ Monitoring

### View Worker Logs

```bash
wrangler tail
```

### Cloudflare Dashboard

-   **Analytics**: Workers → advancia-api-gateway → Analytics
-   **Logs**: Workers → advancia-api-gateway → Logs
-   **Metrics**: Requests, errors, latency, CPU time

### Key Metrics

-   **Requests/sec**: Real-time request rate
-   **Error Rate**: 4xx and 5xx responses
-   **P50/P95/P99 Latency**: Response time percentiles
-   **Rate Limit Hits**: 429 responses per minute

---

## 🔄 Updates & Rollback

### Deploy New Version

```bash
wrangler deploy --env production
```

### Rollback

```bash
# In Cloudflare Dashboard:
# Workers → advancia-api-gateway → Deployments
# Click "Rollback" on previous version
```

---

## 📖 API Examples

### Fetch Dashboard (Frontend)

```javascript
const response = await fetch("https://api.advanciapayledger.com/api/dashboard", {
  headers: {
    Authorization: `Bearer ${userToken}`,
  },
});
const data = await response.json();
```

### Create Stripe Payment

```javascript
const response = await fetch("https://api.advanciapayledger.com/api/payments/stripe/payment_intents", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${userToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    amount: 5000,
    currency: "usd",
  }),
});
```

### Get Crypto Prices

```javascript
const response = await fetch("https://api.advanciapayledger.com/api/public/prices");
const prices = await response.json();
console.log(prices.prices.BTC); // Current BTC price
```

---

## 🚨 Troubleshooting

### 401 Unauthorized

-   Check JWT token is valid
-   Verify Authorization header format: `Bearer <token>`
-   Ensure backend `/api/auth/verify` endpoint is working

### 429 Rate Limit Exceeded

-   User exceeded tier rate limit
-   Wait for rate limit window to reset (60 seconds)
-   Upgrade user to higher tier

### 502 Bad Gateway

-   Backend API is down or unreachable
-   Check `BACKEND_URL` environment variable
-   Verify backend health: `curl https://api.advanciapayledger.com/health`

### 500 Internal Server Error

-   Check worker logs: `wrangler tail`
-   Verify all environment variables are set
-   Check Cloudflare Dashboard for errors

---

## 📚 References

-   [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
-   [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
-   [Workers KV](https://developers.cloudflare.com/kv/)
-   [Rate Limiting Best Practices](https://developers.cloudflare.com/workers/examples/rate-limiting/)

---

**Deployed URL:** <https://api.advanciapayledger.com>  
**Status:** Production Ready  
**Last Updated:** 2025-11-18
