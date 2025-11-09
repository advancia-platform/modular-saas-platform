# Stripe Webhook Setup Guide

## Prerequisites
✅ Stripe test keys configured in `.env`
✅ Backend server running on `http://localhost:4000`

## Steps to Enable Webhooks Locally

### 1. Install Stripe CLI

**Windows (PowerShell as Administrator):**
```powershell
# Using Scoop (recommended)
scoop install stripe

# OR download directly from:
# https://github.com/stripe/stripe-cli/releases/latest
```

**Verify Installation:**
```powershell
stripe --version
```

### 2. Login to Stripe

```powershell
stripe login
```

This will:
- Open your browser
- Ask you to authorize the CLI
- Return to terminal when complete

### 3. Start Webhook Forwarding

```powershell
stripe listen --forward-to localhost:4000/api/payments/webhook
```

**Expected Output:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

### 4. Copy the Webhook Secret

The output will show something like:
```
Your webhook signing secret is whsec_1234567890abcdefghijklmnopqrstuvwxyz
```

**Copy this secret** and add it to your `backend/.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz
```

### 5. Restart Backend Server

After adding the secret to `.env`:

```powershell
cd backend
# Kill any running processes
taskkill /F /IM node.exe

# Restart
npm run dev
```

### 6. Test the Webhook

**Keep the Stripe CLI running in one terminal**, then in another terminal:

```powershell
cd backend
.\test-payments.ps1
```

This will create a checkout session. To complete the payment:

1. Copy the payment URL from the test output
2. Open it in your browser
3. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code
4. Complete the payment

**Watch the Stripe CLI terminal** - you should see:
```
2025-01-20 00:15:30   --> checkout.session.completed [evt_xxx]
2025-01-20 00:15:30  <--  [200] POST http://localhost:4000/api/payments/webhook [evt_xxx]
```

**Check your backend logs** - you should see the webhook being processed.

## Testing Webhook Events

You can also trigger test events manually:

```powershell
# Trigger a checkout.session.completed event
stripe trigger checkout.session.completed

# Trigger a payment_intent.succeeded event  
stripe trigger payment_intent.succeeded
```

## Production Webhook Setup

For production, you'll need to:

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your production URL: `https://your-domain.com/api/payments/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the "Signing secret" and add it to your production environment variables

## Troubleshooting

### Webhook not receiving events
- ✅ Check Stripe CLI is running (`stripe listen...`)
- ✅ Check backend is running on port 4000
- ✅ Check `STRIPE_WEBHOOK_SECRET` is in `.env`
- ✅ Restart backend after adding secret

### "Invalid signature" errors
- The webhook secret in `.env` doesn't match the CLI output
- Make sure you copied the entire `whsec_...` string
- Restart the backend after updating `.env`

### Events not processing
- Check backend console logs for errors
- Verify the webhook handler in `routes/payments.ts`
- Check database connectivity

## Current Webhook Events Handled

✅ `checkout.session.completed` - Credits user balance when payment succeeds

## What Happens on Webhook

When a `checkout.session.completed` event is received:

1. ✅ Stripe signature is verified
2. ✅ User's `usdBalance` is incremented
3. ✅ Transaction record is created (type: 'credit')
4. ✅ Socket.IO event is emitted to user's room
5. ✅ User sees real-time balance update

## Testing Checklist

- [ ] Stripe CLI installed and authenticated
- [ ] Webhook forwarding running
- [ ] Webhook secret added to `.env`
- [ ] Backend restarted with new secret
- [ ] Test payment completed successfully
- [ ] Webhook event logged in Stripe CLI
- [ ] User balance updated in database
- [ ] Transaction record created
- [ ] Socket event emitted (check browser console)

## Stripe Test Cards

| Card Number         | Scenario              |
|--------------------|-----------------------|
| 4242 4242 4242 4242 | Success               |
| 4000 0000 0000 9995 | Decline (insufficient)|
| 4000 0025 0000 3155 | Requires authentication|
| 4000 0000 0000 0002 | Declined card         |

**Expiry:** Any future date  
**CVC:** Any 3 digits  
**ZIP:** Any valid ZIP

---

**Need help?** Check the Stripe CLI docs: https://stripe.com/docs/stripe-cli
