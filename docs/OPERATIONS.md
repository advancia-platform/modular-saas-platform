# Operations Guide ⚙️

This document defines day‑to‑day monitoring, logging, and incident response procedures for the Notification Preferences project.

---

## 🔍 Monitoring

### Application Metrics

- **Request latency (p95, p99)**
  - Target: p95 ≤ 300ms, p99 ≤ 500ms
  - Measured via Express middleware and Prometheus
- **Error rate (HTTP 4xx/5xx)**
  - Target: ≤ 0.1% of total requests
  - Tracked via Winston logs and monitoring dashboards
- **Notification delivery success (Resend, Twilio, Slack)**
  - Target: ≥ 99% success rate
  - Measured via integration adapter logs and webhooks

### Infrastructure Metrics

- **CPU, memory, disk usage**
  - Alert thresholds: CPU >80%, Memory >85%, Disk >90%
- **Database query performance**
  - Slow query logging for queries >1s
  - Connection pool monitoring
- **Queue length for async jobs**
  - Background notification processing
  - Email digest generation

### Tools

- **Primary**: Prometheus + Grafana dashboards
- **Backup**: Cloud provider monitoring (AWS CloudWatch, Azure Monitor, GCP Operations)
- **Alerting**: PagerDuty for critical issues, Slack for warnings

---

## 📜 Logging

### Backend

- **Structured JSON logs** (timestamp, user, action, role, result)
- **Log levels**: error, warn, info, debug
- **Key events logged**:
  - Authentication attempts (success/failure)
  - Permission changes (RBAC modifications)
  - Notification preference updates
  - Integration failures (Resend, Twilio, Slack)
- **Audit trail** for preference changes
  - Who changed what, when, and why
  - Compliance tracking for GDPR/CCPA

### Frontend

- **Console warnings/errors** captured via Sentry
- **User interaction tracking** (preference changes, errors)
- **Performance metrics** (page load times, API response times)

### Retention Policy

- **Staging**: Logs stored for 90 days
- **Production**: Logs stored for 1 year
- **Audit logs**: Retained for 7 years for compliance
- **Storage**: Centralized logging via ELK Stack or cloud logging services

---

## 🚨 Incident Response

### Detection

- **Automated alerts** triggered via monitoring (PagerDuty/Slack)
- **Threshold-based alerts**:
  - Error rate >1%
  - Response time >1s (p95)
  - Availability <99%
  - Failed notifications >5%

### Classification

- **Critical**: Full outage, data breach, compliance violation
- **High**: Major functionality broken, high error rate, degraded performance
- **Medium**: Partial feature outage, minor security issue
- **Low**: Cosmetic bug, documentation issue, non‑urgent

### Response Workflow

1. **Acknowledge** incident within 30 minutes
2. **Assign** incident commander (maintainer on call)
3. **Contain** issue (disable affected service, rollback deployment)
4. **Communicate** status updates every hour for Critical/High incidents
5. **Resolve** by applying fix, patch, or rollback
6. **Verify** resolution with smoke tests and monitoring

### Escalation

- **Critical incidents**: Immediate escalation to team lead
- **Security incidents**: CISO notification within 1 hour
- **Data breaches**: Legal/compliance team notification

---

## 🛡️ Security Operations

### Regular Security Tasks

- **Weekly dependency scans** (`npm audit`, `pip-audit`)
- **Monthly RBAC verification tests**
  - Verify Admin/Auditor/Viewer permissions
  - Test cross-user access restrictions
- **Quarterly audit review** (see AUDIT.md)
- **Secrets rotation** every 90 days
  - JWT secrets
  - API keys (Resend, Twilio, Slack)
  - Database credentials

### Security Monitoring

- **Failed authentication attempts** (>5 in 15 minutes)
- **Privilege escalation attempts**
- **Unusual access patterns** (off-hours, unusual locations)
- **API abuse** (rate limiting violations)

---

## 🧭 Operational Playbook

### Deployment Schedule

- **Staging deploys**: Daily, auto from `develop` branch
- **Production deploys**: Weekly, manual approval required
- **Hotfixes**: Emergency deploys for critical issues

### Rollback Procedures

1. **Immediate rollback**: Redeploy previous Docker tag
2. **Database rollback**: Reverse migrations if schema changes
3. **Verification**: Run smoke tests to confirm stability
4. **Documentation**: Log rollback reason and resolution

### Smoke Tests

Run after every deploy to confirm system health:

- **API health checks**: `/health`, `/api/auth/me`
- **Database connectivity**: Basic query execution
- **Integration tests**: Notification delivery verification
- **UI functionality**: Key user workflows

### Backup Procedures

- **Database backups**: Daily automated backups
- **Code repository**: GitHub with branch protection
- **Configuration**: Secrets backed up in secure vault
- **Documentation**: Version-controlled in git

---

## 📊 Reporting

### Weekly Operations Report

- **Uptime percentage**: Target ≥99.9%
- **Error rate**: Target ≤0.1%
- **Response time trends**: p95/p99 latency
- **Notification delivery**: Success/failure rates
- **Security incidents**: Summary of any issues
- **Coverage status**: Test coverage metrics

### Monthly Summary

- **Performance trends**: Month-over-month comparisons
- **Capacity planning**: Resource utilization analysis
- **Security posture**: Vulnerability scan results
- **User feedback**: Support ticket analysis

### Quarterly Governance Review

- **Compliance status**: GDPR, CCPA, SOC2 adherence
- **Roadmap progress**: Feature delivery against plan
- **Audit findings**: Security and compliance review results
- **Risk assessment**: Updated risk register
- **Process improvements**: Lessons learned and optimizations

---

## 🔧 Maintenance Windows

### Scheduled Maintenance

- **Frequency**: Monthly, second Saturday of each month
- **Duration**: Maximum 2 hours
- **Notification**: 48 hours advance notice via email/Slack
- **Activities**: Security updates, dependency upgrades, infrastructure maintenance

### Emergency Maintenance

- **Authorization**: Team lead approval required
- **Communication**: Immediate notification via all channels
- **Documentation**: Incident report required within 24 hours

---

## 📞 Contact Information

### On-Call Rotation

- **Primary**: Team lead (24/7 for critical issues)
- **Secondary**: Senior developer (backup)
- **Escalation**: Engineering manager

### Communication Channels

- **Internal**: Slack #ops-notifications, #incidents
- **External**: status.advancia.com updates
- **Emergency**: PagerDuty alerts, direct phone calls

---

## ✅ Success Metrics

By following this operations guide, we ensure:

- **High availability**: 99.9%+ uptime
- **Fast incident response**: <30 minute acknowledgment
- **Proactive monitoring**: Issues detected before user impact
- **Compliance readiness**: Audit-ready logging and documentation
- **Continuous improvement**: Regular reviews and optimizations
