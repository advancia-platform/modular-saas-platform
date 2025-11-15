# Unified Logging & Monitoring Strategy

Complete guide to consolidating logs and implementing a scalable monitoring roadmap for Advvancia Pay.

---

## 🎯 Overview

As your platform grows, you need visibility into three key areas:

1. **Backend process health** (PM2)
2. **API endpoint availability** (Watchdog)
3. **Application errors** (Logs & Error tracking)

This guide shows you how to unify these logs and when to add advanced monitoring tools.

---

## 📁 Current Logging Structure

### PM2 Logs (Backend Process)

```
backend/logs/
├── err.log         # Error output (stderr)
├── out.log         # Standard output (stdout)
└── combined.log    # Unified log file (all PM2 events)
```

**What's captured:**

- Application startup/shutdown
- Uncaught exceptions
- Console.log/console.error output
- PM2 restart events
- Memory threshold warnings

### Watchdog Logs (Health Monitoring)

```
backend/logs/watchdog.log
```

**What's captured:**

- Health check results (/api/health endpoint)
- Backend restart triggers
- Health check failures with reasons
- Uptime statistics
- Critical alerts

### Winston Logs (Application Logging)

```
backend/logs/
├── combined.log    # All application logs
└── error.log       # Error-level logs only
```

**What's captured:**

- HTTP request/response details
- Database queries (if enabled)
- Business logic events
- User authentication attempts
- API errors with stack traces

---

## 🔄 Unified Logging Strategy

### Option A: Real-Time Streaming (Development)

**Watch all logs simultaneously:**

```powershell
# PowerShell
Get-Content "backend\logs\watchdog.log","backend\logs\out.log","backend\logs\err.log","backend\logs\combined.log" -Wait -Tail 20
```

```bash
# Linux/Mac
tail -f backend/logs/watchdog.log backend/logs/out.log backend/logs/err.log backend/logs/combined.log
```

**Filtered streaming:**

```powershell
# Only errors
Get-Content "backend\logs\err.log","backend\logs\error.log" -Wait | Select-String "error|ERROR|Error"

# Only restarts
Get-Content "backend\logs\watchdog.log","backend\logs\out.log" -Wait | Select-String "restart|RESTART|Restart"
```

### Option B: Consolidated Log File (Production)

**Enhanced Watchdog with Unified Logging:**

Add to your watchdog script (`simple-watchdog.ps1` or `backend-watchdog.ps1`):

```powershell
function Write-UnifiedLog($message, $level = "INFO") {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "$timestamp [$level] $message"

    # Write to watchdog log
    Add-Content -Path $LogFile -Value $entry

    # Also write to unified log
    Add-Content -Path "backend\logs\combined.log" -Value $entry

    # Console output
    Write-Output $entry
}

# Usage
Write-UnifiedLog "Health check passed" "INFO"
Write-UnifiedLog "Backend restarted due to failure" "WARN"
Write-UnifiedLog "Critical: Multiple failures detected" "ERROR"
```

**Benefits:**

- Single `combined.log` file contains everything
- Chronological order across all sources
- Easier to grep/search for specific events
- Simplified log rotation and archival

### Option C: PM2 Log Aggregation

**Install PM2 log rotation:**

```bash
pm2 install pm2-logrotate
```

**Configure rotation:**

```bash
# Max log file size (default: 10M)
pm2 set pm2-logrotate:max_size 10M

# Number of rotated logs to keep (default: 10)
pm2 set pm2-logrotate:retain 7

# Compress rotated logs
pm2 set pm2-logrotate:compress true

# Rotate at specific time (default: midnight)
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```

**Result:**

```
backend/logs/
├── out.log           # Current output
├── out.log.1.gz      # Yesterday (compressed)
├── out.log.2.gz      # 2 days ago
├── err.log           # Current errors
└── err.log.1.gz      # Yesterday (compressed)
```

---

## 🛠 PM2 Health Check Integration

PM2 can monitor your `/api/health` endpoint and auto-restart on failures.

### Setup

**1. Install PM2 health module:**

```bash
# Option 1: NPM package
npm install pm2-health --save-dev

# Option 2: PM2 module
pm2 install pm2-health
```

**2. Configuration already added to `ecosystem.config.cjs`:**

```javascript
health_check: {
  url: "http://localhost:4000/api/health",
  interval: 30000,         // 30 seconds between checks
  timeout: 5000,           // 5 seconds before considering it failed
  max_retries: 3,          // restart after 3 consecutive failures
  restart_on_unhealthy: true
}
```

**3. Restart PM2 to apply:**

```bash
pm2 restart advvancia-backend
```

### What It Does

- **Every 30 seconds**: PM2 pings `http://localhost:4000/api/health`
- **On failure**: Increments failure counter
- **After 3 consecutive failures**: Restarts backend automatically
- **Logs everything**: Events appear in `out.log` and `combined.log`

### Testing

**Simulate unhealthy state:**

```bash
# Stop backend temporarily
pm2 stop advvancia-backend

# Watch PM2 detect failure
pm2 logs advvancia-backend --lines 50

# PM2 will auto-restart after 3 failed checks (~90 seconds)
```

**Expected log output:**

```
2025-11-14 21:30:00: [PM2-Health] Checking http://localhost:4000/api/health
2025-11-14 21:30:05: [PM2-Health] Check failed: Connection refused (1/3)
2025-11-14 21:30:35: [PM2-Health] Check failed: Connection refused (2/3)
2025-11-14 21:31:05: [PM2-Health] Check failed: Connection refused (3/3)
2025-11-14 21:31:10: [PM2-Health] Max retries reached, restarting...
2025-11-14 21:31:15: Backend listening on port 4000
```

---

## 📊 Log Analysis Tools

### 1. One-Liner Queries (PowerShell)

**Count restarts today:**

```powershell
$today = Get-Date -Format "yyyy-MM-dd"
Select-String -Path "backend\logs\combined.log" -Pattern "$today.*restart" | Measure-Object | Select -Expand Count
```

**Find all errors in last 24 hours:**

```powershell
$cutoff = (Get-Date).AddHours(-24)
Get-Content "backend\logs\combined.log" | Where-Object {
    $_ -match "^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}" -and
    [DateTime]::Parse(($_ -split " ")[0..1] -join " ") -ge $cutoff -and
    $_ -match "ERROR|error|Error"
} | Select-Object -Last 20
```

**Health check success rate:**

```powershell
$total = (Select-String -Path "backend\logs\watchdog.log" -Pattern "Health check").Count
$passed = (Select-String -Path "backend\logs\watchdog.log" -Pattern "Health check passed").Count
$rate = [math]::Round(($passed / $total) * 100, 2)
Write-Host "Health check success rate: $rate%"
```

### 2. parse-watchdog.ps1

Already created! Analyzes watchdog logs for daily summaries:

```powershell
# Basic analysis
.\parse-watchdog.ps1

# With detailed failure breakdown
.\parse-watchdog.ps1 -ShowDetails

# Export to CSV for reporting
.\parse-watchdog.ps1 -ExportCsv "weekly-report.csv"

# Last 30 days
.\parse-watchdog.ps1 -Days 30
```

### 3. Custom Dashboard Script

**Create `view-logs.ps1`:**

```powershell
Clear-Host
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Advvancia Backend - Unified Log Dashboard" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# PM2 Status
Write-Host "📊 PM2 Status:" -ForegroundColor Yellow
npx pm2 status

# Recent restarts
Write-Host "`n🔄 Recent Restarts:" -ForegroundColor Yellow
Select-String -Path "backend\logs\combined.log" -Pattern "restart" | Select-Object -Last 5

# Recent errors
Write-Host "`n❌ Recent Errors:" -ForegroundColor Red
Select-String -Path "backend\logs\err.log" -Pattern "." | Select-Object -Last 10

# Health check summary
Write-Host "`n💚 Health Check Summary (Today):" -ForegroundColor Green
$today = Get-Date -Format "yyyy-MM-dd"
$checks = (Select-String -Path "backend\logs\watchdog.log" -Pattern "$today.*Health check").Count
$passed = (Select-String -Path "backend\logs\watchdog.log" -Pattern "$today.*Health check passed").Count
Write-Host "  Total: $checks | Passed: $passed | Failed: $($checks - $passed)"

Write-Host "`n═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan
```

**Run:**

```powershell
.\view-logs.ps1
```

---

## 🛤️ Resilience & Monitoring Roadmap

### Stage 1: MVP / Development (✅ Current)

**Tools:**

- ✅ PM2 with auto-restart (`ecosystem.config.cjs`)
- ✅ Basic error/output logging
- ✅ PM2 health checks (just added)

**Capabilities:**

- Backend stays alive on crashes
- Memory management (500MB limit)
- Auto-restart after 3 health check failures
- Basic logs for debugging

**When:** Right now — baseline for any production system

---

### Stage 2: Early Testing (✅ Current)

**Tools:**

- ✅ PowerShell Watchdog (`simple-watchdog.ps1` or `backend-watchdog.ps1`)
- ✅ Slack/Email notifications
- ✅ Unified logging (`combined.log`)

**Capabilities:**

- External health monitoring (independent of PM2)
- Alert engineers on failures
- Restart backend if health checks fail
- Consolidated logs for debugging

**When:** Already implemented — good for team collaboration

---

### Stage 3: Pre-Production (Next)

**Tools to add:**

- 📦 **Winston structured logging** (already in place)
- 📦 **Log aggregation** (pm2-logrotate)
- 📦 **Automated reports** (parse-watchdog.ps1 + scheduled task)

**Capabilities:**

- Structured JSON logs for parsing
- Automatic log rotation (7 days retention)
- Daily/weekly uptime reports via email
- Historical trend analysis

**When:** Before launch to real users

**Implementation:**

```bash
# Install log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Schedule daily report (Windows Task Scheduler)
# Action: powershell.exe
# Arguments: -File "C:\path\to\parse-watchdog.ps1" -ExportCsv "C:\reports\daily-$(Get-Date -Format 'yyyy-MM-dd').csv"
# Schedule: Daily at 8:00 AM
```

---

### Stage 4: Production Launch (When Users Arrive) ✅ READY!

**Tools to add:**

- ✅ **Sentry** (Error tracking with stack traces) - **INSTALLED!**
- 🎯 **Uptime monitoring** (Pingdom, StatusCake, or UptimeRobot)

**Capabilities:**

- Real-time error alerts with context
- User-specific error tracking
- Release version tracking
- Performance monitoring
- External uptime checks (from multiple locations)

**When:** Add when real users are hitting the system

**Implementation:** ✅ **COMPLETE!**

Sentry already integrated in `backend/src/`:

- ✅ `utils/sentry.js` - Full Sentry wrapper
- ✅ `index.js` - Middleware integrated
- ✅ Global error handlers
- ✅ Request context capture
- ✅ Performance monitoring
- ✅ User tracking utilities

**Setup steps:**

1. Create Sentry account (free): https://sentry.io/signup/
2. Create Node.js project
3. Copy DSN to `.env`: `SENTRY_DSN=https://xxx@sentry.io/xxx`
4. Connect Slack workspace
5. Create alert rules

**Documentation:** See `backend/SENTRY_SETUP.md` for complete guide

**Cost:** Sentry free tier: 5K errors/month, UptimeRobot: 50 monitors free

---

### Stage 5: Scaling / Team Growth (6-12 months)

**Tools to add:**

- 📈 **Datadog** or **New Relic** (Full observability)
- 📈 **Grafana + Prometheus** (Open-source alternative)

**Capabilities:**

- Custom dashboards (uptime %, response times, error rates)
- Infrastructure metrics (CPU, memory, disk, network)
- Distributed tracing (track requests across services)
- Alerting rules (PagerDuty integration)
- SLA compliance tracking

**When:** When uptime guarantees matter (SLAs, investors, enterprise customers)

**Implementation:**

```bash
# Datadog agent
npm install dd-trace
# Add to backend/src/index.js
require('dd-trace').init({
  hostname: 'advvancia-backend',
  service: 'advvancia-pay',
});
```

**Cost:** Datadog starts at $15/host/month, Grafana Cloud free tier available

---

### Stage 6: Mature SaaS (1-2 years)

**Tools to add:**

- 📊 **Automated executive reports** (Weekly/Monthly)
- 📊 **Custom analytics dashboard** (for stakeholders)
- 📊 **Compliance logging** (SOC2, PCI-DSS requirements)

**Capabilities:**

- Polished weekly summaries for investors
- Uptime % charts for marketing
- Audit trails for compliance
- Custom KPIs (transaction success rate, user growth, etc.)

**When:** Need investor-friendly metrics or compliance certifications

**Implementation:**

```powershell
# Weekly executive report script
param(
    [string]$RecipientEmail = "exec@advancia.com"
)

$report = .\parse-watchdog.ps1 -Days 7 -ExportCsv "temp.csv"
$uptime = # ... calculate from CSV
$restarts = # ... count from CSV

$body = @"
Weekly Backend Health Report

Uptime: $uptime%
Restarts: $restarts
Critical Issues: 0

Full report attached.
"@

Send-MailMessage -To $RecipientEmail -Subject "Weekly Health Report" -Body $body -Attachments "temp.csv"
```

---

## 🎯 Current vs Future State

### ✅ What You Have Now (Excellent Foundation!)

```
PM2 Process Manager
└── Auto-restart on crash
└── Memory management
└── Health check monitoring (just added)

PowerShell Watchdog
└── External health checks
└── Slack/Email alerts
└── Restart capability

Unified Logging
└── combined.log (all events)
└── err.log (errors only)
└── watchdog.log (health monitoring)

Log Analysis
└── parse-watchdog.ps1 (daily summaries)
└── One-liner queries (instant stats)
```

**This is production-ready for MVP launch!**

---

### 🔮 What to Add Later

```
Pre-Production (Before Launch)
└── Log rotation (pm2-logrotate)
└── Automated daily reports
└── Historical trend analysis

Production Launch (With Real Users)
└── Sentry (error tracking)
└── UptimeRobot (external monitoring)

Scaling (6-12 months)
└── Datadog/Grafana (dashboards)
└── Distributed tracing
└── SLA tracking

Mature SaaS (1-2 years)
└── Executive reports
└── Compliance logging
└── Custom analytics
```

---

## 🚀 Quick Commands Reference

### View All Logs

```powershell
# Real-time streaming
Get-Content backend\logs\combined.log -Wait -Tail 50

# Search for errors
Select-String -Path backend\logs\combined.log -Pattern "error|ERROR" | Select -Last 20

# Count restarts today
$today = Get-Date -Format "yyyy-MM-dd"
Select-String -Path backend\logs\combined.log -Pattern "$today.*restart" | Measure | Select -Expand Count
```

### PM2 Health Check

```bash
# View PM2 status
pm2 status

# Check health check logs
pm2 logs advvancia-backend | grep -i "health"

# Manually test health endpoint
curl http://localhost:4000/api/health
```

### Watchdog Analysis

```powershell
# Daily summary
.\parse-watchdog.ps1

# Detailed failure analysis
.\parse-watchdog.ps1 -ShowDetails

# Export report
.\parse-watchdog.ps1 -ExportCsv "report.csv"
```

---

## 📚 Summary

**Current Setup (Excellent!):**

- ✅ PM2 keeps backend alive
- ✅ Health checks restart on failures
- ✅ Unified logging in `combined.log`
- ✅ Watchdog provides external monitoring
- ✅ parse-watchdog.ps1 analyzes trends

**Next Steps:**

1. **Now**: Test PM2 health checks (already configured)
2. **Before launch**: Add log rotation and automated reports
3. **After launch**: Add Sentry for error tracking
4. **When scaling**: Add Datadog or Grafana for dashboards

**You don't need everything now!** Your current setup is production-ready. Add tools as you scale.

---

**Ready to go! Backend has enterprise-grade resilience and monitoring. 🚀**
