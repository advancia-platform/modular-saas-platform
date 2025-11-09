# Cloudflare Setup - Quick Start Checklist

## 🚀 Complete This Setup in 30 Minutes

### Prerequisites (5 min)

- [ ] Cloudflare account created (https://dash.cloudflare.com/sign-up)
- [ ] Domain registered (advancia.app, advancia.site, or similar)
- [ ] Backend deployed with URL (e.g., advancia-backend.onrender.com)
- [ ] Frontend deployed with URL (e.g., advancia-frontend.vercel.app)

---

## Step 1: Add Domain to Cloudflare (5 min)

1. [ ] Go to Cloudflare Dashboard: https://dash.cloudflare.com
2. [ ] Click **"Add a Site"**
3. [ ] Enter domain: `advancia.app`
4. [ ] Select **Free** plan → Click Continue
5. [ ] Copy the 2 nameservers shown (e.g., `ava.ns.cloudflare.com`)
6. [ ] Go to your domain registrar (Namecheap, GoDaddy, etc.)
7. [ ] Update nameservers to Cloudflare's
8. [ ] Wait 5-30 minutes for activation
9. [ ] Copy **Zone ID** from Cloudflare dashboard (right sidebar)

**Save these values:**

```
Zone ID: ____________________________________
Nameserver 1: _______________________________
Nameserver 2: _______________________________
```

---

## Step 2: Create Cloudflare API Token (3 min)

1. [ ] Go to: https://dash.cloudflare.com/profile/api-tokens
2. [ ] Click **"Create Token"**
3. [ ] Use template: **"Edit zone DNS"**
4. [ ] Select your zone: `advancia.app`
5. [ ] Click **"Continue to summary"** → **"Create Token"**
6. [ ] **COPY THE TOKEN** (you'll only see it once!)

**Save this value:**

```
API Token: __________________________________________
```

---

## Step 3: Add Secrets to GitHub (2 min)

1. [ ] Go to your GitHub repository
2. [ ] Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. [ ] Click **"New repository secret"**
4. [ ] Add two secrets:

```
Name: CLOUDFLARE_API_TOKEN
Value: [paste token from Step 2]

Name: CLOUDFLARE_ZONE_ID
Value: [paste Zone ID from Step 1]
```

---

## Step 4: Update Configuration Files (5 min)

### Edit `.github/workflows/cloudflare-setup.yml`

Replace these lines (around line 22):

```yaml
env:
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  ZONE_ID: ${{ secrets.CLOUDFLARE_ZONE_ID }}
  DOMAIN: advancia.app # ← CHANGE THIS
  BACKEND_ORIGIN: advancia-backend.onrender.com # ← CHANGE THIS
  FRONTEND_ORIGIN: advancia-frontend.vercel.app # ← CHANGE THIS
  BACKEND_IP: 203.0.113.45 # ← CHANGE THIS (if using IP)
```

**Your values:**

```
DOMAIN: _______________________________
BACKEND_ORIGIN: ________________________
FRONTEND_ORIGIN: _______________________
BACKEND_IP: ____________________________ (optional)
```

### Edit `.infrastructure/cloudflare/workers/api-gateway.js`

Replace these lines (around line 7):

```javascript
const CONFIG = {
  BACKEND_ORIGIN: 'https://advancia-backend.onrender.com', // ← CHANGE THIS
  ALLOWED_ORIGINS: [
    'https://advancia.app',           // ← CHANGE THIS
    'https://www.advancia.app',       // ← CHANGE THIS
    'https://admin.advancia.app',     // ← CHANGE THIS
    'http://localhost:3000',          // Keep for development
    'http://127.0.0.1:3000',          // Keep for development
  ],
```

---

## Step 5: Run GitHub Actions Workflow (3 min)

1. [ ] Commit and push your changes
2. [ ] Go to GitHub: **Actions** tab
3. [ ] Select **"Cloudflare Infrastructure Setup"**
4. [ ] Click **"Run workflow"** → Select `setup-all` → **"Run workflow"**
5. [ ] Wait 2-3 minutes for completion
6. [ ] Check for green ✅ checkmark

**OR manually run via GitHub CLI:**

```bash
gh workflow run cloudflare-setup.yml -f action=setup-all
```

---

## Step 6: Deploy Cloudflare Worker (5 min)

### Option A: Via Dashboard (Recommended for first time)

1. [ ] Go to: **Workers & Pages** → **Create application** → **Create Worker**
2. [ ] Name it: `advancia-api-gateway`
3. [ ] Click **"Deploy"**
4. [ ] Click **"Edit code"**
5. [ ] Copy entire content from `.infrastructure/cloudflare/workers/api-gateway.js`
6. [ ] Paste into editor (replace all content)
7. [ ] Click **"Save and deploy"**
8. [ ] Go to **Settings** → **Triggers** → **Add route**
9. [ ] Route: `api.advancia.app/*`
10. [ ] Zone: `advancia.app`
11. [ ] Click **"Add route"**

### Option B: Via Wrangler CLI

```bash
cd .infrastructure/cloudflare/workers
npm install -g wrangler
wrangler login
wrangler deploy api-gateway.js --name advancia-api-gateway
wrangler route add api.advancia.app/* advancia-api-gateway
```

---

## Step 6.5: One‑Click Finalize via GitHub Actions (2–3 min)

If you prefer an automated Worker publish and a Render frontend deploy trigger, use the repository Action named "Finalize Advancia Platform Setup".

Required repository secrets (GitHub → Settings → Secrets and variables → Actions):

- RENDER_DEPLOY_HOOK_FRONTEND
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_ZONE_ID
- (optional) DISCORD_WEBHOOK_URL

How to run:

1. Push your latest changes.
2. Go to GitHub → Actions → "Finalize Advancia Platform Setup" → Run workflow.
3. Provide inputs:

- domain: your root domain (e.g., advancia.app)
- backend_origin: your backend URL (e.g., https://advancia-backend.onrender.com)

4. The workflow will:

- Trigger the Render frontend deploy via the deploy hook (if set).
- Publish the Cloudflare Worker in `.infrastructure/cloudflare/workers` with route: `api.${domain}/*`.
- Post a Discord message if configured.

Verify after the run:

```bash
curl -s https://api.<your-domain>/api/system/health | jq .
```

You should see a JSON payload from the backend.

---

## Step 7: Verify Setup (5 min)

### DNS Propagation

- [ ] Check: https://dnschecker.org/#A/advancia.app
- [ ] All locations should show Cloudflare IPs (104.x.x.x)

### SSL Certificate

- [ ] Check: https://www.ssllabs.com/ssltest/analyze.html?d=advancia.app
- [ ] Should show **A or A+** rating

### Endpoint Tests

```bash
# Test root domain
curl -I https://advancia.app
# Should return 200 OK

# Test API endpoint
curl https://api.advancia.app/api/system/health
# Should return backend response

# Test WWW redirect
curl -I https://www.advancia.app
# Should return 200 OK

# Test admin subdomain
curl -I https://admin.advancia.app
# Should return 200 OK
```

### HTTPS Redirect

- [ ] Visit: http://advancia.app (HTTP)
- [ ] Should auto-redirect to: https://advancia.app (HTTPS)

### Security Headers

```bash
curl -I https://api.advancia.app/api/health | grep -i "x-"
```

Should show:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

---

## Step 8: Configure Email Routing (Optional, 5 min)

1. [ ] Go to: **Email** → **Email Routing** → **Get started**
2. [ ] Click **"Enable Email Routing"**
3. [ ] Add destination email (your personal email)
4. [ ] Verify destination by clicking link in email
5. [ ] Add custom addresses:
   - [ ] `support@advancia.app` → your-email@gmail.com
   - [ ] `admin@advancia.app` → your-email@gmail.com
   - [ ] `noreply@advancia.app` → your-email@gmail.com

Test:

```bash
# Send test email to support@advancia.app
# Check if it arrives at your destination email
```

---

## Step 9: Update Backend Environment Variables (3 min)

In your backend (Render/Railway/etc.), add:

```bash
# Cloudflare Configuration
CLOUDFLARE_ZONE_ID=your_zone_id_here
FRONTEND_URL=https://advancia.app

# Update CORS origins
ALLOWED_ORIGINS=https://advancia.app,https://www.advancia.app,https://admin.advancia.app

# SSL
TRUST_PROXY=true
```

Restart backend service.

---

## Step 10: Update Frontend Environment Variables (2 min)

In your frontend (Vercel/Netlify/etc.), update:

```bash
NEXT_PUBLIC_API_URL=https://api.advancia.app

# Or in .env.production
NEXT_PUBLIC_API_URL=https://api.advancia.app
```

Redeploy frontend.

---

## ✅ Final Verification Checklist

- [ ] Domain shows Cloudflare nameservers in WHOIS
- [ ] DNS records created for @, api, www, admin
- [ ] SSL certificate issued (Full strict mode)
- [ ] HTTPS redirect working
- [ ] Backend API accessible via https://api.advancia.app
- [ ] System health OK at https://api.advancia.app/api/system/health
- [ ] Frontend accessible via https://advancia.app
- [ ] WWW redirect working (www.advancia.app → advancia.app)
- [ ] Admin panel accessible via https://admin.advancia.app
- [ ] Security headers present in responses
- [ ] WAF rules active (check Security Events tab)
- [ ] Cloudflare Worker deployed and routing correctly
- [ ] Email routing working (if configured)
- [ ] Backend CORS updated for new domain
- [ ] Frontend API URL updated

Bonus developer tools:

- CORS origins debug endpoint: `GET https://api.<your-domain>/api/system/cors-origins`
- Admin Tools page (frontend) for email tests: `src/app/admin/tools/page.tsx` calls `POST /api/auth/test-email`

---

## 📊 Monitoring (Ongoing)

### Daily

- [ ] Check **Analytics** → Overview for traffic patterns
- [ ] Review **Security** → Events for blocked requests
- [ ] Monitor **Speed** → Observatory for performance

### Weekly

- [ ] Review **Analytics** → Traffic report
- [ ] Check **Caching** → Configuration for optimization
- [ ] Review **Firewall** → Events for false positives

### Monthly

- [ ] Review **SSL/TLS** → Edge Certificates expiry
- [ ] Audit **WAF** → Custom rules effectiveness
- [ ] Check **Speed** → Observatory recommendations

---

## 🐛 Troubleshooting

### DNS not propagating

- Wait 24-48 hours for full propagation
- Clear local DNS cache:
  - Windows: `ipconfig /flushdns`
  - Mac: `sudo dscacheutil -flushcache`
- Check specific DNS: `nslookup advancia.app 1.1.1.1`

### SSL errors

- Ensure backend has valid SSL certificate
- Check SSL mode is "Full (strict)"
- Verify backend accepts HTTPS on correct port

### API CORS errors

- Verify backend `ALLOWED_ORIGINS` includes new domain
- Check Worker script `ALLOWED_ORIGINS` array
- Inspect browser console for specific error

### 522 errors (Origin connection timeout)

- Check backend is running and accessible
- Verify backend accepts connections from Cloudflare IPs
- Check firewall rules allow Cloudflare IP ranges

### 524 errors (Origin timeout)

- Backend taking too long to respond (>100s)
- Optimize slow database queries
- Increase backend timeout settings

---

## 📚 Resources

- [Cloudflare Dashboard](https://dash.cloudflare.com)
- [DNS Checker](https://dnschecker.org)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [Cloudflare Status](https://www.cloudflarestatus.com)
- [Cloudflare Community](https://community.cloudflare.com)
- [Documentation](https://developers.cloudflare.com)

---

## 🎉 Setup Complete!

**Total Time:** ~30-45 minutes

Your Advancia Pay Ledger is now:

- ✅ Protected by Cloudflare's global CDN
- ✅ Secured with enterprise-grade WAF
- ✅ Optimized for performance worldwide
- ✅ Monitored for security threats
- ✅ Ready for production traffic

**Next Steps:**

1. Share the new domain with your team
2. Update all external links and documentation
3. Monitor Cloudflare Analytics for first 24-48 hours
4. Set up alerts for security events (Pro plan)

**Need Help?** Check `CLOUDFLARE_SETUP_GUIDE.md` for detailed configuration.
