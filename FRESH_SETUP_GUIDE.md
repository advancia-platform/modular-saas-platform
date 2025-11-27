# Fresh Setup Guide - Advancia Platform

**Active Repository:** `advancia-platform/modular-saas-platform`  
**Backup Repository:** `advancia-platform-backup` (Archive only - do not use)

## Current Status

✅ Repository: Connected to correct remote (`advancia-platform/modular-saas-platform`)  
✅ Recent Changes: R2 integration and database setup committed  
✅ Branch: `feature/authentication-system`  
⚠️ TypeScript Errors: 245 errors across 35 files (need fixing)  
⚠️ Untracked Files: 169 new files ready to stage

---

## Step 1: Clean Installation

### Backend Setup

```powershell
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\backend

# Remove old dependencies
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Fresh install
npm install

# Generate Prisma client
npx prisma generate

# Verify installation
npm run type-check
```

### Frontend Setup

```powershell
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\frontend

# Remove old dependencies
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Fresh install
npm install

# Verify build
npm run build
```

---

## Step 2: Environment Configuration

### Backend Environment

```powershell
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\backend

# Copy example if .env doesn't exist
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}
```

**Required Environment Variables:**

```env
# Database (Production - Render PostgreSQL)
DATABASE_URL="postgresql://database_advancia:W9vl0keXJcw6zTFH0VQDGG9evLwMPyNP@dpg-d4f112trnu6s73doipjg-a.oregon-postgres.render.com/db_adnan_postrl?connection_limit=5&pool_timeout=10&sslmode=require"

# JWT
JWT_SECRET="your-strong-secret-here"
JWT_EXPIRES_IN="24h"
REFRESH_TOKEN_SECRET="your-refresh-secret-here"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Cloudflare R2
CLOUDFLARE_R2_ACCOUNT_ID="your-account-id"
CLOUDFLARE_R2_ACCESS_KEY_ID="your-access-key"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-secret-key"
CLOUDFLARE_R2_BUCKET_NAME="advancia-uploads"
CLOUDFLARE_R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
CLOUDFLARE_R2_PUBLIC_URL="https://uploads.advancia.com"

# Stripe
STRIPE_SECRET_KEY="your-stripe-key"
STRIPE_WEBHOOK_SECRET="your-webhook-secret"

# Email (Gmail SMTP)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"

# Sentry
SENTRY_DSN="your-sentry-dsn"

# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment

```powershell
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\frontend

# Copy example if .env.local doesn't exist
if (-not (Test-Path .env.local)) {
    Copy-Item .env.example .env.local
}
```

**Required:**

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

---

## Step 3: Database Setup

### Local Development Database

```powershell
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\backend

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

### Production Database (Render)

```powershell
# Test connection
npm run db:health

# Run production migrations
npm run db:migrate:prod

# Open Studio for production DB
npm run db:studio:prod
```

---

## Step 4: Start Development Servers

### Terminal 1: Backend

```powershell
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\backend
npm run dev
```

**Expected Output:**

```
🚀 Server running on http://localhost:4000
✅ Database connected
✅ Socket.IO initialized
```

### Terminal 2: Frontend

```powershell
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\frontend
npm run dev
```

**Expected Output:**

```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in X.Xs
```

---

## Step 5: Verify Setup

### Health Checks

```powershell
# Backend health
curl http://localhost:4000/api/system/health | ConvertFrom-Json

# Database health
curl http://localhost:4000/api/system/db-health | ConvertFrom-Json

# R2 health (if configured)
curl http://localhost:4000/api/health/detailed | ConvertFrom-Json
```

### Test Authentication

```powershell
# Register test user
$body = @{
    email = "test@example.com"
    password = "Test123456!"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/auth/register" -Method POST -Body $body -ContentType "application/json"

# Login
$loginBody = @{
    email = "test@example.com"
    password = "Test123456!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
```

---

## Step 6: Fix TypeScript Errors

### Current Issues (245 errors in 35 files)

**Priority Fixes:**

1. **Import path extensions** - Add `.js` to relative imports
2. **Prisma imports** - Change `{ prisma }` to default import
3. **Logger calls** - Fix object vs string arguments
4. **Type mismatches** - Fix auth middleware types

**Quick Fix Script:**

```powershell
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\backend

# Run type check to see all errors
npm run type-check

# Fix auto-fixable issues
npx eslint --fix src/**/*.ts
```

---

## Step 7: Commit Untracked Files

### Stage by Category

```powershell
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform

# 1. Trust system
git add backend/src/services/trustScoreService.ts
git add backend/src/services/telegramTrustBot.ts
git add TRUST_SYSTEM_SETUP.md

# 2. Security evaluation
git add backend/src/__tests__/security-evaluation.test.ts
git add backend/security-tests/

# 3. Monitoring
git add monitoring/

# 4. GitHub workflows
git add .github/workflows/

# 5. Documentation
git add docs/
git add *.md

# Commit in logical groups
git commit -m "feat: Add trust scoring system with Telegram integration"
git commit -m "feat: Add security evaluation framework"
git commit -m "feat: Add monitoring infrastructure (Prometheus/Grafana)"
git commit -m "feat: Add GitHub Actions workflows"
git commit -m "docs: Add comprehensive documentation"
```

---

## Step 8: Production Deployment

### Render Backend

**Service:** `srv-d4froq8gjchc73djvp00`  
**URL:** https://advancia-backend.onrender.com

**Configure Environment Variables in Render Dashboard:**

1. Go to https://dashboard.render.com/
2. Select backend service
3. Environment → Add all variables from `.env.example`
4. Save Changes (auto-deploys)

### Vercel Frontend

```powershell
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\frontend

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

---

## Troubleshooting

### Database Connection Issues

```powershell
# Test connection
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('✅ Connected')).catch(e => console.error('❌ Error:', e.message))"

# Check DATABASE_URL
$env:DATABASE_URL
```

### Port Already in Use

```powershell
# Kill process on port 4000
Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Kill process on port 3000
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

### TypeScript Module Errors

```powershell
cd backend

# Clear TypeScript cache
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue

# Reinstall types
npm install --save-dev @types/node @types/express @types/jest

# Regenerate Prisma client
npx prisma generate
```

### R2 Upload Issues

```powershell
cd backend

# Test R2 connection
bash scripts/test-r2-connection.sh

# Verify environment variables
echo $env:CLOUDFLARE_R2_ACCESS_KEY_ID
echo $env:CLOUDFLARE_R2_BUCKET_NAME
```

---

## Next Steps After Fresh Setup

1. ✅ Verify all services running locally
2. ✅ Run test suite: `npm test`
3. ✅ Fix TypeScript errors
4. ✅ Stage and commit remaining files
5. ✅ Push to GitHub
6. ✅ Deploy to Render/Vercel
7. ✅ Test production endpoints
8. ✅ Run database migrations on production
9. ✅ Configure Cloudflare DNS
10. ✅ Set up monitoring alerts

---

## Quick Reference Commands

```powershell
# Start everything
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform
# Terminal 1: Backend
cd backend; npm run dev
# Terminal 2: Frontend
cd frontend; npm run dev

# Run tests
cd backend; npm test

# Check types
cd backend; npm run type-check

# Database operations
cd backend
npx prisma studio              # Open UI
npx prisma migrate dev         # Run migrations
npx prisma db push             # Push schema changes

# Git operations
git status
git add .
git commit -m "message"
git push origin feature/authentication-system

# Deploy
cd frontend; vercel --prod
# Render deploys automatically on push to main
```

---

## Support

- **Render Dashboard:** https://dashboard.render.com/
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Cloudflare Dashboard:** https://dash.cloudflare.com/
- **GitHub Repository:** https://github.com/advancia-platform/modular-saas-platform

**Backup Repository (Archive):** https://github.com/advancia-platform-backup (DO NOT USE FOR DEVELOPMENT)
