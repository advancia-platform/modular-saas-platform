# 📧 Email Configuration & Testing Guide

Complete guide for setting up and testing email functionality in Advancia PayLedger.

## 📋 Table of Contents

1. [Email Service Overview](#email-service-overview)
2. [Resend API Setup](#resend-api-setup)
3. [Custom Email Domain Setup](#custom-email-domain-setup)
4. [Email Forwarding](#email-forwarding)
5. [Testing Email Delivery](#testing-email-delivery)
6. [Email Templates](#email-templates)
7. [Troubleshooting](#troubleshooting)

---

## Email Service Overview

**Current Configuration:**
- **Primary Service**: Resend.com (recommended)
- **Fallback**: Gmail SMTP (configured)
- **Templates**: 6 pre-built HTML templates
- **Status**: ✅ Email service code ready, needs API key

**Email Templates Available:**
1. Welcome Email (user registration)
2. Transaction Confirmation
3. Password Reset
4. Two-Factor Authentication
5. Invoice Generation
6. Admin Notifications

---

## Resend API Setup

### Step 1: Create Resend Account

```
1. Go to: https://resend.com
2. Sign up with GitHub or Email
3. Verify your email
4. Free tier: 3,000 emails/month, 100 emails/day
```

### Step 2: Get API Key

```
1. Login to Resend Dashboard
2. Navigate to: API Keys → Create API Key
3. Name: "Advancia PayLedger Production"
4. Permissions: "Sending access"
5. Copy the key (starts with: re_...)
```

**Example API Key:**
```
re_123abc456def789ghi012jkl345mno678pqr
```

### Step 3: Add to Environment Variables

**For Render (Backend):**
```
1. Go to: https://dashboard.render.com
2. Select: advancia-backend-upnrf
3. Environment → Add Environment Variable
   - Key: RESEND_API_KEY
   - Value: re_YOUR_API_KEY_HERE
4. Save (triggers redeploy)
```

**For Local Development:**
```bash
# backend/.env
RESEND_API_KEY=re_YOUR_API_KEY_HERE
EMAIL_FROM=noreply@advanciapayledger.com
```

**For Production (.env.production):**
```env
RESEND_API_KEY=re_YOUR_PRODUCTION_KEY
EMAIL_FROM=noreply@advanciapayledger.com
```

---

## Custom Email Domain Setup

### Option 1: Use Resend Domain (Quick Start)

**Free subdomain from Resend:**
```
From: noreply@resend.dev
To: user@example.com
```

No setup required - works immediately after API key is configured.

### Option 2: Custom Domain (Recommended for Production)

#### Step 1: Add Domain in Resend

```
1. Resend Dashboard → Domains → Add Domain
2. Enter: advanciapayledger.com
3. Resend will show DNS records to configure
```

#### Step 2: Configure DNS Records

**Add these records to your domain registrar:**

```dns
# SPF Record
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all
TTL: 3600

# DKIM Record 1
Type: TXT
Name: resend._domainkey
Value: [provided by Resend - unique to your domain]
TTL: 3600

# DKIM Record 2
Type: TXT
Name: resend2._domainkey
Value: [provided by Resend - unique to your domain]
TTL: 3600

# DMARC Record
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@advanciapayledger.com
TTL: 3600
```

**For Namecheap:**
```
1. Domain List → Manage → Advanced DNS
2. Add New Record → TXT Record
3. Enter each record above
4. Save All Changes
```

**For Cloudflare:**
```
1. DNS → Records → Add Record
2. Type: TXT
3. Add each record above
4. Proxy status: DNS only (gray cloud)
```

#### Step 3: Verify Domain

```
1. Return to Resend Dashboard
2. Domains → advanciapayledger.com
3. Click "Verify Domain"
4. Wait 5-30 minutes for DNS propagation
5. Status should show: ✅ Verified
```

#### Step 4: Update Email From Address

```env
# In Render environment variables or .env
EMAIL_FROM=noreply@advanciapayledger.com

# Or for specific departments:
EMAIL_FROM=support@advanciapayledger.com
```

**Test Authentication:**
```bash
# Check SPF
dig TXT advanciapayledger.com

# Check DKIM
dig TXT resend._domainkey.advanciapayledger.com

# Check DMARC
dig TXT _dmarc.advanciapayledger.com
```

---

## Email Forwarding

### Setup Email Aliases

**Route emails to your personal inbox:**

#### Option 1: Using Email Hosting Service

**ImprovMX (Free):**
```
1. Go to: https://improvmx.com
2. Add domain: advanciapayledger.com
3. Create aliases:
   - admin@advanciapayledger.com → your-personal@gmail.com
   - support@advanciapayledger.com → your-personal@gmail.com
   - noreply@advanciapayledger.com → your-personal@gmail.com
4. Add MX records to DNS
```

**DNS Configuration:**
```dns
Type: MX
Name: @
Value: mx1.improvmx.com
Priority: 10

Type: MX
Name: @
Value: mx2.improvmx.com
Priority: 20
```

#### Option 2: Using Cloudflare Email Routing (Free)

```
1. Cloudflare Dashboard → Email → Email Routing
2. Enable Email Routing
3. Add destination: your-personal@gmail.com
4. Create custom addresses:
   - admin@ → forward to personal email
   - support@ → forward to personal email
5. Cloudflare auto-configures MX records
```

#### Option 3: Using Gmail (Forwarding Only)

```
1. Gmail → Settings → Forwarding and POP/IMAP
2. Add forwarding address
3. Verify with code
4. Set up filter to auto-forward emails
```

---

## Testing Email Delivery

### Test Script

Create `/tmp/test_email.sh`:

```bash
#!/bin/bash

echo "╔══════════════════════════════════════════════╗"
echo "║     EMAIL DELIVERY TEST - Advancia Pay       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Test 1: Welcome Email
echo "=== Test 1: Welcome Email ==="
curl -X POST http://localhost:4000/api/test/email/welcome \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-api-key-123" \
  -d '{
    "email": "your-email@gmail.com",
    "username": "testuser"
  }' | jq '.'

sleep 2

# Test 2: Transaction Confirmation
echo ""
echo "=== Test 2: Transaction Confirmation ==="
curl -X POST http://localhost:4000/api/test/email/transaction \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-api-key-123" \
  -d '{
    "email": "your-email@gmail.com",
    "type": "credit",
    "amount": 100.50,
    "description": "Test payment",
    "transactionId": "TXN-12345"
  }' | jq '.'

sleep 2

# Test 3: Password Reset
echo ""
echo "=== Test 3: Password Reset Email ==="
curl -X POST http://localhost:4000/api/test/email/reset-password \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-api-key-123" \
  -d '{
    "email": "your-email@gmail.com",
    "resetToken": "test-reset-token-123"
  }' | jq '.'

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅ Email tests sent! Check your inbox       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Check:"
echo "  1. Inbox for emails from noreply@advanciapayledger.com"
echo "  2. Spam folder if not in inbox"
echo "  3. Email authentication (SPF, DKIM, DMARC)"
```

### Manual API Test

**Test Welcome Email:**
```bash
curl -X POST https://api.advanciapayledger.com/api/test/email \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-api-key-123" \
  -d '{
    "to": "your-email@gmail.com",
    "type": "welcome",
    "data": {
      "username": "Test User"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "emailId": "abc123...",
  "message": "Email sent successfully"
}
```

### Check Email in Resend Dashboard

```
1. Resend Dashboard → Emails
2. View sent emails
3. Check delivery status:
   - ✅ Delivered
   - ⏳ Pending
   - ❌ Bounced
   - ⚠️ Complained
```

---

## Email Templates

### Available Templates

The platform includes these pre-built templates:

#### 1. Welcome Email
- **Trigger**: User registration
- **Content**: Welcome message, platform features, dashboard link
- **From**: noreply@advanciapayledger.com
- **Subject**: "Welcome to Advancia Pay Ledger! 🎉"

#### 2. Transaction Confirmation
- **Trigger**: Successful transaction
- **Content**: Transaction details, amount, type, description
- **From**: noreply@advanciapayledger.com
- **Subject**: "Transaction Confirmation - [TYPE] $[AMOUNT]"

#### 3. Password Reset
- **Trigger**: User requests password reset
- **Content**: Reset link with token
- **From**: noreply@advanciapayledger.com
- **Subject**: "Reset Your Password"

#### 4. Two-Factor Authentication
- **Trigger**: 2FA code requested
- **Content**: 6-digit code
- **From**: noreply@advanciapayledger.com
- **Subject**: "Your 2FA Code: [CODE]"

#### 5. Invoice Generation
- **Trigger**: Invoice created
- **Content**: Invoice details, payment link, PDF attachment
- **From**: invoices@advanciapayledger.com
- **Subject**: "Invoice #[NUMBER] - Advancia Pay Ledger"

#### 6. Admin Notifications
- **Trigger**: New user registration, critical events
- **To**: admin@advanciapayledger.com
- **Content**: Event details, action required
- **Subject**: "Admin Alert: [EVENT]"

### Customize Templates

Templates are located in:
```
backend/src/services/emailService.ts
```

Modify HTML in each method (e.g., `sendWelcomeEmail`, `sendTransactionConfirmation`)

---

## Email Configuration in Render

### Environment Variables to Set

```
1. Go to Render Dashboard
2. Select: advancia-backend-upnrf
3. Environment → Edit
4. Add/Update:
```

| Variable | Value | Description |
|----------|-------|-------------|
| `RESEND_API_KEY` | `re_...` | Your Resend API key |
| `EMAIL_FROM` | `noreply@advanciapayledger.com` | Default sender |
| `ADMIN_EMAIL` | `admin@advanciapayledger.com` | Admin notifications |
| `SUPPORT_EMAIL` | `support@advanciapayledger.com` | Support emails |

**Save → Triggers automatic redeploy**

---

## Troubleshooting

### Issue 1: "RESEND_API_KEY not configured"

**Solution:**
```bash
# Check if API key is set
echo $RESEND_API_KEY

# Add to Render environment
# Or add to .env file for local development
```

### Issue 2: Emails Going to Spam

**Solution:**
1. Verify domain in Resend
2. Check SPF, DKIM, DMARC records
3. Use custom domain instead of resend.dev
4. Add unsubscribe link in emails
5. Warm up domain (send gradually increasing emails)

**Test Email Authentication:**
```bash
# Send test email
# Check headers in Gmail: Show Original
# Look for:
SPF: PASS
DKIM: PASS
DMARC: PASS
```

### Issue 3: "Email not delivered"

**Solution:**
```
1. Check Resend Dashboard → Emails
2. View delivery status
3. Check bounce reason
4. Verify recipient email is valid
5. Check daily sending limits (100/day free tier)
```

### Issue 4: Custom Domain Not Verifying

**Solution:**
```bash
# Check DNS propagation
dig TXT advanciapayledger.com
dig TXT resend._domainkey.advanciapayledger.com

# Wait 30-60 minutes for DNS to propagate
# Use: https://dnschecker.org

# Try verifying again in Resend Dashboard
```

### Issue 5: Rate Limit Exceeded

**Free Tier Limits:**
- 100 emails/day
- 3,000 emails/month

**Solution:**
```
1. Upgrade to paid plan ($20/month = 50,000 emails)
2. Or use multiple API keys (not recommended)
3. Implement email queueing
4. Batch notifications
```

---

## Production Checklist

Before going live:

- [ ] Resend API key configured in production
- [ ] Custom domain verified in Resend
- [ ] DNS records (SPF, DKIM, DMARC) configured
- [ ] Email forwarding set up for admin@
- [ ] Test all email templates
- [ ] Check spam score: https://www.mail-tester.com
- [ ] Verify authentication (SPF, DKIM, DMARC pass)
- [ ] Set up email monitoring/alerts
- [ ] Configure unsubscribe links (if sending marketing emails)
- [ ] Review Resend logs for any bounces

---

## Monitoring & Analytics

### Check Email Performance

**Resend Dashboard:**
```
1. Dashboard → Analytics
2. View metrics:
   - Sent
   - Delivered
   - Opened
   - Clicked
   - Bounced
   - Complained
```

### Set Up Webhooks (Optional)

Monitor email events in real-time:

```
1. Resend → Webhooks → Create Webhook
2. Endpoint: https://api.advanciapayledger.com/api/webhooks/resend
3. Events:
   - email.delivered
   - email.bounced
   - email.complained
4. Save webhook URL
```

---

## Cost Summary

| Service | Plan | Monthly Cost | Emails Included |
|---------|------|--------------|-----------------|
| Resend | Free | $0 | 3,000/month (100/day) |
| Resend | Pro | $20 | 50,000/month |
| ImprovMX | Free | $0 | Unlimited forwarding |
| Cloudflare | Free | $0 | Unlimited forwarding |

**Recommended Start:** Free tier (good for 100 users/day)

---

## Quick Reference

**Resend Dashboard:** https://resend.com/overview  
**API Documentation:** https://resend.com/docs  
**Email Tester:** https://www.mail-tester.com  
**DNS Checker:** https://dnschecker.org  

**Support:**
- Resend Support: https://resend.com/support
- ImprovMX: https://improvmx.com/support

---

**🎉 Email Configuration Complete!**

Your platform is ready to send professional transactional emails with custom domain support.
