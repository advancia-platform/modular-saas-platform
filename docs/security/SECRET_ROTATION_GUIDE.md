# 🔑 Secret Rotation Guide

## Standardized Process for Advancia Pay Security Compliance

### 📋 Overview

This guide provides a foolproof, step-by-step process for rotating critical secrets in GitHub Actions. Following this process ensures security compliance and reduces human error.

---

## 🚨 When to Rotate Secrets

### Scheduled Rotation (Every 90 days)

- Automated reminder created via GitHub Actions
- Issue automatically assigned to platform engineer
- 7-day completion window

### Emergency Rotation (Immediate)

- **Security Incident:** Suspected compromise or breach
- **Employee Departure:** Team member with secret access leaves
- **Service Compromise:** External service (PagerDuty, Slack) reports breach
- **Compliance Requirement:** Audit or regulation demands immediate rotation

### Indicators for Rotation

- Unusual API usage patterns
- Failed authentication attempts
- External service security notifications
- Quarterly security reviews

---

## 🔧 Pre-Rotation Checklist

### ✅ Preparation Steps

- [ ] **Identify Current Secrets**
  - `PAGERDUTY_ROUTING_KEY`
  - `SLACK_WEBHOOK_URL`
  - `TEAMS_WEBHOOK_URL`
  - `GRAFANA_ADMIN_PASSWORD`
  - Additional service keys as needed

- [ ] **Schedule Maintenance Window**
  - Inform team of rotation window
  - Plan for 30-60 minutes maximum
  - Schedule during low-traffic period
  - Notify stakeholders if customer-facing impact possible

- [ ] **Backup Current Configuration**
  - Document current secret names and purposes
  - Save current workflow configurations
  - Note any dependencies or integrations

---

## 🔄 Step-by-Step Rotation Process

### Step 1: Generate New Credentials

#### PagerDuty Integration Key

1. **Login to PagerDuty**
2. **Navigate to:** Services → [Your Service] → Integrations
3. **Create Integration:** Events API v2
4. **Copy Integration Key:** Save securely
5. **Keep old key active** (don't delete yet)

#### Slack Webhook URL

1. **Login to Slack workspace**
2. **Navigate to:** [Workspace] → Settings & administration → Manage apps
3. **Search for:** Incoming Webhooks
4. **Create new webhook** for #alerts-critical channel
5. **Copy Webhook URL:** Save securely
6. **Keep old webhook active** (don't delete yet)

#### Teams Webhook URL

1. **Login to Microsoft Teams**
2. **Navigate to:** [Team] → Connectors
3. **Add Incoming Webhook**
4. **Configure for appropriate channel**
5. **Copy Webhook URL:** Save securely
6. **Keep old webhook active** (don't delete yet)

### Step 2: Update GitHub Secrets

1. **Navigate to Repository**

   ```
   GitHub → [Repository] → Settings → Secrets and variables → Actions
   ```

2. **Update Each Secret:**
   - Click **Update** next to secret name
   - Paste new value
   - Click **Update secret**
   - ❗ **Important:** Keep exact same secret names

3. **Secrets to Update:**
   - [ ] `PAGERDUTY_ROUTING_KEY`
   - [ ] `SLACK_WEBHOOK_URL`
   - [ ] `TEAMS_WEBHOOK_URL`

### Step 3: Validate Changes

1. **Run Validation Workflow**

   ```bash
   # Navigate to Actions tab in GitHub
   # Find "Secret Validation Testing" workflow
   # Click "Run workflow"
   # Select "all-channels"
   # Add test message: "Post-rotation validation"
   # Click "Run workflow"
   ```

2. **Monitor Results:**
   - Check workflow completion status
   - Verify notifications received in:
     - [ ] PagerDuty (check for test incident)
     - [ ] Slack #alerts-critical channel
     - [ ] Teams incident channel

3. **Health Check:**

   ```bash
   # Test individual channels if needed
   gh workflow run "Secret Validation Testing" --ref main \
     -f test_type=pagerduty-only \
     -f test_message="PagerDuty validation test"
   ```

### Step 4: Cleanup Old Secrets

⚠️ **Only after successful validation**

#### PagerDuty

1. Return to PagerDuty integrations
2. Delete old integration key
3. Verify new key is receiving events

#### Slack

1. Return to Slack webhook settings
2. Delete old webhook
3. Verify new webhook is active

#### Teams

1. Return to Teams connectors
2. Remove old webhook connector
3. Verify new webhook is functional

### Step 5: Documentation & Compliance

1. **Update Rotation Log**

   ```bash
   # See ROTATION_LOG_TEMPLATE.md for format
   # Record rotation event with all details
   ```

2. **Update Security Documentation**
   - Next rotation date (add 90 days)
   - Any lessons learned
   - Process improvements identified

3. **Notify Stakeholders**
   - Platform team: Rotation complete
   - Security team: Compliance documentation updated
   - Management: If required by policy

---

## 🚨 Emergency Procedures

### Suspected Compromise

1. **Immediate Action:** Rotate secrets immediately
2. **Disable Old Secrets:** Deactivate in external services first
3. **Generate New Secrets:** Follow standard process
4. **Enhanced Monitoring:** Watch for unusual activity
5. **Security Review:** Conduct thorough analysis

### Rotation Failure

1. **Don't Panic:** Old secrets still work
2. **Identify Issue:** Check validation workflow logs
3. **Fix Problems:** Address specific failures
4. **Re-validate:** Run validation workflow again
5. **Escalate if Needed:** Contact platform lead

### Service Outages During Rotation

1. **Pause Rotation:** Don't continue with broken services
2. **Verify Service Health:** Check external service status
3. **Complete When Stable:** Resume once services restored
4. **Document Delay:** Note in rotation log

---

## 🔍 Troubleshooting

### PagerDuty Issues

| Problem | Solution |
|---------|----------|
| No test incident created | Verify routing key is correct |
| Wrong service triggered | Check integration belongs to correct service |
| 401/403 errors | Ensure integration key is valid and not expired |

### Slack Issues

| Problem | Solution |
|---------|----------|
| Webhook not found (404) | Verify webhook URL is current |
| Permission denied | Check webhook permissions for channel |
| Message not formatted | Verify JSON payload structure |

### Teams Issues

| Problem | Solution |
|---------|----------|
| Connector not found | Recreate webhook connector in Teams |
| Message not displayed | Check adaptive card format |
| Wrong channel | Verify webhook points to correct team/channel |

---

## 📊 Compliance & Audit Trail

### Required Documentation

- [ ] **Rotation Event Log:** Date, engineer, reason
- [ ] **Validation Results:** All channels tested successfully
- [ ] **Old Secret Cleanup:** Confirmed deactivation
- [ ] **Next Rotation Date:** 90 days scheduled

### Audit Requirements

- All rotations logged with timestamps
- Validation results retained for 1 year
- Engineer accountability for each rotation
- Compliance team notification for emergency rotations

### Metrics to Track

- Time to complete rotation (target: <60 minutes)
- Validation success rate (target: 100%)
- Emergency vs scheduled rotations
- Time between incident detection and rotation completion

---

## 📞 Support & Escalation

### Normal Business Hours

- **Platform Team:** #platform-support Slack channel
- **Platform Lead:** Direct message for guidance
- **Documentation Issues:** Create GitHub issue

### After Hours / Emergency

- **On-Call Engineer:** PagerDuty escalation
- **Security Team:** Emergency contact list
- **Platform Lead:** Phone/SMS for critical issues

### Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PagerDuty API Documentation](https://developer.pagerduty.com/docs/)
- [Slack Webhook Documentation](https://api.slack.com/messaging/webhooks)
- [Teams Webhook Documentation](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook)

---

## 🔄 Process Improvements

### Feedback Collection

After each rotation, consider:

- What went well?
- What could be improved?
- Any automation opportunities?
- Documentation gaps identified?

### Regular Review

- Monthly: Process effectiveness review
- Quarterly: Security team audit
- Annually: Complete process overhaul assessment

---

*Last Updated: December 2024*  
*Process Version: 2.0*  
*Next Review Date: March 2025*
