# 🚀 Watchdog Quick Start

## Basic Commands

### Start Watchdog (No Notifications)

```powershell
.\backend-watchdog.ps1 -Port 4000
```

### Start with Slack Alerts

```powershell
.\backend-watchdog.ps1 -Port 4000 -SlackWebhook "YOUR_WEBHOOK_URL"
```

### Start with Email Alerts (Gmail)

```powershell
.\backend-watchdog.ps1 `
    -Port 4000 `
    -EmailTo "admin@advancia.com" `
    -SmtpServer "smtp.gmail.com" `
    -SmtpPort "587" `
    -FromEmail "noreply@advancia.com" `
    -SmtpUsername "your-email@gmail.com" `
    -SmtpPassword "your-app-password"
```

### Full Notifications (Slack + Email)

```powershell
.\backend-watchdog.ps1 `
    -Port 4000 `
    -CheckInterval 60 `
    -SlackWebhook "YOUR_WEBHOOK_URL" `
    -EmailTo "admin@advancia.com" `
    -SmtpServer "smtp.gmail.com" `
    -SmtpPort "587" `
    -FromEmail "noreply@advancia.com" `
    -SmtpUsername "your-email@gmail.com" `
    -SmtpPassword "your-app-password"
```

---

## Using backend-tools.ps1

### Start Watchdog

```powershell
.\backend-tools.ps1 -Action watchdog-start
```

### Check Status

```powershell
.\backend-tools.ps1 -Action watchdog-status
```

### Stop Watchdog

```powershell
.\backend-tools.ps1 -Action watchdog-stop
```

---

## Slack Setup (60 seconds)

1. **Create Webhook**:

   - Go to: https://api.slack.com/messaging/webhooks
   - Click "Create New App" → "From scratch"
   - Enable "Incoming Webhooks"
   - Add to channel (e.g., #alerts)
   - Copy webhook URL

2. **Test**:

   ```powershell
   $webhook = "YOUR_WEBHOOK_URL"
   $body = @{ text = "Test from Advancia" } | ConvertTo-Json
   Invoke-RestMethod -Uri $webhook -Method Post -ContentType 'application/json' -Body $body
   ```

3. **Use**:
   ```powershell
   .\backend-watchdog.ps1 -Port 4000 -SlackWebhook $webhook
   ```

---

## Gmail Setup (2 minutes)

1. **Enable 2FA**: Google Account → Security → 2-Step Verification

2. **Create App Password**:

   - Security → 2-Step Verification → App passwords
   - Select "Mail" → Copy 16-char password

3. **Use**:
   ```powershell
   .\backend-watchdog.ps1 `
       -Port 4000 `
       -EmailTo "admin@advancia.com" `
       -SmtpServer "smtp.gmail.com" `
       -SmtpPort "587" `
       -FromEmail "your-email@gmail.com" `
       -SmtpUsername "your-email@gmail.com" `
       -SmtpPassword "16-char-app-password"
   ```

---

## Common SMTP Providers

### Gmail

```powershell
-SmtpServer "smtp.gmail.com" -SmtpPort "587"
```

### Outlook

```powershell
-SmtpServer "smtp-mail.outlook.com" -SmtpPort "587"
```

### SendGrid

```powershell
-SmtpServer "smtp.sendgrid.net" -SmtpPort "587" -SmtpUsername "apikey" -SmtpPassword "YOUR_API_KEY"
```

### Amazon SES

```powershell
-SmtpServer "email-smtp.us-east-1.amazonaws.com" -SmtpPort "587"
```

---

## Environment Variables (Production)

```powershell
# Set once
$env:SLACK_WEBHOOK = "https://hooks.slack.com/services/..."
$env:SMTP_PASSWORD = "your-app-password"
$env:EMAIL_TO = "admin@advancia.com"

# Use in scripts
.\backend-watchdog.ps1 `
    -Port 4000 `
    -SlackWebhook $env:SLACK_WEBHOOK `
    -EmailTo $env:EMAIL_TO `
    -SmtpServer "smtp.gmail.com" `
    -SmtpPort "587" `
    -FromEmail "noreply@advancia.com" `
    -SmtpUsername "noreply@advancia.com" `
    -SmtpPassword $env:SMTP_PASSWORD
```

---

## Alert Levels

| Level        | Slack | Email | Use Case                                   |
| ------------ | ----- | ----- | ------------------------------------------ |
| **success**  | ✅    | ❌    | Backend restarted successfully             |
| **info**     | ✅    | ❌    | General information                        |
| **warning**  | ✅    | ❌    | Single health check failure                |
| **error**    | ✅    | ✅    | Multiple failures, restart initiated       |
| **critical** | ✅    | ✅    | Restart failed, manual intervention needed |

---

## Troubleshooting

### Slack Not Working

```powershell
# Test webhook directly
curl -X POST -H 'Content-type: application/json' --data '{"text":"Test"}' YOUR_WEBHOOK_URL
```

### Email Not Working

```powershell
# Test SMTP manually
Send-MailMessage `
    -To "test@example.com" `
    -From "noreply@advancia.com" `
    -Subject "Test" `
    -Body "Test" `
    -SmtpServer "smtp.gmail.com" `
    -Port 587 `
    -UseSsl `
    -Credential (Get-Credential)
```

### Check Logs

```powershell
# View watchdog log
Get-Content backend\logs\watchdog.log -Tail 50

# Monitor in real-time
Get-Content backend\logs\watchdog.log -Wait
```

---

## Full Documentation

See [WATCHDOG_NOTIFICATIONS.md](./WATCHDOG_NOTIFICATIONS.md) for complete details.
