# Cloudflare Setup Checklist - advanciapayledger.com

## ✅ Completed Steps

- [x] Domain added to Cloudflare
- [x] Zone ID obtained: `0bff66558872c58ed5b8b7942acc34d9`
- [x] Account ID obtained: `74ecde4d46d4b399c7295cf599d2886b`
- [x] Nameservers assigned: `dom.ns.cloudflare.com`, `monroe.ns.cloudflare.com`
- [x] Credentials saved to `CLOUDFLARE_CREDENTIALS.md`
- [x] Environment update script created: `Update-Cloudflare-Env.ps1`
- [x] `.gitignore` updated to protect credentials

## 📋 Immediate Next Steps (Do Now)

### 1. Update Nameservers at Domain Registrar ⏰ URGENT

Go to your domain registrar (where you bought advanciapayledger.com) and:

1. Login to your account
2. Find your domain: `advanciapayledger.com`
3. Go to **DNS Settings** or **Nameservers** or **Domain Settings**
4. Change nameservers to:
   ```
   dom.ns.cloudflare.com
   monroe.ns.cloudflare.com
   ```
5. Save changes

**⏰ Time Required**: 5-10 minutes  
**⏳ Propagation Time**: 2-48 hours (usually 2-4 hours)

### 2. Create Cloudflare API Token

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**
3. Use template: **"Edit zone DNS"**
4. Under **Zone Resources**:
   - Include → Specific zone → `advanciapayledger.com`
5. Click **"Continue to summary"**
6. Click **"Create Token"**
7. **COPY THE TOKEN** (you won't see it again!)
8. Save it securely

### 3. Run Environment Update Script

```powershell
# In your project root
.\Update-Cloudflare-Env.ps1
```

This will:

- Update `backend/.env` with Cloudflare credentials
- Update `frontend/.env.local` with new domain URLs
- Configure CORS origins for production

## ⏳ Wait for DNS Propagation (2-48 hours)

While waiting, you can:

### Check Propagation Status

```powershell
# Check nameservers
nslookup -type=NS advanciapayledger.com

# Check globally
# Visit: https://dnschecker.org/#NS/advanciapayledger.com
```

### When Nameservers Show Cloudflare

You'll see:

```
advanciapayledger.com nameserver = dom.ns.cloudflare.com
advanciapayledger.com nameserver = monroe.ns.cloudflare.com
```

## 🔧 Configure Cloudflare (After DNS Propagation)

### 1. SSL/TLS Configuration

**Dashboard**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/ssl-tls

- [ ] Set SSL/TLS encryption mode to: **Full (strict)**
- [ ] Enable **Always Use HTTPS**
- [ ] Go to Edge Certificates:
  - [ ] Enable **Always Use HTTPS**
  - [ ] Enable **Automatic HTTPS Rewrites**
  - [ ] Enable **Certificate Transparency Monitoring**

### 2. DNS Records Configuration

**Dashboard**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/dns

Add these records (if not already added):

```
Type: CNAME
Name: @
Target: [your-frontend-host].vercel.app
Proxy: ON (🟠 Proxied)
TTL: Auto

Type: CNAME
Name: api
Target: [your-backend-host].onrender.com
Proxy: ON (🟠 Proxied)
TTL: Auto

Type: CNAME
Name: www
Target: advanciapayledger.com
Proxy: ON (🟠 Proxied)
TTL: Auto

Type: CNAME
Name: admin
Target: advanciapayledger.com
Proxy: ON (🟠 Proxied)
TTL: Auto
```

### 3. Page Rules

**Dashboard**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/rules

- [ ] **Rule 1**: Bypass cache for `api.advanciapayledger.com/api/*`
- [ ] **Rule 2**: Cache static assets `*.advanciapayledger.com/*.{js,css,jpg,png,gif,svg,ico}`
- [ ] **Rule 3**: Cache HTML pages `advanciapayledger.com/*` (30 min TTL)

### 4. Firewall Rules (WAF)

**Dashboard**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/security/waf

- [ ] Block SQL Injection & XSS attempts
- [ ] Rate limit `/api/auth/*` endpoints (10 req/min)
- [ ] Challenge `/api/admin/*` endpoints (CAPTCHA)
- [ ] Enable Cloudflare Managed Ruleset
- [ ] Enable OWASP Core Ruleset

### 5. Speed Optimization

**Dashboard**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/speed/optimization

- [ ] Enable **Auto Minify**: JS, CSS, HTML
- [ ] Enable **Brotli Compression**
- [ ] Enable **Early Hints**
- [ ] Disable **Rocket Loader** (conflicts with Next.js)

### 6. Email Routing (Optional)

**Dashboard**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/email/routing

- [ ] Enable Email Routing
- [ ] Add destination email
- [ ] Create custom addresses:
  - `support@advanciapayledger.com`
  - `admin@advanciapayledger.com`
  - `noreply@advanciapayledger.com`

## 🚀 Update Production Deployments

### Backend (Render/VPS)

Update environment variables:

```bash
DOMAIN=advanciapayledger.com
FRONTEND_URL=https://advanciapayledger.com
BACKEND_URL=https://api.advanciapayledger.com
ALLOWED_ORIGINS=https://advanciapayledger.com,https://www.advanciapayledger.com,https://admin.advanciapayledger.com
```

Add custom domain:

- [ ] `api.advanciapayledger.com`

### Frontend (Vercel/Netlify)

Update environment variables:

```bash
NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com
NEXT_PUBLIC_DOMAIN=advanciapayledger.com
```

Add custom domains:

- [ ] `advanciapayledger.com`
- [ ] `www.advanciapayledger.com`
- [ ] `admin.advanciapayledger.com`

## ✅ Final Verification Tests

Once DNS is fully propagated and configured:

- [ ] Visit `https://advanciapayledger.com` - Frontend loads
- [ ] Visit `https://www.advanciapayledger.com` - Works
- [ ] Visit `https://api.advanciapayledger.com/health` - API responds
- [ ] Visit `http://advanciapayledger.com` - Redirects to HTTPS
- [ ] Test API: `https://api.advanciapayledger.com/api/auth/login`
- [ ] Check SSL: https://www.ssllabs.com/ssltest/analyze.html?d=advanciapayledger.com
- [ ] Test email: Send to `support@advanciapayledger.com`
- [ ] Check analytics: Cloudflare dashboard shows traffic

## 📊 Monitoring

After setup:

- [ ] Add GitHub Secrets:

  - `CLOUDFLARE_ZONE_ID`
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_API_TOKEN`

- [ ] Monitor Cloudflare Analytics
- [ ] Check Security Events dashboard
- [ ] Review Performance metrics
- [ ] Set up alerts for downtime

---

**Current Status**: ⏳ Waiting for nameserver propagation  
**Started**: October 21, 2025  
**Expected Active**: October 21-23, 2025  
**Domain**: advanciapayledger.com
