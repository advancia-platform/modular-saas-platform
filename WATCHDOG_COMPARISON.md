# Watchdog Scripts Comparison

Quick reference to help you choose the right watchdog script for your needs.

---

## 📊 Feature Comparison

| Feature                 | simple-watchdog.ps1    | backend-watchdog.ps1  | backend-tools.ps1            |
| ----------------------- | ---------------------- | --------------------- | ---------------------------- |
| **Purpose**             | Lightweight monitoring | Production monitoring | Multi-purpose automation     |
| **Complexity**          | ⭐ Simple              | ⭐⭐ Moderate         | ⭐⭐⭐ Comprehensive         |
| **Lines of Code**       | ~400                   | ~450                  | ~664                         |
| **Setup Time**          | 2 min                  | 5 min                 | 10 min                       |
| **Health Checks**       | ✅ Basic               | ✅ Advanced           | ✅ Via watchdog scripts      |
| **Auto-Restart**        | ✅ PM2 only            | ✅ PM2 or Node        | ✅ Via watchdog scripts      |
| **Logging**             | ✅ Simple              | ✅ Comprehensive      | ✅ Per action                |
| **Slack Notifications** | ✅ Basic               | ✅ Rich formatted     | ❌ (via watchdog)            |
| **Email Notifications** | ✅ Basic               | ✅ Detailed           | ❌ (via watchdog)            |
| **Statistics**          | ✅ Basic               | ✅ Advanced           | ✅ Process stats             |
| **Retry Threshold**     | Immediate (1)          | Configurable (3)      | N/A                          |
| **Failure Tracking**    | ❌                     | ✅ Consecutive        | N/A                          |
| **PM2 Management**      | ✅ Restart only        | ✅ Full integration   | ✅ Start/Stop/Restart/Status |
| **Background Mode**     | Manual                 | Built-in              | Launches watchdog            |
| **Process Tracking**    | ❌                     | ✅ PID tracking       | ✅ Find processes            |
| **Alert Levels**        | Single                 | 5 levels              | N/A                          |
| **DB Operations**       | ❌                     | ❌                    | ✅ Migrate/Backup/Restore    |
| **Dev Tools**           | ❌                     | ❌                    | ✅ Test/Lint/Build           |
| **Best For**            | Quick setup            | Production            | Complete automation          |

---

## 🎯 Decision Matrix

### Use `simple-watchdog.ps1` If You:

- ✅ Need quick setup (< 5 minutes)
- ✅ Want a single-file solution
- ✅ Are testing notifications
- ✅ Prefer simplicity over features
- ✅ Don't need retry thresholds
- ✅ Want to learn the system
- ✅ Have basic monitoring needs
- ✅ Are running in development

**Command**:

```powershell
.\simple-watchdog.ps1 -Action watchdog -Port 4000
```

---

### Use `backend-watchdog.ps1` If You:

- ✅ Need production-grade monitoring
- ✅ Want configurable retry thresholds
- ✅ Need detailed statistics
- ✅ Want alert level filtering
- ✅ Need consecutive failure tracking
- ✅ Want background execution
- ✅ Need PID tracking
- ✅ Require audit trails
- ✅ Are running in production

**Command**:

```powershell
.\backend-watchdog.ps1 -Port 4000 -CheckInterval 60 -MaxRetries 3
```

---

### Use `backend-tools.ps1` If You:

- ✅ Need complete backend automation
- ✅ Want database operations (migrate/seed/backup)
- ✅ Need PM2 lifecycle management
- ✅ Want development tools (test/lint/build)
- ✅ Need port management utilities
- ✅ Want a unified toolset
- ✅ Prefer launching watchdog as needed
- ✅ Need multiple operation types

**Commands**:

```powershell
# Database operations
.\backend-tools.ps1 -Action migrate
.\backend-tools.ps1 -Action seed
.\backend-tools.ps1 -Action backup

# Server operations
.\backend-tools.ps1 -Action start
.\backend-tools.ps1 -Action restart
.\backend-tools.ps1 -Action pm2-status

# Watchdog management
.\backend-tools.ps1 -Action watchdog-start
.\backend-tools.ps1 -Action watchdog-status
.\backend-tools.ps1 -Action watchdog-stop
```

---

## 📋 Use Case Scenarios

### Scenario 1: Local Development

**Goal**: Monitor backend while coding

**Recommended**: `simple-watchdog.ps1`

**Reason**: Quick to start, simple logging, no complexity

**Setup**:

```powershell
.\simple-watchdog.ps1 -Action watchdog -Port 4000 -Interval 30
```

---

### Scenario 2: Testing Notifications

**Goal**: Verify Slack/Email alerts work

**Recommended**: `simple-watchdog.ps1` or `test-watchdog-notifications.ps1`

**Reason**: Fast setup, easy to trigger failures, clear feedback

**Setup**:

```powershell
# Using simple watchdog
.\simple-watchdog.ps1 -Action watchdog -SlackWebhook "..." -EmailTo "..."

# Using test script
.\test-watchdog-notifications.ps1 -TestSlack -TestEmail -SlackWebhook "..." -EmailTo "..."
```

---

### Scenario 3: Production Deployment

**Goal**: Reliable 24/7 monitoring with alerts

**Recommended**: `backend-watchdog.ps1`

**Reason**: Retry thresholds, alert levels, detailed logging, production features

**Setup**:

```powershell
.\backend-watchdog.ps1 `
    -Port 4000 `
    -CheckInterval 60 `
    -MaxRetries 3 `
    -UsePM2 $true `
    -SlackWebhook $env:SLACK_WEBHOOK `
    -EmailTo "ops@advancia.com" `
    -SmtpServer "smtp.gmail.com" `
    -SmtpPort 587 `
    -FromEmail "alerts@advancia.com" `
    -SmtpUsername "alerts@advancia.com" `
    -SmtpPassword $env:SMTP_PASSWORD
```

---

### Scenario 4: Complete Backend Automation

**Goal**: Manage database, PM2, monitoring, and development tasks

**Recommended**: `backend-tools.ps1`

**Reason**: All operations in one script, consistent interface

**Setup**:

```powershell
# Daily operations
.\backend-tools.ps1 -Action migrate
.\backend-tools.ps1 -Action restart
.\backend-tools.ps1 -Action watchdog-start

# Development
.\backend-tools.ps1 -Action dev
.\backend-tools.ps1 -Action test
.\backend-tools.ps1 -Action lint

# Maintenance
.\backend-tools.ps1 -Action backup
.\backend-tools.ps1 -Action pm2-status
```

---

### Scenario 5: CI/CD Pipeline

**Goal**: Automated deployment and monitoring

**Recommended**: `backend-tools.ps1` + `backend-watchdog.ps1`

**Reason**: Scriptable operations, production monitoring

**Setup**:

```powershell
# In CI/CD script
.\backend-tools.ps1 -Action migrate
.\backend-tools.ps1 -Action pm2-restart
.\backend-tools.ps1 -Action watchdog-start
.\backend-tools.ps1 -Action health
```

---

## 🔄 Migration Paths

### Path 1: From Nothing → Simple Watchdog

```powershell
# Step 1: Install PM2
npm install -g pm2

# Step 2: Start backend with PM2
cd backend
pm2 start src\index.js --name advancia-backend

# Step 3: Run simple watchdog
cd ..
.\simple-watchdog.ps1 -Action watchdog
```

**Time**: 5 minutes

---

### Path 2: Simple Watchdog → Full Watchdog

```powershell
# Step 1: Stop simple watchdog
# Press Ctrl+C

# Step 2: Configure full watchdog
Copy-Item watchdog-config.template.ps1 watchdog-config.ps1
# Edit watchdog-config.ps1 with your settings

# Step 3: Start full watchdog
. .\watchdog-config.ps1
.\backend-watchdog.ps1 @WatchdogConfig
```

**Time**: 10 minutes

---

### Path 3: Any Watchdog → Backend Tools Integration

```powershell
# Step 1: Stop current watchdog
# Ctrl+C or .\backend-tools.ps1 -Action watchdog-stop

# Step 2: Use backend-tools to manage watchdog
.\backend-tools.ps1 -Action watchdog-start

# Step 3: Check status
.\backend-tools.ps1 -Action watchdog-status

# Step 4: Use other backend-tools features
.\backend-tools.ps1 -Action migrate
.\backend-tools.ps1 -Action pm2-status
```

**Time**: 2 minutes

---

## 📈 Scalability Considerations

### Small Projects (1-5 developers)

**Recommended**: `simple-watchdog.ps1`

- Fast setup
- Minimal overhead
- Easy to understand
- Sufficient for small teams

### Medium Projects (5-20 developers)

**Recommended**: `backend-tools.ps1` + `backend-watchdog.ps1`

- Unified tooling
- Professional monitoring
- Team collaboration features
- Scalable as project grows

### Large Projects (20+ developers)

**Recommended**: `backend-tools.ps1` + `backend-watchdog.ps1` + External Monitoring

- Professional-grade automation
- Comprehensive monitoring
- Integration with external tools (Grafana, Prometheus, PagerDuty)
- Audit trails and compliance

---

## 🔧 Maintenance Complexity

### simple-watchdog.ps1

- **Maintenance**: ⭐ Low
- **Updates**: Rare
- **Customization**: Easy (single file)
- **Debugging**: Simple
- **Learning Curve**: Minimal

### backend-watchdog.ps1

- **Maintenance**: ⭐⭐ Medium
- **Updates**: Occasional
- **Customization**: Moderate (multiple functions)
- **Debugging**: Detailed logs help
- **Learning Curve**: Moderate

### backend-tools.ps1

- **Maintenance**: ⭐⭐⭐ Higher
- **Updates**: Regular (many features)
- **Customization**: Complex (many actions)
- **Debugging**: Comprehensive logs
- **Learning Curve**: Steeper

---

## 💰 Cost Considerations

### Development Time

| Script               | Initial Setup | Configuration | Testing | Total      |
| -------------------- | ------------- | ------------- | ------- | ---------- |
| simple-watchdog.ps1  | 2 min         | 3 min         | 2 min   | **7 min**  |
| backend-watchdog.ps1 | 5 min         | 10 min        | 5 min   | **20 min** |
| backend-tools.ps1    | 10 min        | 15 min        | 10 min  | **35 min** |

### Operational Overhead

| Script               | Daily Monitoring | Weekly Maintenance | Monthly Review |
| -------------------- | ---------------- | ------------------ | -------------- |
| simple-watchdog.ps1  | 5 min            | 10 min             | 30 min         |
| backend-watchdog.ps1 | 2 min            | 5 min              | 15 min         |
| backend-tools.ps1    | 1 min            | 3 min              | 10 min         |

**Key Insight**: More complex tools have higher initial cost but lower operational overhead.

---

## 🎓 Learning Resources

### For simple-watchdog.ps1

- [SIMPLE_WATCHDOG.md](./SIMPLE_WATCHDOG.md)
- Script comments (inline documentation)

### For backend-watchdog.ps1

- [WATCHDOG_NOTIFICATIONS.md](./WATCHDOG_NOTIFICATIONS.md)
- [WATCHDOG_QUICK_START.md](./WATCHDOG_QUICK_START.md)
- [WATCHDOG_IMPLEMENTATION.md](./WATCHDOG_IMPLEMENTATION.md)

### For backend-tools.ps1

- Built-in help: `.\backend-tools.ps1 -Action help`
- Script header documentation
- All watchdog docs (manages watchdog scripts)

---

## 🚀 Quick Decision Flowchart

```
START
  |
  +--> Need database/PM2/dev tools?
       |
       +-- YES --> Use backend-tools.ps1
       |
       +-- NO --> Continue
                  |
                  +--> Need production monitoring?
                       |
                       +-- YES --> Use backend-watchdog.ps1
                       |
                       +-- NO --> Need quick/simple monitoring?
                                  |
                                  +-- YES --> Use simple-watchdog.ps1
                                  |
                                  +-- NO --> Maybe you don't need monitoring?
```

---

## 📝 Summary Table

| Criteria           | simple-watchdog.ps1 | backend-watchdog.ps1 | backend-tools.ps1        |
| ------------------ | ------------------- | -------------------- | ------------------------ |
| **Setup Time**     | 2 min ⚡            | 5 min ⚡⚡           | 10 min ⚡⚡⚡            |
| **Features**       | Basic ⭐            | Advanced ⭐⭐⭐      | Comprehensive ⭐⭐⭐⭐⭐ |
| **Complexity**     | Low 😊              | Medium 😐            | High 🤓                  |
| **Best For**       | Dev/Testing         | Production           | Automation               |
| **Notifications**  | ✅ Basic            | ✅ Rich              | ❌ (via watchdog)        |
| **DB Operations**  | ❌                  | ❌                   | ✅ Yes                   |
| **PM2 Management** | ✅ Restart          | ✅ Advanced          | ✅ Full control          |
| **Monitoring**     | ✅ Simple           | ✅ Advanced          | ✅ Via watchdog          |

---

## 🎯 Final Recommendation

**For most users**: Start with `simple-watchdog.ps1` to learn the system, then migrate to `backend-tools.ps1` + `backend-watchdog.ps1` for production.

**Quick Decision**:

- **I want it working NOW** → `simple-watchdog.ps1`
- **I want production-ready** → `backend-watchdog.ps1`
- **I want everything automated** → `backend-tools.ps1`
