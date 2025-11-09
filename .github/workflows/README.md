# 🚀 CI/CD Workflows for Advancia Pay Ledger

This directory contains GitHub Actions workflows for automated testing, building, and deployment.

## 📋 Available Workflows

### 1. 🎨 Frontend CI/CD (`frontend-ci.yml`)

**Triggers:**

- Push to `main` or `develop` branches (when `frontend/**` changes)
- Pull requests to `main` or `develop` (when `frontend/**` changes)

**Jobs:**

1. **🔍 Lint → 📝 Typecheck → 🏗️ Build** (15 min timeout)

   - Installs dependencies with `npm ci`
   - Runs ESLint
   - Runs TypeScript type checking (`tsc --noEmit`)
   - Builds Next.js production bundle
   - Uploads build artifacts (7-day retention)

2. **🔒 Security Audit** (parallel, 5 min timeout)

   - Runs `npm audit` to check for vulnerabilities

3. **🚀 Deploy to Render** (only on `main` push, after CI passes)

   - Triggers Render deployment via webhook
   - Requires `RENDER_DEPLOY_HOOK_FRONTEND` secret

4. **📢 Notify on Failure**
   - Creates GitHub summary if CI fails

---

### 2. ⚙️ Backend CI/CD (`backend-ci.yml`)

**Triggers:**

- Push to `main` or `develop` branches (when `backend/**` changes)
- Pull requests to `main` or `develop` (when `backend/**` changes)

**Jobs:**

1. **🔍 Lint → 📝 Typecheck → 🏗️ Build** (15 min timeout)

   - Installs dependencies with `npm ci`
   - Runs ESLint (if configured)
   - Runs TypeScript type checking (`tsc --noEmit`)
   - Builds backend with `npm run build`
   - Uploads build artifacts (7-day retention)

2. **🗄️ Validate Prisma Schema** (parallel, 5 min timeout)

   - Validates Prisma schema with `npx prisma validate`
   - Checks for schema drift with `npx prisma format --check`

3. **🔒 Security Audit** (parallel, 5 min timeout)

   - Runs `npm audit --audit-level=high`

4. **🧪 Run Tests** (parallel, 10 min timeout)

   - Runs `npm test` if available

5. **🚀 Deploy to Render** (only on `main` push, after all checks pass)

   - Triggers Render deployment via webhook
   - Requires `RENDER_DEPLOY_HOOK_BACKEND` secret

6. **📢 Notify on Failure**
   - Creates GitHub summary if CI fails

---

## 🔧 Setup Instructions

### 1. Add GitHub Secrets

Navigate to your repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name                   | Description                         | Example Value                                       |
| ----------------------------- | ----------------------------------- | --------------------------------------------------- |
| `RENDER_DEPLOY_HOOK_FRONTEND` | Render deploy hook URL for frontend | `https://api.render.com/deploy/srv-xxxxx?key=yyyyy` |
| `RENDER_DEPLOY_HOOK_BACKEND`  | Render deploy hook URL for backend  | `https://api.render.com/deploy/srv-zzzzz?key=wwwww` |
| `NEXT_PUBLIC_API_URL`         | Production API URL (optional)       | `https://api.advanciapayledger.com`                 |
| `NEXT_PUBLIC_WS_URL`          | Production WebSocket URL (optional) | `wss://api.advanciapayledger.com`                   |

**How to get Render deploy hooks:**

1. Go to Render Dashboard → Your service
2. Click **Settings** → **Deploy Hook**
3. Copy the webhook URL

### 2. Enable GitHub Actions

1. Go to your repository → **Actions** tab
2. If workflows are disabled, click **"I understand my workflows, go ahead and enable them"**

### 3. Test the Workflows

**Option 1: Push to trigger**

```bash
git add .github/workflows
git commit -m "feat: add CI/CD workflows"
git push origin main
```

**Option 2: Manual trigger (if configured)**

- Go to **Actions** tab → Select workflow → **Run workflow**

---

## 📊 Workflow Status Badges

Add these to your README.md:

```markdown
[![Frontend CI/CD](https://github.com/pdtribe181-prog/-modular-saas-platform/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/pdtribe181-prog/-modular-saas-platform/actions/workflows/frontend-ci.yml)

[![Backend CI/CD](https://github.com/pdtribe181-prog/-modular-saas-platform/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/pdtribe181-prog/-modular-saas-platform/actions/workflows/backend-ci.yml)
```

---

## 🔍 Troubleshooting

### Issue: "npm ci" fails

**Solution:** Make sure `package-lock.json` is committed and up-to-date

```bash
cd frontend  # or backend
npm install
git add package-lock.json
git commit -m "chore: update package-lock.json"
```

### Issue: TypeScript errors in CI but not locally

**Solution:** CI uses strict `tsc --noEmit`. Run locally:

```bash
cd frontend  # or backend
npx tsc --noEmit
```

### Issue: Deployment not triggering

**Solution:**

1. Verify `RENDER_DEPLOY_HOOK_FRONTEND` and `RENDER_DEPLOY_HOOK_BACKEND` secrets are set
2. Check workflow logs in **Actions** tab
3. Ensure push is to `main` branch

### Issue: Build artifacts not uploading

**Solution:** Check that paths exist:

- Frontend: `frontend/.next` must exist after build
- Backend: `backend/dist` must exist after build

---

## 🎯 Best Practices

### ✅ DO:

- Keep `package-lock.json` committed and synced
- Run `npm ci` (not `npm install`) in CI
- Use caching for faster builds (`cache: 'npm'`)
- Set timeouts to prevent hung jobs
- Use `continue-on-error: true` for non-critical steps
- Upload build artifacts for debugging

### ❌ DON'T:

- Don't commit `.env` files (use GitHub Secrets)
- Don't use `npm install` in CI (use `npm ci`)
- Don't skip TypeScript checks (`tsc --noEmit`)
- Don't deploy without passing tests

---

## 📈 Performance Optimization

**Current setup:**

- Frontend CI: ~8-12 minutes
- Backend CI: ~6-10 minutes

**Optimizations applied:**

- ✅ npm cache enabled (`cache: 'npm'`)
- ✅ Parallel jobs (lint, audit, tests run simultaneously)
- ✅ `npm ci --prefer-offline --no-audit` for faster installs
- ✅ Artifact retention limited to 7 days

**Further optimizations (optional):**

- Use `actions/cache` for node_modules (saves 1-2 min)
- Use matrix strategy for multi-version testing
- Run E2E tests only on PR merge (not every push)

---

## 🔐 Security

**Built-in security features:**

- ✅ npm audit runs on every build
- ✅ Prisma schema validation prevents drift
- ✅ TypeScript strict mode enforced
- ✅ Secrets never exposed in logs
- ✅ HTTPS-only deployment webhooks

**Recommendations:**

- Rotate Render deploy hooks every 90 days
- Review `npm audit` reports regularly
- Keep Node.js version updated (currently: 18)
- Monitor GitHub Dependabot alerts

---

## 📝 Customization

### Add E2E Tests (Playwright)

```yaml
e2e-tests:
  name: 🎭 E2E Tests
  runs-on: ubuntu-latest
  needs: [frontend-ci]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: "18"
    - run: cd frontend && npm ci
    - run: cd frontend && npx playwright install --with-deps
    - run: cd frontend && npm run test:e2e
```

### Add Slack Notifications

```yaml
- name: 📢 Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Add Code Coverage

```yaml
- name: 📊 Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

---

## 🆘 Support

For issues with these workflows:

1. Check **Actions** tab for detailed logs
2. Review this README for troubleshooting tips
3. Verify GitHub Secrets are configured correctly
4. Ensure Render services are running

**Useful commands:**

```bash
# Test frontend build locally
cd frontend && npm ci && npm run build

# Test backend build locally
cd backend && npm ci && npm run build

# Validate Prisma schema
cd backend && npx prisma validate

# Run TypeScript check
npx tsc --noEmit
```

---

**Last Updated:** October 26, 2025  
**Maintainer:** Advancia Pay Ledger Team  
**License:** MIT
