# Monitoring Stack Quick Reference

Single-page cheat sheet for all monitoring tools and commands.

---

## 🎯 Three-Layer Defense System

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: PM2 Process Manager (Internal)                     │
│ • Auto-restart on crash                                     │
│ • Health checks every 30s                                   │
│ • Memory limit: 500MB                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: PowerShell Watchdog (External)                     │
│ • Independent health monitoring                             │
│ • Slack/Email alerts                                        │
│ • Backup restart capability                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Log Analysis (Historical)                          │
│ • Daily summaries & trends                                  │
│ • CSV export for reports                                    │
│ • One-liner instant stats                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Essential Commands

### PM2 Management

```bash
# Start
pm2 start ecosystem.config.cjs --env production

# Status
pm2 status

# Logs (live)
pm2 logs advvancia-backend

# Logs (last 100 lines)
pm2 logs advvancia-backend --lines 100

# Real-time monitoring
pm2 monit

# Restart
pm2 restart advvancia-backend

# Reload (zero-downtime)
pm2 reload advvancia-backend

# Stop
pm2 stop advvancia-backend

# Delete
pm2 delete advvancia-backend
```

### Watchdog Control

```powershell
# Start watchdog
.\simple-watchdog.ps1 -Action watchdog

# Start with notifications
.\simple-watchdog.ps1 -Action watchdog -SlackWebhook "https://hooks.slack.com/..." -EmailTo "admin@advancia.com"

# Stop watchdog
Ctrl+C (shows summary)

# View watchdog logs
Get-Content backend\logs\watchdog.log -Tail 50 -Wait
```

### Log Analysis

```powershell
# Daily summary
.\parse-watchdog.ps1

# Detailed analysis
.\parse-watchdog.ps1 -ShowDetails

# Export to CSV
.\parse-watchdog.ps1 -ExportCsv "report.csv"

# Last 30 days
.\parse-watchdog.ps1 -Days 30

# Specific date range
.\parse-watchdog.ps1 -Days 7
```

### One-Liner Queries

```powershell
# Total restarts
Select-String backend\logs\watchdog.log -Pattern "restart" | Measure | Select -Expand Count

# Restarts today
$d = Get-Date -Format "yyyy-MM-dd"
Select-String backend\logs\watchdog.log -Pattern "restart" | ? { $_ -match $d } | Measure | Select -Expand Count

# Recent errors
Select-String backend\logs\err.log -Pattern "." | Select -Last 20

# Watch all logs live
Get-Content backend\logs\combined.log -Wait -Tail 20
```

---

## 📁 Log File Locations

```
backend/logs/
├── err.log         # PM2 error output (stderr)
├── out.log         # PM2 standard output (stdout)
├── combined.log    # Unified log (all PM2 events)
├── watchdog.log    # Watchdog health checks & restarts
├── error.log       # Winston error-level logs
└── combined.log    # Winston all-level logs
```

---

## 🔍 Health Check URLs

```bash
# Local
curl http://localhost:4000/api/health

# Production
curl https://api.advancia.com/api/health

# Expected response
{"ok":true}
```

---

## 🚨 Emergency Procedures

### Backend Down

```bash
# 1. Check PM2 status
pm2 status

# 2. View recent errors
pm2 logs advvancia-backend --err --lines 100

# 3. Check if port is blocked
netstat -ano | findstr :4000

# 4. Restart
pm2 restart advvancia-backend

# 5. If still down, manual start
cd backend
node src/index.js
```

### High Memory Usage

```bash
# 1. Monitor memory
pm2 monit

# 2. Check current limit
pm2 describe advvancia-backend | grep "max_memory"

# 3. Restart to clear
pm2 restart advvancia-backend

# 4. If persistent, increase limit in ecosystem.config.cjs
```

### Frequent Restarts

```bash
# 1. Check restart count
pm2 status

# 2. Analyze logs for crash reason
pm2 logs advvancia-backend --err --lines 200

# 3. Run watchdog analysis
.\parse-watchdog.ps1 -ShowDetails

# 4. Stop PM2 and debug manually
pm2 stop advvancia-backend
cd backend
node src/index.js
```

---

## 📊 Daily Checklist

### Morning Check (5 minutes)

```powershell
# 1. PM2 status
pm2 status

# 2. Restart count (should be low)
pm2 describe advvancia-backend | Select-String "restarts"

# 3. Quick health check
curl http://localhost:4000/api/health

# 4. Recent errors
pm2 logs advvancia-backend --err --lines 20

# 5. Uptime summary
.\parse-watchdog.ps1 | Select-String "Overall Uptime"
```

### Weekly Review (15 minutes)

```powershell
# 1. Full analysis with export
.\parse-watchdog.ps1 -ShowDetails -ExportCsv "weekly-$(Get-Date -Format 'yyyy-MM-dd').csv"

# 2. Check for patterns
# - High restart days?
# - Specific failure types?
# - Memory growth?

# 3. Review recommendations
.\parse-watchdog.ps1 | Select-String "Recommendations" -Context 0,10

# 4. Update team/stakeholders
# Email the CSV report
```

---

## 🎯 Configuration Files

```
backend/
├── ecosystem.config.cjs          # PM2 configuration
├── PM2_GUIDE.md                  # PM2 documentation
└── logs/                         # Log directory

Root/
├── simple-watchdog.ps1           # Lightweight watchdog
├── parse-watchdog.ps1            # Log analysis tool
├── UNIFIED_LOGGING_STRATEGY.md   # Logging guide & roadmap
├── WATCHDOG_ONE_LINERS.md        # Quick queries
└── WATCHDOG_LOG_ANALYSIS.md      # Analysis automation
```

---

## 🛠️ Ecosystem Config (ecosystem.config.cjs)

```javascript
module.exports = {
  apps: [
    {
      name: "advvancia-backend",
      script: "src/index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false, // true in dev
      max_memory_restart: "500M",
      restart_delay: 5000,
      autorestart: true,

      env_development: {
        NODE_ENV: "development",
        PORT: 4000,
        watch: true,
      },

      env_production: {
        NODE_ENV: "production",
        PORT: 4000,
        watch: false,
      },

      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",

      health_check: {
        url: "http://localhost:4000/api/health",
        interval: 30000, // 30 seconds
        timeout: 5000, // 5 seconds
        max_retries: 3, // 3 failures = restart
        restart_on_unhealthy: true,
      },
    },
  ],
};
```

---

## 📈 Monitoring Roadmap

| Stage              | Tools                  | When            |
| ------------------ | ---------------------- | --------------- |
| **MVP** (Now)      | PM2 + Watchdog + Logs  | ✅ Implemented  |
| **Pre-Production** | Log rotation + Reports | Before launch   |
| **Production**     | Sentry + UptimeRobot   | With real users |
| **Scaling**        | Datadog/Grafana        | 6-12 months     |
| **Mature**         | Executive reports      | 1-2 years       |

---

## 🎉 What You Have Now

✅ **PM2 Process Manager**

- Auto-restart on crash
- Memory management (500MB limit)
- Health check monitoring (30s interval)
- Comprehensive logging

✅ **PowerShell Watchdog**

- External health monitoring
- Slack/Email alerts
- Independent restart capability
- Detailed logging

✅ **Log Analysis**

- parse-watchdog.ps1 (daily summaries)
- One-liner queries (instant stats)
- CSV export (reporting)
- Unified logging strategy

✅ **Documentation**

- PM2_GUIDE.md (complete PM2 reference)
- UNIFIED_LOGGING_STRATEGY.md (logging + roadmap)
- WATCHDOG_ONE_LINERS.md (quick queries)
- WATCHDOG_LOG_ANALYSIS.md (automation)
- MONITORING_QUICK_REFERENCE.md (this file)

---

## 🚀 Most Used Commands

```powershell
# Check everything
pm2 status
pm2 logs advvancia-backend --lines 50
.\parse-watchdog.ps1

# Start backend (dev)
cd backend
pm2 start ecosystem.config.cjs --env development

# Start backend (production)
cd backend
pm2 start ecosystem.config.cjs --env production

# Restart count today
$d = Get-Date -Format "yyyy-MM-dd"
Select-String backend\logs\watchdog.log -Pattern "restart" | ? { $_ -match $d } | Measure | Select -Expand Count

# Watch logs live
Get-Content backend\logs\combined.log -Wait -Tail 20

# Weekly report
.\parse-watchdog.ps1 -Days 7 -ShowDetails -ExportCsv "report.csv"
```

---

## 📞 Support Resources

- **PM2 Docs**: https://pm2.keymetrics.io/docs/
- **Backend README**: `backend/README.md`
- **PM2 Guide**: `backend/PM2_GUIDE.md`
- **Logging Strategy**: `UNIFIED_LOGGING_STRATEGY.md`

---

**Keep this file bookmarked for quick reference! 🔖**
