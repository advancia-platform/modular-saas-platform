# 🚀 Cloudflare R2 + Docker Deployment Guide

Complete guide for deploying Advancia Pay Ledger with Cloudflare R2 object storage and Docker containers.

---

## 📋 Table of Contents

-   [Architecture Overview](#architecture-overview)
-   [Prerequisites](#prerequisites)
-   [Secrets Management](#secrets-management)
-   [Local Development](#local-development)
-   [Docker Build & Push](#docker-build--push)
-   [Production Deployment](#production-deployment)
-   [CI/CD Pipeline](#cicd-pipeline)
-   [Security Best Practices](#security-best-practices)
-   [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI/CD                     │
│  - Build Docker images                                      │
│  - Push to ghcr.io (GitHub Container Registry)             │
│  - Deploy to staging/production via SSH                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  Production Environment                      │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Docker Host    │  │  Cloudflare R2  │                  │
│  │  - Backend API  │──▶ - File storage  │                  │
│  │  - PostgreSQL   │  │  - Backups      │                  │
│  │  - Redis        │  └─────────────────┘                  │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

**Key Components:**

-   **Backend**: Node.js 20 + Express + TypeScript + Prisma
-   **Database**: PostgreSQL 16 (containerized or managed service)
-   **Cache**: Redis 7 (session storage, rate limiting)
-   **Storage**: Cloudflare R2 (S3-compatible object storage)
-   **Container Registry**: GitHub Container Registry (ghcr.io)
-   **Deployment**: Docker Compose + GitHub Actions SSH

---

## ✅ Prerequisites

### 1. Cloudflare R2 Setup

1. **Create R2 Bucket:**

   ```bash
   # Via Cloudflare Dashboard:
   # Dashboard → R2 → Create Bucket
   # Name: advancia-production-storage
   # Location: Auto (or choose region closest to your backend)
   ```

2. **Generate R2 API Tokens:**

   ```bash
   # Dashboard → R2 → Manage R2 API Tokens → Create API Token
   # Permissions: Object Read & Write
   # Scope: Apply to specific buckets only → advancia-production-storage
   ```

   You'll receive:
   -   **Access Key ID**: `<YOUR_R2_ACCESS_KEY_ID>`
   -   **Secret Access Key**: `<YOUR_R2_SECRET_ACCESS_KEY>`
   -   **Endpoint**: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

3. **Note Your Account ID:**

   ```bash
   # Found in Cloudflare Dashboard URL:
   # https://dash.cloudflare.com/<ACCOUNT_ID>/r2/overview
   ```

### 2. Docker & Docker Compose

```bash
# Install Docker Engine (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 3. GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

**Navigate to:** `Settings → Secrets and variables → Actions → New repository secret`

#### Required Secrets

| Secret Name                       | Description                    | Example Value                                   |
| --------------------------------- | ------------------------------ | ----------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID`           | Cloudflare account ID          | `a1b2c3d4e5f6g7h8i9j0`                          |
| `CLOUDFLARE_R2_ACCESS_KEY_ID`     | R2 API token access key        | `<YOUR_R2_ACCESS_KEY>`                          |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 API token secret            | `<YOUR_R2_SECRET>`                              |
| `CLOUDFLARE_R2_BUCKET`            | R2 bucket name                 | `advancia-production-storage`                   |
| `CLOUDFLARE_R2_ENDPOINT`          | R2 S3-compatible endpoint      | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `DATABASE_URL`                    | PostgreSQL connection string   | `postgres://user:pass@host:5432/db`             |
| `JWT_SECRET`                      | JWT signing secret (32+ chars) | `<GENERATE_STRONG_SECRET>`                      |
| `SESSION_SECRET`                  | Session encryption key         | `<GENERATE_STRONG_SECRET>`                      |
| `STRIPE_SECRET_KEY`               | Stripe API secret key          | `sk_live_...`                                   |
| `STRIPE_WEBHOOK_SECRET`           | Stripe webhook signature       | `whsec_...`                                     |
| `SENTRY_DSN`                      | Sentry error tracking DSN      | `https://...@sentry.io/...`                     |
| `SLACK_WEBHOOK_URL`               | Slack notifications webhook    | `https://hooks.slack.com/...`                   |
| `STAGING_HOST`                    | Staging server IP/hostname     | `staging.advancia.io`                           |
| `STAGING_USER`                    | SSH username for staging       | `deploy`                                        |
| `STAGING_SSH_KEY`                 | SSH private key for staging    | `-----BEGIN OPENSSH PRIVATE KEY-----`           |
| `PROD_HOST`                       | Production server IP/hostname  | `api.advancia.io`                               |
| `PROD_USER`                       | SSH username for production    | `deploy`                                        |
| `PROD_SSH_KEY`                    | SSH private key for production | `-----BEGIN OPENSSH PRIVATE KEY-----`           |

---

## 🔒 Secrets Management

### 1. Environment File Strategy

```bash
# Development (local, tracked in Git)
.env.development.example  → Copy to .env.development

# Staging (injected via CI/CD)
.env.staging  → Created on staging server via GitHub Actions

# Production (injected via CI/CD)
.env.production  → Created on production server via GitHub Actions

# Templates (tracked in Git, safe placeholders)
.env.production.example  → Documentation only, never contains real secrets
```

### 2. .gitignore Rules

The repository is configured to **ignore all real env files** but **allow example templates**:

```gitignore
# Ignore all environment files
.env
.env.*

# BUT allow .example templates (safe to commit)
!.env.example
!.env*.example
!.env.*.example
```

### 3. Secret Injection Workflow

**Local Development:**

```bash
# Copy template and fill in development values
cp .env.production.example .env.development
# Edit .env.development with local test credentials
```

**Staging/Production (Automated):**

```yaml
# GitHub Actions creates .env.production from secrets
cat > .env.production << EOF
DATABASE_URL=${{ secrets.DATABASE_URL }}
CLOUDFLARE_R2_ACCESS_KEY_ID=${{ secrets.CLOUDFLARE_R2_ACCESS_KEY_ID }}
# ... all other secrets
EOF
```

---

## 💻 Local Development

### 1. Initial Setup

```bash
# Clone repository
git clone https://github.com/advancia-platform/modular-saas-platform.git
cd modular-saas-platform

# Create environment file from template
cp .env.production.example .env.development

# Edit with your local development credentials
nano .env.development
```

### 2. Start Services with Docker Compose

```bash
# Start all services (PostgreSQL, Redis, RabbitMQ, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Check service status
docker-compose ps

# Run database migrations
docker-compose exec backend npx prisma migrate dev

# Access Prisma Studio (database GUI)
docker-compose exec backend npx prisma studio
```

### 3. Development URLs

-   **Backend API**: <http://localhost:4000/api>
-   **Frontend**: <http://localhost:3000>
-   **PostgreSQL**: localhost:5433 (mapped from container 5432)
-   **Redis**: localhost:6379
-   **RabbitMQ Management**: <http://localhost:15672> (user: `advancia`, pass: see docker-compose.yml)
-   **Prisma Studio**: <http://localhost:5555>

---

## 🐳 Docker Build & Push

### Manual Build (For Testing)

```bash
# Build backend image
cd backend
docker build -t advancia-backend:local .

# Test image locally
docker run --rm -p 4000:4000 \
  -e DATABASE_URL="postgres://..." \
  -e CLOUDFLARE_R2_ACCESS_KEY_ID="..." \
  advancia-backend:local

# Build and push to GitHub Container Registry
docker build -t ghcr.io/advancia-platform/modular-saas-platform/backend:latest .
docker push ghcr.io/advancia-platform/modular-saas-platform/backend:latest
```

### Automated Build via GitHub Actions

**Triggered on:**

-   Push to `main`, `staging`, or `chore/**` branches
-   Pull requests to `main` or `staging`

**Workflow file:** `.github/workflows/docker-build-push.yml`

**Process:**

1. Checkout code
2. Set up Docker Buildx (multi-platform builds)
3. Log in to GitHub Container Registry
4. Build Docker image (multi-stage Dockerfile)
5. Push image with tags: `latest`, `<branch>-<sha>`, `<branch>`
6. Cache layers for faster rebuilds

**View builds:** `Actions → Docker Build, Push & Deploy`

---

## 🌐 Production Deployment

### Deployment Environments

| Environment    | Branch    | Auto-Deploy | Approval Required           |
| -------------- | --------- | ----------- | --------------------------- |
| **Staging**    | `staging` | ✅ Yes      | ❌ No                       |
| **Production** | `main`    | ✅ Yes      | ✅ Yes (GitHub Environment) |

### Staging Deployment (Automatic)

```bash
# Push to staging branch triggers auto-deploy
git push origin staging

# GitHub Actions will:
# 1. Build Docker image
# 2. SSH into staging server
# 3. Create .env.production from GitHub Secrets
# 4. Pull latest image and restart container
# 5. Run Prisma migrations
# 6. Health check validation
```

**Staging URL:** <https://staging.advancia.io>

### Production Deployment (Manual Approval)

```bash
# Push to main triggers deployment workflow
git push origin main

# GitHub Actions workflow:
# 1. Build Docker image
# 2. Wait for manual approval (GitHub Environment Protection)
# 3. Blue-green deployment:
#    - Start new container (blue) on port 4001
#    - Health check new container
#    - If healthy: swap to primary port 4000
#    - If unhealthy: rollback to previous container
```

**Production URL:** <https://api.advancia.io>

---

## 🔄 CI/CD Pipeline

### Workflow Overview

```mermaid
graph TD
    A[Push to staging/main] --> B[Build Docker Image]
    B --> C[Push to ghcr.io]
    C --> D{Branch?}
    D -->|staging| E[Auto-deploy to Staging]
    D -->|main| F[Require Manual Approval]
    F --> G[Blue-Green Deploy to Production]
    E --> H[Run Migrations]
    G --> H
    H --> I[Health Check]
    I --> J{Healthy?}
    J -->|Yes| K[Deployment Success ✅]
    J -->|No| L[Rollback ❌]
    K --> M[Send Slack Notification]
    L --> M
```

### Deployment Steps (Detailed)

**1. Build Phase:**

```yaml
- Checkout repository
- Set up Docker Buildx
- Log in to ghcr.io
- Build multi-stage Dockerfile
- Push image with tags
```

**2. Staging Deploy:**

```bash
# SSH into staging server
cd /srv/advancia-backend
git pull origin staging

# Create .env.production from GitHub Secrets
cat > .env.production << EOF
DATABASE_URL=${{ secrets.DATABASE_URL }}
CLOUDFLARE_R2_ACCESS_KEY_ID=${{ secrets.CLOUDFLARE_R2_ACCESS_KEY_ID }}
# ... (all secrets injected)
EOF

# Pull and restart
docker-compose pull backend
docker-compose up -d backend --force-recreate

# Run migrations
docker-compose exec -T backend npx prisma migrate deploy

# Health check
curl -f http://localhost:4000/api/health || exit 1
```

**3. Production Deploy (Blue-Green):**

```bash
# Start blue (new) container on port 4001
docker-compose up -d backend-blue

# Health check blue container
if curl -f http://localhost:4001/api/health; then
  # Swap: stop old, start new as primary
  docker-compose stop backend
  docker-compose up -d backend --force-recreate
  docker-compose stop backend-blue
else
  # Rollback: stop blue, keep old running
  docker-compose stop backend-blue
  exit 1
fi
```

---

## 🛡️ Security Best Practices

### 1. Secrets Management

✅ **DO:**

-   Store secrets in GitHub Actions → Secrets (encrypted at rest)
-   Inject secrets at deployment time (never bake into images)
-   Use scoped R2 API tokens (least privilege)
-   Rotate secrets quarterly
-   Use `.env.production.example` with placeholders for documentation

❌ **DON'T:**

-   Commit `.env.production` to Git
-   Hardcode secrets in Dockerfile or docker-compose.yml
-   Use global Cloudflare API keys (use scoped R2 tokens)
-   Share secrets via Slack/email (use 1Password or similar)

### 2. Docker Security

```dockerfile
# ✅ Use non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# ✅ Multi-stage builds (smaller attack surface)
FROM node:20-alpine AS builder  # Build stage
FROM node:20-alpine AS runner   # Runtime stage

# ✅ Health checks
HEALTHCHECK --interval=30s CMD node -e "require('http').get('http://localhost:4000/api/health')"
```

### 3. Network Security

-   Use private Docker networks (`networks: [app_net]`)
-   Expose only necessary ports (4000 for API, not PostgreSQL)
-   Use TLS/HTTPS in production (Cloudflare proxy or Let's Encrypt)
-   Firewall rules: Allow only GitHub Actions IPs for SSH (if possible)

### 4. Cloudflare R2 Security

-   **Bucket Policy**: Private by default (no public access)
-   **Access Control**: Use IAM-style policies (least privilege)
-   **Encryption**: Enable R2 encryption at rest (enabled by default)
-   **Audit Logs**: Enable Cloudflare Logpush for R2 access logs

---

## 🔧 Troubleshooting

### Push Blocked by GitHub Secret Scanning

**Error:**

```
remote: error: GH013: Repository rule violations found for refs/heads/...
remote: - Secret scanning found secrets in commits
```

**Solution:**

1. Secrets are whitelisted in `.github/secret-scanning.yml`
2. Commit and push this file first:

   ```bash
   git add .github/secret-scanning.yml
   git commit -m "chore: add secret scanning allowlist for rotated keys"
   git push origin chore/ci-auto-release-auto-label-decimal-fixes
   ```

3. Once merged, subsequent pushes will succeed

**Alternative (if allowlist doesn't work):**

-   Visit GitHub-provided unblock URLs (shown in push error)
-   Click "Allow secret" for each rotated key

### Docker Build Fails with Prisma Error

**Error:**

```
Error: @prisma/client did not initialize yet. Please run "prisma generate"
```

**Solution:**

```dockerfile
# Ensure Dockerfile includes:
RUN npx prisma generate
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
```

### R2 Connection Timeout

**Error:**

```
Error: connect ETIMEDOUT <ACCOUNT_ID>.r2.cloudflarestorage.com:443
```

**Solution:**

1. Verify R2 endpoint format:

   ```bash
   CLOUDFLARE_R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   ```

2. Check R2 API token permissions (must have Object Read & Write)
3. Verify bucket name matches token scope

### Deployment Health Check Fails

**Error:**

```
curl: (7) Failed to connect to localhost:4000: Connection refused
```

**Solution:**

1. Check backend logs:

   ```bash
   docker-compose logs backend
   ```

2. Verify environment variables are set:

   ```bash
   docker-compose exec backend printenv | grep DATABASE_URL
   ```

3. Check database connectivity:

   ```bash
   docker-compose exec backend npx prisma db push --skip-generate
   ```

---

## 📚 Additional Resources

-   **Cloudflare R2 Docs**: <https://developers.cloudflare.com/r2/>
-   **Docker Security Best Practices**: <https://docs.docker.com/develop/security-best-practices/>
-   **GitHub Actions Docs**: <https://docs.github.com/en/actions>
-   **Prisma Deployment Guide**: <https://www.prisma.io/docs/guides/deployment>

---

## 🎯 Quick Reference

### Common Commands

```bash
# Local development
docker-compose up -d
docker-compose logs -f backend
docker-compose exec backend npx prisma studio

# Rebuild after code changes
docker-compose build backend
docker-compose up -d backend --force-recreate

# Database operations
docker-compose exec backend npx prisma migrate dev
docker-compose exec backend npx prisma db seed

# View R2 bucket contents (via AWS CLI)
aws s3 ls s3://advancia-production-storage \
  --endpoint-url=https://<ACCOUNT_ID>.r2.cloudflarestorage.com \
  --profile r2

# SSH into production
ssh -i ~/.ssh/prod_key deploy@api.advancia.io
cd /srv/advancia-backend
docker-compose ps
```

### Environment Variables Quick Check

```bash
# Verify required secrets are set
cat .env.production | grep -E '(DATABASE_URL|JWT_SECRET|CLOUDFLARE_R2)'

# Test R2 connection from backend container
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
```

---

✅ **Deployment checklist complete!** You now have:

-   Cloudflare R2 integrated for object storage
-   Docker multi-stage builds optimized for production
-   GitHub Actions CI/CD with blue-green deployment
-   Secret management via GitHub Secrets (never baked into images)
-   Automated staging deploys + manual production approvals
