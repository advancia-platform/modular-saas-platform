# 🔐 Environment Variables Setup Guide

Quick reference for setting up environment variables in Advancia Pay Ledger.

---

## 📋 Quick Setup Checklist

### 1️⃣ Backend Setup

```bash
cd backend
cp .env.example .env
```

**Edit `backend/.env` with your values:**

```bash
# Generate secure secrets
openssl rand -base64 32  # Use for JWT_SECRET
openssl rand -base64 32  # Use for SESSION_SECRET
```

### 2️⃣ Frontend Setup

```bash
cd frontend
cp .env.example .env.local
```

**Note**: Next.js uses `.env.local` for local development (already gitignored).

### 3️⃣ Root Setup (Optional)

```bash
cp .env.example .env
```

---

## 🔑 Required Environment Variables

### **Backend (Minimum Viable Setup)**

| Variable         | Required | Example                                    | Where to Get                 |
| ---------------- | -------- | ------------------------------------------ | ---------------------------- |
| `DATABASE_URL`   | ✅ Yes   | `postgresql://user:pass@localhost:5432/db` | PostgreSQL connection string |
| `JWT_SECRET`     | ✅ Yes   | `openssl rand -base64 32`                  | Generate with OpenSSL        |
| `SESSION_SECRET` | ✅ Yes   | `openssl rand -base64 32`                  | Generate with OpenSSL        |
| `PORT`           | ✅ Yes   | `4000`                                     | Backend server port          |
| `FRONTEND_URL`   | ✅ Yes   | `http://localhost:3000`                    | Frontend URL for CORS        |

### **Frontend (Minimum Viable Setup)**

| Variable                             | Required    | Example                 | Where to Get     |
| ------------------------------------ | ----------- | ----------------------- | ---------------- |
| `NEXT_PUBLIC_API_URL`                | ✅ Yes      | `http://localhost:4000` | Backend API URL  |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⚠️ Payments | `pk_test_...`           | Stripe Dashboard |

---

## 🔧 Service-Specific Configuration

### 💳 Stripe Payments

**Required for payment processing:**

1. Sign up at [stripe.com](https://stripe.com)
2. Get test keys from Dashboard → Developers → API Keys
3. Add to **backend**:
   ```env
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```
4. Add to **frontend**:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   ```

### 🏦 Plaid (Bank Account Linking)

**Optional - for bank account features:**

1. Sign up at [plaid.com](https://plaid.com)
2. Create app and get credentials
3. Add to **backend**:
   ```env
   PLAID_CLIENT_ID="your-client-id"
   PLAID_SECRET="your-secret"
   PLAID_ENV="sandbox"
   ```

### 🛡️ Cloudflare (DNS & Security)

**Required for production deployment:**

1. Create account at [cloudflare.com](https://cloudflare.com)
2. Add your domain
3. Get API token: My Profile → API Tokens → Create Token
4. Add to **backend**:
   ```env
   CLOUDFLARE_API_TOKEN="your-token"
   CLOUDFLARE_ZONE_ID="your-zone-id"
   ```

### 📊 Sentry (Error Monitoring)

**Highly recommended for production:**

1. Create project at [sentry.io](https://sentry.io)
2. Get DSN from Project Settings
3. Add to **backend**:
   ```env
   SENTRY_DSN="https://...@sentry.io/..."
   ```
4. Add to **frontend**:
   ```env
   NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
   ```

### 📈 Mixpanel (Analytics)

**Optional - for user analytics:**

1. Create project at [mixpanel.com](https://mixpanel.com)
2. Get token from Project Settings
3. Add to **backend**:
   ```env
   MIXPANEL_TOKEN="your-token"
   ```
4. Add to **frontend**:
   ```env
   NEXT_PUBLIC_MIXPANEL_TOKEN="your-token"
   ```

### 📧 Email Service (SMTP)

**Required for OTP and notifications:**

**Gmail (Easiest for Development):**

1. Enable 2FA on your Gmail account
2. Generate App Password: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Add to **backend**:
   ```env
   EMAIL_HOST="smtp.gmail.com"
   EMAIL_PORT="587"
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASSWORD="your-app-password"
   ```

**SendGrid (Recommended for Production):**

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key
3. Add to **backend**:
   ```env
   EMAIL_HOST="smtp.sendgrid.net"
   EMAIL_PORT="587"
   EMAIL_USER="apikey"
   EMAIL_PASSWORD="your-sendgrid-api-key"
   ```

### 💰 Cryptomus (Crypto Payments)

**Optional - for cryptocurrency payments:**

1. Sign up at [cryptomus.com](https://cryptomus.com)
2. Create merchant account
3. Add to **backend**:
   ```env
   CRYPTOMUS_API_KEY="your-api-key"
   CRYPTOMUS_MERCHANT_ID="your-merchant-id"
   ```

### 🔔 Web Push Notifications

**Optional - for browser notifications:**

**Generate VAPID Keys:**

```bash
cd backend
node generate-vapid.js
```

Add output to **backend**:

```env
VAPID_PUBLIC_KEY="generated-public-key"
VAPID_PRIVATE_KEY="generated-private-key"
VAPID_SUBJECT="mailto:support@yourdomain.com"
```

Add to **frontend**:

```env
NEXT_PUBLIC_VAPID_KEY="generated-public-key"
```

---

## 🔒 Security Best Practices

### ✅ DO:

- ✅ Use strong, randomly generated secrets (32+ characters)
- ✅ Never commit `.env` files to Git
- ✅ Use different secrets for dev, staging, and production
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Use environment-specific `.env` files
- ✅ Encrypt secrets in CI/CD (GitHub Secrets, Render env vars)

### ❌ DON'T:

- ❌ Use default/example secrets in production
- ❌ Share `.env` files via email/Slack/Discord
- ❌ Hardcode secrets in source code
- ❌ Use the same secrets across multiple environments
- ❌ Store secrets in plaintext documentation

---

## 🚀 Deployment Environments

### **Local Development**

- Use `.env` (backend) and `.env.local` (frontend)
- Relaxed CORS, debug logging enabled
- Test/sandbox API keys

### **Staging/UAT**

- Environment variables via hosting platform (Render, Vercel)
- Tighter CORS, standard logging
- Test/sandbox API keys

### **Production**

- Environment variables via hosting platform (encrypted at rest)
- Strict CORS, minimal logging
- Production API keys with monitoring
- Enable rate limiting and WAF

---

## 🧪 Testing Your Setup

### Backend Health Check

```bash
cd backend
npm run dev
curl http://localhost:4000/health
```

**Expected Response:**

```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected"
}
```

### Frontend Connection Check

```bash
cd frontend
npm run dev
# Open http://localhost:3000
# Check browser console for API connection
```

---

## 🆘 Troubleshooting

### "DATABASE_URL not found"

- ✅ Verify `.env` exists in `backend/` directory
- ✅ Check `.env` is not empty
- ✅ Restart backend server after changes

### "JWT_SECRET is required"

- ✅ Generate secret: `openssl rand -base64 32`
- ✅ Add to `backend/.env`: `JWT_SECRET="generated-secret"`

### "CORS error" in frontend

- ✅ Verify `FRONTEND_URL` in backend `.env` matches frontend URL
- ✅ Check `NEXT_PUBLIC_API_URL` in frontend `.env.local` points to backend

### "Stripe key invalid"

- ✅ Use `pk_test_` (publishable) in frontend
- ✅ Use `sk_test_` (secret) in backend
- ✅ Never use secret keys in frontend

---

## 📚 Additional Resources

- [Backend README](./backend/README.md) - Detailed backend setup
- [Frontend README](./frontend/README.md) - Detailed frontend setup
- [Deployment Guide](./ONE_HOUR_MIGRATION_GUIDE.md) - Production deployment
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and fixes

---

## 🤝 Need Help?

- 📖 Check [.env.example files](./backend/.env.example) for all available options
- 🐛 Open an issue on GitHub
- 💬 Join our Discord community
- 📧 Email: support@advanciapayledger.com

---

**Built with ❤️ for secure fintech development**
