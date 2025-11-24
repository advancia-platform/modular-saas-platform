# Render Environment Variables Update Guide

## Current Render Service

- **Service Name**: advancia-backend-upnrf
- **Region**: Oregon (US West)
- **URL**: <https://advancia-backend-upnrf.onrender.com>

## Environment Variables to Update

### Step 1: Access Render Dashboard

1. Go to <https://dashboard.render.com>
2. Select service: **advancia-backend-upnrf**
3. Click **Environment** tab

### Step 2: Update/Add These Variables

#### CORS & Frontend URLs

```env
ALLOWED_ORIGINS=https://modular-saas-platform-frontend-jej5uyfbg-advanciapayledger.vercel.app,https://admin.advanciapayledger.com
CORS_ORIGIN=https://www.advanciapayledger.com,http://localhost:3000
FRONTEND_URL=https://www.advanciapayledger.com
```

#### Database (Already Configured)

```env
DATABASE_URL=postgresql://db_adva_user:SoNL2vAIioXMn9Yuzu0wwI4zO7m9azfk@dpg-d3tqp46uk2gs73dcu2dg-a/db_adva
```

#### Email Configuration

```env
# Gmail SMTP (Backup)
GMAIL_EMAIL=advanciapayledger@gmail.com
GMAIL_APP_PASSWORD=avso gszp fjvj svmk

# SMTP Settings
SMTP_FROM_EMAIL=noreply@advanciapayledger.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# Resend API (Primary - NEEDS API KEY)
RESEND_API_KEY=re_placeholder
EMAIL_FROM=noreply@advanciapayledger.com
```

#### Security Keys (Already Configured)

```env
JWT_SECRET=esODgcxlM1LQ4tnNfVZE9zTYRWdHKChr
JWT_ENCRYPTION_KEY=2B4dF6hJ8lN0pR2tV4xZ6bD8fH0jL2nP4rT6vX8zB0dF2hJ4lN6pR8tV0xZ2b
JWT_ENCRYPTION_IV=3C5eG7iK9mO1qS3uW5yA7cE9gI1kM3oQ5sU7wY9aC3eG5iK7mO9qS1uW3y
NEXTAUTH_SECRET=G6wLKgJaOun2f9IviNkFDdXVHylbqtpHe
```

#### Stripe (Already Configured)

```env
STRIPE_SECRET_KEY=<REDACTED_STRIPE_SECRET_KEY>
STRIPE_WEBHOOK_SECRET=<REDACTED_STRIPE_WEBHOOK_SECRET>
```

#### Push Notifications (Already Configured)

```env
VAPID_PUBLIC_KEY=BK_IxYLeLV9i28EmlpogDJAy5PK_L9QoRY8ktu7EcH1EedWdfy72dp8MIpuIVBGZgVMMUNeFpVUvLeC3858PAoI
VAPID_PRIVATE_KEY=jKuvTOT7AS7CGMHH_d6-YbT26wE7mnWasyWkvj8JGeQ
VAPID_SUBJECT=mailto:support@advanciapayledger.com
```

#### Server Configuration

```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
```

### Step 3: Get Resend API Key (Required for Email)

1. **Sign up at Resend**

   ```bash
   # Visit: https://resend.com
   # Click "Get Started" or "Sign Up"
   # Use: advanciapayledger@gmail.com
   ```

2. **Create API Key**
   - Go to **API Keys** in Resend dashboard
   - Click **Create API Key**
   - Name: "Advancia Pay Production"
   - Permissions: **Full Access** (or "Sending Access" minimum)
   - Copy the key (starts with `re_`)

3. **Update in Render**

   ```env
   RESEND_API_KEY=re_... (paste your key here)
   ```

### Step 4: Verify Configuration

After updating variables, Render will auto-redeploy. Then test:

#### 1. Health Check

```bash
curl https://advancia-backend-upnrf.onrender.com/api/health
# Should return: {"status":"healthy"}
```

#### 2. Email Configuration Status

```bash
curl https://advancia-backend-upnrf.onrender.com/api/test/email/status
# Should show Resend configured
```

#### 3. Test Email Delivery

```bash
curl -X POST https://advancia-backend-upnrf.onrender.com/api/test/email/welcome \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@gmail.com", "username": "Test User"}'
```

## Important Notes

### ⚠️ CORS Configuration

Your current CORS settings allow:

- `https://modular-saas-platform-frontend-jej5uyfbg-advanciapayledger.vercel.app` (Vercel preview)
- `https://admin.advanciapayledger.com` (Custom admin domain)
- `https://www.advanciapayledger.com` (Custom main domain)
- `http://localhost:3000` (Local development)

**When you set up custom domains:**

1. Update Vercel to use `www.advanciapayledger.com`
2. Keep the Vercel preview URL for testing
3. Add any new domains to `ALLOWED_ORIGINS`

### 🔒 Security Checklist

- ✅ All secrets are secure (JWT, Stripe, VAPID)
- ✅ SMTP credentials configured (Gmail backup)
- ⚠️ **NEED**: Resend API key for primary email
- ✅ Database connection secure (SSL enabled)
- ✅ HTTPS enforced on Render

### 📧 Email Setup Status

- **Gmail SMTP**: ✅ Configured (backup for notifications)
- **Resend API**: ⚠️ Needs API key
- **Custom Domain Email**: ⏳ Pending (see EMAIL_SETUP_GUIDE.md)
- **Email Templates**: ✅ 6 templates ready
- **Test Endpoints**: ✅ 8 test routes available

### 🌐 Custom Domain Setup (Next Steps)

#### Frontend (Vercel)

1. Add domain in Vercel dashboard
2. Update DNS:

   ```
   A    @    76.76.21.21
   CNAME www  cname.vercel-dns.com
   ```

#### Backend (Render)

1. Add custom domain: `api.advanciapayledger.com`
2. Update DNS:

   ```
   CNAME api  advancia-backend-upnrf.onrender.com
   ```

3. Update `ALLOWED_ORIGINS` to include API domain

## Quick Copy-Paste for Render

**Variables to add/update in Render dashboard:**

```
ALLOWED_ORIGINS=https://modular-saas-platform-frontend-jej5uyfbg-advanciapayledger.vercel.app,https://admin.advanciapayledger.com
CORS_ORIGIN=https://www.advanciapayledger.com,http://localhost:3000
FRONTEND_URL=https://www.advanciapayledger.com
GMAIL_APP_PASSWORD=avso gszp fjvj svmk
SMTP_FROM_EMAIL=noreply@advanciapayledger.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
VAPID_SUBJECT=mailto:support@advanciapayledger.com
```

**Then get your Resend API key and add:**

```
RESEND_API_KEY=re_... (your key from resend.com)
```

## After Updating

1. **Render will auto-deploy** (takes ~2-3 minutes)
2. **Test health**: `curl .../api/health`
3. **Test email**: Use test endpoints from EMAIL_SETUP_GUIDE.md
4. **Verify CORS**: Frontend should connect without errors
5. **Check logs**: Render dashboard → Logs tab

## Next Actions

1. ✅ Update Render environment variables
2. 🔄 Get Resend API key (<https://resend.com>)
3. ⏳ Configure custom domains (see RENDER_CUSTOM_DOMAIN_SETUP.md)
4. ⏳ Set up email domain (see EMAIL_SETUP_GUIDE.md)
5. ⏳ Test all email templates
6. ⏳ Configure email forwarding (optional)

## Support Resources

- **Render Docs**: <https://render.com/docs/environment-variables>
- **Resend Docs**: <https://resend.com/docs/introduction>
- **Email Setup**: See `EMAIL_SETUP_GUIDE.md` in repo
- **Domain Setup**: See `RENDER_CUSTOM_DOMAIN_SETUP.md` in repo
