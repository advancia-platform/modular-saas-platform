# 🌳 Branching Strategy for Modular SaaS Platform

This document outlines the branching strategy that aligns with our CI/CD pipeline and environment-based deployments.

---

## Branch Overview

```
main (production)
├── staging (integration/QA)
│   ├── feature/login-form
│   ├── feature/dashboard-tasks
│   └── bugfix/team-routing
└── hotfix/critical-security-patch
```

---

## 1. **Main Branch (`main`)**

### Purpose

Production-ready code that's deployed to live users.

### Deployment

-   **Automatically deploys to:** Production backend (`BACKEND_URL_PROD`)
-   **Trigger:** Every push to `main`
-   **CI/CD:** GitHub Actions workflow builds and deploys to Vercel production

### Rules

-   ✅ **Protected branch** (requires PR review + CI checks)
-   ❌ **No direct commits** — only merges from `staging`
-   ✅ **Automatic deployments** on merge
-   ✅ **All tests must pass** before merge

### Environment Variables

```bash
NODE_ENV=production
BACKEND_URL_PROD=https://api.advancia.com
```

---

## 2. **Staging Branch (`staging`)**

### Purpose

Integration testing, QA validation, and pre-release verification.

### Deployment

-   **Automatically deploys to:** Staging backend (`BACKEND_URL_STAGING`)
-   **Trigger:** Every push to `staging`
-   **CI/CD:** GitHub Actions workflow builds and deploys to Vercel preview

### Rules

-   ✅ **Feature branches merge here first**
-   ✅ **QA team validates** before promoting to `main`
-   ✅ **Can be reset** if integration issues occur
-   ✅ **Tests run on every PR**

### Environment Variables

```bash
NODE_ENV=staging
BACKEND_URL_STAGING=https://staging-api.advancia.com
```

### Workflow

1. Feature branches merge into `staging`
2. QA team validates features
3. Once stable, `staging` merges into `main`

---

## 3. **Feature Branches (`feature/*`)**

### Purpose

Individual developer work for new features or enhancements.

### Naming Convention

```bash
feature/login-form
feature/dashboard-tasks
feature/crypto-wallet-ui
feature/admin-panel-filters
```

### Deployment

-   **Runs locally only:** Development backend (`BACKEND_URL_DEV`)
-   **No automatic deployment** until merged to `staging`

### Rules

-   ✅ **Branch off from `staging`**
-   ✅ **PR into `staging` when ready**
-   ✅ **Delete after merge**
-   ✅ **Keep branches focused** (one feature per branch)

### Environment Variables

```bash
NODE_ENV=development
BACKEND_URL_DEV=http://localhost:4000
```

### Developer Workflow

```bash
# 1. Create feature branch from staging
git checkout staging
git pull origin staging
git checkout -b feature/login-form

# 2. Work on feature locally
npm run dev

# 3. Commit changes
git add .
git commit -m "feat: add login form with validation"

# 4. Push and create PR to staging
git push origin feature/login-form
# Open PR on GitHub: feature/login-form → staging

# 5. After merge, delete branch
git branch -d feature/login-form
```

---

## 4. **Bugfix Branches (`bugfix/*`)**

### Purpose

Fix non-critical bugs in staging environment.

### Naming Convention

```bash
bugfix/team-routing
bugfix/task-status-update
bugfix/payment-webhook-retry
```

### Deployment

Same as feature branches (local dev only).

### Rules

-   ✅ **Branch off from `staging`**
-   ✅ **PR into `staging`**
-   ✅ **Link to issue number** in PR description

---

## 5. **Hotfix Branches (`hotfix/*`)**

### Purpose

**Urgent fixes for production** that can't wait for normal release cycle.

### Naming Convention

```bash
hotfix/critical-security-patch
hotfix/payment-gateway-down
hotfix/database-connection-leak
```

### Deployment

-   **Directly merged into `main`** after review
-   **Also merged into `staging`** to keep branches aligned

### Rules

-   ✅ **Branch off from `main`**
-   ✅ **PR into `main` (expedited review)**
-   ✅ **After merge, cherry-pick to `staging`**
-   ✅ **Tag with version number** (e.g., `v1.2.3`)

### Hotfix Workflow

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-patch

# 2. Fix the issue
# ... make changes ...

# 3. Commit and push
git add .
git commit -m "hotfix: patch XSS vulnerability in auth"
git push origin hotfix/critical-security-patch

# 4. Create PR to main (expedited review)
# Open PR: hotfix/critical-security-patch → main

# 5. After merge to main, merge to staging
git checkout staging
git pull origin staging
git merge main
git push origin staging

# 6. Tag the release
git tag v1.2.3
git push origin v1.2.3
```

---

## 🔄 Complete Workflow Example

### Scenario: Developer adds a new dashboard feature

```bash
# Step 1: Create feature branch from staging
git checkout staging
git pull origin staging
git checkout -b feature/dashboard-tasks

# Step 2: Develop locally
# proxy.ts routes to BACKEND_URL_DEV (http://localhost:4000)
npm run dev

# Step 3: Commit changes
git add .
git commit -m "feat: add task management dashboard"
git push origin feature/dashboard-tasks

# Step 4: Open PR to staging
# GitHub: feature/dashboard-tasks → staging
# CI runs tests, builds app
# Reviewer approves

# Step 5: Merge to staging
# CI/CD deploys to staging environment
# proxy.ts routes to BACKEND_URL_STAGING

# Step 6: QA validates in staging
# QA team tests feature, reports no issues

# Step 7: Merge staging to main
# GitHub: staging → main
# CI/CD deploys to production
# proxy.ts routes to BACKEND_URL_PROD

# Step 8: Monitor production
# Feature is live for users
```

---

## 🛡️ Branch Protection Rules

### `main` Branch

-   ✅ Require pull request reviews (2 approvals)
-   ✅ Require status checks to pass (CI/CD tests)
-   ✅ Require branches to be up to date
-   ✅ Restrict who can push (admins only)
-   ✅ Require signed commits

### `staging` Branch

-   ✅ Require pull request reviews (1 approval)
-   ✅ Require status checks to pass
-   ✅ Allow force pushes (for resets if needed)

### Feature/Bugfix Branches

-   No protection rules (developer freedom)

---

## 📋 Quick Reference

| Branch      | Purpose        | Deploys To     | Merge Into         | Backend URL           |
| ----------- | -------------- | -------------- | ------------------ | --------------------- |
| `main`      | Production     | Vercel Prod    | N/A                | `BACKEND_URL_PROD`    |
| `staging`   | QA/Integration | Vercel Preview | `main`             | `BACKEND_URL_STAGING` |
| `feature/*` | New features   | Local dev      | `staging`          | `BACKEND_URL_DEV`     |
| `bugfix/*`  | Bug fixes      | Local dev      | `staging`          | `BACKEND_URL_DEV`     |
| `hotfix/*`  | Urgent fixes   | Vercel Prod    | `main` + `staging` | `BACKEND_URL_PROD`    |

---

## 🚀 GitHub Secrets Required

Add these secrets in GitHub repository settings:

```bash
# Vercel
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-org-id>
VERCEL_PROJECT_ID=<your-project-id>

# Backend URLs
BACKEND_URL_DEV=http://localhost:4000
BACKEND_URL_STAGING=https://staging-api.advancia.com
BACKEND_URL_PROD=https://api.advancia.com
```

---

## 📝 Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add new dashboard feature
fix: resolve payment webhook timeout
docs: update branching strategy guide
chore: update dependencies
refactor: simplify authentication flow
test: add unit tests for task API
```

---

## 🔗 Related Documentation

-   [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Full deployment instructions
-   [BRANCH_PROTECTION_GUIDE.md](./BRANCH_PROTECTION_GUIDE.md) - Setting up branch protection
-   [CI_CD_PIPELINE.md](./CI_CD_PIPELINE.md) - GitHub Actions workflows

---

## 🆘 Troubleshooting

### "My feature isn't deploying"

-   Feature branches only run locally. Merge to `staging` to deploy.

### "Staging and main are out of sync"

-   Always merge `staging` → `main`, never the reverse.
-   If you need a hotfix, merge `main` → `staging` after hotfix.

### "CI/CD failed on deployment"

-   Check GitHub Actions logs for build errors.
-   Verify all required secrets are set.
-   Ensure backend URLs are accessible.

---

**Last Updated:** November 24, 2025  
**Maintained By:** DevOps Team
