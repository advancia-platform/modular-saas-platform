# 🔐 Environment-Based Secrets Setup Guide

Complete guide for organizing GitHub Secrets by environment (Staging, UAT, Production).

---

## 📋 Overview

This setup ensures your pipeline automatically uses the correct credentials based on deployment environment:
- **Staging** → `staging` branch
- **UAT** → `uat` branch  
- **Production** → `main` branch

---

## 🔹 Step 1: Add Repository Secrets

Go to: **Settings → Secrets and variables → Actions → New repository secret**

### 🟢 Staging Environment

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `STAGING_CF_ZONE_ID` | Cloudflare zone ID for staging | `a1b2c3d4e5f6g7h8...` |
| `STAGING_CF_API_TOKEN` | Cloudflare API token (staging) | `a1b2c3d4e5f6...` |
| `STAGING_CF_RECORD_ID_API` | DNS record ID for api-staging | `1a2b3c4d5e6f...` |
| `STAGING_CF_RECORD_ID_WWW` | DNS record ID for www-staging | `9z8y7x6w5v4u...` |
| `STAGING_DROPLET_IP` | DigitalOcean staging server IP | `164.90.XXX.XXX` |
| `STAGING_DROPLET_USER` | SSH user for staging | `root` or `deploy` |
| `STAGING_DROPLET_SSH_KEY` | Private SSH key for staging | Full private key |
| `STAGING_SLACK_WEBHOOK` | Slack webhook for staging alerts | `https://hooks.slack.com/...` |
| `STAGING_DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@...` |
| `STAGING_REDIS_URL` | Redis connection string | `redis://...` |

### 🟡 UAT Environment

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `UAT_CF_ZONE_ID` | Cloudflare zone ID for UAT | `a1b2c3d4e5f6g7h8...` |
| `UAT_CF_API_TOKEN` | Cloudflare API token (UAT) | `a1b2c3d4e5f6...` |
| `UAT_CF_RECORD_ID_API` | DNS record ID for api-uat | `1a2b3c4d5e6f...` |
| `UAT_CF_RECORD_ID_WWW` | DNS record ID for www-uat | `9z8y7x6w5v4u...` |
| `UAT_DROPLET_IP` | DigitalOcean UAT server IP | `167.71.XXX.XXX` |
| `UAT_DROPLET_USER` | SSH user for UAT | `root` or `deploy` |
| `UAT_DROPLET_SSH_KEY` | Private SSH key for UAT | Full private key |
| `UAT_SLACK_WEBHOOK` | Slack webhook for UAT alerts | `https://hooks.slack.com/...` |
| `UAT_DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@...` |
| `UAT_REDIS_URL` | Redis connection string | `redis://...` |

### 🔴 Production Environment

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `PROD_CF_ZONE_ID` | Cloudflare zone ID for production | `a1b2c3d4e5f6g7h8...` |
| `PROD_CF_API_TOKEN` | Cloudflare API token (production) | `a1b2c3d4e5f6...` |
| `PROD_CF_RECORD_ID_API` | DNS record ID for api.advancia.com | `1a2b3c4d5e6f...` |
| `PROD_CF_RECORD_ID_WWW` | DNS record ID for www.advancia.com | `9z8y7x6w5v4u...` |
| `PROD_DROPLET_IP_BLUE` | Blue environment server IP | `164.90.XXX.XXX` |
| `PROD_DROPLET_IP_GREEN` | Green environment server IP | `167.71.XXX.XXX` |
| `PROD_DROPLET_USER` | SSH user for production | `root` or `deploy` |
| `PROD_DROPLET_SSH_KEY` | Private SSH key for production | Full private key |
| `PROD_SLACK_WEBHOOK` | Slack webhook for production alerts | `https://hooks.slack.com/...` |
| `PROD_DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@...` |
| `PROD_REDIS_URL` | Redis connection string | `redis://...` |

---

## 🔹 Step 2: Workflow Configuration

Your workflows will automatically select secrets based on branch:

```yaml
name: Environment-Aware Deployment

on:
  push:
    branches: [main, uat, staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set environment variables
        run: |
          # Detect environment from branch
          if [[ "${{ github.ref_name }}" == "main" ]]; then
            echo "ENVIRONMENT=production" >> $GITHUB_ENV
            echo "CF_ZONE_ID=${{ secrets.PROD_CF_ZONE_ID }}" >> $GITHUB_ENV
            echo "CF_API_TOKEN=${{ secrets.PROD_CF_API_TOKEN }}" >> $GITHUB_ENV
            echo "CF_RECORD_ID_API=${{ secrets.PROD_CF_RECORD_ID_API }}" >> $GITHUB_ENV
            echo "CF_RECORD_ID_WWW=${{ secrets.PROD_CF_RECORD_ID_WWW }}" >> $GITHUB_ENV
            echo "DROPLET_IP=${{ secrets.PROD_DROPLET_IP_BLUE }}" >> $GITHUB_ENV
            echo "DROPLET_USER=${{ secrets.PROD_DROPLET_USER }}" >> $GITHUB_ENV
            echo "SLACK_WEBHOOK=${{ secrets.PROD_SLACK_WEBHOOK }}" >> $GITHUB_ENV
            echo "DATABASE_URL=${{ secrets.PROD_DATABASE_URL }}" >> $GITHUB_ENV
            echo "REDIS_URL=${{ secrets.PROD_REDIS_URL }}" >> $GITHUB_ENV
          elif [[ "${{ github.ref_name }}" == "uat" ]]; then
            echo "ENVIRONMENT=uat" >> $GITHUB_ENV
            echo "CF_ZONE_ID=${{ secrets.UAT_CF_ZONE_ID }}" >> $GITHUB_ENV
            echo "CF_API_TOKEN=${{ secrets.UAT_CF_API_TOKEN }}" >> $GITHUB_ENV
            echo "CF_RECORD_ID_API=${{ secrets.UAT_CF_RECORD_ID_API }}" >> $GITHUB_ENV
            echo "CF_RECORD_ID_WWW=${{ secrets.UAT_CF_RECORD_ID_WWW }}" >> $GITHUB_ENV
            echo "DROPLET_IP=${{ secrets.UAT_DROPLET_IP }}" >> $GITHUB_ENV
            echo "DROPLET_USER=${{ secrets.UAT_DROPLET_USER }}" >> $GITHUB_ENV
            echo "SLACK_WEBHOOK=${{ secrets.UAT_SLACK_WEBHOOK }}" >> $GITHUB_ENV
            echo "DATABASE_URL=${{ secrets.UAT_DATABASE_URL }}" >> $GITHUB_ENV
            echo "REDIS_URL=${{ secrets.UAT_REDIS_URL }}" >> $GITHUB_ENV
          else
            echo "ENVIRONMENT=staging" >> $GITHUB_ENV
            echo "CF_ZONE_ID=${{ secrets.STAGING_CF_ZONE_ID }}" >> $GITHUB_ENV
            echo "CF_API_TOKEN=${{ secrets.STAGING_CF_API_TOKEN }}" >> $GITHUB_ENV
            echo "CF_RECORD_ID_API=${{ secrets.STAGING_CF_RECORD_ID_API }}" >> $GITHUB_ENV
            echo "CF_RECORD_ID_WWW=${{ secrets.STAGING_CF_RECORD_ID_WWW }}" >> $GITHUB_ENV
            echo "DROPLET_IP=${{ secrets.STAGING_DROPLET_IP }}" >> $GITHUB_ENV
            echo "DROPLET_USER=${{ secrets.STAGING_DROPLET_USER }}" >> $GITHUB_ENV
            echo "SLACK_WEBHOOK=${{ secrets.STAGING_SLACK_WEBHOOK }}" >> $GITHUB_ENV
            echo "DATABASE_URL=${{ secrets.STAGING_DATABASE_URL }}" >> $GITHUB_ENV
            echo "REDIS_URL=${{ secrets.STAGING_REDIS_URL }}" >> $GITHUB_ENV
          fi

      - name: Display environment
        run: |
          echo "🚀 Deploying to: $ENVIRONMENT"
          echo "📍 Target IP: $DROPLET_IP"
```

---

## 🔹 Step 3: DNS Update Example

```yaml
- name: Update Cloudflare DNS
  run: |
    echo "Updating DNS for $ENVIRONMENT environment..."
    
    # Update API subdomain
    curl -X PATCH \
      "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$CF_RECORD_ID_API" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "{\"type\":\"A\",\"name\":\"api-$ENVIRONMENT.advancia.com\",\"content\":\"$DROPLET_IP\",\"ttl\":120,\"proxied\":true}"
    
    # Update WWW subdomain
    curl -X PATCH \
      "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$CF_RECORD_ID_WWW" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "{\"type\":\"A\",\"name\":\"www-$ENVIRONMENT.advancia.com\",\"content\":\"$DROPLET_IP\",\"ttl\":120,\"proxied\":true}"
```

---

## 🔹 Step 4: SSH Deployment Example

```yaml
- name: Setup SSH key
  run: |
    mkdir -p ~/.ssh
    echo "${{ secrets.STAGING_DROPLET_SSH_KEY }}" > ~/.ssh/deploy_key
    chmod 600 ~/.ssh/deploy_key
    ssh-keyscan -H $DROPLET_IP >> ~/.ssh/known_hosts

- name: Deploy to server
  run: |
    ssh -i ~/.ssh/deploy_key $DROPLET_USER@$DROPLET_IP << 'EOF'
      cd /opt/advancia
      git pull origin ${{ github.ref_name }}
      docker-compose down
      docker-compose up -d --build
      echo "✅ Deployed to $ENVIRONMENT"
    EOF
```

---

## 🔹 Step 5: Slack Notification Example

```yaml
- name: Send Slack notification
  if: always()
  run: |
    STATUS="${{ job.status }}"
    COLOR="good"
    [[ "$STATUS" == "failure" ]] && COLOR="danger"
    
    curl -X POST $SLACK_WEBHOOK \
      -H 'Content-Type: application/json' \
      -d '{
        "attachments": [{
          "color": "'$COLOR'",
          "title": "Deployment to '$ENVIRONMENT'",
          "text": "Status: '$STATUS'\nBranch: ${{ github.ref_name }}\nCommit: ${{ github.sha }}",
          "footer": "GitHub Actions"
        }]
      }'
```

---

## 🛠️ Quick Setup Scripts

### PowerShell: Add All Staging Secrets
```powershell
# Save as add-staging-secrets.ps1

$stagingSecrets = @{
    "STAGING_CF_ZONE_ID" = "YOUR_VALUE"
    "STAGING_CF_API_TOKEN" = "YOUR_VALUE"
    "STAGING_CF_RECORD_ID_API" = "YOUR_VALUE"
    "STAGING_CF_RECORD_ID_WWW" = "YOUR_VALUE"
    "STAGING_DROPLET_IP" = "YOUR_VALUE"
    "STAGING_DROPLET_USER" = "root"
    "STAGING_DROPLET_SSH_KEY" = @"
-----BEGIN OPENSSH PRIVATE KEY-----
YOUR_KEY_HERE
-----END OPENSSH PRIVATE KEY-----
"@
    "STAGING_SLACK_WEBHOOK" = "YOUR_VALUE"
    "STAGING_DATABASE_URL" = "postgresql://..."
    "STAGING_REDIS_URL" = "redis://..."
}

Write-Host "📋 Staging Secrets Checklist:" -ForegroundColor Cyan
foreach ($key in $stagingSecrets.Keys) {
    Write-Host "  • $key" -ForegroundColor Yellow
}

Write-Host "`n➡️  Add these at:" -ForegroundColor Green
Write-Host "https://github.com/muchaeljohn739337-cloud/-modular-saas-platform/settings/secrets/actions"
```

### Get Cloudflare Record IDs by Environment
```powershell
# Save as get-cf-records-all.ps1

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("staging", "uat", "production")]
    [string]$Environment
)

$ZONE_ID = Read-Host "Enter Cloudflare Zone ID"
$API_TOKEN = Read-Host "Enter Cloudflare API Token"

$subdomain = if ($Environment -eq "production") { "" } else { "-$Environment" }

Write-Host "`nFetching DNS records for $Environment..." -ForegroundColor Cyan

# Get API record
$apiDomain = "api$subdomain.advancia.com"
$apiRecord = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=$apiDomain" `
    -Headers @{
        "Authorization" = "Bearer $API_TOKEN"
        "Content-Type" = "application/json"
    }

# Get WWW record
$wwwDomain = "www$subdomain.advancia.com"
$wwwRecord = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=$wwwDomain" `
    -Headers @{
        "Authorization" = "Bearer $API_TOKEN"
        "Content-Type" = "application/json"
    }

Write-Host "`n✅ Record IDs for $Environment environment:" -ForegroundColor Green
Write-Host "API ($apiDomain): " -NoNewline -ForegroundColor Yellow
Write-Host $apiRecord.result[0].id -ForegroundColor White
Write-Host "WWW ($wwwDomain): " -NoNewline -ForegroundColor Yellow
Write-Host $wwwRecord.result[0].id -ForegroundColor White
```

---

## 📊 Environment Matrix

| Environment | Branch | Domain Pattern | Server Count | DNS TTL |
|-------------|--------|----------------|--------------|---------|
| **Staging** | `staging` | `*-staging.advancia.com` | 1 | 120s |
| **UAT** | `uat` | `*-uat.advancia.com` | 1 | 300s |
| **Production** | `main` | `*.advancia.com` | 2 (Blue/Green) | 60s |

---

## ✅ Verification Checklist

### Staging
- [ ] Added all 10 staging secrets
- [ ] Created staging branch: `git checkout -b staging`
- [ ] Tested staging deployment workflow
- [ ] Verified DNS updates to `-staging` subdomain
- [ ] Confirmed Slack notifications work

### UAT
- [ ] Added all 10 UAT secrets
- [ ] Created UAT branch: `git checkout -b uat`
- [ ] Tested UAT deployment workflow
- [ ] Verified DNS updates to `-uat` subdomain
- [ ] Confirmed Slack notifications work

### Production
- [ ] Added all 11 production secrets
- [ ] Set up Blue and Green droplets
- [ ] Tested blue/green deployment workflow
- [ ] Verified DNS switching works
- [ ] Tested emergency rollback
- [ ] Confirmed production Slack notifications

---

## 🔒 Security Best Practices

### ✅ Do's
- ✅ Use **separate API tokens** for each environment
- ✅ Use **different SSH keys** per environment
- ✅ Set up **separate Slack channels** (e.g., #staging-deploys, #prod-deploys)
- ✅ Use **environment-specific databases** (never share prod data)
- ✅ Rotate secrets every **90 days**
- ✅ Test in **staging → UAT → production** order

### ❌ Don'ts
- ❌ Never use production secrets in staging/UAT
- ❌ Don't commit `.env` files to git
- ❌ Never share secrets via email/Slack
- ❌ Don't use admin-level API tokens
- ❌ Never skip UAT testing
- ❌ Don't deploy to production on Fridays 😉

---

## 🎯 Deployment Flow

```
Developer pushes to staging branch
    ↓
GitHub Actions detects staging branch
    ↓
Loads STAGING_* secrets automatically
    ↓
Deploys to staging.advancia.com
    ↓
QA team tests in staging
    ↓
Merge staging → uat branch
    ↓
Loads UAT_* secrets automatically
    ↓
Deploys to uat.advancia.com
    ↓
UAT testing and sign-off
    ↓
Merge uat → main branch
    ↓
Loads PROD_* secrets automatically
    ↓
Blue/Green deployment to production
    ↓
advancia.com goes live! 🎉
```

---

## 📞 Troubleshooting

### Issue: Wrong environment detected
**Solution**: Check branch name matches exactly (`staging`, `uat`, or `main`)

### Issue: Secrets not loading
**Checklist**:
- [ ] Secret name has correct prefix (STAGING_, UAT_, PROD_)
- [ ] Secret is added to repository (not environment)
- [ ] Branch trigger includes your branch name
- [ ] Workflow has permission to read secrets

### Issue: DNS not updating
**Checklist**:
- [ ] CF_ZONE_ID is correct for domain
- [ ] CF_API_TOKEN has "Edit DNS" permission
- [ ] CF_RECORD_ID is correct for specific subdomain
- [ ] DNS record exists in Cloudflare dashboard

### Issue: SSH connection fails
**Checklist**:
- [ ] SSH key is complete (including header/footer)
- [ ] SSH key has no passphrase
- [ ] DROPLET_IP is correct
- [ ] DROPLET_USER has access
- [ ] Server allows key-based auth

---

## 🚀 Next Steps

1. **Add all secrets to GitHub** using the checklist above
2. **Create branches**: `staging` and `uat`
3. **Update workflows** to use environment detection
4. **Test staging deployment** first
5. **Promote to UAT** after staging validation
6. **Deploy to production** via blue/green workflow

---

**Last Updated**: November 15, 2025  
**Status**: Ready for multi-environment deployment ✅

For production blue/green specifics, see `BLUE_GREEN_DEPLOYMENT_GUIDE.md`
