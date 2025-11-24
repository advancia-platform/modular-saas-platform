# 🔐 GitHub Actions Secrets Configuration Guide

**Purpose**: Configure all required environment variables for CI/CD pipeline to build Docker images, run tests, and deploy to staging/production.

**Location**: GitHub repo → Settings → Secrets and variables → Actions

**Total Secrets Required**: 25+

---

## 📋 Secrets by Category

### 1. **Cloudflare R2 Storage** (3 secrets)

Used for S3-compatible backup storage and CDN integration.

| Secret Name                       | Value                      | Format                 | Source                                        |
| --------------------------------- | -------------------------- | ---------------------- | --------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID`           | Your Cloudflare Account ID | `UUID`                 | Cloudflare Dashboard → Account Settings       |
| `CLOUDFLARE_R2_ACCESS_KEY_ID`     | R2 bucket access key       | `alphanumeric`         | Cloudflare R2 → Tokens → Create API Token     |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 bucket secret key       | `alphanumeric~40chars` | Cloudflare R2 → Tokens (save during creation) |

**How to Create**:

1. Log in to Cloudflare Dashboard
2. Go to **R2** → **API Tokens**
3. Click **Create API Token**
4. Grant `Object Read & Write` permissions
5. Copy Access Key ID and Secret Access Key
6. Add both to GitHub Secrets

---

### 2. **Database Connection** (2 secrets)

For PostgreSQL connection and backups.

| Secret Name            | Value                        | Format                                | Source                                    |
| ---------------------- | ---------------------------- | ------------------------------------- | ----------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | `.env.production` or Render.com dashboard |
| `DATABASE_BACKUP_PATH` | S3 backup location           | `s3://bucket-name/backups/`           | Manual configuration                      |

**How to Create**:

1. Get `DATABASE_URL` from Render.com → Resources → PostgreSQL → Internal Database URL
2. Format: `postgresql://user:password@hostname:5432/dbname`
3. For backups, use pattern: `s3://cloudflare-backups/db-backups/`

---

### 3. **Authentication & JWT** (2 secrets)

For token signing and session management.

| Secret Name      | Value                      | Format                               | Source                              |
| ---------------- | -------------------------- | ------------------------------------ | ----------------------------------- |
| `JWT_SECRET`     | Secret key for JWT signing | `min 32 chars, alphanumeric+special` | Generate: `openssl rand -base64 32` |
| `SESSION_SECRET` | Express session secret     | `min 32 chars, alphanumeric+special` | Generate: `openssl rand -base64 32` |

**How to Create**:

```bash
# Generate random secrets
openssl rand -base64 32
# Output: example = "xYzAbc+/123...=="

# Store in GitHub Secrets with the full output value
```

---

### 4. **Stripe Payment Integration** (2 secrets)

For payment processing and webhook handling.

| Secret Name             | Value                  | Format                         | Source                                   |
| ----------------------- | ---------------------- | ------------------------------ | ---------------------------------------- |
| `STRIPE_SECRET_KEY`     | Stripe secret API key  | `sk_live_...` or `sk_test_...` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_...`                    | Stripe Dashboard → Developers → Webhooks |

**How to Create**:

1. Log in to Stripe Dashboard
2. Go to **Developers** → **API Keys**
3. Copy **Secret Key** (starts with `sk_live_` or `sk_test_`)
4. Go to **Webhooks** → Select webhook for your environment
5. Click **Signing secret** → **Reveal**
6. Copy the signing secret (starts with `whsec_`)

---

### 5. **Cryptomus Crypto Payments** (2 secrets)

For cryptocurrency payment processing.

| Secret Name             | Value                 | Format                  | Source                                       |
| ----------------------- | --------------------- | ----------------------- | -------------------------------------------- |
| `CRYPTOMUS_API_KEY`     | Cryptomus API key     | `alphanumeric~50 chars` | Cryptomus Dashboard → API Keys               |
| `CRYPTOMUS_MERCHANT_ID` | Cryptomus merchant ID | `UUID or alphanumeric`  | Cryptomus Dashboard → Settings → Merchant ID |

**How to Create**:

1. Log in to Cryptomus Dashboard
2. Go to **API Keys** → **Create New Key**
3. Grant `payments` and `invoices` permissions
4. Copy API Key
5. Go to **Settings** → Note Merchant ID

---

### 6. **Email Services** (3 secrets)

For transactional emails and notifications.

| Secret Name      | Value                        | Format                 | Source                                                |
| ---------------- | ---------------------------- | ---------------------- | ----------------------------------------------------- |
| `EMAIL_USER`     | Gmail SMTP username          | `your-email@gmail.com` | Gmail account with App Password enabled               |
| `EMAIL_PASSWORD` | Gmail SMTP password          | `16-char app password` | Gmail → Security → App Passwords (Gmail 2FA required) |
| `RESEND_API_KEY` | Resend email service API key | `re_...`               | Resend Dashboard → API Keys                           |

**How to Create Gmail App Password**:

1. Go to myaccount.google.com → Security
2. Enable 2-Step Verification if not enabled
3. Go back to Security → App passwords
4. Select "Mail" and "Other (custom name)"
5. Copy the 16-character password
6. Use as `EMAIL_PASSWORD`

**How to Create Resend API Key**:

1. Log in to Resend.com
2. Go to **API Keys**
3. Click **Create**
4. Copy the key (starts with `re_`)

---

### 7. **Monitoring & Logging** (3 secrets)

For error tracking, performance monitoring, and alerting.

| Secret Name              | Value                   | Format                                 | Source                                                           |
| ------------------------ | ----------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| `SENTRY_DSN`             | Sentry Data Source Name | `https://key@sentry.io/project-id`     | Sentry Dashboard → Settings → DSN                                |
| `SLACK_WEBHOOK_URL`      | Slack incoming webhook  | `https://hooks.slack.com/services/...` | Slack Workspace → Apps → Custom Integrations → Incoming Webhooks |
| `MONITORING_ALERT_EMAIL` | Email for alerts        | `ops@advancia.io`                      | Manual configuration                                             |

**How to Create Sentry DSN**:

1. Log in to Sentry.io
2. Create Project → Select Node.js + Tracing
3. Copy DSN from project settings

**How to Create Slack Webhook**:

1. Go to Slack Workspace Settings → Manage Apps
2. Search "Incoming Webhooks"
3. Click "Add to Slack"
4. Select channel (e.g., #deployments)
5. Copy Webhook URL

---

### 8. **SSH Deployment Keys** (3 secrets)

For secure remote deployment to staging/production servers.

| Secret Name       | Value                   | Format                                     | Source                        |
| ----------------- | ----------------------- | ------------------------------------------ | ----------------------------- |
| `STAGING_HOST`    | Staging server hostname | `staging.advancia.io` or IP                | Configuration                 |
| `STAGING_USER`    | SSH username            | `deploy`                                   | Server configuration          |
| `STAGING_SSH_KEY` | Private SSH key         | `-----BEGIN OPENSSH PRIVATE KEY-----\n...` | Generated locally (see below) |

**How to Create SSH Key**:

```bash
# Generate key pair locally
ssh-keygen -t ed25519 -f deploy_key -N ""

# Output: deploy_key (private) and deploy_key.pub (public)

# Add public key to staging server
ssh-copy-id -i deploy_key.pub deploy@staging.advancia.io

# Copy private key content (including newlines)
cat deploy_key

# Output: -----BEGIN OPENSSH PRIVATE KEY-----
#         abc123...xyz
#         -----END OPENSSH PRIVATE KEY-----

# Add entire content (with \n line breaks) to GitHub Secret: STAGING_SSH_KEY
```

**Format for GitHub Secret**:

-   Copy entire key file content
-   Preserve line breaks as `\n`
-   Include `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`

---

### 9. **Slack/Discord Notifications** (2 secrets)

For CI/CD pipeline notifications and alerts.

| Secret Name              | Value                         | Format                                 | Source                                     |
| ------------------------ | ----------------------------- | -------------------------------------- | ------------------------------------------ |
| `SLACK_WEBHOOK_DEPLOY`   | Slack webhook for deployments | `https://hooks.slack.com/services/...` | Slack Workspace → Apps → Incoming Webhooks |
| `DISCORD_WEBHOOK_ALERTS` | Discord webhook for alerts    | `https://discord.com/api/webhooks/...` | Discord Server → Settings → Webhooks       |

**How to Create Discord Webhook**:

1. Go to Discord Server Settings → Integrations → Webhooks
2. Click "New Webhook"
3. Name it (e.g., "CI/CD Alerts")
4. Copy the Webhook URL

---

## 🔧 GitHub UI Setup Instructions

### **Step 1: Navigate to Secrets Settings**

```
GitHub Repo → Settings → Secrets and variables → Actions
```

### **Step 2: Add Each Secret**

1. Click **"New repository secret"**
2. Enter **Name** (e.g., `CLOUDFLARE_ACCOUNT_ID`)
3. Enter **Value** (the actual secret/key)
4. Click **Add secret**
5. Repeat for all 25+ secrets

### **Step 3: Verify Secrets**

```
GitHub Repo → Settings → Secrets and variables → Actions
```

You should see all secrets listed (values are masked):

```
✓ CLOUDFLARE_ACCOUNT_ID
✓ CLOUDFLARE_R2_ACCESS_KEY_ID
✓ CLOUDFLARE_R2_SECRET_ACCESS_KEY
✓ DATABASE_URL
✓ DATABASE_BACKUP_PATH
✓ JWT_SECRET
✓ SESSION_SECRET
✓ STRIPE_SECRET_KEY
✓ STRIPE_WEBHOOK_SECRET
✓ CRYPTOMUS_API_KEY
✓ CRYPTOMUS_MERCHANT_ID
✓ EMAIL_USER
✓ EMAIL_PASSWORD
✓ RESEND_API_KEY
✓ SENTRY_DSN
✓ SLACK_WEBHOOK_URL
✓ MONITORING_ALERT_EMAIL
✓ STAGING_HOST
✓ STAGING_USER
✓ STAGING_SSH_KEY
✓ SLACK_WEBHOOK_DEPLOY
✓ DISCORD_WEBHOOK_ALERTS
[... and any others ...]
```

---

## 📝 Secrets Checklist

Use this checklist during setup:

### **Cloudflare R2** (3)

-   [ ] `CLOUDFLARE_ACCOUNT_ID`
-   [ ] `CLOUDFLARE_R2_ACCESS_KEY_ID`
-   [ ] `CLOUDFLARE_R2_SECRET_ACCESS_KEY`

### **Database** (2)

-   [ ] `DATABASE_URL`
-   [ ] `DATABASE_BACKUP_PATH`

### **Authentication** (2)

-   [ ] `JWT_SECRET`
-   [ ] `SESSION_SECRET`

### **Stripe** (2)

-   [ ] `STRIPE_SECRET_KEY`
-   [ ] `STRIPE_WEBHOOK_SECRET`

### **Cryptomus** (2)

-   [ ] `CRYPTOMUS_API_KEY`
-   [ ] `CRYPTOMUS_MERCHANT_ID`

### **Email Services** (3)

-   [ ] `EMAIL_USER`
-   [ ] `EMAIL_PASSWORD`
-   [ ] `RESEND_API_KEY`

### **Monitoring** (3)

-   [ ] `SENTRY_DSN`
-   [ ] `SLACK_WEBHOOK_URL`
-   [ ] `MONITORING_ALERT_EMAIL`

### **SSH Deployment** (3)

-   [ ] `STAGING_HOST`
-   [ ] `STAGING_USER`
-   [ ] `STAGING_SSH_KEY`

### **Webhooks** (2)

-   [ ] `SLACK_WEBHOOK_DEPLOY`
-   [ ] `DISCORD_WEBHOOK_ALERTS`

---

## 🚨 Security Best Practices

### ✅ **DO**

-   ✅ Use strong, unique secrets (min 32 chars for custom secrets)
-   ✅ Rotate secrets quarterly
-   ✅ Use service-specific API keys (never share credentials)
-   ✅ Enable branch protection on `main` and `staging`
-   ✅ Require PR reviews before merging
-   ✅ Audit GitHub Actions logs for suspicious activity
-   ✅ Use SSH keys instead of passwords for server access

### ❌ **DON'T**

-   ❌ Never commit secrets to git (even in history)
-   ❌ Never share secrets in Slack, email, or chat
-   ❌ Never use the same secret across environments
-   ❌ Never grant unnecessary GitHub Actions permissions
-   ❌ Never expose secrets in CI/CD logs
-   ❌ Never hardcode secrets in code

### 🔄 **Rotation Schedule**

| Secret                                | Rotation                   | Reason           |
| ------------------------------------- | -------------------------- | ---------------- |
| `JWT_SECRET`                          | Quarterly (Q1, Q2, Q3, Q4) | Token signing    |
| `SESSION_SECRET`                      | Quarterly                  | Session security |
| `STRIPE_SECRET_KEY`                   | As needed (if compromised) | Payment security |
| `SSH_PRIVATE_KEYS`                    | Annually                   | Access control   |
| `API Keys` (Cloudflare, Resend, etc.) | Annually                   | Vendor security  |

---

## 🧪 Testing Secrets

### **Test GitHub Actions Workflow Runs**

1. Push a test commit to staging:

   ```bash
   git checkout chore/ci-auto-release-auto-label-decimal-fixes
   git commit --allow-empty -m "test: verify GitHub Actions secrets are accessible"
   git push origin chore/ci-auto-release-auto-label-decimal-fixes
   ```

2. Monitor workflow execution:

   ```
   GitHub Repo → Actions → Watch workflow run
   ```

3. Check for:
   -   ✅ Build stage completes
   -   ✅ Docker image builds successfully
   -   ✅ Tests pass
   -   ✅ Secrets are not logged (only masked values: `***`)

### **Verify Secret Access in Workflow**

Add debug step to `.github/workflows/docker-build-push.yml`:

```yaml
- name: Verify Secrets Loaded
  run: |
    [ -n "${{ secrets.CLOUDFLARE_ACCOUNT_ID }}" ] && echo "✓ CLOUDFLARE_ACCOUNT_ID loaded" || echo "✗ CLOUDFLARE_ACCOUNT_ID missing"
    [ -n "${{ secrets.DATABASE_URL }}" ] && echo "✓ DATABASE_URL loaded" || echo "✗ DATABASE_URL missing"
    [ -n "${{ secrets.STRIPE_SECRET_KEY }}" ] && echo "✓ STRIPE_SECRET_KEY loaded" || echo "✗ STRIPE_SECRET_KEY missing"
    # ... repeat for all critical secrets
```

---

## 🆘 Troubleshooting

### **Workflow Fails with "Secret Not Found"**

**Problem**: Workflow can't access secret
**Solution**:

1. Verify secret exists in GitHub Settings
2. Check spelling matches exactly (case-sensitive)
3. Ensure secret is not marked as "Environment only"
4. Re-run workflow after adding/updating secret

### **Build Fails with "Invalid Credentials"**

**Problem**: AWS/Cloudflare credentials rejected
**Solution**:

1. Verify credentials are active and not rotated
2. Check permissions on API keys (e.g., R2 requires "Object Read & Write")
3. Test locally: `aws s3 ls` or `curl -X GET https://api.cloudflare.com/client/v4/accounts`
4. Regenerate key if compromised

### **Docker Build Succeeds but Deployment Fails**

**Problem**: Secrets loaded in CI but fail at runtime
**Solution**:

1. Check `.env.production` is using correct variable names
2. Verify secrets are passed to Docker container (see Dockerfile ENV)
3. Test locally: `docker run -e DATABASE_URL=... advancia:latest`

---

## 📚 Related Documents

-   **ACCELERATED_DEPLOYMENT.md**: 24-hour deployment timeline
-   **CLOUDFLARE_R2_DOCKER_DEPLOYMENT.md**: Infrastructure setup
-   **PR_STAGING_v1.2.0.md**: This PR description (use as deployment checklist)
-   **.github/workflows/docker-build-push.yml**: CI/CD workflow definition

---

## ✅ Sign-Off

**Secrets Configuration Checklist**:

-   [ ] All 25+ secrets added to GitHub
-   [ ] Secrets are masked in GitHub UI (not visible as plain text)
-   [ ] Test workflow run passes with secrets loaded
-   [ ] No secrets exposed in GitHub Actions logs
-   [ ] Team members have access to GitHub Secrets documentation

**Ready for deployment!** 🚀

Questions? Check the troubleshooting section or contact DevOps team.
