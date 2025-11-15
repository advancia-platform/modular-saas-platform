# Simple Watchdog - Quick Reference

## Overview

`simple-watchdog.ps1` is a lightweight, easy-to-use watchdog script for monitoring the Advancia backend. It provides the core functionality of health monitoring, auto-restart, and notifications without the complexity of the full `backend-watchdog.ps1` implementation.

---

## Quick Start

### Basic Usage (No Notifications)

```powershell
.\simple-watchdog.ps1 -Action watchdog
```

- Monitors backend on port 4000
- Checks every 60 seconds
- Logs to `~\backend-watchdog.log`
- Auto-restarts on failure

### With Custom Log File

```powershell
.\simple-watchdog.ps1 -Action watchdog -LogFile "C:\logs\backend.log"
```

### With Slack Notifications

```powershell
.\simple-watchdog.ps1 -Action watchdog -SlackWebhook "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### With Email Notifications (Gmail)

```powershell
.\simple-watchdog.ps1 -Action watchdog `
    -EmailTo "admin@advancia.com" `
    -SmtpServer "smtp.gmail.com" `
    -SmtpPort 587 `
    -FromEmail "noreply@advancia.com" `
    -SmtpUsername "your-email@gmail.com" `
    -SmtpPassword "your-app-password"
```

### Full Configuration

```powershell
.\simple-watchdog.ps1 -Action watchdog `
    -Port 4000 `
    -Interval 60 `
    -LogFile "C:\logs\watchdog.log" `
    -SlackWebhook "https://hooks.slack.com/services/..." `
    -EmailTo "admin@advancia.com" `
    -SmtpServer "smtp.gmail.com" `
    -SmtpPort 587 `
    -FromEmail "noreply@advancia.com" `
    -SmtpUsername "your-email@gmail.com" `
    -SmtpPassword "your-app-password"
```

---

## Parameters

| Parameter        | Type   | Default                | Description                          |
| ---------------- | ------ | ---------------------- | ------------------------------------ |
| **Action**       | string | watchdog               | Action to perform (watchdog or help) |
| **Port**         | int    | 4000                   | Backend port to monitor              |
| **Interval**     | int    | 60                     | Seconds between health checks        |
| **LogFile**      | string | ~\backend-watchdog.log | Path to log file                     |
| **SlackWebhook** | string | ""                     | Slack webhook URL (optional)         |
| **EmailTo**      | string | ""                     | Email recipient (optional)           |
| **SmtpServer**   | string | ""                     | SMTP server hostname                 |
| **SmtpPort**     | int    | 587                    | SMTP port                            |
| **FromEmail**    | string | ""                     | Sender email address                 |
| **SmtpUsername** | string | ""                     | SMTP auth username                   |
| **SmtpPassword** | string | ""                     | SMTP auth password                   |

---

## Features

### ✅ Included

- **Health Monitoring**: Checks `/api/health` endpoint
- **Auto-Restart**: Uses PM2 to restart backend on failure
- **Logging**: All events written to log file with timestamps
- **Slack Notifications**: Optional webhook integration
- **Email Alerts**: Optional SMTP notifications
- **Statistics Tracking**: Uptime, check count, restart count
- **Graceful Shutdown**: Ctrl+C handler with summary stats
- **Colored Console Output**: Easy-to-read status messages

### ❌ Not Included (Use `backend-watchdog.ps1` Instead)

- Advanced PM2 management options
- Configurable retry thresholds
- Multiple failure tracking
- Detailed statistics dashboard
- Background execution mode
- PID tracking and process management
- Alert system placeholders for SMS/PagerDuty

---

## Comparison: Simple vs Full Watchdog

| Feature                 | simple-watchdog.ps1  | backend-watchdog.ps1                           |
| ----------------------- | -------------------- | ---------------------------------------------- |
| **Lines of Code**       | ~400                 | ~450                                           |
| **Complexity**          | Low                  | Medium                                         |
| **Setup Time**          | 2 minutes            | 5 minutes                                      |
| **Health Checks**       | ✅                   | ✅                                             |
| **Auto-Restart**        | ✅                   | ✅                                             |
| **Logging**             | ✅                   | ✅                                             |
| **Slack Notifications** | ✅                   | ✅ (Rich formatting)                           |
| **Email Notifications** | ✅                   | ✅ (Detailed templates)                        |
| **Statistics**          | Basic                | Comprehensive                                  |
| **Retry Threshold**     | Immediate            | Configurable (default: 3)                      |
| **PM2 Integration**     | Basic                | Advanced                                       |
| **Background Mode**     | Manual               | Built-in                                       |
| **Process Management**  | No                   | Yes (PID tracking)                             |
| **Alert Levels**        | Single               | Multiple (success/info/warning/error/critical) |
| **Best For**            | Quick setup, testing | Production, long-term monitoring               |

---

## When to Use

### Use `simple-watchdog.ps1` If:

- ✅ You want quick setup (< 5 minutes)
- ✅ You need basic monitoring and restart
- ✅ You're testing the notification system
- ✅ You prefer a single-file solution
- ✅ You don't need advanced statistics

### Use `backend-watchdog.ps1` If:

- ✅ You need production-grade monitoring
- ✅ You want configurable retry thresholds
- ✅ You need detailed statistics and reporting
- ✅ You want alert level filtering
- ✅ You need background execution
- ✅ You want PID tracking

---

## Log File Format

```
2025-11-14 14:32:15 - ==========================================
2025-11-14 14:32:15 - Watchdog starting (interval: 60 seconds)
2025-11-14 14:32:15 - Monitoring: http://localhost:4000/api/health
2025-11-14 14:32:15 - ==========================================
2025-11-14 14:32:15 - Health check passed (1)
2025-11-14 14:33:15 - Health check passed (2)
2025-11-14 14:34:15 - ALERT: Health check failed on port 4000
2025-11-14 14:34:15 - Error: Unable to connect to the remote server
2025-11-14 14:34:15 - Attempting restart (1)...
2025-11-14 14:34:15 - Executing: pm2 restart advancia-backend
2025-11-14 14:34:18 - Backend restarted successfully via PM2
2025-11-14 14:34:18 - ✓ Slack notification sent
2025-11-14 14:34:19 - ✓ Email notification sent to admin@advancia.com
2025-11-14 14:34:29 - Health check passed (3)
```

---

## Notification Examples

### Slack Message

```
🔔 Advancia Backend Alert

Health check failed on port 4000. Restarting backend...

Statistics:
- Uptime: 02h 15m 43s
- Total Checks: 135
- Total Restarts: 2
- Time: 2025-11-14 14:34:15

Error: Unable to connect to the remote server
```

### Email

```
Subject: 🚨 Backend Alert - Health Check Failed

Health check failed on port 4000. Restarting backend...

Statistics:
- Uptime: 02h 15m 43s
- Total Checks: 135
- Total Restarts: 2
- Time: 2025-11-14 14:34:15

Error: Unable to connect to the remote server
```

---

## Common Configurations

### Development Environment

```powershell
.\simple-watchdog.ps1 -Action watchdog -Port 4000 -Interval 30
```

### Production (Slack Only)

```powershell
.\simple-watchdog.ps1 -Action watchdog `
    -Port 4000 `
    -Interval 60 `
    -LogFile "C:\production\logs\watchdog.log" `
    -SlackWebhook $env:SLACK_WEBHOOK
```

### Production (Email Only)

```powershell
.\simple-watchdog.ps1 -Action watchdog `
    -Port 4000 `
    -Interval 60 `
    -LogFile "C:\production\logs\watchdog.log" `
    -EmailTo "ops@advancia.com" `
    -SmtpServer "smtp.sendgrid.net" `
    -SmtpPort 587 `
    -FromEmail "alerts@advancia.com" `
    -SmtpUsername "apikey" `
    -SmtpPassword $env:SENDGRID_API_KEY
```

### Production (Full Alerts)

```powershell
.\simple-watchdog.ps1 -Action watchdog `
    -Port 4000 `
    -Interval 60 `
    -LogFile "C:\production\logs\watchdog.log" `
    -SlackWebhook $env:SLACK_WEBHOOK `
    -EmailTo "ops@advancia.com" `
    -SmtpServer "smtp.gmail.com" `
    -SmtpPort 587 `
    -FromEmail "alerts@advancia.com" `
    -SmtpUsername "alerts@advancia.com" `
    -SmtpPassword $env:SMTP_PASSWORD
```

---

## Tips & Best Practices

### 1. Use Environment Variables

```powershell
$env:SLACK_WEBHOOK = "https://hooks.slack.com/services/..."
$env:SMTP_PASSWORD = "your-app-password"

.\simple-watchdog.ps1 -Action watchdog `
    -SlackWebhook $env:SLACK_WEBHOOK `
    -EmailTo "admin@advancia.com" `
    -SmtpServer "smtp.gmail.com" `
    -SmtpPort 587 `
    -FromEmail "noreply@advancia.com" `
    -SmtpUsername "noreply@advancia.com" `
    -SmtpPassword $env:SMTP_PASSWORD
```

### 2. Run in Background

```powershell
Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File simple-watchdog.ps1 -Action watchdog -Port 4000" -WindowStyle Hidden
```

### 3. Monitor Log in Real-Time

```powershell
Get-Content "$env:USERPROFILE\backend-watchdog.log" -Wait -Tail 20
```

### 4. Verify PM2 is Available

```powershell
pm2 --version
# If not installed: npm install -g pm2
```

### 5. Test Notifications First

```powershell
# Test Slack
Invoke-RestMethod -Uri "YOUR_WEBHOOK" -Method Post -ContentType 'application/json' -Body '{"text":"Test"}'

# Test Email
Send-MailMessage -To "test@example.com" -From "sender@example.com" -Subject "Test" -Body "Test" -SmtpServer "smtp.gmail.com" -Port 587 -UseSsl -Credential (Get-Credential)
```

---

## Troubleshooting

### Watchdog Won't Start

**Problem**: Script errors on startup
**Solution**:

- Check PowerShell execution policy: `Get-ExecutionPolicy`
- Set if needed: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Verify PM2 is installed: `pm2 --version`

### Notifications Not Sending

**Problem**: No Slack/Email alerts received
**Solution**:

- Verify webhook URL is correct (Slack)
- Check SMTP credentials (Email)
- Test manually (see tips above)
- Check log file for error messages

### Health Checks Always Fail

**Problem**: Continuous restart loops
**Solution**:

- Verify backend is actually running: `pm2 status`
- Check correct port: `netstat -ano | findstr :4000`
- Test health endpoint manually: `curl http://localhost:4000/api/health`
- Check backend logs: `pm2 logs advancia-backend`

### Log File Permission Denied

**Problem**: Can't write to log file
**Solution**:

- Use a path you have write access to
- Try `$env:USERPROFILE\watchdog.log` (user home directory)
- Or `.\watchdog.log` (current directory)

---

## Migration Path

### From No Monitoring → Simple Watchdog

1. Install PM2: `npm install -g pm2`
2. Start backend with PM2: `pm2 start backend\src\index.js --name advancia-backend`
3. Run simple watchdog: `.\simple-watchdog.ps1 -Action watchdog`

### From Simple Watchdog → Full Watchdog

1. Stop simple watchdog (Ctrl+C)
2. Configure `watchdog-config.ps1` with your settings
3. Start full watchdog: `.\backend-tools.ps1 -Action watchdog-start`

---

## Summary

`simple-watchdog.ps1` provides:

- ✅ Quick 2-minute setup
- ✅ Essential monitoring features
- ✅ Slack & Email notifications
- ✅ File logging with timestamps
- ✅ Single-file simplicity

Perfect for:

- 🎯 Quick testing
- 🎯 Development environments
- 🎯 Learning the system
- 🎯 Small deployments

For production environments with advanced needs, upgrade to `backend-watchdog.ps1`.

---

**Related Documentation**:

- [WATCHDOG_NOTIFICATIONS.md](./WATCHDOG_NOTIFICATIONS.md) - Complete watchdog guide
- [WATCHDOG_QUICK_START.md](./WATCHDOG_QUICK_START.md) - Full watchdog quick start
- [WATCHDOG_IMPLEMENTATION.md](./WATCHDOG_IMPLEMENTATION.md) - Implementation overview
