# 🔔 Watchdog Notification System Guide

The enhanced `backend-watchdog.ps1` now includes a comprehensive notification system that alerts you via **Slack** and **Email** whenever the backend fails health checks and is automatically restarted.

---

## 📋 Table of Contents

- [Features](#features)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Notification Types](#notification-types)
- [Slack Setup](#slack-setup)
- [Email Setup](#email-setup)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## ✨ Features

### Automated Alerts

- **Slack Notifications**: Rich formatted messages with color-coded severity
- **Email Notifications**: Detailed HTML emails for critical failures
- **Multi-Channel**: Send to both Slack and Email simultaneously
- **Smart Filtering**: Emails only sent for error/critical level alerts

### Alert Content

- Health check failure details
- Auto-restart status (success/failure)
- Real-time statistics (uptime, checks, restarts, success rate)
- Timestamp and port information
- Formatted for easy reading

### Alert Levels

- **Success**: Backend successfully restarted
- **Info**: General informational messages
- **Warning**: Non-critical issues detected
- **Error**: Health check failures requiring restart
- **Critical**: Restart failures requiring manual intervention

---

## ⚙️ Configuration

### Parameters

```powershell
.\backend-watchdog.ps1 `
    -Port 4000 `
    -CheckInterval 60 `
    -MaxRetries 3 `
    -UsePM2 $true `
    -SlackWebhook "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" `
    -EmailTo "alerts@advancia.com" `
    -SmtpServer "smtp.gmail.com" `
    -SmtpPort "587" `
    -FromEmail "noreply@advancia.com" `
    -SmtpUsername "your-email@gmail.com" `
    -SmtpPassword "your-app-password"
```

### Parameter Details

| Parameter       | Type   | Default           | Description                    |
| --------------- | ------ | ----------------- | ------------------------------ |
| `Port`          | int    | 4000              | Backend server port to monitor |
| `CheckInterval` | int    | 60                | Seconds between health checks  |
| `MaxRetries`    | int    | 3                 | Failed checks before restart   |
| `UsePM2`        | bool   | true              | Use PM2 for restarts           |
| `LogFile`       | string | logs\watchdog.log | Log file path                  |
| `SlackWebhook`  | string | ""                | Slack incoming webhook URL     |
| `EmailTo`       | string | ""                | Alert recipient email          |
| `SmtpServer`    | string | ""                | SMTP server hostname           |
| `SmtpPort`      | string | "587"             | SMTP server port               |
| `FromEmail`     | string | ""                | Sender email address           |
| `SmtpUsername`  | string | ""                | SMTP authentication username   |
| `SmtpPassword`  | string | ""                | SMTP authentication password   |

---

## 🚀 Usage Examples

### 1. Basic Watchdog (No Notifications)

```powershell
.\backend-watchdog.ps1 -Port 4000 -CheckInterval 60
```

### 2. Slack Notifications Only

```powershell
.\backend-watchdog.ps1 `
    -Port 4000 `
    -CheckInterval 60 `
    -SlackWebhook "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX"
```

### 3. Email Notifications Only (Gmail)

```powershell
.\backend-watchdog.ps1 `
    -Port 4000 `
    -CheckInterval 60 `
    -EmailTo "admin@advancia.com" `
    -SmtpServer "smtp.gmail.com" `
    -SmtpPort "587" `
    -FromEmail "noreply@advancia.com" `
    -SmtpUsername "your-email@gmail.com" `
    -SmtpPassword "your-app-password"
```

### 4. Full Notification Suite (Slack + Email)

```powershell
.\backend-watchdog.ps1 `
    -Port 4000 `
    -CheckInterval 60 `
    -MaxRetries 3 `
    -SlackWebhook "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX" `
    -EmailTo "admin@advancia.com" `
    -SmtpServer "smtp.gmail.com" `
    -SmtpPort "587" `
    -FromEmail "noreply@advancia.com" `
    -SmtpUsername "your-email@gmail.com" `
    -SmtpPassword "your-app-password"
```

### 5. Production Configuration with Secure Credentials

```powershell
# Store sensitive data in environment variables
$env:SLACK_WEBHOOK = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
$env:SMTP_PASSWORD = "your-app-password"

.\backend-watchdog.ps1 `
    -Port 4000 `
    -CheckInterval 30 `
    -MaxRetries 3 `
    -SlackWebhook $env:SLACK_WEBHOOK `
    -EmailTo "admin@advancia.com" `
    -SmtpServer "smtp.gmail.com" `
    -SmtpPort "587" `
    -FromEmail "noreply@advancia.com" `
    -SmtpUsername "your-email@gmail.com" `
    -SmtpPassword $env:SMTP_PASSWORD
```

---

## 📬 Notification Types

### Slack Message Format

```
🔔 Advancia Backend Watchdog Alert

Backend health check failed 3 times. Auto-restart initiated.

Statistics:
• Uptime: 02h 15m 43s
• Total Checks: 135
• Total Restarts: 2
• Success Rate: 98.52%
• Port: 4000
```

### Email Format (Critical Alerts Only)

```
Subject: 🚨 Advancia Backend Alert - error

Advancia Backend Watchdog Alert
================================

Level: error
Time: 2025-11-14 14:32:15
Port: 4000

Message:
Backend health check failed 3 times. Auto-restart initiated.

Statistics:
- Uptime: 02h 15m 43s
- Total Checks: 135
- Total Restarts: 2
- Success Rate: 98.52%
- Port: 4000

This is an automated message from Advancia Backend Watchdog.
To stop receiving these alerts, please resolve the backend issue or stop the watchdog service.
```

---

## 📱 Slack Setup

### Step 1: Create Incoming Webhook

1. Go to your Slack workspace settings
2. Navigate to **Apps** → **Custom Integrations** → **Incoming Webhooks**
3. Click **Add to Slack**
4. Select the channel for notifications (e.g., `#alerts`, `#backend-monitoring`)
5. Copy the webhook URL (looks like: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`)

### Step 2: Test Webhook

```powershell
# Test your Slack webhook
$webhook = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
$body = @{ text = "Test notification from Advancia watchdog" } | ConvertTo-Json
Invoke-RestMethod -Uri $webhook -Method Post -ContentType 'application/json' -Body $body
```

### Step 3: Configure Watchdog

```powershell
.\backend-watchdog.ps1 -Port 4000 -SlackWebhook "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### Message Colors

- 🟢 **Green (good)**: Success messages
- 🟡 **Yellow (warning)**: Warning messages
- 🔴 **Red (danger)**: Error/Critical messages
- 🔵 **Blue (#439FE0)**: Info messages

---

## 📧 Email Setup

### Gmail Configuration

#### Step 1: Enable 2-Factor Authentication

1. Go to Google Account settings
2. Navigate to **Security**
3. Enable **2-Step Verification**

#### Step 2: Create App Password

1. In Security settings, go to **2-Step Verification**
2. Scroll to **App passwords**
3. Select **Mail** and your device
4. Copy the 16-character app password

#### Step 3: Configure Watchdog

```powershell
.\backend-watchdog.ps1 `
    -Port 4000 `
    -EmailTo "admin@advancia.com" `
    -SmtpServer "smtp.gmail.com" `
    -SmtpPort "587" `
    -FromEmail "noreply@advancia.com" `
    -SmtpUsername "your-email@gmail.com" `
    -SmtpPassword "your-16-char-app-password"
```

### Other SMTP Providers

#### Outlook/Office 365

```powershell
-SmtpServer "smtp-mail.outlook.com" `
-SmtpPort "587"
```

#### Yahoo Mail

```powershell
-SmtpServer "smtp.mail.yahoo.com" `
-SmtpPort "587"
```

#### SendGrid

```powershell
-SmtpServer "smtp.sendgrid.net" `
-SmtpPort "587" `
-SmtpUsername "apikey" `
-SmtpPassword "your-sendgrid-api-key"
```

#### Amazon SES

```powershell
-SmtpServer "email-smtp.us-east-1.amazonaws.com" `
-SmtpPort "587" `
-SmtpUsername "your-ses-smtp-username" `
-SmtpPassword "your-ses-smtp-password"
```

---

## 🔧 Troubleshooting

### Slack Notifications Not Sending

**Symptom**: Log shows "✗ Slack notification failed"

**Solutions**:

1. Verify webhook URL is correct
2. Test webhook with curl:
   ```powershell
   curl -X POST -H 'Content-type: application/json' --data '{"text":"Test"}' YOUR_WEBHOOK_URL
   ```
3. Check if webhook is still active in Slack settings
4. Ensure network connectivity allows HTTPS outbound

### Email Notifications Not Sending

**Symptom**: Log shows "✗ Email notification failed"

**Solutions**:

1. **Authentication Failed**

   - Gmail: Use App Password, not regular password
   - Verify username/password are correct
   - Check 2FA is enabled for Gmail

2. **Connection Failed**

   - Verify SMTP server and port are correct
   - Check firewall allows port 587 outbound
   - Try port 465 with SSL if 587 fails

3. **SSL/TLS Issues**

   - Ensure `-UseSsl $true` is set
   - Try different ports (465, 587, 2525)

4. **Test Email Manually**
   ```powershell
   Send-MailMessage `
       -To "recipient@example.com" `
       -From "sender@example.com" `
       -Subject "Test" `
       -Body "Test message" `
       -SmtpServer "smtp.gmail.com" `
       -Port 587 `
       -UseSsl `
       -Credential (Get-Credential)
   ```

### No Notifications at All

**Solutions**:

1. Check if parameters are passed correctly:
   ```powershell
   Write-Host "SlackWebhook: $SlackWebhook"
   Write-Host "EmailTo: $EmailTo"
   ```
2. Verify notification functions are being called (check logs)
3. Ensure alert level triggers notifications (emails only for error/critical)

---

## 🎯 Best Practices

### 1. Security

- **Never commit credentials**: Use environment variables or secure vaults
- **Rotate credentials**: Change SMTP passwords regularly
- **Use app passwords**: Don't use main account passwords
- **Limit webhook scope**: Create dedicated Slack channels

### 2. Alert Management

- **Don't over-alert**: Set reasonable `CheckInterval` (30-60 seconds)
- **Test notifications**: Verify all channels before production
- **Monitor alert fatigue**: If restarts are frequent, investigate root cause
- **Set up on-call rotation**: Multiple email recipients for critical alerts

### 3. Production Setup

```powershell
# Create a scheduled task or service wrapper
# Use environment variables for secrets
$env:SLACK_WEBHOOK = "https://hooks.slack.com/services/..."
$env:SMTP_PASSWORD = "app-password"
$env:EMAIL_TO = "oncall@advancia.com"

# Run in background with logging
Start-Process powershell -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", "backend-watchdog.ps1",
    "-Port", "4000",
    "-CheckInterval", "30",
    "-SlackWebhook", $env:SLACK_WEBHOOK,
    "-EmailTo", $env:EMAIL_TO,
    "-SmtpServer", "smtp.gmail.com",
    "-SmtpPort", "587",
    "-FromEmail", "noreply@advancia.com",
    "-SmtpUsername", "alerts@advancia.com",
    "-SmtpPassword", $env:SMTP_PASSWORD
) -WindowStyle Hidden
```

### 4. Monitoring the Watchdog

```powershell
# Check watchdog status via backend-tools.ps1
.\backend-tools.ps1 -Action watchdog-status

# View recent logs
Get-Content backend\logs\watchdog.log -Tail 50

# Monitor in real-time
Get-Content backend\logs\watchdog.log -Wait
```

### 5. Alert Escalation Strategy

- **First 3 failures**: Slack notification (info level)
- **Restart triggered**: Slack + Email (error level)
- **Restart fails**: Slack + Email + SMS (critical level)
- **3+ restarts in 1 hour**: Page on-call engineer

---

## 📊 Statistics Tracked

Every notification includes:

- **Uptime**: Time since watchdog started
- **Total Checks**: Number of health checks performed
- **Total Restarts**: Number of automatic restarts
- **Success Rate**: Percentage of successful health checks
- **Port**: Monitored backend port

---

## 🔗 Integration Examples

### Discord Webhook (Alternative to Slack)

```powershell
# Discord uses different JSON format - modify Send-SlackNotification:
function Send-DiscordNotification {
    param([string]$Message, [string]$Color)

    $payload = @{
        embeds = @(
            @{
                title = "🔔 Advancia Backend Watchdog Alert"
                description = $Message
                color = 15258703  # Orange color
                timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            }
        )
    } | ConvertTo-Json -Depth 4

    Invoke-RestMethod -Uri $DiscordWebhook -Method Post -ContentType 'application/json' -Body $payload
}
```

### PagerDuty Integration

```powershell
# Add to Send-Alert function for critical alerts
if ($Level -eq "critical") {
    $pagerDutyPayload = @{
        routing_key = $env:PAGERDUTY_INTEGRATION_KEY
        event_action = "trigger"
        payload = @{
            summary = $Message
            severity = "critical"
            source = "backend-watchdog"
        }
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "https://events.pagerduty.com/v2/enqueue" -Method Post -ContentType 'application/json' -Body $pagerDutyPayload
}
```

---

## 📝 Logging

### Log Locations

- **Watchdog Log**: `backend/logs/watchdog.log`
- **PM2 Logs**: `~/.pm2/logs/advancia-backend-*.log`
- **Backend Logs**: `backend/logs/error.log`, `backend/logs/combined.log`

### Log Levels

- `INFO`: Normal operations
- `WARN`: Non-critical issues (single health check failure)
- `ERROR`: Critical issues requiring restart
- `SUCCESS`: Successful operations (restarts, recoveries)

---

## 🎉 Summary

The enhanced watchdog system provides:

- ✅ Automatic health monitoring
- ✅ Self-healing auto-restart
- ✅ Multi-channel notifications (Slack + Email)
- ✅ Detailed statistics and reporting
- ✅ Flexible configuration
- ✅ Production-ready security

**Next Steps**:

1. Set up Slack webhook
2. Configure SMTP credentials
3. Test notifications
4. Deploy to production
5. Monitor and adjust thresholds

For questions or issues, check the main [OPS_PLAYBOOK.md](./OPS_PLAYBOOK.md) or consult the [backend-tools.ps1](./backend-tools.ps1) source code.
