# 🔐 GitHub Secrets Setup Guide for Backend

## Repository: `-modular-saas-platform`

## Service: `advancia-backend-upnf`

---

## 📋 How to Add Secrets to GitHub

1. Go to: `https://github.com/pdtribe181-prog/-modular-saas-platform`
2. Click: **Settings** → **Secrets and variables** → **Actions**
3. Click: **New repository secret** for each variable below
4. Or add to **Render Dashboard** → **Environment** tab

---

## 🔑 Required Environment Variables

### **Core Configuration**

```bash
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://advanciapayledger.com
BACKEND_URL=https://api.advanciapayledger.com
ALLOWED_ORIGINS=https://advanciapayledger.com,https://www.advanciapayledger.com
```

### **Database**

```bash
DATABASE_URL=postgresql://user:password@host:5432/advancia_ledger
```

**Where to get:** Your PostgreSQL provider (Render, Neon, Supabase)

---

### **JWT & Security**

```bash
JWT_SECRET=generate-48-character-random-string
JWT_EXPIRATION=7d
SESSION_SECRET=generate-32-character-random-string
REFRESH_SECRET=generate-32-character-random-string
API_KEY=generate-your-api-key-for-external-services
```

**Generate random secrets:**

```bash
# On PowerShell:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | % {[char]$_})
```

---

### **Admin Credentials**

```bash
ADMIN_EMAIL=admin@advanciapayledger.com
ADMIN_PASS=YourStrongPassword123!
```

**⚠️ CHANGE THESE IMMEDIATELY IN PRODUCTION!**

---

### **Email (Gmail SMTP)**

```bash
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-char-gmail-app-password
EMAIL_FROM=noreply@advanciapayledger.com
EMAIL_REPLY_TO=support@advanciapayledger.com
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-char-gmail-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
ALERT_TO=security@advanciapayledger.com
```

**How to get Gmail App Password:**

1. Go to: https://myaccount.google.com/apppasswords
2. Select: **Mail** → **Other (Custom name)**
3. Copy the 16-character password (remove spaces)
4. Paste into `EMAIL_PASSWORD` and `SMTP_PASS`

---

### **Push Notifications (VAPID Keys)**

```bash
VAPID_PUBLIC_KEY=generate-using-script-below
VAPID_PRIVATE_KEY=generate-using-script-below
VAPID_SUBJECT=mailto:support@advanciapayledger.com
```

**Generate VAPID keys:**

```bash
cd backend
node generate-vapid.js
```

Copy the output and paste into environment variables.

---

### **Twilio (SMS/OTP) - OPTIONAL**

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=your-api-key-secret
```

**Where to get:**

- Sign up at: https://console.twilio.com
- Get Account SID & Auth Token from dashboard
- Create Verify Service for OTP
- Purchase a phone number

---

### **Stripe (Payments) - OPTIONAL**

```bash
STRIPE_SECRET_KEY=sk_test_51SCrKDBRIx...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Where to get:**

1. Sign up at: https://dashboard.stripe.com
2. Get API keys from **Developers** → **API keys**
3. Set up webhook endpoint: `/api/payments/webhook`
4. Copy webhook secret

---

### **Redis (Caching) - OPTIONAL**

```bash
REDIS_URL=redis://default:password@host:6379
```

**Providers:** Upstash, Redis Cloud, Render Redis

---

### **Ethereum Gateway - OPTIONAL**

```bash
ETH_PROVIDER_URL=https://ethereum.publicnode.com
```

**Or use:** Infura, Alchemy, or Quicknode

---

### **RPA Automation - OPTIONAL**

```bash
RPA_ENABLED=true
RPA_SCHEDULE_ENABLED=true
RPA_CRYPTO_RECOVERY_ENABLED=true
RPA_BACKUP_ENABLED=true
RPA_REPORTS_ENABLED=true
RPA_NOTIFICATIONS_ENABLED=true
RPA_EMAIL_ENABLED=true
RPA_SMS_ENABLED=true
RPA_EMAIL_RATE_LIMIT=10
RPA_SMS_RATE_LIMIT=5
```

---

## 🎯 For Render Dashboard

1. Go to: https://dashboard.render.com
2. Select service: **advancia-backend-upnf**
3. Go to: **Environment** tab
4. Click: **Add Environment Variable**
5. Paste each variable from above
6. Click: **Save Changes**

---

## ✅ Verification Checklist

After adding all variables:

- [ ] Backend starts without errors
- [ ] Database connection successful
- [ ] JWT authentication works
- [ ] Email sending works (test with `/api/auth/test-smtp`)
- [ ] Push notifications work (if VAPID keys set)
- [ ] SMS OTP works (if Twilio configured)
- [ ] Payments work (if Stripe configured)

---

## 🧪 Test Commands

```bash
# Test database connection
npm run test:db

# Test SMTP email
npm run test:smtp

# Test all endpoints
npm run test

# Check environment variables
npm run check-env
```

---

## 🆘 Common Issues

### Issue: "DATABASE_URL is required"

**Solution:** Add `DATABASE_URL` to Render environment variables

### Issue: "No JWT secret found"

**Solution:** Add `JWT_SECRET` with at least 32 characters

### Issue: "SMTP not configured"

**Solution:** Add `EMAIL_USER` and `EMAIL_PASSWORD` (Gmail App Password)

### Issue: "Twilio credentials not configured"

**Solution:** Add `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`

### Issue: "VAPID keys not set"

**Solution:** Run `node generate-vapid.js` and add keys

---

## 📚 Related Documentation

- [RENDER_ENV_VARS_REFERENCE.md](./RENDER_ENV_VARS_REFERENCE.md)
- [SMTP_QUICK_TEST.md](./SMTP_QUICK_TEST.md)
- [DNS_AND_SSL_SETUP_GUIDE.md](./DNS_AND_SSL_SETUP_GUIDE.md)
- [Setup-Notifications.ps1](./Setup-Notifications.ps1)

---

## 🔒 Security Best Practices

1. **Never commit secrets to Git**
2. **Use strong, random passwords** (48+ characters)
3. **Rotate secrets regularly** (every 90 days)
4. **Use different values for dev/staging/prod**
5. **Enable 2FA on all service accounts** (Twilio, Stripe, Gmail)
6. **Restrict API key permissions** to minimum required
7. **Monitor logs** for unauthorized access attempts

---

## 📝 Notes

- **Required variables** are marked with ⚠️ - backend won't start without them
- **Optional variables** enable additional features
- **Test locally first** before deploying to production
- **Backup your .env** file securely (encrypted storage only)

---

**Last Updated:** October 22, 2025
**Service:** advancia-backend-upnf
**Repository:** -modular-saas-platform
