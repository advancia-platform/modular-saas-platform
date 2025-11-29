# Environment Configuration Guide

## Overview

This project uses environment-specific configuration files to separate development, staging, and production settings. This ensures:

- **No credential conflicts** between local dev and production
- **Safe testing** with fake credentials in development
- **Easy environment switching** without manual editing
- **Protection** against accidentally committing secrets

## Environment Files

### 📁 File Structure

```
backend/
├── .env                          # Active environment (git-ignored)
├── .env.development             # Development config (SAFE to commit - fake credentials)
├── .env.production.template     # Production template (git-ignored)
├── .env.example                 # Example config (SAFE to commit)
├── switch-env.sh               # Environment switcher (Linux/Mac)
└── switch-env.ps1              # Environment switcher (Windows)
```

### 🔐 Security Model

| File                       | Git Tracked | Contains Real Secrets | Purpose                          |
| -------------------------- | ----------- | --------------------- | -------------------------------- |
| `.env`                     | ❌ No       | Maybe                 | Active config (generated)        |
| `.env.development`         | ✅ Yes      | ❌ No                 | Dev config with fake credentials |
| `.env.production.template` | ❌ No       | ❌ No                 | Production template              |
| `.env.production`          | ❌ No       | ✅ Yes                | Real production config           |
| `.env.example`             | ✅ Yes      | ❌ No                 | Documentation only               |

## Quick Start

### 1️⃣ Initial Setup

**Development Environment (Default)**

```bash
# The .env.development file is ready to use with fake credentials
# Just copy it to .env
cp backend/.env.development backend/.env
```

**Production Environment**

```bash
# 1. Copy the template
cp backend/.env.production.template backend/.env.production

# 2. Edit with real credentials (NEVER commit this file)
nano backend/.env.production

# 3. Replace ALL placeholder values:
#    - REPLACE_WITH_STRONG_SECRET_*
#    - YOUR_PRODUCTION_*
#    - fake_*
```

### 2️⃣ Switching Environments

**Using PowerShell (Windows)**

```powershell
# Switch to development
cd backend
.\switch-env.ps1 development

# Switch to production
.\switch-env.ps1 production
```

**Using Bash (Linux/Mac)**

```bash
# Switch to development
cd backend
chmod +x switch-env.sh
./switch-env.sh development

# Switch to production
./switch-env.sh production
```

**Manual Method**

```bash
# Development
cp backend/.env.development backend/.env

# Production
cp backend/.env.production backend/.env
```

### 3️⃣ Verify Configuration

```bash
# Check current environment
grep "^NODE_ENV=" backend/.env

# View first 20 lines
cat backend/.env | head -20

# Check for fake credentials (should be empty in production)
grep -i "fake" backend/.env
```

## Environment Flags

### 🚧 Development Flags

```env
NODE_ENV=development
SKIP_DATABASE_VALIDATION=1        # Skip DB checks at startup
OTEL_TRACING_ENABLED=false       # Disable OpenTelemetry
ENABLE_CRON=false                # Disable background jobs
DIAG_INTERCEPT_EXIT=1            # Convert exits to errors for debugging
RATE_LIMIT_MAX_REQUESTS=1000     # Relaxed rate limiting
ENABLE_RATE_LIMITING=false       # Rate limiting disabled
SENTRY_DSN=                      # Error tracking disabled
```

### 🚀 Production Flags

```env
NODE_ENV=production
SKIP_DATABASE_VALIDATION=0        # Strict DB validation
OTEL_TRACING_ENABLED=true        # Enable monitoring
ENABLE_CRON=true                 # Enable scheduled jobs
DIAG_INTERCEPT_EXIT=0            # Normal exit behavior
RATE_LIMIT_MAX_REQUESTS=100      # Strict rate limiting
ENABLE_RATE_LIMITING=true        # Rate limiting enabled
SENTRY_DSN=https://...           # Error tracking enabled
```

## Key Differences

### Development vs Production

| Feature     | Development                 | Production              |
| ----------- | --------------------------- | ----------------------- |
| Database    | `localhost:5432` (Docker)   | Render PostgreSQL (SSL) |
| Stripe      | Test keys (`sk_test_*`)     | Live keys (`sk_live_*`) |
| Email       | Console logging / fake SMTP | Real Gmail App Password |
| Crypto      | Sandbox/test mode           | Live payment processing |
| Ethereum    | Sepolia testnet             | Mainnet with real funds |
| Monitoring  | Disabled (Sentry DSN empty) | Enabled (Sentry + OTEL) |
| Rate Limits | 1000 req/min                | 100 req/min             |
| CORS        | `localhost:*` allowed       | Only production domains |
| Secrets     | Fake placeholders           | Strong random secrets   |

## Credential Management

### 🔑 Generating Secrets

**JWT Secrets (64 bytes)**

```bash
openssl rand -base64 64
```

**VAPID Keys (Web Push)**

```bash
npx web-push generate-vapid-keys
```

**Ethereum Private Keys**

```bash
# Use MetaMask or a wallet to generate
# NEVER use test keys in production
```

### 🛡️ Security Checklist

**Before Deploying to Production:**

- [ ] All `REPLACE_WITH_*` placeholders replaced
- [ ] No `fake_*` values in `.env.production`
- [ ] All `YOUR_PRODUCTION_*` placeholders replaced
- [ ] JWT secrets are 64+ characters
- [ ] Stripe keys are `sk_live_*` not `sk_test_*`
- [ ] Database URL uses SSL (`?sslmode=require`)
- [ ] CORS only allows production domains
- [ ] Sentry DSN is configured
- [ ] Email credentials are for production account
- [ ] `.env.production` is in `.gitignore`
- [ ] No production secrets committed to git

## Common Pitfalls

### ❌ DON'T

```bash
# DON'T commit .env with real secrets
git add backend/.env

# DON'T use production credentials in development
NODE_ENV=development
STRIPE_SECRET_KEY=sk_live_... # WRONG!

# DON'T hardcode secrets in code
const JWT_SECRET = "my-secret-123"; // WRONG!

# DON'T share .env.production publicly
# It contains ALL your production secrets!
```

### ✅ DO

```bash
# DO use environment-specific files
cp .env.development .env  # For local dev

# DO generate strong secrets
openssl rand -base64 64

# DO verify environment before starting
grep "^NODE_ENV=" .env

# DO use version control for templates
git add .env.development
git add .env.example
```

## Troubleshooting

### "Database connection failed"

```bash
# Check DATABASE_URL
grep "^DATABASE_URL=" backend/.env

# Development: Ensure Docker is running
docker-compose up -d

# Production: Verify connection string and SSL
```

### "Stripe error: Invalid API key"

```bash
# Check Stripe keys
grep "^STRIPE_SECRET_KEY=" backend/.env

# Ensure test keys in development, live keys in production
```

### "Email sending failed"

```bash
# Development: Check fake credentials (expected to fail)
# Production: Verify Gmail App Password
grep "^GMAIL_APP_PASSWORD=" backend/.env
```

### "Environment switch failed"

```bash
# PowerShell: Enable script execution
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Bash: Make script executable
chmod +x switch-env.sh
```

## Best Practices

1. **Always use fake credentials in development**
   - No real money at risk
   - No accidental emails/charges
   - Safe to commit configuration

2. **Never commit `.env.production`**
   - Contains all production secrets
   - One commit can expose everything
   - Use CI/CD environment variables instead

3. **Use the switcher scripts**
   - Automatic backups
   - Validation checks
   - Prevents mistakes

4. **Rotate secrets regularly**
   - Change JWT secrets quarterly
   - Rotate API keys after incidents
   - Update after team member changes

5. **Document custom variables**
   - Add to `.env.example`
   - Update this README
   - Explain purpose and format

## CI/CD Integration

### GitHub Actions

```yaml
# Use secrets, not .env files
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

### Render Deployment

1. Go to Render Dashboard
2. Select your service
3. Environment → Add from `.env` file
4. Paste `.env.production` contents
5. Save (secrets are encrypted)

### Vercel Deployment

```bash
# Add secrets via CLI
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
```

## Support

For questions about:

- **Missing credentials**: Check `.env.example` for required variables
- **Environment setup**: Follow "Quick Start" section above
- **Production deployment**: See `DEPLOYMENT_GUIDE.md`
- **Security concerns**: Contact security@yourdomain.com
