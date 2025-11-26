# 🔑 Secret Rotation Log Template

**Instructions:** Copy this template for each rotation event and fill out all sections completely.

---

## 📋 Rotation Event Summary

| Field | Value |
|-------|-------|
| **Rotation ID** | `[YYYY-MM-DD-HH-MM-SS]` |
| **Date & Time** | `[YYYY-MM-DD HH:MM:SS UTC]` |
| **Engineer Responsible** | `[Full Name / GitHub Username]` |
| **Rotation Type** | ☐ Scheduled (90-day) ☐ Emergency ☐ Compliance ☐ Other: _____ |
| **Trigger Reason** | `[Brief explanation of why rotation was needed]` |

---

## 🔧 Secrets Rotated

### PagerDuty

- [ ] **PAGERDUTY_ROUTING_KEY**
  - **Previous Key ID:** `[Last 4 characters of old key]`
  - **New Key Created:** `[YYYY-MM-DD HH:MM:SS UTC]`
  - **Service:** `[PagerDuty service name]`
  - **Integration Type:** Events API v2

### Slack

- [ ] **SLACK_WEBHOOK_URL**
  - **Previous Webhook ID:** `[Last 4 characters of webhook ID]`
  - **New Webhook Created:** `[YYYY-MM-DD HH:MM:SS UTC]`
  - **Channel:** `[#channel-name]`
  - **Workspace:** `[Workspace name]`

### Teams

- [ ] **TEAMS_WEBHOOK_URL**
  - **Previous Connector:** `[Connector name]`
  - **New Connector Created:** `[YYYY-MM-DD HH:MM:SS UTC]`
  - **Channel:** `[Channel name]`
  - **Team:** `[Team name]`

### Additional Secrets (if applicable)

- [ ] **GRAFANA_ADMIN_PASSWORD**
  - **Password Changed:** `[YYYY-MM-DD HH:MM:SS UTC]`
  - **Admin User:** `[Username]`

- [ ] **Other:** `[Secret name]`
  - **Details:** `[Relevant information]`

---

## ✅ Validation Results

### Workflow Execution

- **Validation Workflow Run:** `[GitHub Actions run ID]`
- **Workflow URL:** `[Direct link to GitHub Actions run]`
- **Execution Time:** `[Start time - End time]`
- **Overall Status:** ☐ Success ☐ Partial Failure ☐ Complete Failure

### Channel-by-Channel Results

| Service | Status | Test Time | Notes |
|---------|--------|-----------|-------|
| **PagerDuty** | ☐ ✅ ☐ ❌ | `[HH:MM:SS UTC]` | `[Any issues or observations]` |
| **Slack** | ☐ ✅ ☐ ❌ | `[HH:MM:SS UTC]` | `[Any issues or observations]` |
| **Teams** | ☐ ✅ ☐ ❌ | `[HH:MM:SS UTC]` | `[Any issues or observations]` |

### Manual Verification

- [ ] **PagerDuty incident received:** Incident ID: `[ID]`
- [ ] **Slack message received:** Timestamp: `[HH:MM:SS]`
- [ ] **Teams message received:** Timestamp: `[HH:MM:SS]`
- [ ] **GitHub Actions logs reviewed:** No errors found
- [ ] **All secret names unchanged:** Confirmed exact match

---

## 🧹 Cleanup Actions

### External Services

- [ ] **PagerDuty:** Old integration key deleted at `[HH:MM:SS UTC]`
- [ ] **Slack:** Old webhook removed at `[HH:MM:SS UTC]`
- [ ] **Teams:** Old connector removed at `[HH:MM:SS UTC]`

### Security Verification

- [ ] **Old secrets no longer functional:** Tested and confirmed
- [ ] **New secrets working correctly:** Validated through live test
- [ ] **No duplicate integrations:** Verified clean slate

---

## 📊 Performance Metrics

| Metric | Target | Actual | Status |
|--------|---------|--------|---------|
| **Total Rotation Time** | < 60 minutes | `[X minutes]` | ☐ Met ☐ Exceeded |
| **Validation Success Rate** | 100% | `[X%]` | ☐ Met ☐ Below |
| **Zero Downtime** | Yes | ☐ Yes ☐ No | `[If no, duration: X minutes]` |
| **Documentation Complete** | 100% | `[X%]` | ☐ Complete ☐ Missing items |

---

## 🚨 Issues Encountered

### Problems During Rotation

| Issue | Severity | Description | Resolution | Time to Resolve |
|-------|----------|-------------|------------|-----------------|
| `[Issue #1]` | ☐ Low ☐ Medium ☐ High ☐ Critical | `[What happened]` | `[How it was fixed]` | `[X minutes]` |
| `[Issue #2]` | ☐ Low ☐ Medium ☐ High ☐ Critical | `[What happened]` | `[How it was fixed]` | `[X minutes]` |

### Lessons Learned

- **What went well:** `[Positive observations]`
- **What could be improved:** `[Areas for enhancement]`
- **Process suggestions:** `[Recommended changes for next rotation]`

---

## 📞 Notifications Sent

### Team Communication

- [ ] **Platform team notified:** Channel: `[#platform]` Time: `[HH:MM:SS]`
- [ ] **Security team informed:** Method: `[Email/Slack]` Time: `[HH:MM:SS]`
- [ ] **Management updated:** Required: ☐ Yes ☐ No | Completed: ☐ Yes ☐ N/A

### Stakeholder Updates

- [ ] **Customer support briefed:** If customer-facing impact
- [ ] **Compliance team notified:** If audit requirement
- [ ] **Engineering teams informed:** If affecting their workflows

---

## 📅 Next Rotation Planning

### Scheduling

- **Next Scheduled Rotation:** `[Date: YYYY-MM-DD]` (90 days from completion)
- **Calendar Event Created:** ☐ Yes ☐ No
- **Reminder Set in GitHub:** ☐ Yes ☐ No
- **Engineer Pre-assigned:** `[Name]` (if known)

### Process Improvements for Next Time

1. `[Improvement #1]`
2. `[Improvement #2]`
3. `[Improvement #3]`

---

## 🔐 Compliance & Audit Trail

### Security Requirements

- [ ] **Rotation logged in security system:** System: `[System name]`
- [ ] **Old credentials securely disposed:** Method: `[Deletion/archival]`
- [ ] **New credentials securely stored:** Location: `[Password manager/vault]`
- [ ] **Access reviewed:** Confirmed minimum necessary access

### Audit Documentation

- [ ] **Rotation evidence preserved:** GitHub Actions logs saved
- [ ] **Validation results archived:** Results stored for 1 year
- [ ] **Timeline documented:** Complete start-to-finish record
- [ ] **Sign-off obtained:** Security team acknowledgment

---

## ✍️ Final Sign-off

### Engineer Certification

```
I certify that this rotation was completed according to established procedures,
all validation tests passed successfully, and appropriate cleanup was performed.

Engineer: [Full Name]
Date: [YYYY-MM-DD]
GitHub Username: [@username]
Digital Signature: [Initials or electronic signature]
```

### Security Team Review (if required)

```
Security review completed. Rotation meets compliance requirements.

Reviewer: [Full Name]
Date: [YYYY-MM-DD]  
Title: [Security Role]
Comments: [Any additional notes]
```

---

## 📎 Attachments

### Supporting Documentation

- [ ] **GitHub Actions workflow logs:** Link: `[URL]`
- [ ] **Screenshots of successful validations:** Stored: `[Location]`
- [ ] **External service confirmations:** Emails/notifications saved
- [ ] **Before/after configuration snapshots:** Documented changes

---

*Template Version: 2.0*  
*Last Updated: December 2024*  
*Next Template Review: March 2025*
