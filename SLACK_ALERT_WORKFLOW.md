# Slack Alert Workflow & Engineer Response Playbook

Complete guide for organizing monitoring alerts and responding to incidents effectively.

---

## 🎯 Overview

This playbook integrates **Sentry (error tracking)** + **Datadog (metrics)** + **Watchdog (health monitoring)** into a unified Slack workflow that keeps engineers informed without overwhelming them.

### Three-Channel Strategy

```
┌─────────────────────────────────────────────────────────┐
│ #backend-errors (Sentry)                                │
│ → Detailed error alerts with stack traces               │
│ → Developer focus: Fix code issues                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ #backend-metrics (Datadog)                              │
│ → System health alerts (uptime, restarts, resources)    │
│ → Ops focus: Infrastructure monitoring                  │
└─────────────────────────────────────────────────────────┐
                         ↓
┌─────────────────────────────────────────────────────────┐
│ #backend-alerts (Unified - Critical Only)               │
│ → High-priority alerts requiring immediate action       │
│ → Whole team: Correlated errors + system instability    │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 Slack Channel Setup

### Channel 1: #backend-errors (Sentry)

**Purpose**: Detailed error tracking for developers

**Connected Tools**:

- Sentry (error tracking)

**What Gets Posted**:

```
🚨 Error: TypeError in /api/login
Affected users: 12
Environment: production
Stack trace: at processPayment (payment.js:45)
[View in Sentry]
```

**Audience**:

- Backend developers
- Frontend developers (for API errors)
- Engineering leads

**Notification Settings**:

- Mentions: @backend-team for critical errors
- Frequency: Real-time for high-priority, batched for low-priority
- Threads: Enabled for discussion

---

### Channel 2: #backend-metrics (Datadog)

**Purpose**: System health and infrastructure monitoring

**Connected Tools**:

- Datadog (metrics & monitoring)
- PM2 (via webhook)
- Watchdog (via Slack integration)

**What Gets Posted**:

```
⚠️ Backend restarted 4 times in last 30 minutes
Uptime: 97.8%
Memory usage: 450MB/500MB
CPU: 75%
[View Dashboard]
```

**Audience**:

- DevOps engineers
- Backend team leads
- Site reliability engineers

**Notification Settings**:

- Mentions: @ops-team for infrastructure issues
- Frequency: Real-time for critical, hourly digest for warnings
- Threads: Enabled for investigation

---

### Channel 3: #backend-alerts (Critical Only)

**Purpose**: Unified critical alerts requiring immediate action

**Connected Tools**:

- Sentry (critical errors only)
- Datadog (critical metrics only)
- Watchdog (critical health failures)

**What Gets Posted**:

```
🔴 CRITICAL: Error spike detected + Restart storm
Error rate: 50/min (Sentry)
Restarts: 5 in last hour (Datadog)
Uptime: 95.2% (below SLA)
@backend-oncall @ops-oncall - Immediate investigation required
[Sentry] [Datadog] [Runbook]
```

**Audience**:

- Entire engineering team
- On-call engineers
- Engineering managers

**Notification Settings**:

- Mentions: @channel for critical alerts
- Frequency: Real-time only (no batching)
- Threads: Required for all alerts
- Escalation: PagerDuty if unacknowledged in 5 minutes

---

## 🔔 Alert Rules Configuration

### Sentry Rules → #backend-errors

#### Rule 1: High Error Frequency

```yaml
Name: High Error Rate Alert
Conditions:
  - Error count > 5 per minute
  - Environment: production
Actions:
  - Send to #backend-errors
  - Severity: Warning
Filters:
  - Exclude health check errors
  - Exclude validation errors
```

#### Rule 2: Critical Error Types

```yaml
Name: Critical Error Alert
Conditions:
  - Error type in: [DatabaseError, AuthFailure, PaymentError]
  - Any frequency
  - Environment: production
Actions:
  - Send to #backend-errors
  - Send to #backend-alerts (if critical)
  - Mention @backend-oncall
  - Severity: Critical
```

#### Rule 3: User Impact Alert

```yaml
Name: High User Impact
Conditions:
  - More than 10 unique users affected
  - Within 5 minutes
  - Environment: production
Actions:
  - Send to #backend-errors
  - Send to #backend-alerts
  - Email engineering lead
  - Severity: Critical
```

#### Rule 4: New Error Type

```yaml
Name: New Error Detected
Conditions:
  - Error is first seen
  - Environment: production
Actions:
  - Send to #backend-errors
  - Severity: Info
Filters:
  - Only during business hours (optional)
```

---

### Datadog Rules → #backend-metrics

#### Rule 1: Restart Storm

```yaml
Name: Backend Restart Storm
Conditions:
  - Backend restarts > 3 per hour
  - Sustained for 10 minutes
Actions:
  - Send to #backend-metrics
  - Send to #backend-alerts (if >5 restarts)
  - Mention @ops-team
  - Severity: Warning/Critical
```

#### Rule 2: Uptime SLA Breach

```yaml
Name: Uptime Below SLA
Conditions:
  - Uptime < 99% in last hour
  - Environment: production
Actions:
  - Send to #backend-metrics
  - Send to #backend-alerts
  - Email ops lead
  - Severity: Critical
```

#### Rule 3: Memory Usage

```yaml
Name: High Memory Usage
Conditions:
  - Memory > 80% for 10 minutes
  - OR Memory > 95% for 1 minute
Actions:
  - Send to #backend-metrics
  - Severity: Warning/Critical
```

#### Rule 4: CPU Usage

```yaml
Name: High CPU Usage
Conditions:
  - CPU > 90% for 10 minutes
Actions:
  - Send to #backend-metrics
  - Severity: Warning
```

#### Rule 5: Health Check Failures

```yaml
Name: Health Check Failing
Conditions:
  - /api/health returns non-200
  - For 3 consecutive checks (90 seconds)
Actions:
  - Send to #backend-metrics
  - Trigger PM2 restart
  - Severity: Critical
```

---

### Unified Critical Rules → #backend-alerts

#### Rule 1: Correlated Error + Restart Storm

```yaml
Name: Critical System Instability
Conditions:
  - Sentry: Error rate > 50/min
  - AND Datadog: Restarts > 5 per hour
  - Both sustained for 5 minutes
Actions:
  - Send to #backend-alerts with 🔴 tag
  - Mention @channel
  - Create PagerDuty incident
  - Severity: Critical
```

#### Rule 2: Complete System Failure

```yaml
Name: Backend Down
Conditions:
  - Health check fails for 5 minutes
  - PM2 unable to restart
Actions:
  - Send to #backend-alerts
  - Mention @channel
  - Escalate to PagerDuty
  - Send SMS to on-call
  - Severity: Critical
```

#### Rule 3: Database Connection Failure

```yaml
Name: Database Unreachable
Conditions:
  - Multiple DatabaseError in Sentry
  - Health check DB query fails
Actions:
  - Send to #backend-alerts
  - Mention @backend-oncall @ops-oncall
  - Severity: Critical
```

---

## 🚨 Engineer Response Playbook

### Sentry Alerts (#backend-errors)

#### 🔸 Error Frequency > 5/minute

**Alert Example**:

```
⚠️ Error rate spike: 12 errors/min
Error: TypeError: Cannot read property 'user' of undefined
File: auth.js:45
Affected: 8 users
```

**Response Steps**:

1. **Acknowledge** in Slack thread within 2 minutes
2. **Open Sentry dashboard** → view stack trace
3. **Classify severity**:
   - User-facing? → Priority 1 (hotfix)
   - Internal only? → Priority 2 (schedule fix)
4. **Check recent deployments** (last 30 min)
5. **If deployment related** → rollback
6. **If code bug** → create hotfix PR
7. **Update thread** with findings and ETA

**Escalation**: If unresolved in 15 minutes → mention engineering lead

---

#### 🔸 Critical Error (Database/Auth Failure)

**Alert Example**:

```
🚨 CRITICAL: DatabaseError
Message: Connection pool exhausted
Affected users: 25
Environment: production
```

**Response Steps**:

1. **Acknowledge immediately** (< 1 minute)
2. **Check database status**:
   ```bash
   # Connect to DB
   docker ps | grep postgres
   psql -h localhost -U postgres -d advvancia
   ```
3. **Verify connection pool settings**:
   ```javascript
   // Check backend/src/db.js
   pool: { min: 2, max: 10 }
   ```
4. **Check active connections**:
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```
5. **Emergency actions**:
   - If DB down → restart DB container
   - If pool exhausted → restart backend (PM2)
   - If DB locked → identify and kill long queries
6. **Roll back recent changes** if deployment-related
7. **Update #backend-alerts** if escalated

**Escalation**: Immediate escalation to ops lead + DB admin

---

#### 🔸 User Impact > 10 Users

**Alert Example**:

```
🔴 High user impact: 15 users affected
Error: Payment processing failed
Timeframe: Last 5 minutes
```

**Response Steps**:

1. **Acknowledge + mention @backend-lead**
2. **Post to #backend-alerts** if not already there
3. **Assign engineer** to investigate root cause
4. **Update status page** if user-visible downtime:
   - status.advancia.com → "Investigating payment issues"
5. **Create incident report** in shared doc:
   - Start time
   - Affected feature
   - User impact (number of users)
   - Actions taken
6. **Communicate ETA** in Slack every 10 minutes
7. **Post-mortem** after resolution

**Escalation**: Mention @engineering-manager if >20 users affected

---

### Datadog Alerts (#backend-metrics)

#### 🔸 Restart Storm (>3/hour)

**Alert Example**:

```
⚠️ Backend restart storm detected
Restarts: 5 in last hour
Uptime: 96.8%
Memory: 480MB/500MB (near limit)
```

**Response Steps**:

1. **Acknowledge** within 5 minutes
2. **Check PM2 logs**:
   ```bash
   pm2 logs advvancia-backend --lines 100 --err
   ```
3. **Review watchdog logs**:
   ```powershell
   .\parse-watchdog.ps1 -ShowDetails
   ```
4. **Identify pattern**:
   - Memory limit exceeded? → Increase limit or fix leak
   - Crash loop? → Check recent code changes
   - Health check failures? → Investigate endpoint
5. **Check Sentry for correlated errors**
6. **Emergency actions**:
   - Increase memory limit: `max_memory_restart: "1G"`
   - Rollback deployment if recent
   - Disable problematic feature flag
7. **Monitor for 30 minutes** after action

**Escalation**: If restarts persist >30 minutes → ops lead + engineering lead

---

#### 🔸 Uptime < 99%

**Alert Example**:

```
🚨 Uptime SLA breach
Current uptime: 97.8% (last hour)
Target: 99%
Restarts: 3
Failed health checks: 12
```

**Response Steps**:

1. **Acknowledge immediately**
2. **Create incident** in tracking system
3. **Investigate root cause**:
   - Check infrastructure (server, cloud provider status)
   - Review error logs (Sentry + PM2)
   - Check database health
   - Review recent deployments
4. **Correlate with Sentry alerts**
5. **Communicate to stakeholders**:
   - Internal: #backend-alerts
   - External: Status page update (if SLA breach)
6. **Document actions taken**
7. **Schedule post-mortem**

**Escalation**: If SLA breach risk → immediate escalation to VP Engineering

---

#### 🔸 Memory > 80% or CPU > 90%

**Alert Example**:

```
⚠️ High resource usage
Memory: 420MB/500MB (84%)
CPU: 92% sustained
Duration: 12 minutes
```

**Response Steps**:

1. **Acknowledge** within 10 minutes
2. **Check current load**:
   ```bash
   pm2 monit
   top -p $(pgrep -f "node.*index.js")
   ```
3. **Identify culprit**:
   - Check active requests (Datadog APM)
   - Profile memory usage (Node.js heap snapshot)
   - Check for memory leaks (increasing over time)
4. **Immediate mitigation**:
   - Scale horizontally (add instance) if high traffic
   - Restart backend if memory leak suspected
   - Kill long-running queries if DB-related
5. **Schedule optimization**:
   - If non-urgent → create JIRA ticket
   - If recurring → prioritize for sprint
6. **Monitor for improvement**

**Escalation**: If resource usage >95% for >30 min → ops lead

---

### Unified Critical Alerts (#backend-alerts)

#### 🔴 Error Spike + Restart Storm

**Alert Example**:

```
🔴🔴🔴 CRITICAL: System Instability Detected
Sentry: 52 errors/min (TypeError in auth.js)
Datadog: 6 restarts in last hour
Uptime: 95.2% (BELOW SLA)
@channel @backend-oncall @ops-oncall
IMMEDIATE ACTION REQUIRED
[Sentry Dashboard] [Datadog Dashboard] [Runbook]
```

**Response Steps**:

1. **Immediate team huddle** (war room in Slack thread)
2. **Assign roles**:
   - Engineer A: Investigate errors (Sentry)
   - Engineer B: Investigate system health (Datadog)
   - Lead: Coordinate + communicate
3. **Create incident channel**: `#incident-2025-11-14`
4. **Status updates every 5 minutes**:
   ```
   [12:05] Investigating auth.js error
   [12:10] Identified memory leak in auth middleware
   [12:15] Deploying hotfix
   [12:20] Restart completed, monitoring
   [12:25] Error rate declining, uptime recovering
   ```
5. **Communicate to stakeholders**:
   - Update status page
   - Notify customer success team
   - Post to company Slack
6. **Escalate if unresolved in 30 minutes**:
   - Page VP Engineering
   - Consider full rollback
   - Prepare incident report

**Post-Incident**:

- Write detailed post-mortem (48 hours)
- Review alert thresholds
- Update runbook
- Implement preventive measures

---

## 📊 Alert Severity Levels

### Level 1: Info (💙)

- **Examples**: New error type, minor performance degradation
- **Response Time**: 24 hours
- **Audience**: Team channel only
- **Action**: Log and schedule

### Level 2: Warning (⚠️)

- **Examples**: Error rate spike, 1-2 restarts, memory >80%
- **Response Time**: 1 hour
- **Audience**: Relevant team channel + mention
- **Action**: Investigate and monitor

### Level 3: Error (🔶)

- **Examples**: Multiple restarts, critical error type, CPU >90%
- **Response Time**: 15 minutes
- **Audience**: Team channel + ops channel
- **Action**: Immediate investigation

### Level 4: Critical (🔴)

- **Examples**: Restart storm, uptime <99%, error spike + restarts
- **Response Time**: 1 minute
- **Audience**: All channels + @channel
- **Action**: War room + escalation

---

## 🎯 Best Practices

### For Alert Configuration

1. **Use rate-based alerts** (errors/min) not absolute counts
2. **Filter out noise**: Health checks, client disconnects, validation errors
3. **Set appropriate thresholds**: Test in staging first
4. **Enable alert grouping**: Combine related errors
5. **Configure quiet hours**: Batch non-critical alerts overnight

### For Slack Channels

1. **Use threads religiously**: Keep main channel readable
2. **Add emoji reactions**: ✅ (investigating), 🔧 (fixing), ✔️ (resolved)
3. **Pin important alerts**: Critical ongoing incidents
4. **Mute low-priority**: Let engineers opt-in to detailed channels
5. **Archive old incidents**: Keep channels focused

### For Engineers

1. **Acknowledge alerts quickly**: Even if "I'm looking into it"
2. **Update threads regularly**: Every 10-15 minutes during incident
3. **Use runbooks**: Link to response procedures
4. **Don't silence alerts**: Fix the root cause instead
5. **Participate in post-mortems**: Improve alerting over time

---

## 🔗 Integration Setup

### Sentry → Slack

1. **Go to Sentry Project Settings**
2. **Integrations → Slack**
3. **Authenticate workspace**
4. **Choose channels**:
   - `#backend-errors` for all alerts
   - `#backend-alerts` for critical only
5. **Configure alert rules** (see above)
6. **Test with sample error**:
   ```javascript
   // In your code
   throw new Error("Test Sentry → Slack integration");
   ```

### Datadog → Slack

1. **Go to Datadog Integrations**
2. **Search "Slack" → Configure**
3. **Authorize workspace**
4. **Choose channels**:
   - `#backend-metrics` for all alerts
   - `#backend-alerts` for critical only
5. **Create monitors** (see alert rules above)
6. **Test with manual monitor trigger**

### Watchdog → Slack

Watchdog already supports Slack webhooks:

```powershell
.\simple-watchdog.ps1 -Action watchdog -SlackWebhook "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

Configure in PM2 or run standalone.

---

## 📈 Monitoring the Monitors

### Weekly Review (15 minutes)

1. **Check alert frequency**:
   ```
   - #backend-errors: How many alerts/day?
   - #backend-metrics: How many alerts/day?
   - #backend-alerts: How many critical/week?
   ```
2. **Identify false positives**: Adjust thresholds
3. **Review response times**: Are engineers acknowledging quickly?
4. **Update runbooks**: Add new scenarios encountered

### Monthly Review (30 minutes)

1. **Analyze alert trends**:
   - Increasing error rates? → Code quality issue
   - Increasing restarts? → Infrastructure issue
   - Decreasing alerts? → Improvements working
2. **Review escalation paths**: Were they effective?
3. **Update alert rules**: Based on lessons learned
4. **Celebrate improvements**: Share wins with team

---

## 📚 Quick Reference

### Alert Cheat Sheet

| Alert Type     | Channel                            | Severity | Response Time | Action      |
| -------------- | ---------------------------------- | -------- | ------------- | ----------- |
| Error spike    | #backend-errors                    | Warning  | 15 min        | Investigate |
| Critical error | #backend-errors + #backend-alerts  | Critical | 1 min         | War room    |
| Restart storm  | #backend-metrics                   | Warning  | 15 min        | Check logs  |
| Uptime breach  | #backend-metrics + #backend-alerts | Critical | 1 min         | Escalate    |
| High resources | #backend-metrics                   | Warning  | 1 hour        | Monitor     |
| Correlated     | #backend-alerts                    | Critical | 1 min         | Full team   |

### Useful Commands

```bash
# Check PM2 status
pm2 status

# View recent errors
pm2 logs advvancia-backend --err --lines 50

# Analyze watchdog logs
.\parse-watchdog.ps1 -ShowDetails

# Check Sentry (browser)
https://sentry.io/organizations/YOUR_ORG/issues/

# Check Datadog (browser)
https://app.datadoghq.com/monitors/manage

# Restart backend
pm2 restart advvancia-backend

# View memory usage
pm2 monit
```

---

## ✅ Summary

**What This Playbook Provides**:

- ✅ Three-channel Slack workflow (errors, metrics, critical)
- ✅ Detailed alert rules for Sentry + Datadog
- ✅ Step-by-step response procedures
- ✅ Escalation paths for each scenario
- ✅ Best practices for alert hygiene
- ✅ Integration setup guides
- ✅ Weekly/monthly review process

**Benefits**:

- Engineers know exactly what to do
- Alerts are actionable, not noisy
- Response times are fast and consistent
- System stays resilient
- Team learns and improves over time

**Next Steps**:

1. Set up Slack channels
2. Connect Sentry + Datadog
3. Configure alert rules
4. Test with sample alerts
5. Train team on playbook
6. Schedule first weekly review

---

**Your backend now has enterprise-grade incident response! 🚀**
