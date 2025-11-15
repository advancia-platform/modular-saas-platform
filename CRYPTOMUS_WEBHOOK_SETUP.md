# 🔧 Cryptomus Webhook Setup & Testing Guide

## 📋 Step-by-Step Configuration Checklist

### 1. **Access Cryptomus Dashboard**

- Log in to your [Cryptomus Merchant Dashboard](https://app.cryptomus.com/)
- Navigate to **Settings** → **Payment Notifications** or **Webhook Settings**

### 2. **Configure Webhook URL**

- **Webhook URL**: `https://advanciapayledger.com/api/cryptomus/webhook`
- **HTTP Method**: POST
- **Content Type**: application/json
- **Events to Send**: `payment.status.paid` (or equivalent)

### 3. **Security Settings**

- Ensure webhook signing is enabled
- Note: Your backend uses HMAC-SHA256 verification with `CRYPTOMUS_API_KEY`

### 4. **Save & Test Configuration**

- Save the webhook settings
- Cryptomus may send a test ping - check your backend logs

---

## 🧪 Testing with Small Payment

### 5. **Create Test Payment**

```bash
# Frontend: Navigate to checkout
# Select Cryptomus payment method
# Pay small amount ($1-5 equivalent in crypto)
```

### 6. **Monitor Backend Logs**

```bash
# Check backend logs for webhook receipt
tail -f backend/logs/app.log | grep -i cryptomus
```

Expected log output:

```
✅ Cryptomus webhook received: { status: 'paid', order_id: '...', amount: '1.00', currency: 'USD' }
✅ Payment processed successfully: 1.00 USD for user user_123
Admin wallet credited: +1 USD
User user_123 crypto wallet credited: +1 USD
```

### 7. **Verify Database Updates**

```sql
-- Check transaction record
SELECT * FROM transactions WHERE description LIKE '%Order: %' ORDER BY created_at DESC LIMIT 1;

-- Check admin wallet
SELECT * FROM admin_wallets WHERE currency = 'USD';

-- Check user crypto wallet
SELECT * FROM crypto_wallets WHERE user_id = 'user_123' AND currency = 'USD';
```

### 8. **Test Frontend Status Polling**

```bash
# Test the payment status API
curl "http://localhost:3000/api/payment-status?orderId=YOUR_ORDER_ID"
```

Expected response:

```json
{
  "status": "confirmed",
  "amount": 1.0,
  "createdAt": "2025-11-15T...",
  "paidAt": "2025-11-15T..."
}
```

---

## 🔍 Troubleshooting

### Webhook Not Received

- ✅ Check webhook URL is correct and HTTPS
- ✅ Verify Cryptomus dashboard shows webhook as "Active"
- ✅ Check backend is running and route is registered
- ✅ Review firewall/network settings

### Signature Verification Fails

- ✅ Ensure `CRYPTOMUS_API_KEY` environment variable is set
- ✅ Check webhook signature header name (`sign` vs `cryptomus-signature`)
- ✅ Verify API key matches the one in Cryptomus dashboard

### Payment Not Processed

- ✅ Check database connection
- ✅ Verify user exists in database
- ✅ Review error logs for specific failure reasons
- ✅ Ensure admin wallet table exists and is accessible

### Frontend Not Updating

- ✅ Test `/api/payment-status` endpoint directly
- ✅ Check browser network tab for polling requests
- ✅ Verify Socket.IO connection for real-time updates
- ✅ Check for CORS issues

---

## 📡 Sample Webhook Test Payload

### Test with cURL

```bash
curl -X POST https://advanciapayledger.com/api/cryptomus/webhook \
  -H "Content-Type: application/json" \
  -H "sign: YOUR_CALCULATED_SIGNATURE" \
  -d '{
    "uuid": "test-invoice-123",
    "order_id": "test-order-456",
    "amount": "1.00",
    "currency": "USD",
    "status": "paid",
    "additional_data": "{\"user_id\": \"test-user-123\"}"
  }'
```

### Calculate Test Signature

```javascript
const crypto = require("crypto");
const payload = JSON.stringify({
  uuid: "test-invoice-123",
  order_id: "test-order-456",
  amount: "1.00",
  currency: "USD",
  status: "paid",
  additional_data: '{"user_id": "test-user-123"}',
});
const signature = crypto
  .createHmac("sha256", process.env.CRYPTOMUS_API_KEY)
  .update(payload)
  .digest("hex");
console.log("Test signature:", signature);
```

### Expected Backend Response

```json
{
  "received": true
}
```

---

## ✅ Success Indicators

- [ ] Webhook URL configured in Cryptomus dashboard
- [ ] Backend logs show webhook receipt and processing
- [ ] Database shows new transaction record
- [ ] Admin wallet balance increased
- [ ] User crypto wallet credited
- [ ] Frontend shows "Payment Successful" page
- [ ] Real-time notifications work via Socket.IO

---

## 🚀 Production Deployment

### Environment Variables

```bash
# Backend .env
CRYPTOMUS_API_KEY=your_production_api_key
CRYPTOMUS_MERCHANT_ID=your_merchant_id
CRYPTOMUS_WEBHOOK_URL=https://advanciapayledger.com/api/cryptomus/webhook
```

### DNS & SSL

- Ensure `advanciapayledger.com` points to your server
- SSL certificate must be valid for webhook delivery

### Monitoring

- Set up alerts for webhook failures
- Monitor admin wallet balance changes
- Track payment success rates

---

**Last Updated:** 2025-11-15
**Version:** 1.0.0
