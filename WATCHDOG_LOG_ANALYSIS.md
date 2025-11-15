# Watchdog Log Analysis Guide

Comprehensive guide for analyzing watchdog logs and generating daily summaries.

---

## 📊 Overview

`parse-watchdog.ps1` analyzes watchdog logs to provide:

- Daily restart counts
- Health check statistics
- Uptime percentages
- Failure patterns
- Trend analysis
- Recommendations

---

## 🚀 Quick Start

### Basic Usage

```powershell
.\parse-watchdog.ps1
```

Shows summary for last 7 days.

### Custom Date Range

```powershell
.\parse-watchdog.ps1 -Days 30     # Last 30 days
.\parse-watchdog.ps1 -Days 0      # All available data
```

### Export to CSV

```powershell
.\parse-watchdog.ps1 -ExportCsv "summary.csv"
```

### Detailed Analysis

```powershell
.\parse-watchdog.ps1 -ShowDetails
```

Shows failure breakdown and recent errors.

---

## 📋 Example Output

### Daily Summary

```
═══════════════════════════════════════════════════════
  Daily Summary
═══════════════════════════════════════════════════════

Date        Restarts HealthChecks Failures Critical Uptime % Status
----        -------- ------------ -------- -------- -------- ------
2025-11-14  2        120          3        0        97.56    Good
2025-11-13  0        144          0        0        100.00   Excellent
2025-11-12  1        138          2        0        98.57    Good
2025-11-11  0        144          0        0        100.00   Excellent
2025-11-10  3        132          5        1        96.35    Good
2025-11-09  1        140          2        0        98.59    Good
2025-11-08  0        144          0        0        100.00   Excellent
```

### Overall Statistics

```
═══════════════════════════════════════════════════════
  Overall Statistics
═══════════════════════════════════════════════════════

Date Range              : 2025-11-08 to 2025-11-14
Total Days              : 7
Total Restarts          : 7
Total Health Checks     : 962
Total Failures          : 12
Critical Issues         : 1
Average Daily Uptime %  : 98.72
Overall Uptime %        : 98.77
Restarts per Day        : 1.00

Health Status: VERY GOOD (99%+)
```

### Days with Restarts

```
═══════════════════════════════════════════════════════
  Days with Restarts
═══════════════════════════════════════════════════════

Date        Restarts HealthChecks Failures Critical Uptime % Status
----        -------- ------------ -------- -------- -------- ------
2025-11-10  3        132          5        1        96.35    Good
2025-11-14  2        120          3        0        97.56    Good
2025-11-12  1        138          2        0        98.57    Good
2025-11-09  1        140          2        0        98.59    Good
```

### Recommendations

```
═══════════════════════════════════════════════════════
  Recommendations
═══════════════════════════════════════════════════════

ℹ️  System health is good. Continue monitoring.
  • Review daily summaries for trends
  • Investigate any unusual restart patterns
```

---

## 🎯 Use Cases

### 1. Daily Health Check

```powershell
# Run every morning
.\parse-watchdog.ps1 -Days 1
```

### 2. Weekly Review

```powershell
# Run every Monday
.\parse-watchdog.ps1 -Days 7 -ExportCsv "weekly-$(Get-Date -Format 'yyyy-MM-dd').csv"
```

### 3. Monthly Report

```powershell
# End of month summary
.\parse-watchdog.ps1 -Days 30 -ExportCsv "monthly-$(Get-Date -Format 'yyyy-MM').csv"
```

### 4. Incident Investigation

```powershell
# Detailed analysis with failure breakdown
.\parse-watchdog.ps1 -Days 0 -ShowDetails
```

### 5. Historical Analysis

```powershell
# Analyze all available data
.\parse-watchdog.ps1 -Days 0
```

---

## 🤖 Automation Examples

### 1. Scheduled Task (Daily Email)

```powershell
# Create script: send-daily-summary.ps1
param([string]$EmailTo = "admin@advancia.com")

# Generate summary
$summary = .\parse-watchdog.ps1 -Days 1 | Out-String

# Send email
Send-MailMessage `
    -To $EmailTo `
    -From "watchdog@advancia.com" `
    -Subject "Daily Backend Health Summary - $(Get-Date -Format 'yyyy-MM-dd')" `
    -Body $summary `
    -SmtpServer "smtp.gmail.com" `
    -Port 587 `
    -UseSsl `
    -Credential (Get-Credential)

# Schedule with Task Scheduler
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-File C:\path\to\send-daily-summary.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 8AM
Register-ScheduledTask -Action $action -Trigger $trigger `
    -TaskName "Watchdog Daily Summary" -Description "Send daily backend health summary"
```

### 2. Weekly CSV Export

```powershell
# Create script: weekly-export.ps1
$date = Get-Date -Format "yyyy-MM-dd"
$csvPath = "C:\reports\watchdog-weekly-$date.csv"

.\parse-watchdog.ps1 -Days 7 -ExportCsv $csvPath

# Optional: Upload to cloud storage or share
# Copy-Item $csvPath -Destination "\\server\reports\"

# Schedule for every Monday at 9 AM
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-File C:\path\to\weekly-export.ps1"
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 9AM
Register-ScheduledTask -Action $action -Trigger $trigger `
    -TaskName "Watchdog Weekly Export"
```

### 3. Slack Integration

```````powershell
# Create script: slack-summary.ps1
param([string]$WebhookUrl = $env:SLACK_WEBHOOK)

# Generate summary
$output = .\parse-watchdog.ps1 -Days 1 | Out-String

# Format for Slack
$message = @{
    text = "📊 *Daily Backend Health Summary*"
    attachments = @(
        @{
            text = "``````$output``````"
            color = "good"
        }
    )
} | ConvertTo-Json -Depth 4

# Send to Slack
Invoke-RestMethod -Uri $WebhookUrl -Method Post `
    -ContentType 'application/json' -Body $message

# Schedule daily at 8 AM
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-File C:\path\to\slack-summary.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 8AM
Register-ScheduledTask -Action $action -Trigger $trigger `
    -TaskName "Watchdog Slack Summary"
```````

### 4. Alert on Poor Performance

```powershell
# Create script: alert-on-issues.ps1
$tempFile = [System.IO.Path]::GetTempFileName()
.\parse-watchdog.ps1 -Days 1 | Out-File $tempFile

$content = Get-Content $tempFile -Raw

# Check for poor performance indicators
if ($content -like "*POOR*" -or $content -like "*Averaging more than*") {
    # Send alert
    $subject = "🚨 Backend Health Alert - $(Get-Date -Format 'yyyy-MM-dd')"
    Send-MailMessage `
        -To "ops@advancia.com" `
        -From "watchdog@advancia.com" `
        -Subject $subject `
        -Body $content `
        -SmtpServer "smtp.gmail.com" `
        -Port 587 `
        -UseSsl `
        -Credential (Get-Credential)
}

Remove-Item $tempFile

# Run every 6 hours
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-File C:\path\to\alert-on-issues.ps1"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Hours 6)
Register-ScheduledTask -Action $action -Trigger $trigger `
    -TaskName "Watchdog Health Alert"
```

---

## 📈 Interpreting Results

### Uptime Percentages

| Uptime %     | Status    | Action                  |
| ------------ | --------- | ----------------------- |
| **99.9%+**   | Excellent | Continue monitoring     |
| **99-99.9%** | Very Good | Minor optimization      |
| **95-99%**   | Good      | Review trends           |
| **90-95%**   | Fair      | Investigate issues      |
| **<90%**     | Poor      | Immediate action needed |

### Restart Patterns

| Restarts/Day | Status     | Action        |
| ------------ | ---------- | ------------- |
| **0**        | Perfect    | Continue      |
| **<0.5**     | Good       | Monitor       |
| **0.5-1**    | Acceptable | Review logs   |
| **1-2**      | Concerning | Investigate   |
| **>2**       | Critical   | Immediate fix |

### Failure Types

Common failure patterns:

- **Connection**: Database or network issues
- **Timeout**: Slow responses or deadlocks
- **Port**: Port conflicts or binding issues
- **Database**: Query errors or connection pool exhaustion
- **Other**: Application-level errors

---

## 🔍 Advanced Analysis

### Compare Multiple Log Files

```powershell
# Production vs Development
$prod = .\parse-watchdog.ps1 -LogFile "prod\logs\watchdog.log" -Days 7
$dev = .\parse-watchdog.ps1 -LogFile "dev\logs\watchdog.log" -Days 7

# Export both for comparison
$prod | Export-Csv "prod-summary.csv" -NoTypeInformation
$dev | Export-Csv "dev-summary.csv" -NoTypeInformation
```

### Trend Analysis Over Time

```powershell
# Generate monthly summaries
1..12 | ForEach-Object {
    $month = (Get-Date).AddMonths(-$_).ToString("yyyy-MM")
    $csvPath = "trends\summary-$month.csv"
    .\parse-watchdog.ps1 -Days 30 -ExportCsv $csvPath
}

# Combine for trend analysis
$allMonths = Get-ChildItem "trends\*.csv" | ForEach-Object {
    Import-Csv $_
}

$allMonths | Export-Csv "yearly-trend.csv" -NoTypeInformation
```

### Custom Filtering

```powershell
# Analyze specific date range
$logs = Get-Content "backend\logs\watchdog.log"
$filtered = $logs | Where-Object {
    $_ -match "2025-11-(10|11|12)"
}

$filtered | Set-Content "temp-filtered.log"
.\parse-watchdog.ps1 -LogFile "temp-filtered.log"
Remove-Item "temp-filtered.log"
```

---

## 🛠 Customization

### Modify Alert Thresholds

Edit `parse-watchdog.ps1`:

```powershell
# Change uptime status thresholds
if ($overallUptime -ge 99.9) { "EXCELLENT" }
elseif ($overallUptime -ge 99) { "VERY GOOD" }
elseif ($overallUptime -ge 95) { "GOOD" }
elseif ($overallUptime -ge 90) { "FAIR" }
else { "POOR" }

# Adjust to your needs (e.g., stricter):
if ($overallUptime -ge 99.99) { "EXCELLENT" }
elseif ($overallUptime -ge 99.5) { "VERY GOOD" }
# ...
```

### Add Custom Metrics

```powershell
# Add response time tracking
$avgResponseTime = ($entries | Where-Object {
    $_.Message -match "response time: (\d+)ms"
} | ForEach-Object {
    [int]$matches[1]
} | Measure-Object -Average).Average
```

### Create Dashboard

```powershell
# Generate HTML report
$html = @"
<!DOCTYPE html>
<html>
<head><title>Watchdog Dashboard</title></head>
<body>
<h1>Backend Health Dashboard</h1>
<pre>$($dailySummary | ConvertTo-Html -Fragment)</pre>
</body>
</html>
"@

$html | Out-File "dashboard.html"
Start-Process "dashboard.html"
```

---

## 📊 Integration with Monitoring Tools

### Grafana/Prometheus

```powershell
# Export metrics in Prometheus format
$summary = .\parse-watchdog.ps1 -Days 1 -ExportCsv "temp.csv"
$data = Import-Csv "temp.csv"

$metrics = @"
# HELP backend_uptime_percent Backend uptime percentage
# TYPE backend_uptime_percent gauge
backend_uptime_percent $($data.'Uptime %')

# HELP backend_restarts_total Total number of restarts
# TYPE backend_restarts_total counter
backend_restarts_total $($data.Restarts)
"@

$metrics | Out-File "metrics.prom"
```

### Datadog

```powershell
# Send metrics to Datadog
$apiKey = $env:DATADOG_API_KEY
$summary = .\parse-watchdog.ps1 -Days 1

$metric = @{
    series = @(
        @{
            metric = "backend.uptime"
            points = @(@((Get-Date).ToUniversalTime().Ticks, $summary.'Uptime %'))
            type = "gauge"
            tags = @("env:production", "service:backend")
        }
    )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "https://api.datadoghq.com/api/v1/series?api_key=$apiKey" `
    -Method Post -Body $metric -ContentType "application/json"
```

---

## 🎓 Best Practices

### 1. Regular Reviews

- Run daily summaries every morning
- Review weekly trends every Monday
- Generate monthly reports for stakeholders

### 2. Automated Alerts

- Set up Slack notifications for daily summaries
- Email alerts for uptime below 95%
- SMS alerts for critical issues (3+ restarts/day)

### 3. Log Retention

- Keep daily logs for 30 days
- Archive monthly summaries for 1 year
- Maintain yearly trends indefinitely

### 4. Trend Analysis

- Export weekly/monthly CSVs
- Compare month-over-month metrics
- Identify seasonal patterns

### 5. Documentation

- Document unusual patterns
- Note infrastructure changes
- Track correlation with deployments

---

## 🐛 Troubleshooting

### Log File Not Found

```
❌ Log file not found: backend\logs\watchdog.log
```

**Solution**: Start watchdog first

```powershell
.\backend-tools.ps1 -Action watchdog-start
# Or
.\simple-watchdog.ps1 -Action watchdog
```

### Empty Log File

```
⚠️  Log file is empty. No data to analyze.
```

**Solution**: Wait for watchdog to generate entries

```powershell
# Check if watchdog is running
.\backend-tools.ps1 -Action watchdog-status
```

### No Entries in Date Range

```
⚠️  No entries found in the specified date range.
```

**Solution**: Increase date range or use `-Days 0` for all data

```powershell
.\parse-watchdog.ps1 -Days 0
```

---

## 📝 Summary

`parse-watchdog.ps1` provides:

- ✅ Daily restart and uptime summaries
- ✅ Historical trend analysis
- ✅ Failure pattern detection
- ✅ CSV export for reporting
- ✅ Automated recommendations
- ✅ Detailed failure breakdown

**Perfect for**:

- Daily health reviews
- Weekly team updates
- Monthly stakeholder reports
- Incident investigation
- Performance optimization
- SLA compliance tracking

Run it daily, review trends weekly, and act on recommendations promptly for optimal backend health! 🎉
