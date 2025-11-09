# Cloudflare Workers Frontend Deployment Guide

## 🎯 Current Deployment Status

**Worker Name**: `advanciafrontend`  
**Account ID**: `74ecde4d46d4b399c7295cf599d2886b`  
**Production URL**: https://advanciafrontend.pdtribe181.workers.dev  
**Custom Domain**: advanciapayledger.com (pending DNS setup)

---

## 📦 What is Cloudflare Workers?

Cloudflare Workers is a serverless execution environment that runs your code at the edge (Cloudflare's global network of 300+ data centers). Perfect for:

- **Next.js Static Sites** (via `next export`)
- **Next.js SSR** (via `@cloudflare/next-on-pages`)
- **Low Latency** - Code runs close to users globally
- **No Cold Starts** - Instant response times
- **Free Tier** - 100,000 requests/day

---

## 🏗️ Deployment Architecture

```
User Request
    ↓
advanciapayledger.com (Custom Domain)
    ↓
Cloudflare DNS (Proxied)
    ↓
Cloudflare Workers (advanciafrontend)
    ↓
Next.js Frontend (Edge-optimized)
    ↓
Backend API (api.advanciapayledger.com → Render)
```

---

## 🚀 Deployment Options

### Option 1: Deploy via Wrangler CLI (Recommended)

#### 1. Install Wrangler

```powershell
# Global install
npm install -g wrangler

# Or use npx (no install needed)
npx wrangler --version
```

#### 2. Login to Cloudflare

```powershell
wrangler login
```

This opens browser to authenticate with your Cloudflare account.

#### 3. Create `wrangler.toml` in Frontend

Create `frontend/wrangler.toml`:

```toml
name = "advanciafrontend"
compatibility_date = "2025-10-21"
account_id = "74ecde4d46d4b399c7295cf599d2886b"

# For static Next.js export
main = "out/_worker.js"

[site]
bucket = "./out"

# Custom domain (after DNS setup)
routes = [
  { pattern = "advanciapayledger.com/*", zone_name = "advanciapayledger.com" },
  { pattern = "www.advanciapayledger.com/*", zone_name = "advanciapayledger.com" }
]

# Environment variables
[vars]
NEXT_PUBLIC_API_URL = "https://api.advanciapayledger.com"
NEXT_PUBLIC_SOCKET_URL = "https://api.advanciapayledger.com"

# Secrets (set via: wrangler secret put SECRET_NAME)
# Don't commit actual secrets to wrangler.toml!
```

#### 4. Build Next.js for Workers

**Option A: Static Export** (Simplest)

```powershell
cd frontend

# Update next.config.js
# Add: output: 'export'

npm run build
npx wrangler deploy
```

**Option B: SSR with `@cloudflare/next-on-pages`** (Advanced)

```powershell
cd frontend
npm install --save-dev @cloudflare/next-on-pages

# Build
npx @cloudflare/next-on-pages

# Deploy
npx wrangler deploy
```

#### 5. Deploy

```powershell
# Deploy to production
wrangler deploy

# Deploy to preview
wrangler deploy --env preview

# Deploy specific version
wrangler deploy --name advanciafrontend-v2
```

---

### Option 2: Deploy via Cloudflare Pages (Easiest)

Cloudflare Pages = Workers + automatic Git integration.

#### 1. Connect GitHub Repository

1. Go to: https://dash.cloudflare.com/[account-id]/pages
2. Click "Create application"
3. Select "Connect to Git"
4. Choose repository: `pdtribe181-prog/-modular-saas-platform`
5. Select branch: `main`

#### 2. Configure Build Settings

```yaml
Build command: npm run build
Build output directory: frontend/out (or frontend/.vercel/output/static)
Root directory: frontend
Node version: 18
```

#### 3. Environment Variables

Add in Pages dashboard:

```
NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com
NEXT_PUBLIC_SOCKET_URL=https://api.advanciapayledger.com
```

#### 4. Deploy

- **Automatic**: Push to `main` branch triggers deployment
- **Manual**: Click "Retry deployment" in dashboard

---

## 🔗 Connect Custom Domain

### Step 1: Verify DNS Setup

Ensure `advanciapayledger.com` is using Cloudflare nameservers:

```
dom.ns.cloudflare.com
monroe.ns.cloudflare.com
```

### Step 2: Add Custom Domain to Worker

#### Via Dashboard:

1. Go to: Workers & Pages → `advanciafrontend` → Settings → Domains
2. Click "Add custom domain"
3. Enter: `advanciapayledger.com`
4. Click "Add domain"

Cloudflare automatically creates DNS records:

```
Type: CNAME
Name: advanciapayledger.com
Content: advanciafrontend.pdtribe181.workers.dev
Proxied: Yes
```

#### Via Wrangler:

```powershell
wrangler domains add advanciapayledger.com
wrangler domains add www.advanciapayledger.com
```

### Step 3: Verify

```powershell
# Check DNS propagation
nslookup advanciapayledger.com

# Test endpoints
curl https://advanciapayledger.com
curl https://advanciafrontend.pdtribe181.workers.dev
```

---

## 🔐 Environment Secrets

Never commit secrets to `wrangler.toml`! Use Wrangler secrets:

```powershell
# Set secret
wrangler secret put SECRET_NAME
# Paste value when prompted

# List secrets (names only, not values)
wrangler secret list

# Delete secret
wrangler secret delete SECRET_NAME
```

Example secrets:

```powershell
wrangler secret put STRIPE_PUBLIC_KEY
wrangler secret put NEXT_PUBLIC_VAPID_PUBLIC_KEY
```

---

## 📊 Monitor Deployments

### Via Dashboard

- **URL**: https://dash.cloudflare.com/[account-id]/workers/overview
- **Metrics**: Requests, errors, CPU time, duration

### Via Wrangler

```powershell
# Tail live logs
wrangler tail

# View deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback
```

---

## 🔄 CI/CD with GitHub Actions

Create `.github/workflows/deploy-frontend-workers.yml`:

```yaml
name: Deploy Frontend to Cloudflare Workers

on:
  push:
    branches: [main]
    paths:
      - "frontend/**"
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Build Next.js
        run: |
          cd frontend
          npm run build

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: frontend
          command: deploy
```

### Required GitHub Secrets

```
CLOUDFLARE_API_TOKEN - Create at: https://dash.cloudflare.com/profile/api-tokens
CLOUDFLARE_ACCOUNT_ID - 74ecde4d46d4b399c7295cf599d2886b
```

---

## 🧪 Testing Deployment

### 1. Test Workers.dev URL

```powershell
# Production
curl https://advanciafrontend.pdtribe181.workers.dev

# Should return Next.js homepage HTML
```

### 2. Test Custom Domain (After DNS)

```powershell
curl https://advanciapayledger.com
curl https://www.advanciapayledger.com
```

### 3. Test API Connectivity

```powershell
# From frontend Worker, test backend API
curl https://advanciapayledger.com/api/health
# Should proxy to backend at api.advanciapayledger.com
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Build Fails with "Module not found"

**Solution**: Ensure all dependencies are in `package.json`, not just `devDependencies`.

```powershell
cd frontend
npm install --save [missing-package]
```

### Issue 2: Custom Domain Shows "ERR_NAME_NOT_RESOLVED"

**Solution**: DNS not propagated yet. Wait 2-24 hours or check:

```powershell
nslookup advanciapayledger.com
# Should show Cloudflare IPs
```

### Issue 3: "Account ID mismatch"

**Solution**: Verify `account_id` in `wrangler.toml` matches:

```powershell
wrangler whoami
# Should show: 74ecde4d46d4b399c7295cf599d2886b
```

### Issue 4: 500 Internal Server Error on Worker

**Solution**: Check logs:

```powershell
wrangler tail
# Look for errors in real-time
```

### Issue 5: Environment Variables Not Working

**Solution**: Use `wrangler secret` for sensitive values, `[vars]` for public values.

```powershell
# Public (in wrangler.toml)
[vars]
NEXT_PUBLIC_API_URL = "https://api.advanciapayledger.com"

# Secret (via CLI)
wrangler secret put DATABASE_URL
```

---

## 📚 Next Steps

1. ✅ **Verify Current Deployment**

   ```powershell
   curl https://advanciafrontend.pdtribe181.workers.dev
   ```

2. ⏳ **Wait for DNS Propagation** (if nameservers changed)

   - Check status: https://www.whatsmydns.net/#NS/advanciapayledger.com

3. 🔗 **Add Custom Domain**

   ```powershell
   wrangler domains add advanciapayledger.com
   ```

4. 🔐 **Configure SSL/TLS** (Auto via Cloudflare)

   - Go to: SSL/TLS → Overview → Set to "Full (strict)"

5. 🛡️ **Enable Firewall Rules**

   - Go to: Security → WAF → Create rules

6. 📈 **Monitor Performance**
   - Go to: Analytics → Workers

---

## 🔗 Useful Links

- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **Next.js on Workers**: https://github.com/cloudflare/next-on-pages
- **Wrangler CLI Docs**: https://developers.cloudflare.com/workers/wrangler/
- **Your Worker Dashboard**: https://dash.cloudflare.com/74ecde4d46d4b399c7295cf599d2886b/workers/overview

---

## 💡 Pro Tips

1. **Use Preview Deployments**: Test changes on `*-advanciafrontend.pdtribe181.workers.dev` before production
2. **Enable Caching**: Configure cache rules in Cloudflare dashboard for static assets
3. **Set Up Alerts**: Get notified of deployment failures or errors
4. **Use `wrangler tail`**: Debug issues in real-time
5. **Version Naming**: Deploy with descriptive names: `wrangler deploy --name advanciafrontend-feature-x`

---

**Last Updated**: October 21, 2025  
**Worker Status**: ✅ Deployed at `advanciafrontend.pdtribe181.workers.dev`  
**Custom Domain Status**: ⏳ Pending DNS setup
