# GitHub Actions Workflows Documentation

## 📋 Available Workflows

### 1. **deploy.yml** - Deployment Pipeline
**Triggers:** Push to `main` branch, Pull Requests to `main`

**What it does:**
- ✅ Checks out code
- ✅ Sets up Node.js 18
- ✅ Installs dependencies (backend & frontend)
- ✅ Builds both applications
- ✅ Runs tests
- ✅ Deploys to production (on main branch only)

**Uses these secrets:**
- DATABASE_URL
- REDIS_URL
- JWT_SECRET_ENCRYPTED
- JWT_ENCRYPTION_KEY
- JWT_ENCRYPTION_IV
- JWT_EXPIRATION
- SESSION_SECRET
- NODE_ENV
- PORT
- FRONTEND_URL

---

### 2. **ci.yml** - Continuous Integration
**Triggers:** Push/PR to `main` or `develop` branches

**What it does:**

#### Backend Testing:
- ✅ Spins up PostgreSQL & Redis containers
- ✅ Runs Prisma migrations
- ✅ Executes tests
- ✅ Builds the backend

#### Frontend Testing:
- ✅ Runs linter
- ✅ Executes tests
- ✅ Builds the frontend

#### Code Quality:
- ✅ Lints both backend and frontend code

---

## 🚀 How to Use

### View Workflows:
Visit: https://github.com/pdtribe181-prog/modular-saas-platform/actions

### Trigger a Workflow:
```bash
# Push to main branch
git add .
git commit -m "Deploy new features"
git push origin main
```

### Manual Trigger:
Go to Actions tab → Select workflow → Click "Run workflow"

---

## 🔧 Customizing Workflows

### Add Deployment Steps:

Edit `.github/workflows/deploy.yml` and replace the deployment section:

```yaml
- name: Deploy to Production
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  env:
    # ... your secrets ...
  run: |
    # Your deployment commands here
    
    # Example: Deploy to Vercel
    # npm install -g vercel
    # vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
    
    # Example: Deploy to AWS
    # aws deploy ...
    
    # Example: Deploy with Docker
    # docker build -t myapp .
    # docker push myapp
```

### Add More Secrets:

1. Go to: https://github.com/pdtribe181-prog/modular-saas-platform/settings/secrets/actions
2. Click "New repository secret"
3. Add name and value
4. Update workflow to use it: `${{ secrets.YOUR_SECRET }}`

---

## 📊 Workflow Status Badges

Add to your README.md:

```markdown
![Deploy](https://github.com/pdtribe181-prog/modular-saas-platform/workflows/Deploy%20Advancia%20Pay%20Ledger/badge.svg)
![CI](https://github.com/pdtribe181-prog/modular-saas-platform/workflows/CI%20-%20Test%20%26%20Build/badge.svg)
```

---

## 🎯 Best Practices

### 1. **Environment-specific Secrets**
For staging/production, use GitHub Environments:
- Go to Settings → Environments
- Create "staging" and "production" environments
- Add environment-specific secrets
- Update workflow to use environments

### 2. **Caching Dependencies**
Already implemented! Uses `cache: 'npm'` to speed up builds.

### 3. **Parallel Jobs**
CI workflow runs backend and frontend tests in parallel for speed.

### 4. **Service Containers**
CI workflow includes PostgreSQL and Redis for realistic testing.

---

## 🛠️ Common Tasks

### Run Tests Locally (Like CI Does):

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Build Locally:

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Lint Code:

```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

---

## 🔍 Troubleshooting

### Workflow Failed?
1. Go to Actions tab
2. Click on the failed workflow
3. Expand the failed step
4. Read error messages

### Common Issues:

**Missing Secrets:**
- Add them at: https://github.com/pdtribe181-prog/modular-saas-platform/settings/secrets/actions

**Test Failures:**
- Check if tests pass locally first
- Ensure DATABASE_URL and REDIS_URL are correct

**Build Failures:**
- Check Node.js version (should be 18)
- Verify dependencies are correctly listed in package.json

---

## 📚 Learn More

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Created:** October 15, 2025  
**Project:** Advancia Pay Ledger - Modular SaaS Platform  
**Repository:** https://github.com/pdtribe181-prog/modular-saas-platform
