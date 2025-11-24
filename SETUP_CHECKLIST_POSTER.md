# 🚀 Deployment Setup Checklist - Print & Track Progress

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│           MULTI-REGION DEPLOYMENT SETUP                                │
│           Configuration Checklist                                       │
│                                                                         │
│   Print this page and check off items as you complete them             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: PREREQUISITES ✅

**Time: 10 minutes**

-   [ ] GitHub CLI installed and authenticated
      `gh --versionn
    gh auth status
    `

-   [ ] Repository access verified  
       Current repo: `muchaeljohn739337-cloud/-modular-saas-platform`

-   [ ] Admin permissions confirmed  
       Needed for: Environments, Secrets, Webhooks

---

## PHASE 2: WEBHOOK SETUP 🔔

**Time: 10 minutes | Guide: WEBHOOK_CONFIGURATION_GUIDE.md**

### Slack Configuration

-   [ ] **Step 1:** Create Slack app  
       URL: <https://api.slack.com/apps>

-   [ ] **Step 2:** Enable Incoming Webhooks  
       Toggle "Activate Incoming Webhooks" → ON

-   [ ] **Step 3:** Create #deployments channel  
       Members: Engineering team, SRE, Product

-   [ ] **Step 4:** Create #incidents-deployments channel  
       Members: On-call SRE, Engineering leads

-   [ ] **Step 5:** Add webhook to #deployments  
       Save URL → Will use for GLOBAL_SLACK_WEBHOOK

-   [ ] **Step 6:** Add webhook to #incidents-deployments  
       Save URL → Will use for SLACK_WEBHOOK_URL

-   [ ] **Step 7:** Test webhooks  
       `powershell
    curl -X POST "webhook-url" -d '{"text":"Test"}'
    `

### Microsoft Teams (Optional)

-   [ ] **Step 8:** Configure Teams webhook  
       Channel → ••• → Connectors → Incoming Webhook  
       Save URL → Will use for TEAMS_WEBHOOK_URL

---

## PHASE 3: INFRASTRUCTURE INFO 🖥️

**Time: 5 minutes | Document: <https://cloud.digitalocean.com/>**

### DigitalOcean Droplets

-   [ ] Get Green environment IP  
       Droplet: ********\_******** → IP: **_._**.**_._**  
       → Will use for DROPLET_IP_GREEN

-   [ ] Get Blue environment IP  
       Droplet: ********\_******** → IP: **_._**.**_._**  
       → Will use for DROPLET_IP_BLUE

-   [ ] Get Load Balancer IP  
       Load Balancer: ********\_******** → IP: **_._**.**_._**  
       → Will use for LB_IP

-   [ ] Create deployment user  
       `bash
    ssh root@droplet-ip
    adduser deploy
    usermod -aG sudo deploy
    mkdir -p /home/deploy/.ssh
    cp ~/.ssh/authorized_keys /home/deploy/.ssh/
    chown -R deploy:deploy /home/deploy/.ssh
    `
      → Will use "deploy" for DROPLET_USER

### Cloudflare DNS

-   [ ] Get Zone ID  
       URL: <https://dash.cloudflare.com/>  
       Domain → Overview → Zone ID (right sidebar)  
       Zone ID: **************\_\_\_\_**************  
       → Will use for CF_ZONE_ID

-   [ ] Create API Token  
       My Profile → API Tokens → Create Token  
       Template: "Edit zone DNS"  
       Token: **************\_\_\_\_**************  
       → Will use for CF_API_TOKEN

-   [ ] Get DNS Record ID  
       `bash
    curl -X GET "https://api.cloudflare.com/client/v4/zones/ZONE_ID/dns_records" \
      -H "Authorization: Bearer API_TOKEN" | jq '.result[] | select(.name=="api.yourdomain.com") | .id'
    `
      Record ID: **************\_\_\_\_**************  
       → Will use for CF_RECORD_ID_API

### Monitoring Setup

-   [ ] Get Prometheus Pushgateway URL  
       URL: **************\_\_\_\_**************  
       → Will use for PROMETHEUS_PUSHGATEWAY_URL

-   [ ] Create Grafana API Key  
       URL: <https://grafana.advancia.com>  
       Configuration → API Keys → Add key  
       Name: "GitHub Actions Deployment" | Role: Editor  
       Key: **************\_\_\_\_**************  
       → Will use for GRAFANA_API_KEY

---

## PHASE 4: RUN SETUP SCRIPT ⚙️

**Time: 5 minutes | Script: setup-github-config.ps1**

-   [ ] Navigate to repository  
       `powershell
    cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\-modular-saas-platform
    `

-   [ ] Run setup script  
       `powershell
    .\setup-github-config.ps1
    `

-   [ ] Enter secrets when prompted:

      | # | Secret Name | Value Source | Status |
      |---|-------------|--------------|--------|
      | 1 | SLACK_WEBHOOK_URL | Slack #incidents-deployments | [ ] |
      | 2 | GLOBAL_SLACK_WEBHOOK | Slack #deployments | [ ] |
      | 3 | TEAMS_WEBHOOK_URL | Teams (optional) | [ ] |
      | 4 | DROPLET_IP_GREEN | DigitalOcean Green | [ ] |
      | 5 | DROPLET_IP_BLUE | DigitalOcean Blue | [ ] |
      | 6 | LB_IP | DigitalOcean LB | [ ] |
      | 7 | DROPLET_USER | Usually "deploy" | [ ] |
      | 8 | PROMETHEUS_PUSHGATEWAY_URL | Monitoring URL | [ ] |
      | 9 | CF_ZONE_ID | Cloudflare Zone | [ ] |
      | 10 | CF_API_TOKEN | Cloudflare Token | [ ] |
      | 11 | CF_RECORD_ID_API | Cloudflare Record | [ ] |
      | 12 | GRAFANA_API_KEY | Grafana Key | [ ] |

-   [ ] Verify all secrets added  
       `powershell
    gh secret list
    `
      Expected: 12 secrets listed

---

## PHASE 5: ENVIRONMENT CONFIGURATION 🔐

**Time: 10 minutes | URL: GitHub Settings**

-   [ ] Open environments page  
       `https://github.com/muchaeljohn739337-cloud/-modular-saas-platform/settings/environmentss
    `

-   [ ] Configure production-us-east  
    -   [ ] Add required reviewers:  
       Reviewer 1: ********\_******** (Functional Lead)  
       Reviewer 2: ********\_******** (SRE/DevOps)  
    -   [ ] Set deployment branches: main, release/\*  
    -   [ ] Save protection rules

-   [ ] Configure production-eu-west  
    -   [ ] Add required reviewers:  
       Reviewer 1: ********\_******** (Functional Lead)  
       Reviewer 2: ********\_******** (SRE/DevOps)  
    -   [ ] Set deployment branches: main, release/\*  
    -   [ ] Save protection rules

-   [ ] Configure production-apac-se  
    -   [ ] Add required reviewers:  
       Reviewer 1: ********\_******** (Functional Lead)  
       Reviewer 2: ********\_******** (SRE/DevOps)  
    -   [ ] Set deployment branches: main, release/\*  
    -   [ ] Save protection rules

---

## PHASE 6: PRE-FLIGHT VALIDATION ✈️

**Time: 5 minutes | Guide: PRODUCTION_READINESS_CHECKLIST.md**

-   [ ] All secrets configured (12/12)  
       `powershell
    gh secret list | Measure-Object -Line

# Should show 12

    `

-   [ ] All environments created (3/3)  
       Check: GitHub → Settings → Environments

-   [ ] Slack channels active  
       #deployments | #incidents-deployments

-   [ ] Reviewers configured for all environments  
       2 reviewers per environment × 3 = 6 total

-   [ ] SSH access to droplets verified  
       `powershell
    ssh deploy@DROPLET_IP_GREEN "echo 'Connection OK'"
    ssh deploy@DROPLET_IP_BLUE "echo 'Connection OK'"
    `

-   [ ] Cloudflare API token tested  
       `bash
    curl -X GET "<https://api.cloudflare.com/client/v4/zones/ZONE_ID>" \
      -H "Authorization: Bearer TOKEN"

# Should return zone details

    `

-   [ ] Grafana API key tested  
       `bash
    curl -H "Authorization: Bearer GRAFANA_KEY" \
      <https://grafana.advancia.com/api/auth/keys>

# Should return 200 OK

    `

---

## PHASE 7: TEST DEPLOYMENT 🧪

**Time: 45 minutes (single region test)**

-   [ ] Run test deployment (US East only)  
       ``powershell
    gh workflow run multi-region-deployment-with-monitoring.yml `
      -f regions=us `
      -f deployment_strategy=sequential
    ``

-   [ ] Monitor workflow execution  
       `powershell
    gh run watch
    `

-   [ ] Verify Slack notification received  
       Check #deployments for success message

-   [ ] Check Grafana dashboard  
       Verify metrics showing in US East dashboard

-   [ ] Review logs  
       `powershell
    gh run view --log
    `

-   [ ] Confirm canary stages completed  
       10% → 25% → 50% → 75% → 100%

---

## PHASE 8: FIRST PRODUCTION DEPLOYMENT 🚀

**Time: 5.5 hours (delayed mode) | Guide: DEPLOYMENT_QUICK_REFERENCE.md**

### Pre-Deployment (5 minutes)

-   [ ] Code freeze active (no new commits during deployment)

-   [ ] Notify team in Slack  
       Post to #deployments: "Starting production deployment v\_\_\_"

-   [ ] Grafana dashboards open  
    -   [ ] Global overview  
    -   [ ] US East regional  
    -   [ ] EU West regional  
    -   [ ] APAC Southeast regional

-   [ ] Runbooks accessible  
       Open: DEPLOYMENT_DEBUGGING_GUIDE.md

### Deployment Command

-   [ ] Execute delayed deployment  
       ``powershell
    gh workflow run multi-region-deployment-with-monitoring.yml `
      -f regions=all `
      -f deployment_strategy=delayed `
      -f delay_between_regions=90
    ``
      **Expected Timeline:**
    -   14:00 - US East deployment starts (45 min)
    -   14:45 - US East validation complete
    -   14:45 - Observation period (90 min)
    -   16:15 - EU West deployment starts (45 min)
    -   17:00 - EU West validation complete
    -   17:00 - Observation period (90 min)
    -   18:30 - APAC deployment starts (45 min)
    -   19:15 - APAC validation complete
    -   19:15 - Final global validation (30 min)
    -   19:45 - Deployment complete ✅

### Monitoring (Active throughout)

-   [ ] Watch Slack #deployments for updates

-   [ ] Monitor error rates per region  
       Threshold: < 0.2% at 100% canary

-   [ ] Monitor latency P95 per region  
       Threshold: < 300ms at 100% canary

-   [ ] Check health endpoints every 5 minutes  
       `bash
    curl https://api-us.yourdomain.com/health
    curl https://api-eu.yourdomain.com/health
    curl https://api-apac.yourdomain.com/health
    `

### Post-Deployment (30 minutes)

-   [ ] Verify success notification in Slack

-   [ ] Capture metrics snapshot  
       `bash
    curl https://grafana.advancia.com/api/dashboards/db/global-health > metrics-v__.json
    `

-   [ ] Confirm Grafana annotations visible

-   [ ] Reduce tracing sample rate  
       100% → 5%

-   [ ] Archive deployment logs

-   [ ] Schedule retrospective  
       Date: ****\_\_**** | Time: ****\_\_**** | Duration: 30 min

-   [ ] Post success message to #engineering-all  
       `✅ 🎉 Production Rollout Complete!!
    Regions: US East, EU West, APAC Southeast
    Version: v___
    Duration: __ hours __ minutes
    Metrics: All green ✅
    `

---

## PHASE 9: CELEBRATE 🎉

**You did it! Time to recognize the team's effort.**

-   [ ] Team shoutout in Slack  
       Thank reviewers, SRE, functional leads

-   [ ] Update roadmap  
       Mark deployment milestone complete

-   [ ] Document lessons learned  
       Update Quick Fix Table in DEPLOYMENT_DEBUGGING_GUIDE.md

-   [ ] Plan next deployment  
       After 5 successful delayed runs → Consider parallel mode

---

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   ✅ SETUP COMPLETE - READY FOR PRODUCTION                              │
│                                                                         │
│   📊 Total Setup Time: ~45 minutes                                     │
│   🚀 First Deployment: ~5.5 hours (delayed mode)                       │
│   🎯 Success Criteria: Error < 0.2%, Latency < 300ms                   │
│                                                                         │
│   🔹 Configure → Deploy → Monitor → Celebrate 🚀                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📅 Date Completed: ****\_\_****

**Signed Off By:**

-   [ ] **Functional Lead:** ********\_******** | Date: ****\_\_****
-   [ ] **SRE Lead:** ********\_******** | Date: ****\_\_****
-   [ ] **Product Owner:** ********\_******** | Date: ****\_\_****

---

## 📞 Emergency Contacts

| Role            | Name         | Slack         | Phone        |
| --------------- | ------------ | ------------- | ------------ |
| On-Call SRE     | ****\_\_**** | @**\_\_\_\_** | ****\_\_**** |
| Deployment Lead | ****\_\_**** | @**\_\_\_\_** | ****\_\_**** |
| VP Engineering  | ****\_\_**** | @**\_\_\_\_** | ****\_\_**** |

---

## 🔗 Quick Links (Bookmark These)

-   GitHub Actions: <https://github.com/muchaeljohn739337-cloud/-modular-saas-platform/actions>
-   Environments: <https://github.com/muchaeljohn739337-cloud/-modular-saas-platform/settings/environments>
-   Secrets: <https://github.com/muchaeljohn739337-cloud/-modular-saas-platform/settings/secrets/actions>
-   Slack Webhooks: <https://api.slack.com/apps>
-   DigitalOcean: <https://cloud.digitalocean.com/>
-   Cloudflare: <https://dash.cloudflare.com/>
-   Grafana: <https://grafana.advancia.com>

---

**Save this checklist and refer back for future deployments!** 📋
