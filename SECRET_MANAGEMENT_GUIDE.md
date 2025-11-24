# 🔐 Secret Management - Quick Reference

## ⚠️ CRITICAL RULES

### ❌ NEVER Do This

```bash
# DON'T commit real secrets
STRIPE_SECRET_KEY=sk_test_EXAMPLE_DO_NOT_USE_REAL_KEYS_HERE

# DON'T hardcode passwords
DATABASE_URL=postgresql://admin:MyP@ssw0rd123@localhost:5432/db

# DON'T commit .env files with real values
git add .env.production
```

### ✅ ALWAYS Do This

```bash
# Use placeholders in documentation
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Use environment variables
DATABASE_URL=$DATABASE_URL

# Use GitHub Secrets in workflows
env:
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

---

## 🔑 How to Manage Secrets Properly

### 1. Local Development

**Create `.env` file (never commit):**

```bash
# backend/.env
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/advancia_dev
JWT_SECRET=your-local-jwt-secret-for-dev-only
STRIPE_SECRET_KEY=sk_test_your_test_key_here
```

**Verify it's ignored:**

```powershell
git status  # Should NOT show .env file
git check-ignore -v backend/.env  # Should show .gitignore rule
```

---

### 2. GitHub Actions (CI/CD)

**Add secrets to repository:**

1. Go to: `Repository Settings → Secrets and variables → Actions`
2. Click "New repository secret"
3. Add each secret:

```
DATABASE_URL = postgresql://user:pass@host:5432/db
JWT_SECRET = <generate with: node -e "console.log(require('crypto').randomBytes(64).toString('base64'))">
STRIPE_SECRET_KEY = sk_live_... or sk_test_...
AWS_ACCESS_KEY_ID = AKIA...
AWS_SECRET_ACCESS_KEY = ...
```

**Use in workflow:**

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      JWT_SECRET: ${{ secrets.JWT_SECRET }}
    steps:
      - name: Deploy
        run: npm run deploy
```

---

### 3. Production Deployment (Digital Ocean / Server)

**Option A: Environment Variables in PM2**

```bash
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'advancia-backend',
    script: './dist/index.js',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET
    }
  }]
}
```

**Option B: Server Environment Variables**

```bash
# On server, add to ~/.bashrc or /etc/environment
export DATABASE_URL="postgresql://..."
export JWT_SECRET="..."

# Reload
source ~/.bashrc

# Verify
echo $DATABASE_URL  # Should show value
pm2 restart all
```

**Option C: Use .env file on server (secure it)**

```bash
# On server only
touch /var/www/advancia/backend/.env.production
chmod 600 /var/www/advancia/backend/.env.production  # Owner read/write only

# Add secrets
nano /var/www/advancia/backend/.env.production
```

---

## 🔒 Generate Secure Secrets

### JWT Secret (64 bytes, base64)

```powershell
# PowerShell
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Or use this PowerShell native:
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Session Secret (64 bytes, base64)

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### API Key (32 bytes, hex)

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Random Password (20 chars)

```powershell
node -e "console.log(require('crypto').randomBytes(20).toString('base64').slice(0,20))"
```

---

## 🛡️ Security Checklist

### Before Every Commit

- [ ] No `.env` files in git status
- [ ] No hardcoded passwords in code
- [ ] No API keys in documentation
- [ ] All secrets use placeholders like `YOUR_KEY_HERE`
- [ ] Run: `git grep -E "(sk_live_|sk_test_|ghp_|AKIA)" -- ':!SECURITY_AUDIT_*'`

### Before Every Deploy

- [ ] Production secrets are in GitHub Secrets
- [ ] Server has correct environment variables
- [ ] JWT_SECRET is different from dev
- [ ] Database credentials are strong
- [ ] Stripe is using live keys (not test)

### Monthly

- [ ] Rotate JWT secrets
- [ ] Rotate database passwords
- [ ] Check for leaked secrets: <https://github.com/settings/security>
- [ ] Review GitHub Actions logs for exposed secrets

---

## 🚨 What to Do If You Committed a Secret

### 1. Immediate Actions (within 5 minutes)

```powershell
# Stop immediately - don't push if you haven't
git reset --soft HEAD~1  # Undo commit (keeps changes)

# If already pushed to GitHub:
# 1. Revoke the secret IMMEDIATELY:
#    - Stripe: https://dashboard.stripe.com/test/apikeys
#    - GitHub: https://github.com/settings/tokens
#    - AWS: https://console.aws.amazon.com/iam/
```

### 2. Remove from Git History

```powershell
# Install BFG Repo Cleaner
choco install bfg-repo-cleaner  # or download from https://rtyley.github.io/bfg-repo-cleaner/

# Remove secret from all history
bfg --replace-text secrets.txt  # Create secrets.txt with your exposed secrets

# Or use git-filter-branch (slower)
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch path/to/file" --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: Rewrites history)
git push origin --force --all
```

### 3. Generate New Secrets

```powershell
# Generate new JWT secret
$newJWT = node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Update GitHub Secrets
# Go to: Repository Settings → Secrets → Edit JWT_SECRET
```

### 4. Notify Team

```
Subject: SECURITY INCIDENT - Secret Rotation Required

Team,

A secret was accidentally committed to the repository.

Action taken:
- Secret has been revoked
- Git history cleaned
- New secret generated

Required action from you:
- Pull latest changes: git pull --force
- Update your local .env with new secrets (see Slack/Email)
- Restart your development environment

Timeline: Complete within 1 hour.
```

---

## 📚 Tools for Secret Detection

### Pre-commit Hook (Recommended)

```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: detect-private-key
      - id: check-added-large-files
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
EOF

# Install hooks
pre-commit install
```

### Gitleaks (Secret Scanner)

```powershell
# Install
choco install gitleaks

# Scan repository
gitleaks detect --source . --verbose

# Scan before commit
gitleaks protect --staged --verbose
```

### GitHub Secret Scanning

1. Go to: `Repository Settings → Security → Code security and analysis`
2. Enable "Secret scanning"
3. Enable "Push protection" (blocks commits with secrets)

---

## 📖 References

- GitHub Secrets Management: <https://docs.github.com/en/actions/security-guides/encrypted-secrets>
- OWASP Secrets Management: <https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html>
- Digital Ocean Environment Variables: <https://docs.digitalocean.com/products/app-platform/how-to/use-environment-variables/>

---

**Last Updated:** 2025-11-17  
**Maintainer:** DevOps Team  
**Review Frequency:** Quarterly
