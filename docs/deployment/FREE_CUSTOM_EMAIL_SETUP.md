# Free Custom Email Setup - No Domain Purchase Required

## 🎯 Goal

Set up professional custom email (support@yourdomain.com) **completely FREE** without buying a domain.

---

## Option 1: Use Render's Free Subdomain + Email Forwarding (100% FREE)

### Step 1: Get Your Free Render Subdomain

When you deploy to Render, you get a free subdomain:

```
Frontend: advancia-frontend.onrender.com
Backend: advancia-backend.onrender.com
```

### Step 2: Use ImprovMX for Free Email Forwarding

**ImprovMX** offers FREE email forwarding (unlimited emails, unlimited domains)

#### 2.1 Sign Up for ImprovMX

1. Go to https://improvmx.com
2. Click "Get Started Free"
3. Sign up with your email
4. Verify your email

#### 2.2 Add Your Render Subdomain

1. In ImprovMX dashboard, click "Add Domain"
2. Enter: `advancia-frontend.onrender.com`
3. Click "Add Domain"

#### 2.3 Configure DNS Records

You need to add these DNS records to Render's custom domain settings:

**In Render Dashboard:**

1. Go to your frontend service
2. Click "Settings" → "Custom Domains"
3. Click "Add Custom Domain"
4. Add your subdomain

**DNS Records to Add (via your DNS provider):**

```
Type: MX
Name: advancia-frontend.onrender.com
Priority: 10
Value: mx1.improvmx.com

Type: MX
Name: advancia-frontend.onrender.com
Priority: 20
Value: mx2.improvmx.com
```

#### 2.4 Create Email Aliases (FREE)

In ImprovMX dashboard:

```
support@advancia-frontend.onrender.com → your-personal-email@gmail.com
admin@advancia-frontend.onrender.com → your-personal-email@gmail.com
noreply@advancia-frontend.onrender.com → your-personal-email@gmail.com
```

**Result:**

- Emails sent to `support@advancia-frontend.onrender.com` forward to your Gmail
- Completely FREE forever
- Professional appearance

---

## Option 2: Use a FREE Domain + Free Email (100% FREE)

### Step 1: Get a Free Domain

**Option A: Freenom (FREE .tk, .ml, .ga, .cf, .gq domains)**

1. Go to https://www.freenom.com
2. Search for available domain: `advancia.tk` or `advancia.ml`
3. Click "Get it now" → "Checkout"
4. Select "12 Months @ FREE"
5. Create account and complete registration
6. Domain is yours for FREE for 1 year (renewable)

**Option B: Free Subdomain Services**

- **Afraid.org**: Free subdomains (yourname.mooo.com, yourname.chickenkiller.com)
- **DuckDNS**: Free subdomains (yourname.duckdns.org)
- **No-IP**: Free subdomains (yourname.hopto.org)

### Step 2: Connect Free Domain to Cloudflare

1. Add your free domain to Cloudflare (still FREE)
2. Update nameservers at Freenom to Cloudflare's
3. Wait for activation (5-30 minutes)

### Step 3: Use Cloudflare Email Routing (FREE)

Cloudflare offers **FREE email forwarding** for any domain on their platform!

#### 3.1 Enable Email Routing

1. Go to Cloudflare dashboard
2. Click on your domain
3. Click "Email" → "Email Routing"
4. Click "Get started"
5. Click "Enable Email Routing"

#### 3.2 Add Destination Email

1. Enter your personal email (Gmail, Yahoo, etc.)
2. Click "Send verification email"
3. Check your inbox and click verification link

#### 3.3 Create Custom Addresses (FREE)

```
support@advancia.tk → forwards to your-email@gmail.com
admin@advancia.tk → forwards to your-email@gmail.com
noreply@advancia.tk → forwards to your-email@gmail.com
billing@advancia.tk → forwards to your-email@gmail.com
contact@advancia.tk → forwards to your-email@gmail.com
```

**Limits:**

- Unlimited custom addresses
- Unlimited forwarding
- 100% FREE forever

#### 3.4 DNS Records (Auto-configured by Cloudflare)

Cloudflare automatically adds these records:

```
Type: MX
Priority: 1
Value: route1.mx.cloudflare.net

Type: MX
Priority: 2
Value: route2.mx.cloudflare.net

Type: MX
Priority: 3
Value: route3.mx.cloudflare.net

Type: TXT
Name: @
Value: v=spf1 include:_spf.mx.cloudflare.net ~all
```

---

## Option 3: Gmail Alias + Custom Domain (FREE with workaround)

### Step 1: Use Zoho Mail Free Plan

**Zoho Mail** offers FREE email hosting for 1 custom domain (up to 5 users)

#### 3.1 Sign Up for Zoho Mail

1. Go to https://www.zoho.com/mail/zohomail-pricing.html
2. Select "Free" plan
3. Click "Sign Up Now"
4. Enter your free domain (from Freenom): `advancia.tk`
5. Complete registration

#### 3.2 Verify Domain Ownership

Add these DNS records to Cloudflare (or your DNS provider):

```
Type: TXT
Name: @
Value: zoho-verification=xxxxxx (provided by Zoho)

Type: MX
Name: @
Priority: 10
Value: mx.zoho.com

Type: MX
Name: @
Priority: 20
Value: mx2.zoho.com

Type: MX
Name: @
Priority: 50
Value: mx3.zoho.com
```

#### 3.3 Create Email Accounts (FREE)

Create up to 5 email accounts:

```
support@advancia.tk
admin@advancia.tk
noreply@advancia.tk
contact@advancia.tk
info@advancia.tk
```

**Features:**

- 5GB storage per user
- Send/receive emails
- Web interface + mobile app
- Email forwarding
- Email filters
- 100% FREE forever

---

## Option 4: Use Gmail SMTP with "Send As" Feature (FREE)

### Step 1: Set Up Email Forwarding (ImprovMX or Cloudflare)

First, set up email forwarding (Option 1 or 2 above)

### Step 2: Configure Gmail "Send As"

This allows you to **SEND** emails from your custom domain using Gmail:

#### 4.1 Enable Gmail SMTP

1. Go to Gmail settings
2. Click "Accounts and Import"
3. Click "Add another email address"
4. Enter: `support@advancia.tk`
5. Click "Next"

#### 4.2 Configure SMTP Settings

```
SMTP Server: smtp.gmail.com
Port: 587
Username: your-gmail@gmail.com
Password: [App Password - see below]
```

#### 4.3 Generate App Password

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it: "Advancia Custom Email"
4. Click "Generate"
5. Copy the 16-character password
6. Use this in Gmail SMTP settings

#### 4.4 Verify Ownership

Gmail will send a verification email to `support@advancia.tk`

- This will forward to your Gmail (via ImprovMX/Cloudflare)
- Click the verification link

**Result:**

- **Receive** emails at custom domain → forwards to Gmail
- **Send** emails from custom domain via Gmail
- Professional appearance
- 100% FREE

---

## Option 5: Nodemailer + Gmail SMTP in Your Backend (FREE)

### Use Gmail SMTP Directly in Your App

Your backend can send emails from a custom "From" address using Gmail SMTP:

#### 5.1 Update Backend Email Service

Your project already centralizes email sending in:

**File: `backend/src/services/notificationService.ts`**

This service is configured to use Gmail SMTP with environment variables that let you present your custom domain in the From/Reply-To headers. Ensure these env vars are set (see next subsection) and the service will send with:

- SMTP auth: `EMAIL_USER` / `EMAIL_PASSWORD` (use a Gmail App Password)
- Visible From: `EMAIL_FROM` (e.g., noreply@advancia.tk)
- Reply-To: `EMAIL_REPLY_TO` (e.g., support@advancia.tk)

Note: When authenticating to Gmail SMTP but sending “From” your custom domain, some receivers may mark as “via gmail.com,” and DMARC alignment may not fully pass. This is fine for many cases; for strict DMARC compliance, use a true mailbox provider for your domain (e.g., Zoho Free) and send through their SMTP instead.

#### 5.2 Add Environment Variables

**File: `backend/.env`**

```bash
# Gmail SMTP auth (use App Password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

# What recipients will see
EMAIL_FROM=noreply@advancia.tk
EMAIL_REPLY_TO=support@advancia.tk
```

**Result:**

- Emails sent from your app show "From: support@advancia.tk"
- Recipients can reply (goes to your Gmail)
- 100% FREE (Gmail allows 500 emails/day)

---

## Deliverability: SPF and DMARC (Recommended)

To improve inbox placement and reduce “via gmail.com,” set these DNS records in Cloudflare → DNS → Records for your domain (advancia.tk). These complement the auto-added Cloudflare Email Routing MX/TXT.

### SPF (authorize senders)

Start with Cloudflare Email Routing include, then add senders you’ll use. Examples:

```
Type: TXT
Name: @
Value: v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all
```

- include:\_spf.mx.cloudflare.net → for Cloudflare Email Routing (forwarding)
- include:\_spf.google.com → if you SEND via Gmail SMTP
- If using Zoho for sending, add: include:zoho.com

### DMARC (monitoring policy)

Begin with a monitoring policy so nothing is blocked while you test:

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@advancia.tk; ruf=mailto:dmarc@advancia.tk; pct=100; fo=1
```

Later you can change `p=none` → `p=quarantine` or `p=reject` once you control outbound sending via a provider that DKIM-signs for your domain (e.g., Zoho). Gmail SMTP cannot DKIM-sign with your domain unless you use Google Workspace.

### DKIM

- Cloudflare Email Routing is forwarding only (no DKIM for outbound).
- Zoho Mail will provide DKIM TXT records like `zoho._domainkey.advancia.tk` — add them as instructed in Zoho admin.
- Gmail SMTP with a personal Gmail cannot sign with your domain’s DKIM; recipients may show “via gmail.com.”

## Comparison Table

| Solution                    | Cost | Custom Domain      | Send Email        | Receive Email | Difficulty  |
| --------------------------- | ---- | ------------------ | ----------------- | ------------- | ----------- |
| ImprovMX + Render subdomain | FREE | No (subdomain)     | No (forward only) | Yes (forward) | ⭐ Easy     |
| Freenom + Cloudflare Email  | FREE | Yes (FREE .tk/.ml) | No (forward only) | Yes (forward) | ⭐⭐ Medium |
| Zoho Mail Free              | FREE | Yes (need domain)  | Yes               | Yes           | ⭐⭐ Medium |
| Gmail "Send As"             | FREE | Yes (need domain)  | Yes (via Gmail)   | Yes (forward) | ⭐⭐⭐ Hard |
| Nodemailer + Gmail          | FREE | Virtual            | Yes (from app)    | No            | ⭐⭐ Medium |

---

## My Recommendation: Option 2 (Freenom + Cloudflare)

### Why This is Best:

✅ **100% FREE** - No costs at all
✅ **Custom Domain** - advancia.tk, advancia.ml, etc.
✅ **Professional Email** - support@advancia.tk
✅ **Unlimited Addresses** - Create as many as you want
✅ **Easy Setup** - 15-30 minutes
✅ **Cloudflare Integration** - Works with your existing Cloudflare setup
✅ **Reliable** - Cloudflare's infrastructure

### Quick Setup Steps:

```
1. Register free domain at Freenom          ⏱️  5 min
2. Add domain to Cloudflare                 ⏱️  5 min
3. Enable Cloudflare Email Routing          ⏱️  3 min
4. Add destination email                    ⏱️  2 min
5. Create custom email addresses            ⏱️  5 min
6. Test email forwarding                    ⏱️  2 min
──────────────────────────────────────────────────
Total:                                       ⏱️ 22 min
```

---

## Step-by-Step: Freenom + Cloudflare Email Routing

### Phase 1: Get Free Domain (10 min)

#### 1.1 Go to Freenom

```
URL: https://www.freenom.com
```

#### 1.2 Search for Domain

```
Search: advancia

Available options:
- advancia.tk (FREE)
- advancia.ml (FREE)
- advancia.ga (FREE)
- advancia.cf (FREE)
- advancia.gq (FREE)
```

#### 1.3 Register Domain

```
1. Click "Get it now" on available domain
2. Click "Checkout"
3. Period: 12 Months @ FREE
4. Click "Continue"
5. Enter email address
6. Click "Verify My Email Address"
7. Check inbox and verify
8. Complete registration
9. Domain is yours!
```

**Domain:** advancia.tk (or your choice)

---

### Phase 2: Add to Cloudflare (10 min)

#### 2.1 Add Site to Cloudflare

```
1. Go to Cloudflare dashboard
2. Click "Add a Site"
3. Enter: advancia.tk
4. Select "Free" plan
5. Click "Add site"
```

#### 2.2 Get Cloudflare Nameservers

```
Cloudflare will show 2 nameservers:
- xxx.ns.cloudflare.com
- yyy.ns.cloudflare.com

Copy both
```

#### 2.3 Update Nameservers at Freenom

```
1. Go to Freenom: My Domains
2. Click "Manage Domain" on advancia.tk
3. Click "Management Tools" → "Nameservers"
4. Select "Use custom nameservers"
5. Paste Cloudflare nameservers:
   Nameserver 1: xxx.ns.cloudflare.com
   Nameserver 2: yyy.ns.cloudflare.com
6. Click "Change Nameservers"
```

#### 2.4 Wait for Activation

```
Return to Cloudflare
Click "Done, check nameservers"
Wait 5-30 minutes for activation
Status will change to "Active"
```

---

### Phase 3: Set Up Email Routing (10 min)

#### 3.1 Enable Email Routing

```
1. In Cloudflare, click on advancia.tk
2. Click "Email" in left sidebar
3. Click "Email Routing"
4. Click "Get started"
5. Click "Enable Email Routing"
```

#### 3.2 Add Destination Email

```
1. Enter your personal email: your-email@gmail.com
2. Click "Send verification email"
3. Check Gmail inbox
4. Click verification link in email
5. Return to Cloudflare
```

#### 3.3 Create Custom Addresses

```
Click "Create address"

Address 1:
Custom address: support@advancia.tk
Destination: your-email@gmail.com
Action: Forward

Address 2:
Custom address: admin@advancia.tk
Destination: your-email@gmail.com
Action: Forward

Address 3:
Custom address: noreply@advancia.tk
Destination: your-email@gmail.com
Action: Forward

Address 4:
Custom address: contact@advancia.tk
Destination: your-email@gmail.com
Action: Forward

Address 5:
Custom address: billing@advancia.tk
Destination: your-email@gmail.com
Action: Forward
```

**Done!** 🎉

---

### Phase 4: Configure DNS for Your Services (5 min)

#### 4.1 Add DNS Records for Frontend/Backend

```
In Cloudflare → DNS → Records:

Record 1: Root Domain
Type: CNAME
Name: @
Target: advancia-frontend.onrender.com
Proxy: ON (orange cloud)

Record 2: API Subdomain
Type: CNAME
Name: api
Target: advancia-backend.onrender.com
Proxy: ON (orange cloud)

Record 3: WWW
Type: CNAME
Name: www
Target: advancia.tk
Proxy: ON (orange cloud)
```

#### 4.2 Update Render Custom Domains

```
1. Go to Render → Frontend service
2. Settings → Custom Domains
3. Add: advancia.tk
4. Add: www.advancia.tk
5. Wait for SSL certificate (5-10 min)

6. Go to Render → Backend service
7. Settings → Custom Domains
8. Add: api.advancia.tk
9. Wait for SSL certificate
```

---

### Phase 5: Test Email Forwarding (5 min)

#### 5.1 Test Receiving Emails

```
Send a test email to: support@advancia.tk

Using Gmail:
1. Open Gmail
2. Compose new email
3. To: support@advancia.tk
4. Subject: Test Email
5. Body: This is a test
6. Click "Send"

Check if it arrives at your-email@gmail.com
Should arrive within 1-2 minutes
```

#### 5.2 Test Multiple Addresses

```
Send test emails to:
- admin@advancia.tk
- contact@advancia.tk
- billing@advancia.tk

All should forward to your Gmail
```

---

## Update Your Application

### Update Backend Environment Variables

**File: `backend/.env`**

```bash
# Email Configuration
EMAIL_FROM=noreply@advancia.tk
EMAIL_REPLY_TO=support@advancia.tk
EMAIL_SUPPORT=support@advancia.tk
EMAIL_ADMIN=admin@advancia.tk

# If using Gmail SMTP (App Password)
EMAIL_USER=your-personal-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

### Update Frontend URLs

**File: `frontend/.env.production`**

```bash
NEXT_PUBLIC_SITE_URL=https://advancia.tk
NEXT_PUBLIC_API_URL=https://api.advancia.tk
NEXT_PUBLIC_SUPPORT_EMAIL=support@advancia.tk
```

### Update Email Service

**File: `backend/src/services/notificationService.ts`**

```typescript
const emailConfig = {
  from: "Advancia <noreply@advancia.tk>",
  replyTo: "support@advancia.tk",
};
```

---

## Final Result

### What You Get (100% FREE):

✅ **Custom Domain:** advancia.tk
✅ **Professional Emails:**

- support@advancia.tk
- admin@advancia.tk
- contact@advancia.tk
- billing@advancia.tk
- noreply@advancia.tk

✅ **SSL Certificates:** Free via Cloudflare
✅ **CDN:** Global Cloudflare CDN
✅ **Email Forwarding:** Unlimited addresses
✅ **DDoS Protection:** Cloudflare security
✅ **WAF:** Basic firewall rules

### Your Live URLs:

- **Website:** https://advancia.tk
- **Admin:** https://admin.advancia.tk
- **API:** https://api.advancia.tk
- **Email:** support@advancia.tk

**Total Cost: $0/month forever** 🎉

---

## Troubleshooting

### Email not forwarding

- Wait 10-15 minutes for DNS propagation
- Check spam folder
- Verify destination email is verified in Cloudflare
- Check Cloudflare Email Routing logs

### Domain not activating in Cloudflare

- Wait up to 24 hours for nameserver propagation
- Check nameservers at Freenom are correct
- Use `nslookup advancia.tk` to verify DNS

### SSL certificate not issued in Render

- Wait 10-15 minutes
- Verify DNS points to Render
- Check Cloudflare proxy is ON (orange cloud)

---

## Alternative: If You Already Have a Domain

If you have a domain registered elsewhere (GoDaddy, Namecheap, etc.):

1. **Add to Cloudflare** (FREE)
2. **Use Cloudflare Email Routing** (FREE)
3. **Same setup as above** - Just skip Freenom step

**Result:** FREE custom email with your existing domain!

---

## Summary

**Recommended Path:**

1. Register FREE domain at Freenom (advancia.tk)
2. Add to Cloudflare (FREE)
3. Enable Cloudflare Email Routing (FREE)
4. Create unlimited custom email addresses (FREE)
5. Deploy frontend/backend to Render (FREE tier)
6. Use custom domain with Render (FREE)

**Total Time:** 30-45 minutes
**Total Cost:** $0/month
**Maintenance:** Renew Freenom domain annually (still FREE)

**You now have a professional setup with custom email at ZERO cost! 🚀**
