# 🔍 How to Check GitHub Actions Failures

**Date**: November 8, 2025  
**Platform**: Advancia Pay Ledger  

---

## 📋 Your GitHub Workflows

Located in: `.github/workflows/`

### **1. ci.yml** (Simple CI)
- **Triggers**: Push to `main`, Pull Requests
- **Jobs**:
  - Backend Build (npm ci, lint, build)
  - Frontend Build (npm ci, lint, build)

### **2. advancia-main-orchestrator.yml** (Full Orchestrator)
- **Triggers**: Push to `main`, Manual workflow dispatch
- **Jobs**:
  - Setup (Node.js 20, install tools)
  - Backend (npm install, Prisma generate, TypeScript check)
  - Frontend (npm install, Tailwind verify, Next.js build)
  - Verify (Build status confirmation)

---

## 🔗 How to Check Failed Jobs on GitHub.com

### **Step 1: Navigate to Actions Tab**

1. Go to your GitHub repository:
   ```
   https://github.com/YOUR_USERNAME/advancia-pay-ledger
   ```

2. Click the **"Actions"** tab at the top

### **Step 2: View Recent Workflow Runs**

You'll see a list of recent workflow runs:
- ✅ Green checkmark = Success
- ❌ Red X = Failed
- 🟡 Yellow dot = In progress
- ⚪ Gray circle = Queued

### **Step 3: Click on a Failed Run**

Click on any run with a ❌ to see details:
- Run number and commit message
- Which jobs failed
- Error logs for each job

### **Step 4: Expand Failed Job**

1. Click on the failed job name (e.g., "Backend Build")
2. Expand the step that failed (marked with ❌)
3. Read the error logs

---

## 🚨 Common Failure Reasons

### **1. Build Failures**

**Error**: `npm ERR! code ELIFECYCLE`

**Cause**: TypeScript errors, missing dependencies

**Fix**:
```bash
# Run locally to debug
cd backend
npm run build

# Or frontend
cd frontend
npm run build
```

### **2. Lint Failures**

**Error**: `ESLint found errors`

**Cause**: Code style issues

**Fix**:
```bash
npm run lint --fix
```

### **3. Prisma Generation Failures**

**Error**: `Prisma schema validation failed`

**Cause**: Invalid Prisma schema

**Fix**:
```bash
cd backend
npx prisma validate
npx prisma generate
```

### **4. Dependency Installation Failures**

**Error**: `npm ERR! Cannot find module`

**Cause**: package.json issues or lockfile mismatch

**Fix**:
```bash
# Delete lockfile and reinstall
rm package-lock.json
npm install
```

### **5. Next.js Build Failures**

**Error**: `Build failed` or `Module not found`

**Cause**: Missing imports, environment variables

**Fix**:
```bash
cd frontend
# Check for missing env variables
cat .env.local

# Try building locally
npm run build
```

---

## 🛠️ How to Re-Run Failed Workflows

### **Option 1: Re-run from GitHub UI**

1. Go to the failed workflow run
2. Click **"Re-run jobs"** button (top right)
3. Choose:
   - **Re-run failed jobs** (only failed ones)
   - **Re-run all jobs** (entire workflow)

### **Option 2: Push a New Commit**

```bash
# Make a small fix and push
git add .
git commit -m "fix: resolve build issue"
git push origin main
```

### **Option 3: Manual Workflow Dispatch**

For `advancia-main-orchestrator.yml`:

1. Go to Actions tab
2. Click "Advancia Full Build & Deploy Orchestrator"
3. Click **"Run workflow"** button
4. Choose branch (usually `main`)
5. Click green **"Run workflow"** button

---

## 📊 Understanding the Workflow Logs

### **Example Failed Log**:

```
Run npm run build
> backend@1.0.0 build
> tsc

src/routes/tokens.ts(45,12): error TS2345: 
Argument of type 'string' is not assignable to parameter of type 'number'.

npm ERR! code ELIFECYCLE
npm ERR! errno 1
```

**Translation**:
- File: `src/routes/tokens.ts`
- Line: 45, Column 12
- Issue: Trying to pass a string where a number is expected

**Fix**:
```typescript
// Before
const amount = "100";

// After
const amount = parseInt("100");
```

---

## 🔧 Current Workflow Issues (If Any)

### **Check if Workflows Are Running**

```bash
cd ~/projects/advancia-pay-ledger
ls -la .github/workflows/

# You should see:
# ci.yml
# advancia-main-orchestrator.yml
```

### **Local Testing Before Push**

```bash
# Test backend build
cd backend
npm install
npx prisma generate
npm run build

# Test frontend build
cd ../frontend
npm install
npm run build
```

If both pass locally, GitHub Actions should pass too.

---

## 📧 Enable Email Notifications

### **Get Notified of Failures**:

1. Go to GitHub Settings (your profile)
2. Click **Notifications**
3. Under **Actions**:
   - ✅ Enable "Email" for workflow run failures
   - ✅ Enable "Web" for browser notifications

---

## 🐛 Debug Workflow Locally with Act

**Install Act** (GitHub Actions runner for local testing):

```bash
# Install act (Linux)
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflow locally
cd ~/projects/advancia-pay-ledger
act push -W .github/workflows/ci.yml
```

This runs your GitHub Actions workflow on your local machine!

---

## ✅ Quick Checklist

Before pushing code, ensure:

- [ ] Backend builds: `cd backend && npm run build`
- [ ] Frontend builds: `cd frontend && npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] Prisma is valid: `npx prisma validate`
- [ ] Tests pass (if you have tests): `npm test`
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 📞 Summary

**To check GitHub Actions failures:**

1. Go to `https://github.com/YOUR_USERNAME/advancia-pay-ledger/actions`
2. Click on failed run (red ❌)
3. Click on failed job
4. Read error logs
5. Fix locally and push again

**Pro Tip**: Test builds locally before pushing to avoid CI failures!

---

**Last Updated**: November 8, 2025
