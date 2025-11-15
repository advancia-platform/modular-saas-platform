# 🚀 Quick Start: Deployment Pipeline Implementation

Step-by-step guide to get your deployment pipeline running.

---

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] GitHub repository access (admin permissions)
- [ ] DigitalOcean account (or cloud provider)
- [ ] Cloudflare account with domain configured
- [ ] Slack workspace (for notifications)
- [ ] Local development environment setup

---

## 🎯 Quick Start (15 Minutes)

### Step 1: Create GitHub Environments (5 min)

1. **Go to repository settings**
   ```
   https://github.com/muchaeljohn739337-cloud/-modular-saas-platform/settings/environments
   ```

2. **Create three environments**:
   - Click **"New environment"**
   - Name: `staging` → **Add environment**
   - Name: `uat` → **Add environment**  
   - Name: `production` → **Add environment**

3. **Configure production protection**:
   - Click on `production` environment
   - ✅ Check **"Required reviewers"**
   - Add reviewers: `@your-username, @tech-lead`
   - ✅ Check **"Wait timer"**: `5` minutes
   - Click **"Save protection rules"**

### Step 2: Add Secrets to Each Environment (5 min)

For **each environment** (staging, uat, production):

1. Click environment name → **"Add secret"**
2. Add these secrets:

```
CF_ZONE_ID          = your_cloudflare_zone_id
CF_API_TOKEN        = your_cloudflare_api_token
CF_RECORD_ID_API    = dns_record_id_for_api_subdomain
CF_RECORD_ID_WWW    = dns_record_id_for_www_subdomain
DROPLET_IP          = your_server_ip (or DROPLET_IP_BLUE/GREEN for prod)
DROPLET_USER        = root
DROPLET_SSH_KEY     = [paste your private SSH key]
SLACK_WEBHOOK       = https://hooks.slack.com/services/...
DATABASE_URL        = postgresql://...
REDIS_URL           = redis://...
```

**For production only**, also add:
```
DROPLET_IP_GREEN    = green_server_ip
NGINX_LB_IP         = load_balancer_ip (for canary)
```

### Step 3: Create Deployment Branches (2 min)

```powershell
# Create staging branch
git checkout -b staging
git push origin staging

# Create UAT branch
git checkout -b uat
git push origin uat

# Return to main
git checkout main
```

### Step 4: Test Staging Deployment (3 min)

```powershell
# Make a test change
git checkout staging
echo "# Test deployment" >> DEPLOYMENT_TEST.md
git add .
git commit -m "Test staging auto-deploy"
git push origin staging
```

**Expected result:**
- Workflow runs automatically
- Deploys to staging environment
- No approval needed
- Slack notification sent

**Check it:**
- Go to **Actions** tab
- See "Controlled Promotion Pipeline" running
- Monitor progress

---

## 🔐 Getting Required Credentials

### Cloudflare Setup

#### 1. Get Zone ID
```powershell
# Login to Cloudflare dashboard
# Select your domain (advancia.com)
# Scroll to "API" section on Overview page
# Copy "Zone ID"
```

#### 2. Create API Token
```powershell
# Cloudflare dashboard → My Profile → API Tokens
# Click "Create Token"
# Use template: "Edit zone DNS"
# Zone Resources: Include → Specific zone → advancia.com
# Click "Continue to summary" → "Create Token"
# Copy the token (shown only once!)
```

#### 3. Get DNS Record IDs
```powershell
# Save this script as get-dns-records.ps1
$ZONE_ID = "YOUR_ZONE_ID"
$API_TOKEN = "YOUR_API_TOKEN"

# Get API record
$apiRecord = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=api-staging.advancia.com" `
    -Headers @{
        "Authorization" = "Bearer $API_TOKEN"
        "Content-Type" = "application/json"
    }

Write-Host "API Record ID: $($apiRecord.result[0].id)"

# Get WWW record
$wwwRecord = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=www-staging.advancia.com" `
    -Headers @{
        "Authorization" = "Bearer $API_TOKEN"
        "Content-Type" = "application/json"
    }

Write-Host "WWW Record ID: $($wwwRecord.result[0].id)"
```

### DigitalOcean Setup

#### 1. Create Droplets
```powershell
# Go to DigitalOcean dashboard → Create → Droplets
# For Staging: Create 1 droplet (staging.advancia.com)
# For UAT: Create 1 droplet (uat.advancia.com)
# For Production: Create 2 droplets (Blue & Green)

# Recommended specs:
# - Ubuntu 22.04 LTS
# - 2GB RAM / 2 vCPUs (minimum)
# - Enable monitoring
# - Add SSH key
```

#### 2. Generate SSH Key for CI/CD
```powershell
# Generate new key specifically for GitHub Actions
ssh-keygen -t rsa -b 4096 -C "github-actions@advancia.com" -f github_actions_key -N ""

# Copy public key to all servers
Get-Content github_actions_key.pub | ssh root@YOUR_STAGING_IP "cat >> ~/.ssh/authorized_keys"
Get-Content github_actions_key.pub | ssh root@YOUR_UAT_IP "cat >> ~/.ssh/authorized_keys"
Get-Content github_actions_key.pub | ssh root@YOUR_BLUE_IP "cat >> ~/.ssh/authorized_keys"
Get-Content github_actions_key.pub | ssh root@YOUR_GREEN_IP "cat >> ~/.ssh/authorized_keys"

# Copy private key content for GitHub secret
Get-Content github_actions_key
```

### Slack Setup

#### Create Webhook
```powershell
# 1. Go to https://api.slack.com/apps
# 2. Click "Create New App" → "From scratch"
# 3. Name: "Advancia Deployments"
# 4. Select your workspace
# 5. Click "Incoming Webhooks" → Activate
# 6. Click "Add New Webhook to Workspace"
# 7. Select channel: #deployments (or create it)
# 8. Copy webhook URL
```

---

## 🧪 Testing Each Deployment Type

### Test 1: Staging Auto-Deploy ✅

```powershell
# Push to staging branch
git checkout staging
echo "Feature A" >> features.txt
git add .
git commit -m "Add Feature A"
git push origin staging

# Result: Deploys automatically, no approval
# Check: https://www-staging.advancia.com
```

### Test 2: UAT Approval Gate ⏸️

```powershell
# Merge staging to UAT
git checkout uat
git merge staging
git push origin uat

# Result: Workflow pauses for approval
# Action needed:
# 1. Go to Actions → Find workflow
# 2. Click "Review deployments"
# 3. Select "uat" environment
# 4. Click "Approve and deploy"

# After approval: Deploys to https://www-uat.advancia.com
```

### Test 3: Production Blue/Green 🔵🟢

```powershell
# Merge UAT to main
git checkout main
git merge uat
git push origin main

# Result: 
# 1. 5-minute wait timer starts
# 2. Requires 2 approvals from production reviewers
# 3. After approval: Blue/Green deployment starts
# 4. Deploys to inactive environment
# 5. Runs health checks
# 6. Switches DNS automatically
# 7. Old environment kept for rollback

# Check: https://www.advancia.com
```

### Test 4: Canary Deployment 🐤

```powershell
# Manually trigger canary workflow
# Go to: Actions → Canary Deployment → Run workflow
# Select: target_environment = green
# Click: "Run workflow"

# Result:
# Stage 1: 10% traffic → Green (5 min monitoring)
# Stage 2: 25% traffic → Green (5 min monitoring)
# Stage 3: 50% traffic → Green (10 min monitoring)
# Stage 4: 75% traffic → Green (10 min monitoring)
# Stage 5: 100% traffic → Green (30 min monitoring)

# Total duration: ~65 minutes
# Auto-rollback on any health check failure
```

### Test 5: Emergency Rollback 🚨

```powershell
# Go to: Actions → Emergency Rollback → Run workflow
# Click: "Run workflow"

# Result:
# 1. Detects current live environment
# 2. Switches DNS to other environment
# 3. Completes in < 2 minutes
# 4. Sends urgent Slack notification
```

---

## 🔧 Server Setup (First Time Only)

### Install Docker on All Servers

```bash
# SSH into each server
ssh root@YOUR_SERVER_IP

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

### Clone Repository

```bash
# Create app directory
mkdir -p /opt/advancia
cd /opt/advancia

# Clone repo
git clone https://github.com/muchaeljohn739337-cloud/-modular-saas-platform.git .

# Set up environment
cp .env.example .env
nano .env  # Edit with your values
```

### Install NGINX Load Balancer (For Canary)

```bash
# On dedicated load balancer server
apt update
apt install -y nginx

# Create upstream config
cat > /etc/nginx/conf.d/upstream.conf << 'EOF'
upstream backend {
    server BLUE_IP:4000 weight=1;
    server GREEN_IP:4000 weight=0;  # Initially off
    keepalive 32;
}
EOF

# Create main config
cat > /etc/nginx/conf.d/advancia.conf << 'EOF'
server {
    listen 80;
    server_name api.advancia.com;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        add_header X-Served-By $upstream_addr always;
    }
    
    location /health {
        access_log off;
        proxy_pass http://backend;
    }
}
EOF

# Test and start
nginx -t
systemctl enable nginx
systemctl start nginx
```

---

## 📊 Monitoring Setup

### View Deployment Status

```powershell
# Real-time monitoring
# Go to: Actions → Select workflow → Live logs

# Or use GitHub CLI
gh run list
gh run watch
```

### Check Health Endpoints

```powershell
# Staging
curl https://api-staging.advancia.com/health

# UAT
curl https://api-uat.advancia.com/health

# Production
curl https://api.advancia.com/health

# Expected response:
# {"status":"healthy","timestamp":"2025-11-15T...","uptime":12345}
```

### Monitor Metrics

```powershell
# If Prometheus/Grafana installed:
# http://YOUR_SERVER_IP:9090  # Prometheus
# http://YOUR_SERVER_IP:3001  # Grafana
```

---

## 🚨 Troubleshooting

### Issue: Workflow fails with "Permission denied"

**Solution:**
```powershell
# Verify SSH key is correct
# Test SSH connection manually
ssh -i github_actions_key root@YOUR_SERVER_IP

# If fails, add key again to server
Get-Content github_actions_key.pub | ssh root@YOUR_SERVER_IP "cat >> ~/.ssh/authorized_keys"
```

### Issue: Health checks fail

**Solution:**
```powershell
# SSH into server
ssh root@YOUR_SERVER_IP

# Check Docker containers
docker ps

# Check logs
docker logs advancia-backend
docker logs advancia-frontend

# Restart if needed
cd /opt/advancia
docker-compose restart
```

### Issue: DNS not updating

**Solution:**
```powershell
# Verify Cloudflare credentials
# Test API access
$headers = @{
    "Authorization" = "Bearer YOUR_API_TOKEN"
    "Content-Type" = "application/json"
}
Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID" -Headers $headers

# Check DNS record IDs are correct
Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records" -Headers $headers
```

### Issue: Approval not showing up

**Solution:**
```powershell
# 1. Check environment settings
#    Settings → Environments → production → Required reviewers

# 2. Verify reviewer has permissions
#    Settings → Collaborators → Check access level

# 3. Check email notifications
#    Profile → Notifications → Actions notifications enabled
```

---

## 📚 Next Steps

### 1. Set Up Monitoring (Recommended)
```powershell
# Deploy Prometheus + Grafana
# See: STAGING_DEPLOYMENT_GUIDE.md
docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Configure Alerts (Recommended)
```powershell
# Set up Slack alerts for:
# - Deployment failures
# - High error rates
# - Slow response times
# - Server resource alerts
```

### 3. Create Runbooks
```powershell
# Document procedures for:
# - Emergency rollback process
# - Database migration steps
# - Backup and restore procedures
# - Incident response workflow
```

### 4. Schedule Practice Runs
```powershell
# Practice deployments:
# - Weekly staging deploys (Fridays)
# - Bi-weekly UAT deploys (Thursdays)
# - Monthly production deploys (2nd Tuesday)
# - Quarterly disaster recovery drills
```

---

## 🎯 Deployment Checklist

Before each production deployment:

- [ ] All tests passing in staging
- [ ] UAT sign-off received
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Team notified (30 min advance)
- [ ] Monitoring dashboards open
- [ ] On-call engineer available
- [ ] Change request approved
- [ ] Deployment window confirmed
- [ ] Backup completed

---

## 📞 Support

### Documentation
- **Full guides**: `GITHUB_ENVIRONMENTS_SETUP.md`
- **Blue/Green**: `BLUE_GREEN_DEPLOYMENT_GUIDE.md`
- **Canary**: `CANARY_DEPLOYMENT_GUIDE.md`
- **Secrets**: `ENVIRONMENT_SECRETS_SETUP.md`

### Quick Commands

```powershell
# View all workflows
gh workflow list

# Run specific workflow
gh workflow run "Controlled Promotion Pipeline"

# View recent runs
gh run list --limit 10

# Cancel a run
gh run cancel RUN_ID

# Download logs
gh run download RUN_ID
```

---

**Last Updated**: November 15, 2025  
**Status**: Ready for production deployment ✅

Your deployment pipeline is now fully configured with staging, UAT, production, blue/green, and canary capabilities! 🚀
