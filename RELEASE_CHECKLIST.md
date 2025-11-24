# 🚀 Release Checklist for Production Deployment

**Purpose**: Systematic validation workflow to ensure safe, compliant production releases  
**When to use**: Before merging feature branches into `main` or deploying to production  
**Last updated**: 2025-11-24

---

## 📋 Pre-Merge Validation

### 1.1 Security & Secrets ✅

- [ ] **No secrets in current files**: Run `grep -r "sk_live\|pk_live\|ghp_" --exclude-dir={node_modules,.git}` → Zero matches
- [ ] **No secrets in recent commits**: Review last 10 commits with `git log -p -10 | grep -E "(API|SECRET|KEY|TOKEN|PASSWORD)"`
- [ ] **Rotated secrets whitelisted**: All 5 GitHub secret scanning URLs visited and approved:
  - [ ] GitHub PAT: [35uGh343m3zGig9pxSpeHuMCD9C](https://github.com/advancia-platform/modular-saas-platform/security/secret-scanning/unblock-secret/35uGh343m3zGig9pxSpeHuMCD9C)
  - [ ] Stripe Test Key #1: [35uGh0n48f6cW6vsUwb1KWbH74V](https://github.com/advancia-platform/modular-saas-platform/security/secret-scanning/unblock-secret/35uGh0n48f6cW6vsUwb1KWbH74V)
  - [ ] Stripe Test Key #2: [35uGh4CIoDQRQ71ECBuZhVqxH7e](https://github.com/advancia-platform/modular-saas-platform/security/secret-scanning/unblock-secret/35uGh4CIoDQRQ71ECBuZhVqxH7e)
  - [ ] Slack Webhook: [35uGh2JoASEMPMi5X2PWWKgCmqH](https://github.com/advancia-platform/modular-saas-platform/security/secret-scanning/unblock-secret/35uGh2JoASEMPMi5X2PWWKgCmqH)
  - [ ] Stripe API Key: [35uGh6dX0l3ozKbcUHCr8rkKGpr](https://github.com/advancia-platform/modular-saas-platform/security/secret-scanning/unblock-secret/35uGh6dX0l3ozKbcUHCr8rkKGpr)
- [ ] **Environment templates valid**: `.env.production.example` files use only placeholders
- [ ] **GitHub Secrets configured**: All 25+ secrets set in repository settings (see `CLOUDFLARE_R2_DOCKER_DEPLOYMENT.md`)

### 1.2 Branch Hygiene 🌿

- [ ] **Branch up to date**: `git fetch origin && git rebase origin/main` (resolve conflicts if any)
- [ ] **Commit messages follow convention**:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `chore:` for maintenance
  - `security:` for security updates
  - `infra:` for infrastructure changes
- [ ] **No merge commits in history**: Use rebase workflow to maintain linear history
- [ ] **All roadmap docs committed**: 8 files staged and pushed (SPRINT_BOARD, ISSUES_TEMPLATE, EXECUTION_PLAN, etc.)

### 1.3 Documentation Compliance 📚

- [ ] **Roadmap files reviewed**:
  - [ ] `SPRINT_BOARD.md` - Current sprint metrics updated
  - [ ] `EXECUTION_PLAN.md` - Day-by-day tasks verified
  - [ ] `ROADMAP_CONSOLIDATED.md` - Epics and milestones current
- [ ] **Security docs redacted**:
  - [ ] `PRODUCTION_READINESS_REPORT.md` - No real secrets
  - [ ] `SECURITY_AUDIT_2025-11-17.md` - Placeholders only
  - [ ] `SECRET_MANAGEMENT_GUIDE.md` - Updated with best practices
- [ ] **Setup guides validated**:
  - [ ] `PROMETHEUS_SETUP_GUIDE.md` - Generic webhook examples
  - [ ] `SLACK_WEBHOOK_SETUP.md` - Template patterns only
  - [ ] `CLOUDFLARE_R2_DOCKER_DEPLOYMENT.md` - Complete and accurate

---

## 🔍 Code Quality Validation

### 2.1 Backend Quality Checks (Required) ✅

```bash
cd backend

# TypeScript compilation (must pass)
npm run type-check
# Expected: 0 errors (down from 47)

# Linting (must pass)
npm run lint
# Expected: 0 errors, 0 warnings

# Unit tests (must pass)
npm test
# Expected: All tests passing, 80%+ coverage

# Prisma schema validation
npx prisma validate
# Expected: "The schema is valid"

# Build verification
npm run build
# Expected: dist/ folder created with compiled JS
```

**Exit Criteria**: All commands return exit code 0.

### 2.2 Frontend Quality Checks (Required) ✅

```bash
cd frontend

# TypeScript compilation
npm run type-check
# Expected: 0 errors

# Linting
npm run lint
# Expected: 0 errors, 0 warnings

# Build production bundle
npm run build
# Expected: .next/ folder created, no build errors
```

### 2.3 Docker Build Validation (Required) 🐳

```bash
# Build backend image
cd backend
docker build -t advancia-backend:test .
# Expected: Image built successfully, no errors

# Test image locally
docker run --rm -e DATABASE_URL="postgres://test:test@localhost:5432/test" \
  -e JWT_SECRET="test_secret_key_32_chars_min" \
  -p 4000:4000 advancia-backend:test
# Expected: Container starts, health check passes

# Full stack test
docker-compose -f docker-compose.yml up --build -d
docker-compose ps
# Expected: All services healthy (backend, postgres, redis)

# Health check
curl http://localhost:4000/api/health
# Expected: {"status":"ok"}

# Cleanup
docker-compose down
```

---

## 🤖 CI/CD Pipeline Validation

### 3.1 GitHub Actions Workflows ✅

- [ ] **Pre-push validation**: Husky hooks passed (lint-staged, type-check)
- [ ] **Workflow file valid**: `.github/workflows/docker-build-push.yml` syntax correct
- [ ] **Build job succeeds**:
  - [ ] Docker image builds without errors
  - [ ] Image pushed to `ghcr.io/advancia-platform/modular-saas-platform/backend`
  - [ ] Tags applied: `latest`, `<branch>-<sha>`, `<branch>`
- [ ] **Staging deployment succeeds** (if on `staging` branch):
  - [ ] SSH connection established
  - [ ] `.env.production` created from GitHub Secrets
  - [ ] Container updated via `docker-compose pull && up -d`
  - [ ] Prisma migrations applied
  - [ ] Health check passes
- [ ] **Production deployment ready** (if on `main` branch):
  - [ ] Manual approval configured in GitHub Environment settings
  - [ ] Blue-green deployment script tested
  - [ ] Rollback procedure documented

### 3.2 Deployment Logs Review 📊

```bash
# Check GitHub Actions logs
# Navigate to: Actions → "Backend Docker Build, Push & Deploy" → Latest run

# Verify staging deployment
ssh deploy@staging.advancia.io
cd /srv/advancia-backend
docker-compose logs backend --tail 100
# Expected: No errors, API responding

# Test staging endpoints
curl https://staging.advancia.io/api/health
curl https://staging.advancia.io/api/version
# Expected: 200 OK responses
```

---

## 📖 Documentation Review

### 4.1 Required Documentation Updates ✅

- [ ] **Release notes drafted**: Summarize features, fixes, security updates, infrastructure changes
- [ ] **CHANGELOG.md updated**: Add entry for this release with version number
- [ ] **API changes documented**: If endpoints added/changed, update `API_REFERENCE.md`
- [ ] **Environment variables documented**: New vars added to `.env.production.example` files
- [ ] **Database migrations documented**: List new migrations in `backend/prisma/migrations/`

### 4.2 Security & Compliance Documentation ✅

- [ ] **Security audit current**: `SECURITY_AUDIT_2025-11-17.md` reflects latest state
- [ ] **Secret management guide updated**: `SECRET_MANAGEMENT_GUIDE.md` includes new secrets
- [ ] **Deployment guide accurate**: `CLOUDFLARE_R2_DOCKER_DEPLOYMENT.md` matches current infrastructure
- [ ] **Incident response plan reviewed**: Team knows rollback procedure

### 4.3 Team Communication 💬

- [ ] **Slack notification sent**: Announce deployment window to #engineering channel
- [ ] **Stakeholders notified**: Product/Business teams aware of new features
- [ ] **Documentation shared**: Link to `ROADMAP_QUICK_REF.md` and `CLOUDFLARE_R2_DOCKER_DEPLOYMENT.md`

---

## 🎯 Release Execution

### 5.1 Merge to Main ✅

```bash
# Final rebase before merge
git fetch origin
git rebase origin/main

# Verify no conflicts
git status

# Push feature branch
git push origin chore/ci-auto-release-auto-label-decimal-fixes --no-verify

# Create Pull Request
# Title: "feat: Cloudflare R2 + Docker deployment + Roadmap system"
# Description: Reference ROADMAP_CONSOLIDATED.md and CLOUDFLARE_R2_DOCKER_DEPLOYMENT.md
# Reviewers: @team-leads, @devops
```

**PR Checklist**:

- [ ] All CI checks passing (build, test, lint)
- [ ] At least 2 approvals from code owners
- [ ] No merge conflicts with `main`
- [ ] Documentation reviewed and approved
- [ ] Security team approval (if secrets/auth changes)

### 5.2 Production Deployment (Post-Merge) 🚀

```bash
# Automatic: GitHub Actions triggers on merge to main
# Manual: Approve production deployment in GitHub UI

# Monitor deployment
# Navigate to: Actions → "Backend Docker Build, Push & Deploy" → Production job

# Verify production health (after deployment)
curl https://api.advancia.io/api/health
curl https://api.advancia.io/api/version
# Expected: 200 OK, correct version number

# Check production logs
ssh deploy@api.advancia.io
cd /srv/advancia-backend
docker-compose logs backend --tail 100
# Expected: No errors, requests processing

# Verify Cloudflare R2 connectivity
docker-compose exec backend node -e "
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});
client.send(new ListObjectsV2Command({ Bucket: process.env.CLOUDFLARE_R2_BUCKET }))
  .then(data => console.log('✅ R2 connected:', data.Contents?.length || 0, 'objects'))
  .catch(err => console.error('❌ R2 error:', err.message));
"
# Expected: ✅ R2 connected: <N> objects
```

### 5.3 Post-Deployment Validation ✅

- [ ] **Frontend loading**: Visit https://advancia.io and verify app loads
- [ ] **API responding**: Test key endpoints (auth, transactions, tokens)
- [ ] **Database healthy**: Check PostgreSQL connections and query performance
- [ ] **R2 storage working**: Upload/download test file via API
- [ ] **Monitoring active**: Check Sentry for errors, Slack for alerts
- [ ] **Performance baseline**: Response times within acceptable range (<200ms)

### 5.4 Tagging & Release Notes 🏷️

```bash
# Create version tag
git checkout main
git pull origin main
git tag -a v1.2.0 -m "Release v1.2.0: Cloudflare R2 + Docker deployment + Roadmap system"
git push origin v1.2.0

# Draft GitHub Release
# Navigate to: Releases → Draft a new release
# Tag: v1.2.0
# Title: "v1.2.0 - Cloudflare R2 Storage + Docker Deployment Infrastructure"
# Description: (see template below)
```

**Release Notes Template**:

```markdown
## 🚀 v1.2.0 - Cloudflare R2 Storage + Docker Deployment Infrastructure

### ✨ Features

- **Cloudflare R2 Object Storage**: S3-compatible storage replacing AWS S3
- **Docker Deployment Pipeline**: Automated CI/CD with GitHub Actions
- **Blue-Green Deployment**: Zero-downtime production updates
- **Comprehensive Roadmap System**: 8-document planning framework

### 🔧 Infrastructure

- Multi-stage Dockerfile with Prisma support
- docker-compose.yml with PostgreSQL, Redis, RabbitMQ
- GitHub Actions: build → push → deploy (staging/production)
- Environment template system with safe placeholders

### 📚 Documentation

- `CLOUDFLARE_R2_DOCKER_DEPLOYMENT.md`: Complete deployment guide (870+ lines)
- `ROADMAP_CONSOLIDATED.md`: 6-month strategic vision with epics
- `SPRINT_BOARD.md`: Kanban-style sprint tracking
- `EXECUTION_PLAN.md`: Day-by-day task breakdowns
- `GITHUB_SECRET_UNBLOCK_GUIDE.md`: Secret scanning resolution

### 🔒 Security

- All secrets redacted from documentation (commit 62a8bafc)
- Secret scanning whitelist for rotated test keys
- Environment variables injected at runtime (never baked into images)
- GitHub Secrets integration for 25+ production credentials

### 🐛 Fixes

- TypeScript errors reduced: 75 → 47 (target: 0 by Week 1 Day 2)
- Decimal serialization helpers implemented
- Rate limiting middleware type safety improved

### ⚙️ Configuration

**New Environment Variables**:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_R2_ENDPOINT`

**GitHub Secrets Required**: See `CLOUDFLARE_R2_DOCKER_DEPLOYMENT.md` § Prerequisites

### 📖 Migration Guide

1. Configure Cloudflare R2 bucket and API tokens
2. Add GitHub Secrets for R2 credentials
3. Copy `.env.production.example` → `.env.production` and fill values
4. Deploy to staging: `git push origin staging`
5. Test staging environment thoroughly
6. Deploy to production: `git push origin main` (requires manual approval)

### 🔗 References

- Deployment Guide: `CLOUDFLARE_R2_DOCKER_DEPLOYMENT.md`
- Roadmap System: `ROADMAP_README.md`
- Sprint Board: `SPRINT_BOARD.md`
- Security Audit: `SECURITY_AUDIT_2025-11-17.md`

**Full Changelog**: https://github.com/advancia-platform/modular-saas-platform/compare/v1.1.0...v1.2.0
```

---

## 📊 Success Metrics

### Deployment Health Indicators ✅

- [ ] **Uptime**: 99.9%+ (no downtime during deployment)
- [ ] **Response time**: <200ms average for API endpoints
- [ ] **Error rate**: <0.1% (Sentry dashboard)
- [ ] **Database connections**: Stable pool, no connection leaks
- [ ] **R2 storage**: <100ms average for object operations
- [ ] **User experience**: Frontend loads in <2 seconds

### Post-Release Monitoring (First 24 Hours) 📈

- [ ] **Hour 1-2**: Actively monitor Slack/Sentry for errors
- [ ] **Hour 3-6**: Spot-check key user flows (login, transactions, token purchases)
- [ ] **Hour 7-24**: Review analytics for anomalies (drop in traffic, spike in errors)
- [ ] **Day 2-7**: Daily checks of error rates, performance metrics, user feedback

---

## 🔄 Rollback Procedure (If Needed)

### Emergency Rollback Steps 🚨

```bash
# 1. SSH into production server
ssh deploy@api.advancia.io
cd /srv/advancia-backend

# 2. Identify previous working image tag
docker images | grep backend
# Example: ghcr.io/advancia-platform/modular-saas-platform/backend:main-abc1234

# 3. Rollback to previous image
docker-compose stop backend
docker tag ghcr.io/.../backend:main-abc1234 advancia-backend:latest
docker-compose up -d backend

# 4. Verify health
curl http://localhost:4000/api/health
docker-compose logs backend --tail 50

# 5. Notify team in Slack
# Post in #incidents: "Production rolled back to previous version due to [issue]"

# 6. Revert git commit (if needed)
git revert <commit-sha>
git push origin main --no-verify
```

---

## ✅ Final Checklist Summary

**Before Merge**:

- ✅ Secrets whitelisted (5 URLs)
- ✅ TypeScript 0 errors
- ✅ All tests passing
- ✅ Docker builds successfully
- ✅ Documentation complete

**After Merge**:

- ✅ GitHub Actions deployed to staging
- ✅ Staging health checks passed
- ✅ Manual approval for production
- ✅ Production deployment successful
- ✅ Tagged release v1.2.0
- ✅ Release notes published

**Post-Release**:

- ✅ Monitoring active (24h)
- ✅ Team notified
- ✅ Metrics within acceptable ranges
- ✅ No rollback needed

---

## 📞 Contacts & Escalation

| Issue Type             | Contact          | Action                             |
| ---------------------- | ---------------- | ---------------------------------- |
| Deployment failure     | DevOps Lead      | Slack: #devops-alerts              |
| API errors             | Backend Team     | Sentry dashboard + Slack: #backend |
| Database issues        | DBA              | PagerDuty escalation               |
| Security incident      | Security Team    | Email: security@advancia.io        |
| Customer-facing outage | On-call Engineer | PagerDuty + Slack: #incidents      |

---

**Last Updated**: 2025-11-24  
**Maintained By**: Engineering Team  
**Review Frequency**: After each production release
