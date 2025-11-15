# 🛡️ GitHub Environments with Approval Gates

Complete guide for setting up controlled deployment pipeline with human approval gates.

---

## 📋 Overview

This setup creates a **controlled promotion pipeline**:
- **Staging** → Deploys automatically (no approval needed)
- **UAT** → Requires QA team approval
- **Production** → Requires senior approval + safety checks

---

## 🔹 Step 1: Create GitHub Environments

### Access Environment Settings
1. Go to: https://github.com/muchaeljohn739337-cloud/-modular-saas-platform
2. Click **Settings** tab
3. In left sidebar, click **Environments**

### Create Three Environments

#### Environment 1: `staging`
1. Click **New environment**
2. Name: `staging`
3. **Deployment protection rules**: Leave empty (auto-deploy)
4. **Environment secrets**: Click **Add secret** for each:
   - `CF_ZONE_ID`
   - `CF_API_TOKEN`
   - `CF_RECORD_ID_API`
   - `CF_RECORD_ID_WWW`
   - `DROPLET_IP`
   - `DROPLET_USER`
   - `DROPLET_SSH_KEY`
   - `SLACK_WEBHOOK`
   - `DATABASE_URL`
   - `REDIS_URL`
5. Click **Save protection rules**

#### Environment 2: `uat`
1. Click **New environment**
2. Name: `uat`
3. **Deployment protection rules**:
   - ✅ Check **Required reviewers**
   - Add reviewers: QA Lead, Product Manager (add GitHub usernames)
   - Set **Wait timer**: 0 minutes (optional: add delay)
4. **Environment secrets**: Click **Add secret** for each:
   - `CF_ZONE_ID`
   - `CF_API_TOKEN`
   - `CF_RECORD_ID_API`
   - `CF_RECORD_ID_WWW`
   - `DROPLET_IP`
   - `DROPLET_USER`
   - `DROPLET_SSH_KEY`
   - `SLACK_WEBHOOK`
   - `DATABASE_URL`
   - `REDIS_URL`
5. Click **Save protection rules**

#### Environment 3: `production`
1. Click **New environment**
2. Name: `production`
3. **Deployment protection rules**:
   - ✅ Check **Required reviewers**
   - Add reviewers: CTO, Tech Lead, DevOps Lead
   - ✅ Check **Wait timer**: 5 minutes (safety pause)
   - ✅ Check **Deployment branches**: Only `main` branch
4. **Environment secrets**: Click **Add secret** for each:
   - `CF_ZONE_ID`
   - `CF_API_TOKEN`
   - `CF_RECORD_ID_API`
   - `CF_RECORD_ID_WWW`
   - `DROPLET_IP_BLUE`
   - `DROPLET_IP_GREEN`
   - `DROPLET_USER`
   - `DROPLET_SSH_KEY`
   - `SLACK_WEBHOOK`
   - `DATABASE_URL`
   - `REDIS_URL`
5. Click **Save protection rules**

---

## 🔹 Step 2: Environment Protection Rules

### Staging Environment
**Protection Level**: None (auto-deploy)
```
✓ No approval required
✓ Deploys immediately on push
✓ Used for development testing
```

### UAT Environment
**Protection Level**: Medium (QA approval)
```
✓ Requires 1 reviewer approval
✓ QA Lead or Product Manager
✓ Optional 0-15 minute wait timer
✓ Used for user acceptance testing
```

### Production Environment
**Protection Level**: High (senior approval + safety)
```
✓ Requires 2 reviewer approvals (CTO + Tech Lead)
✓ 5-minute mandatory wait timer
✓ Restricted to main branch only
✓ Optional: Deployment windows (e.g., Mon-Thu 9am-5pm)
✓ Used for live customer traffic
```

---

## 🔹 Step 3: Environment-Scoped Secrets

### How Environment Secrets Work
- Secrets are **scoped to specific environments**
- Workflow automatically uses correct secrets based on `environment:` key
- **No prefixes needed** (use `CF_API_TOKEN` not `PROD_CF_API_TOKEN`)
- Secrets are **never shared between environments**

### Secret Configuration Per Environment

#### Staging Secrets
| Secret Name | Value | Example |
|-------------|-------|---------|
| `CF_ZONE_ID` | Staging Cloudflare zone | `abc123...` |
| `CF_API_TOKEN` | Staging API token | `xyz789...` |
| `CF_RECORD_ID_API` | api-staging record ID | `def456...` |
| `CF_RECORD_ID_WWW` | www-staging record ID | `ghi789...` |
| `DROPLET_IP` | Staging server IP | `164.90.XXX.XXX` |
| `DROPLET_USER` | SSH user | `root` |
| `DROPLET_SSH_KEY` | Staging SSH key | Full private key |
| `SLACK_WEBHOOK` | #staging-deploys channel | `https://hooks.slack.com/...` |
| `DATABASE_URL` | Staging PostgreSQL | `postgresql://...` |
| `REDIS_URL` | Staging Redis | `redis://...` |

#### UAT Secrets
| Secret Name | Value | Example |
|-------------|-------|---------|
| `CF_ZONE_ID` | UAT Cloudflare zone | `abc123...` |
| `CF_API_TOKEN` | UAT API token | `xyz789...` |
| `CF_RECORD_ID_API` | api-uat record ID | `def456...` |
| `CF_RECORD_ID_WWW` | www-uat record ID | `ghi789...` |
| `DROPLET_IP` | UAT server IP | `167.71.XXX.XXX` |
| `DROPLET_USER` | SSH user | `root` |
| `DROPLET_SSH_KEY` | UAT SSH key | Full private key |
| `SLACK_WEBHOOK` | #uat-deploys channel | `https://hooks.slack.com/...` |
| `DATABASE_URL` | UAT PostgreSQL | `postgresql://...` |
| `REDIS_URL` | UAT Redis | `redis://...` |

#### Production Secrets
| Secret Name | Value | Example |
|-------------|-------|---------|
| `CF_ZONE_ID` | Production Cloudflare zone | `abc123...` |
| `CF_API_TOKEN` | Production API token | `xyz789...` |
| `CF_RECORD_ID_API` | api.advancia.com record ID | `def456...` |
| `CF_RECORD_ID_WWW` | www.advancia.com record ID | `ghi789...` |
| `DROPLET_IP_BLUE` | Blue server IP | `164.90.XXX.XXX` |
| `DROPLET_IP_GREEN` | Green server IP | `167.71.XXX.XXX` |
| `DROPLET_USER` | SSH user | `root` |
| `DROPLET_SSH_KEY` | Production SSH key | Full private key |
| `SLACK_WEBHOOK` | #prod-deploys channel | `https://hooks.slack.com/...` |
| `DATABASE_URL` | Production PostgreSQL | `postgresql://...` |
| `REDIS_URL` | Production Redis | `redis://...` |

---

## 🔹 Step 4: Approval Workflow

### How Approvals Work

1. **Developer pushes to staging branch**
   ```bash
   git checkout staging
   git commit -m "New feature"
   git push origin staging
   ```

2. **Staging deploys automatically** (no approval needed)
   - Workflow runs immediately
   - Deploys to staging.advancia.com
   - QA team can start testing

3. **Developer promotes to UAT**
   ```bash
   git checkout uat
   git merge staging
   git push origin uat
   ```

4. **Workflow pauses for UAT approval**
   - GitHub sends notification to reviewers
   - QA Lead or Product Manager must approve
   - Approval screen shows:
     - Commit details
     - Changes being deployed
     - Test results

5. **Reviewer approves UAT deployment**
   - Go to: Actions → Workflow run → Review deployments
   - Click **Review pending deployments**
   - Select `uat` environment
   - Add comment (optional)
   - Click **Approve and deploy**

6. **UAT deploys after approval**
   - Workflow resumes automatically
   - Deploys to uat.advancia.com
   - UAT testing begins

7. **Developer promotes to production**
   ```bash
   git checkout main
   git merge uat
   git push origin main
   ```

8. **Workflow pauses for production approval**
   - 5-minute mandatory wait timer starts
   - GitHub notifies senior reviewers
   - Requires 2 approvals (CTO + Tech Lead)

9. **Senior team approves production**
   - Both reviewers must approve
   - After 5-minute safety timer
   - Production deployment proceeds

10. **Blue/Green production deployment**
    - Deploys to Blue or Green server
    - Runs comprehensive health checks
    - Updates DNS to new environment
    - Old environment kept as instant rollback

---

## 🔹 Step 5: Deployment Permissions

### Recommended Approval Structure

#### Staging Reviewers
- **None required** (auto-deploy)
- Anyone can push to staging branch

#### UAT Reviewers
- **QA Lead** (@qa-lead-username)
- **Product Manager** (@product-manager)
- **Senior QA Engineer** (@senior-qa)
- Required approvals: **1 of 3**

#### Production Reviewers
- **CTO** (@cto-username)
- **Tech Lead** (@tech-lead)
- **DevOps Lead** (@devops-lead)
- Required approvals: **2 of 3**

### Setting Up Reviewers
```yaml
# In Environment settings (GitHub UI):
# 1. Go to Settings → Environments → production
# 2. Check "Required reviewers"
# 3. Add GitHub usernames:
#    - cto-username
#    - tech-lead
#    - devops-lead
# 4. Save protection rules
```

---

## 🔹 Step 6: Deployment Windows (Optional)

### Restrict Production Deployments to Business Hours

#### Configuration
1. Go to **Settings → Environments → production**
2. Under **Deployment branches and tags**, click **Add rule**
3. Select **Custom deployment branches**
4. Add pattern: `main`
5. Enable **Deployment protection rules**
6. Add custom deployment protection (requires GitHub Pro/Enterprise):
   - Allowed days: Monday - Thursday
   - Allowed hours: 9:00 AM - 5:00 PM (your timezone)
   - Blocked: Fridays, weekends, holidays

#### Why Deployment Windows?
- ✅ Avoid deploying before weekends (limited support)
- ✅ Deploy during business hours (full team available)
- ✅ Prevent late-night deployments (tired mistakes)
- ✅ Ensure rollback team is available

---

## 🔹 Step 7: Emergency Bypass Procedure

### When You Need to Skip Approvals

Sometimes you need to deploy urgent hotfixes immediately.

#### Option 1: Emergency Deployment Label
```yaml
# In workflow file
jobs:
  deploy-production:
    environment: 
      name: production
      # Skip approval if commit has [emergency] tag
      required-reviewers: ${{ !contains(github.event.head_commit.message, '[emergency]') }}
```

#### Option 2: Separate Emergency Workflow
```yaml
name: Emergency Hotfix Deployment

on:
  workflow_dispatch:
    inputs:
      reason:
        description: 'Emergency reason'
        required: true

jobs:
  emergency-deploy:
    runs-on: ubuntu-latest
    # No environment = no approval gates
    steps:
      - name: Deploy hotfix
        run: echo "Emergency deployment..."
      
      - name: Log emergency deployment
        run: |
          echo "Emergency deployment triggered by ${{ github.actor }}"
          echo "Reason: ${{ inputs.reason }}"
```

#### Best Practices for Emergencies
- ✅ Document reason in commit message
- ✅ Notify team in Slack immediately
- ✅ Create incident report after deployment
- ✅ Review changes with team next day
- ✅ Add test coverage to prevent recurrence

---

## 🎯 Complete Promotion Pipeline

### Visual Flow
```
┌─────────────────────────────────────────────────────┐
│  Developer: Push to staging branch                  │
└───────────────────────┬─────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Staging Deploy (Auto)                              │
│  • No approval required                             │
│  • Immediate deployment                             │
│  • Deploy to staging.advancia.com                   │
└───────────────────────┬─────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  QA Testing in Staging                              │
│  • Functional testing                               │
│  • Integration testing                              │
│  • Bug fixes loop back to staging                   │
└───────────────────────┬─────────────────────────────┘
                        ↓ (merge staging → uat)
┌─────────────────────────────────────────────────────┐
│  UAT Deploy (Awaiting Approval)                     │
│  ⏸️  Workflow pauses                                 │
│  📧 Notification sent to QA Lead                    │
└───────────────────────┬─────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  QA Lead: Review & Approve                          │
│  ✓ Check test results                               │
│  ✓ Verify staging tests passed                      │
│  ✓ Click "Approve and deploy"                       │
└───────────────────────┬─────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  UAT Deploy (Approved)                              │
│  • Deployment proceeds                              │
│  • Deploy to uat.advancia.com                       │
└───────────────────────┬─────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  User Acceptance Testing                            │
│  • Business stakeholder testing                     │
│  • Final validation before production               │
└───────────────────────┬─────────────────────────────┘
                        ↓ (merge uat → main)
┌─────────────────────────────────────────────────────┐
│  Production Deploy (Awaiting Senior Approval)       │
│  ⏸️  5-minute safety timer                          │
│  📧 Notification sent to CTO + Tech Lead            │
└───────────────────────┬─────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Senior Team: Review & Approve (2 Required)         │
│  ✓ CTO reviews and approves                         │
│  ✓ Tech Lead reviews and approves                   │
│  ✓ 5-minute timer completes                         │
└───────────────────────┬─────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Production Blue/Green Deploy                       │
│  • Deploy to inactive environment (Blue or Green)   │
│  • Run health checks                                │
│  • Switch DNS if healthy                            │
│  • Keep old environment for instant rollback        │
└───────────────────────┬─────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Live on advancia.com 🎉                            │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Setup Checklist

### GitHub Environment Setup
- [ ] Created `staging` environment (no protection)
- [ ] Created `uat` environment (1 reviewer required)
- [ ] Created `production` environment (2 reviewers + 5min timer)
- [ ] Added reviewers to UAT environment
- [ ] Added reviewers to production environment
- [ ] Restricted production to `main` branch only

### Environment Secrets
- [ ] Added 10 secrets to `staging` environment
- [ ] Added 10 secrets to `uat` environment
- [ ] Added 11 secrets to `production` environment
- [ ] Verified no secret sharing between environments
- [ ] Tested secret access in workflows

### Branch Setup
- [ ] Created `staging` branch
- [ ] Created `uat` branch
- [ ] Set up branch protection for `main`
- [ ] Configured merge requirements (PR reviews, CI checks)

### Workflow Configuration
- [ ] Updated workflows to use `environment:` key
- [ ] Removed environment prefix from secret names
- [ ] Tested staging auto-deployment
- [ ] Tested UAT approval gate
- [ ] Tested production approval gate

### Team Permissions
- [ ] Granted staging write access to developers
- [ ] Added QA team as UAT reviewers
- [ ] Added senior team as production reviewers
- [ ] Configured Slack notifications per environment
- [ ] Documented approval process for team

---

## 🚀 Testing Your Setup

### Test 1: Staging Auto-Deploy
```bash
git checkout staging
echo "test" >> README.md
git commit -m "Test staging auto-deploy"
git push origin staging
```
**Expected**: Deploys immediately, no approval needed

### Test 2: UAT Approval Gate
```bash
git checkout uat
git merge staging
git push origin uat
```
**Expected**: 
1. Workflow pauses
2. QA Lead receives notification
3. Deployment waits for approval

### Test 3: Production Approval Gate
```bash
git checkout main
git merge uat
git push origin main
```
**Expected**:
1. 5-minute timer starts
2. CTO + Tech Lead receive notification
3. Requires 2 approvals before deployment

---

## 📞 Troubleshooting

### Issue: Workflow not requesting approval
**Solution**: Check environment name matches exactly in workflow file

### Issue: Wrong people receiving approval requests
**Solution**: Update reviewers in Settings → Environments → [env] → Edit

### Issue: Can't find environment secrets
**Solution**: Secrets must be added to environment, not repository-level

### Issue: Approval never expires
**Solution**: Add wait timer limit in environment settings (e.g., 168 hours = 7 days)

---

## 🎯 Key Benefits

✅ **Controlled Promotions** - Human approval gates prevent accidental deployments  
✅ **Environment Isolation** - Secrets never leak between environments  
✅ **Audit Trail** - All approvals logged in GitHub  
✅ **Safety Timer** - 5-minute pause before production gives time to cancel  
✅ **Role-Based Access** - QA approves UAT, seniors approve production  
✅ **Emergency Bypass** - Hotfix workflow available when needed  

---

**Last Updated**: November 15, 2025  
**Status**: Ready for approval gate implementation ✅

See `CONTROLLED_PROMOTION_WORKFLOW.yml` for complete workflow implementation.
