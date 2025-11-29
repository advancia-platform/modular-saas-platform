# GitHub Actions Workflow Failure Analysis & Solutions

## 🎯 Quick Check Command

Run the workflow health check manually:

```bash
gh workflow run workflow-health-check.yml
```

Or check status programmatically:

```bash
gh run list --limit 20 --json status,conclusion,name
```

---

## 📋 Common Failed Jobs & Root Causes

### 1. **CI (Main Build & Test)**

#### Failed Jobs:

- `lint` - ESLint/Prettier/TypeScript checks
- `test` - Unit and integration tests
- `build` - Production build compilation

#### Root Causes & Solutions:

**Lint Failures:**

- **Cause:** ESLint rule violations, Prettier formatting issues, TypeScript errors
- **Solution:**
  ```bash
  npm run lint:fix        # Auto-fix ESLint
  npx prettier --write .  # Auto-format
  npm run type-check      # Check TypeScript
  ```

**Test Failures:**

- **Cause:** Breaking changes, environment misconfig, database connection issues
- **Solution:**
  ```bash
  npm run test:unit       # Run locally first
  npm run test:integration
  # Check DATABASE_URL is set correctly
  ```

**Build Failures:**

- **Cause:** Missing dependencies, type errors, import issues
- **Solution:**
  ```bash
  npm ci                  # Clean install
  npx prisma generate     # Generate Prisma client
  npm run build           # Test build
  ```

---

### 2. **CI (pnpm checks)**

#### Failed Jobs:

- `type-lint` - TypeScript type checking with pnpm

#### Root Causes & Solutions:

**pnpm Lock File Issues:**

- **Cause:** Mismatch between npm and pnpm lock files (you removed pnpm files)
- **Solution:**
  ```bash
  # This workflow should be DISABLED since we removed pnpm
  # Edit .github/workflows/ci-pnpm.yml and set:
  on:
    workflow_dispatch:  # Manual only
  ```

---

### 3. **Docker Build & Push**

#### Failed Jobs:

- `build-backend` - Backend Docker image
- `build-frontend` - Frontend Docker image

#### Root Causes & Solutions:

**Docker Build Failures:**

- **Cause:** Missing .dockerignore, large context, build arg issues
- **Solution:**
  ```bash
  docker build -t test-backend ./backend
  docker build -t test-frontend ./frontend
  # Check Dockerfile paths and build context
  ```

**Registry Push Failures:**

- **Cause:** Missing Docker Hub credentials
- **Solution:** Add secrets in GitHub repo settings:
  - `DOCKER_USERNAME`
  - `DOCKER_PASSWORD`

---

### 4. **Backup & Migration**

#### Failed Jobs:

- `backup-database` - Digital Ocean Spaces backup
- `migrate-database` - Prisma migrations

#### Root Causes & Solutions:

**Backup Failures:**

- **Cause:** Missing Digital Ocean credentials or wrong bucket name
- **Solution:** Verify secrets:
  - `DO_SPACES_KEY`
  - `DO_SPACES_SECRET`
  - `DO_SPACES_BUCKET`
  - `DO_SPACES_REGION`

**Migration Failures:**

- **Cause:** Schema conflicts, missing migrations, database connection issues
- **Solution:**
  ```bash
  cd backend
  npx prisma migrate dev --name fix_schema
  npx prisma migrate deploy  # For production
  ```

---

### 5. **Integration Tests**

#### Failed Jobs:

- `api-tests` - API endpoint testing
- `e2e-tests` - End-to-end browser tests

#### Root Causes & Solutions:

**API Test Failures:**

- **Cause:** Changed endpoints, authentication issues, test data problems
- **Solution:**
  ```bash
  npm run test:integration
  # Check test/integration/*.test.ts files
  ```

**E2E Test Failures:**

- **Cause:** Playwright browser issues, timeout, element selectors changed
- **Solution:**
  ```bash
  npx playwright install  # Install browsers
  npx playwright test
  ```

---

### 6. **Pre-commit Hook Failures**

#### Failed Jobs:

- Commit blocked during `git push`

#### Root Causes & Solutions:

**Husky Hook Errors:**

- **Cause:** npm/pnpm executable issues, missing dependencies
- **Solution:**

  ```bash
  # Quick fix: Bypass hooks
  git commit --no-verify -m "your message"

  # Permanent fix: Update husky
  npm install --save-dev husky@latest
  npx husky install
  ```

---

## 🔧 Immediate Fixes Needed

### 1. Disable pnpm Workflow (Already Removed Files)

```yaml
# Edit .github/workflows/ci-pnpm.yml
on:
  workflow_dispatch: # Manual trigger only
```

### 2. Fix Common Type Errors

```bash
cd frontend
npm run type-check

cd ../backend
npm run type-check
```

### 3. Regenerate Prisma Client

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

### 4. Clean Install Dependencies

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 SLA Monitoring Thresholds

The new `workflow-health-check.yml` monitors:

| Metric         | Target   | Alert Level |
| -------------- | -------- | ----------- |
| Success Rate   | ≥ 95%    | 🚨 < 80%    |
| Avg Build Time | ≤ 10 min | ⚠️ > 15 min |
| Max Build Time | ≤ 30 min | 🚨 > 30 min |

---

## 🚀 Quick Recovery Commands

```bash
# 1. Clean everything
git clean -fdx
rm -rf node_modules */node_modules
npm install

# 2. Regenerate Prisma
cd backend
npx prisma generate
npx prisma migrate deploy

# 3. Fix linting
npm run lint:fix
npx prettier --write .

# 4. Type check
npm run type-check

# 5. Test locally
npm run test:unit

# 6. Build
npm run build

# 7. Commit with fixes
git add .
git commit --no-verify -m "fix: resolve CI failures"
git push origin main
```

---

## 📧 Alert Configuration

Add these secrets for notifications:

1. **Email Notifications**:
   - Configure in GitHub repo: Settings → Notifications → Actions

2. **GitHub Issues**:
   - Automatic issue creation enabled in `workflow-health-check.yml`

---

## 🔍 Debug Failed Workflows

```bash
# View recent workflow runs
gh run list --limit 10

# View specific run details
gh run view <run-id>

# View logs for failed job
gh run view <run-id> --log-failed

# Download logs
gh run download <run-id>
```

---

## ✅ Pre-Push Checklist

Before pushing code, run:

```bash
npm run check  # Runs all checks
# OR individually:
npm run lint:check
npm run type-check
npm run test:unit
npm run build
```

---

## 📝 Workflow Health Report

The `workflow-health-check.yml` runs:

- **Every 6 hours** (scheduled)
- **After any workflow completes** (automatic)
- **On-demand** (manual trigger)

It will:

1. ✅ Analyze all failures in last 24 hours
2. 📊 Generate detailed report with causes
3. 🐛 Create/update GitHub issue automatically
4. 📤 Upload report as artifact

---

_Last Updated: November 29, 2025_
