# Cloudflare API Token Setup

## 🔑 API Token Information

**Token Name**: `Workers Builds - 2025-10-21 20:16`  
**Created**: October 21, 2025  
**Purpose**: Cloudflare Workers deployment via Wrangler CLI and GitHub Actions

---

## 📋 Where to Add This Token

### 1. Local Development (Wrangler CLI)

#### Option A: Login via Browser (Recommended)

```powershell
cd frontend
npx wrangler login
```

This opens your browser and automatically authenticates. No manual token needed.

#### Option B: Use API Token Directly

Create `frontend/.dev.vars`:

```env
CLOUDFLARE_API_TOKEN=your-token-here
```

**⚠️ IMPORTANT**: This file is gitignored. Never commit tokens!

### 2. GitHub Actions (CI/CD)

Add as a repository secret:

1. Go to: https://github.com/pdtribe181-prog/-modular-saas-platform/settings/secrets/actions
2. Click "New repository secret"
3. Add:

```
Name: CLOUDFLARE_API_TOKEN
Value: [paste your token here]
```

### 3. Verify Token Works

```powershell
# Test with Wrangler
cd frontend
npx wrangler whoami

# Expected output:
# Account Name: [Your Cloudflare Account]
# Account ID: 74ecde4d46d4b399c7295cf599d2886b
```

---

## 🚀 Deploy with Token

### Manual Deployment

```powershell
cd frontend

# Login (if not already)
npx wrangler login

# Build Next.js
npm run build

# Deploy to Workers
npx wrangler deploy
```

### Automatic Deployment (GitHub Actions)

Create `.github/workflows/deploy-frontend-cloudflare.yml`:

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
    name: Deploy Frontend
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Build Next.js with CF_PAGES flag
        working-directory: frontend
        env:
          CF_PAGES: true
          NEXT_PUBLIC_API_URL: https://api.advanciapayledger.com
          NEXT_PUBLIC_SOCKET_URL: https://api.advanciapayledger.com
        run: npm run build

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: frontend
          command: deploy --keep-vars
```

---

## 🔐 Required GitHub Secrets

Add these to your repository secrets:

| Secret Name             | Value                              | Purpose                  |
| ----------------------- | ---------------------------------- | ------------------------ |
| `CLOUDFLARE_API_TOKEN`  | `[your-token-from-dashboard]`      | Authenticate deployments |
| `CLOUDFLARE_ACCOUNT_ID` | `74ecde4d46d4b399c7295cf599d2886b` | Target account           |
| `CLOUDFLARE_ZONE_ID`    | `0bff66558872c58ed5b8b7942acc34d9` | DNS/domain operations    |

---

## 🧪 Test Deployment

### 1. Test Build Locally

```powershell
cd frontend

# Set environment variable for Cloudflare export mode
$env:CF_PAGES="true"

# Build
npm run build

# Check output directory
ls out
# Should contain: _next/, index.html, etc.
```

### 2. Test Deploy Locally

```powershell
cd frontend

# Deploy to Workers
npx wrangler deploy

# Expected output:
# ⛅️ wrangler 3.x.x
# ------------------
# Total Upload: XX.XX KiB / gzip: XX.XX KiB
# Uploaded advanciafrontend (X.XX sec)
# Published advanciafrontend (X.XX sec)
#   https://advanciafrontend.pdtribe181.workers.dev
# Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 3. Test Live Site

```powershell
# Test Workers.dev URL
curl https://advanciafrontend.pdtribe181.workers.dev

# Should return HTML from Next.js homepage
```

---

## 🚨 Troubleshooting

### Issue: "Authentication error"

**Solution**: Re-login to Wrangler

```powershell
npx wrangler logout
npx wrangler login
```

### Issue: "Invalid API token"

**Causes**:

1. Token expired (tokens can have expiration dates)
2. Token doesn't have correct permissions
3. Token was regenerated/deleted

**Solution**: Create a new token with these permissions:

- **Account** → Workers Scripts → Edit
- **Zone** → Workers Routes → Edit (if using custom domains)

### Issue: "Build failed: out directory not found"

**Solution**: Ensure `CF_PAGES=true` is set before build

```powershell
cd frontend
$env:CF_PAGES="true"
npm run build
npx wrangler deploy
```

### Issue: GitHub Actions fails with "wrangler: command not found"

**Solution**: The `cloudflare/wrangler-action@v3` handles this. Make sure you're using `@v3` or later.

---

## 📊 Monitor Deployments

### Via Dashboard

- **URL**: https://dash.cloudflare.com/74ecde4d46d4b399c7295cf599d2886b/workers/overview
- **View**: Deployments, logs, metrics

### Via Wrangler

```powershell
# List recent deployments
npx wrangler deployments list

# Tail live logs
npx wrangler tail

# View specific deployment
npx wrangler deployments view [deployment-id]
```

---

## 🔄 Token Rotation Best Practices

1. **Create tokens with expiration dates** (e.g., 90 days)
2. **Rotate before expiration**:
   - Create new token
   - Update GitHub secret
   - Test deployment
   - Revoke old token
3. **Monitor token usage** in Cloudflare dashboard
4. **Use separate tokens** for different environments (dev/staging/prod)

---

## 🔗 Next Steps

1. ✅ **Add token to GitHub Secrets**

   ```
   CLOUDFLARE_API_TOKEN=[your-token]
   CLOUDFLARE_ACCOUNT_ID=74ecde4d46d4b399c7295cf599d2886b
   CLOUDFLARE_ZONE_ID=0bff66558872c58ed5b8b7942acc34d9
   ```

2. ✅ **Create GitHub Actions workflow**

   - Copy workflow YAML above to `.github/workflows/deploy-frontend-cloudflare.yml`

3. ✅ **Test local deployment**

   ```powershell
   cd frontend
   npx wrangler login
   $env:CF_PAGES="true"
   npm run build
   npx wrangler deploy
   ```

4. ✅ **Test CI/CD deployment**

   ```powershell
   git add .
   git commit -m "Add Cloudflare Workers deployment"
   git push origin main
   # Watch GitHub Actions run
   ```

5. ⏳ **Wait for DNS propagation** (for custom domain)
6. 🔗 **Add custom domain** (after DNS active)

---

**Last Updated**: October 21, 2025  
**Token Status**: ✅ Created  
**Deployment Status**: ⏳ Pending first deployment
