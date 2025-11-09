# Quick Start: Deploy Frontend to Cloudflare Workers

## ✅ What's Been Set Up

1. **`wrangler.toml`** - Cloudflare Workers configuration
2. **`next.config.js`** - Already configured with `CF_PAGES` support
3. **GitHub Actions workflow** - `.github/workflows/deploy-frontend-cloudflare.yml`
4. **API Token documentation** - `CLOUDFLARE_API_TOKEN_SETUP.md`

---

## 🚀 Deploy Now (3 Steps)

### Step 1: Add API Token to GitHub Secrets

1. Go to: https://github.com/pdtribe181-prog/-modular-saas-platform/settings/secrets/actions
2. Click "**New repository secret**"
3. Add these secrets:

```
Name: CLOUDFLARE_API_TOKEN
Value: [paste your "Workers Builds - 2025-10-21 20:16" token]

Name: CLOUDFLARE_ACCOUNT_ID
Value: 74ecde4d46d4b399c7295cf599d2886b

Name: CLOUDFLARE_ZONE_ID
Value: 0bff66558872c58ed5b8b7942acc34d9
```

### Step 2: Test Local Build (Optional)

```powershell
cd frontend

# Install dependencies (if needed)
npm install

# Set Cloudflare export mode
$env:CF_PAGES="true"

# Build
npm run build

# Check output
ls out
# Should see: _next/, index.html, etc.
```

### Step 3: Deploy via GitHub

```powershell
# Commit the new files
git add .
git commit -m "Add Cloudflare Workers deployment config"
git push origin main
```

GitHub Actions will automatically:

1. Build the frontend with `CF_PAGES=true`
2. Deploy to Cloudflare Workers
3. Make it live at: https://advanciafrontend.pdtribe181.workers.dev

---

## 🧪 Test Deployment

### Check Build Status

1. Go to: https://github.com/pdtribe181-prog/-modular-saas-platform/actions
2. Look for "Deploy Frontend to Cloudflare Workers" workflow
3. Click to see logs

### Test Live Site

```powershell
# Test Workers URL
curl https://advanciafrontend.pdtribe181.workers.dev

# Should return Next.js HTML
```

---

## 🔧 Manual Deployment (Alternative)

If you want to deploy manually without GitHub Actions:

```powershell
cd frontend

# Login to Cloudflare
npx wrangler login

# Build for Cloudflare
$env:CF_PAGES="true"
npm run build

# Deploy
npx wrangler deploy

# Output will show:
# ✅ Published advanciafrontend
# https://advanciafrontend.pdtribe181.workers.dev
```

---

## 🌐 Next Steps After Deployment

### 1. Verify Workers Deployment

- Check: https://dash.cloudflare.com/74ecde4d46d4b399c7295cf599d2886b/workers/overview
- Should see "advanciafrontend" worker

### 2. Wait for DNS Propagation

Your nameservers need to be active:

- `dom.ns.cloudflare.com`
- `monroe.ns.cloudflare.com`

Check status: https://www.whatsmydns.net/#NS/advanciapayledger.com

### 3. Add Custom Domain (After DNS)

```powershell
cd frontend
npx wrangler domains add advanciapayledger.com
npx wrangler domains add www.advanciapayledger.com
```

Or via dashboard:

1. Go to: Workers & Pages → advanciafrontend → Settings → Domains
2. Click "Add custom domain"
3. Enter: `advanciapayledger.com`

---

## 🚨 Troubleshooting

### Build Failed: "out directory not found"

**Solution**: Ensure `CF_PAGES=true` is set before build

```powershell
$env:CF_PAGES="true"
npm run build
```

### GitHub Actions Failed: "Authentication error"

**Solution**: Check that `CLOUDFLARE_API_TOKEN` secret is added correctly

### Build Failed: "Module not found"

**Solution**: Ensure dependencies are installed

```powershell
cd frontend
npm install
npm run build
```

### Custom Domain Not Working

**Solution**: DNS not propagated yet. Wait 2-48 hours after nameserver update.

---

## 📊 Monitor Your Deployment

### Live Logs

```powershell
cd frontend
npx wrangler tail
```

### Deployment History

```powershell
cd frontend
npx wrangler deployments list
```

### Metrics Dashboard

- URL: https://dash.cloudflare.com/74ecde4d46d4b399c7295cf599d2886b/workers/overview
- View: Requests, errors, CPU time, latency

---

## ✅ Success Checklist

- [ ] GitHub secrets added (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ZONE_ID)
- [ ] Committed wrangler.toml and workflow file
- [ ] Pushed to main branch
- [ ] GitHub Actions workflow succeeded
- [ ] Site accessible at: https://advanciafrontend.pdtribe181.workers.dev
- [ ] DNS propagation complete (check with whatsmydns.net)
- [ ] Custom domain added: advanciapayledger.com
- [ ] SSL/TLS configured (Full strict mode)

---

**Last Updated**: October 21, 2025  
**Current Status**: ⏳ Ready to deploy  
**Next Action**: Add API token to GitHub secrets, then push to trigger deployment
