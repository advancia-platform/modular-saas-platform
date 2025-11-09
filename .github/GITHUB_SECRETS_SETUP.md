# 🔐 GitHub Secrets Setup Guide

This guide shows you how to configure GitHub Secrets for automated CI/CD deployment to Render.

## 📋 Prerequisites

- GitHub repository: `pdtribe181-prog/-modular-saas-platform`
- Render account with frontend and backend services deployed
- Admin access to your GitHub repository

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Render Deploy Hooks

#### For Frontend Service:

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your **Frontend service** (advanciapayledger.com)
3. Click **Settings** in the left sidebar
4. Scroll to **Deploy Hook** section
5. Click **Create Deploy Hook**
6. Name it: `GitHub Actions - Frontend`
7. Copy the webhook URL (looks like: `https://api.render.com/deploy/srv-xxxxx?key=yyyyy`)

#### For Backend Service:

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your **Backend service** (api.advanciapayledger.com)
3. Click **Settings** in the left sidebar
4. Scroll to **Deploy Hook** section
5. Click **Create Deploy Hook**
6. Name it: `GitHub Actions - Backend`
7. Copy the webhook URL (looks like: `https://api.render.com/deploy/srv-zzzzz?key=wwwww`)

---

### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository: https://github.com/pdtribe181-prog/-modular-saas-platform
2. Click **Settings** tab (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret** button

Add these 4 secrets:

| Secret Name                   | Value                                | Required    |
| ----------------------------- | ------------------------------------ | ----------- |
| `RENDER_DEPLOY_HOOK_FRONTEND` | Frontend deploy hook URL from Step 1 | ✅ Yes      |
| `RENDER_DEPLOY_HOOK_BACKEND`  | Backend deploy hook URL from Step 1  | ✅ Yes      |
| `NEXT_PUBLIC_API_URL`         | `https://api.advanciapayledger.com`  | ⚠️ Optional |
| `NEXT_PUBLIC_WS_URL`          | `wss://api.advanciapayledger.com`    | ⚠️ Optional |

**How to add each secret:**

1. Click **New repository secret**
2. Enter the **Name** (exactly as shown above)
3. Paste the **Value**
4. Click **Add secret**
5. Repeat for all 4 secrets

---

### Step 3: Verify Secrets Are Set

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see all secrets listed:
   - ✅ `RENDER_DEPLOY_HOOK_FRONTEND`
   - ✅ `RENDER_DEPLOY_HOOK_BACKEND`
   - ✅ `NEXT_PUBLIC_API_URL` (if added)
   - ✅ `NEXT_PUBLIC_WS_URL` (if added)

---

### Step 4: Test the CI/CD Pipeline

**Option 1: Trigger by pushing code**

```bash
# Make a small change to trigger workflows
cd frontend
echo "# Test CI/CD" >> README.md
git add .
git commit -m "test: trigger CI/CD workflow"
git push origin main
```

**Option 2: Check existing workflow runs**

1. Go to your repository → **Actions** tab
2. You should see workflows running (they were triggered by the workflow files you just pushed)
3. Click on a workflow run to see details
4. Wait for all jobs to complete (~10-15 minutes total)

---

## 🎯 What Happens After Setup

### When you push to `main` branch:

**Frontend changes (`frontend/**`)\*\*

```
Trigger: Push to main with frontend/ changes
   ↓
✅ Lint with ESLint
✅ TypeScript type check
✅ Build Next.js production bundle
✅ Security audit (npm audit)
   ↓
🚀 Deploy to Render (if all checks pass)
   ↓
✅ Frontend live at: advanciapayledger.com
```

**Backend changes (`backend/**`)\*\*

```
Trigger: Push to main with backend/ changes
   ↓
✅ Lint with ESLint
✅ TypeScript type check
✅ Build backend
✅ Validate Prisma schema
✅ Security audit (npm audit)
✅ Run tests
   ↓
🚀 Deploy to Render (if all checks pass)
   ↓
✅ Backend API live at: api.advanciapayledger.com
```

---

## 🔍 Monitoring & Troubleshooting

### View Workflow Status

1. Go to **Actions** tab in your repository
2. Click on any workflow run to see:
   - ✅ Which jobs passed
   - ❌ Which jobs failed
   - 📊 Build artifacts
   - ⏱️ Execution time

### Common Issues

**Issue: "Secret not found"**

- **Solution:** Verify secret name matches exactly (case-sensitive)
- Check: `RENDER_DEPLOY_HOOK_FRONTEND` not `render_deploy_hook_frontend`

**Issue: "Deployment not triggering"**

- **Solution:** Check that:
  1. Push is to `main` branch (not `develop` or feature branch)
  2. Secret is set correctly in GitHub
  3. Render deploy hook URL is valid

**Issue: "Build failing in CI but works locally"**

- **Solution:**
  1. Run `npm ci` locally (not `npm install`)
  2. Commit `package-lock.json`
  3. Run `npx tsc --noEmit` to check TypeScript

**Issue: "Workflow not running"**

- **Solution:**
  1. Check that `.github/workflows/*.yml` files are in the repository
  2. Go to **Actions** tab → If disabled, click "Enable workflows"
  3. Push a new commit to trigger

---

## 📊 Expected Build Times

- **Frontend CI:** ~8-12 minutes (lint, typecheck, build, deploy)
- **Backend CI:** ~6-10 minutes (lint, typecheck, build, Prisma validation, deploy)
- **Render Deployment:** ~3-8 minutes (after CI triggers webhook)

**Total time from push to live:** ~15-20 minutes

---

## 🛡️ Security Best Practices

✅ **DO:**

- Keep deploy hooks secret (never commit to repository)
- Rotate deploy hooks every 90 days
- Use GitHub's encrypted secrets (never plain text)
- Review workflow logs regularly

❌ **DON'T:**

- Don't share deploy hook URLs publicly
- Don't commit secrets to `.env` files
- Don't disable security audits
- Don't skip TypeScript checks

---

## 🔄 Updating Secrets

If you need to update a secret:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click on the secret name
3. Click **Update secret**
4. Paste the new value
5. Click **Update secret**

**Note:** Changes take effect immediately for new workflow runs.

---

## 🆘 Need Help?

**Workflow logs:**

- Go to **Actions** tab → Click workflow run → View logs

**Render deployment logs:**

- Go to [Render Dashboard](https://dashboard.render.com/)
- Select service → **Logs** tab

**Test locally before pushing:**

```bash
# Frontend
cd frontend
npm ci
npm run lint
npx tsc --noEmit
npm run build

# Backend
cd backend
npm ci
npm run build
npx tsc --noEmit
npx prisma validate
```

---

## ✅ Setup Complete!

Once you've completed all steps above, your CI/CD pipeline is ready:

- ✅ Automated testing on every push
- ✅ Zero-downtime deployments to production
- ✅ Build artifacts for debugging
- ✅ Security audits on every build
- ✅ GitHub status badges in your README

**Next steps:**

1. Add status badges to your README (see `.github/workflows/README.md`)
2. Configure Slack/Discord notifications (optional)
3. Set up E2E tests (Playwright)
4. Enable Dependabot for automatic dependency updates

---

**Last Updated:** October 26, 2025  
**Setup Time:** ~5 minutes  
**Maintainer:** Advancia Pay Ledger Team
