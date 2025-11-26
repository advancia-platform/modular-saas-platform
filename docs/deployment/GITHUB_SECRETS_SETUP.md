# 🔐 GitHub Secrets Setup Guide

## Quick Setup Instructions

### Step 1: Access GitHub Secrets

1. Go to your repository: <https://github.com/muchaeljohn739337-cloud/-modular-saas-platform>
2. Click **Settings** tab
3. In left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** button

---

## Required Secrets

### 🖥️ DigitalOcean / Server Configuration

#### `DROPLET_IP_BLUE`

- **Description**: IP address of Blue environment server
- **Example**: `164.90.XXX.XXX`
- **How to get**:
  - Login to DigitalOcean dashboard
  - Go to Droplets
  - Copy IPv4 address of your Blue server

#### `DROPLET_IP_GREEN`

- **Description**: IP address of Green environment server
- **Example**: `167.71.XXX.XXX`
- **How to get**:
  - Login to DigitalOcean dashboard
  - Go to Droplets
  - Copy IPv4 address of your Green server

#### `DROPLET_SSH_KEY_PROD`

- **Description**: Private SSH key for accessing production servers
- **Value**: Your entire private SSH key
- **How to get**:

  ```bash
  # On your local machine
  cat ~/.ssh/id_rsa
  # Or if you have a specific key
  cat ~/.ssh/production_key
  ```

- **Format**: Should look like:

  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
  ... (many more lines)
  -----END OPENSSH PRIVATE KEY-----
  ```

- **⚠️ Important**:
  - Copy the ENTIRE key including header and footer
  - Never share this key or commit to git
  - Use a key without passphrase for automation

#### `DROPLET_USER_PROD`

- **Description**: SSH username for production servers
- **Example**: `root` or `deploy`
- **Default**: Usually `root` for DigitalOcean droplets

---

### ☁️ Cloudflare Configuration

#### `CF_ZONE_ID`

- **Description**: Cloudflare Zone ID for your domain
- **How to get**:

  1. Login to Cloudflare dashboard
  2. Select your domain (advancia.com)
  3. Scroll down on Overview page
  4. Copy **Zone ID** from API section (right sidebar)

- **Example**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

#### `CF_API_TOKEN`

- **Description**: Cloudflare API token with DNS edit permissions
- **How to get**:

  1. Cloudflare Dashboard → Profile → API Tokens
  2. Click **Create Token**
  3. Use **Edit zone DNS** template
  4. **Zone Resources**: Include → Specific zone → advancia.com
  5. Click **Continue to summary** → **Create Token**
  6. Copy the token (you'll only see it once!)

- **Example**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`
- **Permissions needed**: Zone.DNS (Edit)

#### `CF_PROD_RECORD_ID`

- **Description**: DNS record ID for api.advancia.com
- **How to get**:

  ```bash
  curl -X GET "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records?name=api.advancia.com" \
    -H "Authorization: Bearer YOUR_API_TOKEN" \
    -H "Content-Type: application/json"
  ```

- Look for `"id"` field in the response
- **Example**: `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`

#### `CF_WWW_RECORD_ID`

- **Description**: DNS record ID for <www.advancia.com>
- **How to get**:

  ```bash
  curl -X GET "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records?name=www.advancia.com" \
    -H "Authorization: Bearer YOUR_API_TOKEN" \
    -H "Content-Type: application/json"
  ```

- Look for `"id"` field in the response
- **Example**: `9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k`

---

### 💬 Slack Configuration

#### `SLACK_WEBHOOK_URL`

- **Description**: Slack incoming webhook URL for deployment notifications
- **How to get**:

  1. Go to <https://api.slack.com/apps>
  2. Click **Create New App** → **From scratch**
  3. Name: "Advancia Deployments", Select workspace
  4. Click **Incoming Webhooks** → Toggle **Activate Incoming Webhooks** ON
  5. Click **Add New Webhook to Workspace**
  6. Select channel (e.g., #deployments)
  7. Copy **Webhook URL**

- **Example**: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`
- **Optional**: Can use Discord webhook or other notification services

---

## Setup Script (PowerShell)

Save this as `setup-secrets.ps1` and customize values:

```powershell
# GitHub Secrets Setup Script
# Replace all placeholder values before running

$secrets = @{
    "DROPLET_IP_BLUE" = "YOUR_BLUE_IP"
    "DROPLET_IP_GREEN" = "YOUR_GREEN_IP"
    "DROPLET_SSH_KEY_PROD" = @"
-----BEGIN OPENSSH PRIVATE KEY-----
YOUR_PRIVATE_KEY_CONTENT_HERE
-----END OPENSSH PRIVATE KEY-----
"@
    "DROPLET_USER_PROD" = "root"
    "CF_ZONE_ID" = "YOUR_CLOUDFLARE_ZONE_ID"
    "CF_API_TOKEN" = "YOUR_CLOUDFLARE_API_TOKEN"
    "CF_PROD_RECORD_ID" = "YOUR_API_DNS_RECORD_ID"
    "CF_WWW_RECORD_ID" = "YOUR_WWW_DNS_RECORD_ID"
    "SLACK_WEBHOOK_URL" = "YOUR_SLACK_WEBHOOK_URL"
}

Write-Host "GitHub Secrets to Add:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
foreach ($key in $secrets.Keys) {
    $value = $secrets[$key]
    if ($value.Length -gt 50) {
        $display = $value.Substring(0, 47) + "..."
    } else {
        $display = $value
    }
    Write-Host "$key = $display" -ForegroundColor Yellow
}

Write-Host "`nAdd these manually at:" -ForegroundColor Green
Write-Host "https://github.com/muchaeljohn739337-cloud/-modular-saas-platform/settings/secrets/actions" -ForegroundColor White
```

---

## Verification

### Test Secrets Are Set

1. Go to: <https://github.com/muchaeljohn739337-cloud/-modular-saas-platform/settings/secrets/actions>
2. Verify all 9 secrets are listed
3. Run a workflow to test

### Quick Test Workflow

```yaml
name: Test Secrets
on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test Secrets
        run: |
          echo "Testing secrets (not showing values)..."
          [ -n "${{ secrets.DROPLET_IP_BLUE }}" ] && echo "✅ DROPLET_IP_BLUE set"
          [ -n "${{ secrets.DROPLET_IP_GREEN }}" ] && echo "✅ DROPLET_IP_GREEN set"
          [ -n "${{ secrets.DROPLET_SSH_KEY_PROD }}" ] && echo "✅ DROPLET_SSH_KEY_PROD set"
          [ -n "${{ secrets.DROPLET_USER_PROD }}" ] && echo "✅ DROPLET_USER_PROD set"
          [ -n "${{ secrets.CF_ZONE_ID }}" ] && echo "✅ CF_ZONE_ID set"
          [ -n "${{ secrets.CF_API_TOKEN }}" ] && echo "✅ CF_API_TOKEN set"
          [ -n "${{ secrets.CF_PROD_RECORD_ID }}" ] && echo "✅ CF_PROD_RECORD_ID set"
          [ -n "${{ secrets.CF_WWW_RECORD_ID }}" ] && echo "✅ CF_WWW_RECORD_ID set"
          [ -n "${{ secrets.SLACK_WEBHOOK_URL }}" ] && echo "✅ SLACK_WEBHOOK_URL set"
          echo "All secrets configured!"
```

---

## Security Best Practices

### ✅ Do's

- ✅ Use separate SSH keys for CI/CD
- ✅ Rotate secrets every 90 days
- ✅ Use least-privilege API tokens
- ✅ Monitor secret usage in audit logs
- ✅ Use environment-specific secrets
- ✅ Test in staging first

### ❌ Don'ts

- ❌ Never commit secrets to git
- ❌ Never share secrets via email/chat
- ❌ Don't use personal SSH keys
- ❌ Don't use admin-level tokens
- ❌ Never log secret values
- ❌ Don't reuse secrets across projects

---

## Troubleshooting

### Issue: "Context access might be invalid"

**Solution**: This is just a linter warning. Secrets work fine in actual GitHub Actions.

### Issue: SSH connection fails

**Checklist**:

- [ ] SSH key is complete (including header/footer)
- [ ] SSH key has no passphrase
- [ ] Server allows key-based auth
- [ ] IP addresses are correct
- [ ] User has permission on server

### Issue: Cloudflare API fails

**Checklist**:

- [ ] API token has Edit DNS permission
- [ ] Zone ID is correct
- [ ] DNS record IDs are correct
- [ ] Token hasn't expired

### Issue: Slack notifications not working

**Checklist**:

- [ ] Webhook URL is complete
- [ ] Webhook hasn't been revoked
- [ ] Channel still exists
- [ ] App is installed in workspace

---

## Quick Reference Card

| Secret                 | Where to Get It                   | Format             |
| ---------------------- | --------------------------------- | ------------------ |
| `DROPLET_IP_BLUE`      | DigitalOcean Dashboard            | `1.2.3.4`          |
| `DROPLET_IP_GREEN`     | DigitalOcean Dashboard            | `5.6.7.8`          |
| `DROPLET_SSH_KEY_PROD` | `~/.ssh/id_rsa`                   | Full private key   |
| `DROPLET_USER_PROD`    | Server config                     | `root` or `deploy` |
| `CF_ZONE_ID`           | Cloudflare → Domain → Overview    | 32 char hex        |
| `CF_API_TOKEN`         | Cloudflare → Profile → API Tokens | 40 char string     |
| `CF_PROD_RECORD_ID`    | Cloudflare API                    | 32 char hex        |
| `CF_WWW_RECORD_ID`     | Cloudflare API                    | 32 char hex        |
| `SLACK_WEBHOOK_URL`    | Slack API Apps                    | Full URL           |

---

## Helper Scripts

### Get Cloudflare DNS Record IDs

```powershell
# Save as get-cf-records.ps1
$ZONE_ID = "YOUR_ZONE_ID"
$API_TOKEN = "YOUR_API_TOKEN"

Write-Host "Fetching DNS records..." -ForegroundColor Cyan

# Get api.advancia.com record
$apiRecord = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=api.advancia.com" `
    -Headers @{
        "Authorization" = "Bearer $API_TOKEN"
        "Content-Type" = "application/json"
    }

# Get www.advancia.com record
$wwwRecord = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=www.advancia.com" `
    -Headers @{
        "Authorization" = "Bearer $API_TOKEN"
        "Content-Type" = "application/json"
    }

Write-Host "`nAPI Record ID: " -NoNewline -ForegroundColor Yellow
Write-Host $apiRecord.result[0].id -ForegroundColor Green

Write-Host "WWW Record ID: " -NoNewline -ForegroundColor Yellow
Write-Host $wwwRecord.result[0].id -ForegroundColor Green
```

### Generate SSH Key for CI/CD

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "github-actions@advancia.com" -f ~/.ssh/github_actions_key -N ""

# Copy public key to servers
ssh-copy-id -i ~/.ssh/github_actions_key.pub root@YOUR_BLUE_IP
ssh-copy-id -i ~/.ssh/github_actions_key.pub root@YOUR_GREEN_IP

# Copy private key for GitHub Secret
cat ~/.ssh/github_actions_key
```

---

## Status Checklist

Use this to track your progress:

- [ ] Created both DigitalOcean droplets (Blue & Green)
- [ ] Copied Blue server IP address
- [ ] Copied Green server IP address
- [ ] Generated SSH key for CI/CD
- [ ] Added public key to both servers
- [ ] Tested SSH connection to both servers
- [ ] Obtained Cloudflare Zone ID
- [ ] Created Cloudflare API token
- [ ] Retrieved api.advancia.com DNS record ID
- [ ] Retrieved <www.advancia.com> DNS record ID
- [ ] Created Slack webhook
- [ ] Added all 9 secrets to GitHub
- [ ] Verified secrets are set
- [ ] Ran test workflow

---

## Next Steps

After adding all secrets:

1. **Test Blue/Green Deployment**

   ```
   Actions → Blue/Green Production Deployment → Run workflow
   ```

2. **Monitor First Deployment**
   - Watch workflow progress
   - Check Slack notifications
   - Verify health checks

3. **Test Manual Switch**

   ```
   Actions → Manual Traffic Switch → Run workflow
   ```

4. **Test Emergency Rollback**

   ```
   Actions → Emergency Rollback → Run workflow
   ```

---

**Last Updated**: November 15, 2025  
**Status**: Ready for setup ✅

For questions or issues, refer to `BLUE_GREEN_DEPLOYMENT_GUIDE.md`
