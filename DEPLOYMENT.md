# Deployment Guide 🚀

This document explains how to deploy the Advancia Pay Ledger to **staging** and **production** environments safely and securely.

---

## 🛠 Prerequisites

### Development Environment

- Node.js 18+ and Python 3.11+ installed
- PostgreSQL 13+ and Redis 6+ available
- Git with SSH keys configured
- Docker and Docker Compose for local development

### Cloud Requirements

- GitHub repository with Actions enabled
- Render account for backend deployment
- Vercel account for frontend deployment
- Cloudflare account for CDN and DNS
- Digital Ocean Spaces for backups (optional)

---

## 🔐 Environment Configuration

### Required Secrets (GitHub Repository Settings)

```bash
# Authentication
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Payment Providers
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CRYPTOMUS_API_KEY=your-cryptomus-api-key
CRYPTOMUS_MERCHANT_ID=your-cryptomus-merchant-id

# Email Services
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
RESEND_API_KEY=re_...
SENDGRID_API_KEY=SG...

# Push Notifications
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Monitoring
SENTRY_DSN=https://...@sentry.io/...

# AWS (for backups)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BACKUPS_BUCKET=your-backup-bucket
```

---

## 🌐 Deployment Environments

### Local Development

```bash
# Start local services
docker-compose up -d

# Backend setup
cd backend
npm install
npx prisma migrate dev
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Staging Environment

- **Purpose**: Testing new features before production
- **Branch**: `develop` or feature branches
- **URL**: `staging.advancia.com`
- **Database**: Staging PostgreSQL instance
- **Coverage**: ≥80% required for deployment

### Production Environment

- **Purpose**: Live environment for end users
- **Branch**: `main` only
- **URL**: `app.advancia.com`
- **Database**: Production PostgreSQL with backups
- **Coverage**: ≥80% required (raising to 85% in v1.2.0)

---

## 🚀 Deployment Process

### Automated CI/CD Pipeline

#### 1. Pre-deployment Checks

- ✅ All tests pass with coverage ≥80%
- ✅ ESLint and Prettier checks pass
- ✅ Security scans complete (Bandit, Safety, npm audit)
- ✅ At least one reviewer approval
- ✅ Branch is up to date with base branch

#### 2. Build Process

```yaml
# Backend build
npm install --production
npm run build

# Frontend build
npm install
npm run build
npm run export
```

#### 3. Database Migrations

```bash
# Run pending migrations
npx prisma migrate deploy

# Verify migration success
npx prisma db push --preview-feature
```

#### 4. Deployment Execution

- **Backend**: Deployed to Render with auto-scaling
- **Frontend**: Deployed to Vercel with global CDN
- **Database**: Migrations applied automatically
- **Monitoring**: Sentry deployment tracking enabled

---

## 📋 Manual Deployment Steps

### Backend (Render)

1. Connect GitHub repository to Render
2. Configure environment variables from secrets
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Enable auto-deploy on `main` branch push

### Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Configure environment variables for API endpoints
3. Set framework preset to Next.js
4. Configure custom domain and SSL
5. Enable auto-deploy on `main` branch push

### Database Setup

1. Create PostgreSQL instance on Render
2. Configure connection pooling
3. Set up automated backups
4. Run initial migration: `npx prisma migrate deploy`
5. Verify connection and create admin user

---

## 🔄 Rollback Strategy

### Automatic Rollback Triggers

- Health check failures for >5 minutes
- Error rate >1% for >2 minutes
- Response time >5 seconds for >3 minutes

### Manual Rollback Process

```bash
# Revert to previous release
gh release view --json tagName
gh release download v1.0.0

# Database rollback (if needed)
npx prisma migrate reset --force
npx prisma migrate deploy

# Verify rollback success
curl -f https://api.advancia.com/health
```

---

## 🔍 Post-Deployment Verification

### Health Checks

```bash
# Backend health check
curl -f https://api.advancia.com/health

# Frontend accessibility
curl -f https://app.advancia.com

# Database connectivity
npx prisma db push --preview-feature

# Socket.IO connection
node scripts/test-socket-connection.js
```

### Monitoring Dashboard

- **Uptime**: 99.9% target
- **Response Time**: <200ms average
- **Error Rate**: <0.1%
- **Database Performance**: Query time <50ms
- **Socket.IO**: Connection success >99%

---

## 🚨 Emergency Procedures

### Critical Issue Response

1. **Immediate**: Take down affected service if security risk
2. **Assess**: Determine scope and impact
3. **Communicate**: Notify users via status page
4. **Fix**: Apply hotfix or rollback
5. **Verify**: Confirm resolution
6. **Post-mortem**: Document incident and improvements

### Security Incident

1. **Isolate**: Disconnect affected systems
2. **Assess**: Determine data exposure
3. **Notify**: Follow SECURITY.md reporting process
4. **Patch**: Apply security fix immediately
5. **Audit**: Review logs and access patterns
6. **Report**: Comply with regulatory requirements

---

## 📊 Deployment Metrics

### Success Criteria

- **Deployment Time**: <10 minutes end-to-end
- **Zero Downtime**: <30 seconds service interruption
- **Rollback Time**: <2 minutes if needed
- **Success Rate**: >99% deployment success

### Performance Targets

- **API Response**: <200ms average
- **Page Load**: <2 seconds first load
- **Database Queries**: <50ms average
- **Socket.IO Latency**: <100ms

---

## 🔧 Troubleshooting

### Common Issues

#### Database Connection

```bash
# Check connection string
echo $DATABASE_URL

# Test connection
npx prisma db push --preview-feature

# Reset if corrupted
npx prisma migrate reset --force
```

#### Environment Variables

```bash
# Verify all required vars
node -e "console.log(process.env.JWT_SECRET ? 'JWT_SECRET: OK' : 'JWT_SECRET: MISSING')"

# Check Render dashboard for missing vars
# Verify GitHub Secrets are properly set
```

#### Build Failures

```bash
# Clear cache and rebuild
rm -rf node_modules/.cache
npm ci
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

---

## 📚 Additional Resources

- **Render Documentation**: <https://render.com/docs>
- **Vercel Documentation**: <https://vercel.com/docs>
- **Prisma Deployment**: <https://www.prisma.io/docs/guides/deployment>
- **GitHub Actions**: <https://docs.github.com/en/actions>
- **Internal Runbooks**: See `docs/deployment/` folder

---

_This deployment guide is reviewed and updated with each major release._
