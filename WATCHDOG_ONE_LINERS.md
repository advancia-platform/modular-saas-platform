# Watchdog Log One-Liners - Quick Reference

Fast PowerShell one-liners for instant log analysis without running full scripts.

---

## 📊 Quick Stats

### Total Restarts

```powershell
Select-String -Path "backend\logs\watchdog.log" -Pattern "restart" | Measure-Object | Select-Object -ExpandProperty Count
```

Output: `3`

### Restarts Today

```powershell
Select-String -Path "backend\logs\watchdog.log" -Pattern "restart" | Where-Object { $_ -match (Get-Date -Format "yyyy-MM-dd") } | Measure-Object | Select-Object -ExpandProperty Count
```

Output: `1`

### Total Health Checks

```powershell
Select-String -Path "backend\logs\watchdog.log" -Pattern "Health check passed|Healthy" | Measure-Object | Select-Object -ExpandProperty Count
```

Output: `120`

### Total Failures

```powershell
Select-String -Path "backend\logs\watchdog.log" -Pattern "Health check failed|ALERT|failed" | Measure-Object | Select-Object -ExpandProperty Count
```

Output: `5`

### Critical Issues

```powershell
Select-String -Path "backend\logs\watchdog.log" -Pattern "CRITICAL" | Measure-Object | Select-Object -ExpandProperty Count
```

Output: `0`

---

## 📅 Date-Specific Queries

### Restarts Yesterday

```powershell
$yesterday = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")
Select-String -Path "backend\logs\watchdog.log" -Pattern "restart" | Where-Object { $_ -match $yesterday } | Measure-Object | Select-Object -ExpandProperty Count
```

### Last 7 Days Restarts

```powershell
$logs = Get-Content "backend\logs\watchdog.log"
$cutoff = (Get-Date).AddDays(-7)
$logs | Where-Object {
    $_ -match "^\d{4}-\d{2}-\d{2}" -and
    [DateTime]::Parse(($_ -split " ")[0]) -ge $cutoff -and
    $_ -match "restart"
} | Measure-Object | Select-Object -ExpandProperty Count
```

### Failures This Week

```powershell
$logs = Get-Content "backend\logs\watchdog.log"
$weekStart = (Get-Date).AddDays(-(Get-Date).DayOfWeek.value__)
$logs | Where-Object {
    $_ -match "^\d{4}-\d{2}-\d{2}" -and
    [DateTime]::Parse(($_ -split " ")[0]) -ge $weekStart -and
    ($_ -match "failed|ALERT")
} | Measure-Object | Select-Object -ExpandProperty Count
```

---

## 🔍 Recent Events

### Last 10 Restarts

```powershell
Select-String -Path "backend\logs\watchdog.log" -Pattern "restart" | Select-Object -Last 10
```

### Last 5 Failures

```powershell
Select-String -Path "backend\logs\watchdog.log" -Pattern "Health check failed|ALERT" | Select-Object -Last 5
```

### Last 20 Log Entries

```powershell
Get-Content "backend\logs\watchdog.log" -Tail 20
```

### Watch Log in Real-Time

```powershell
Get-Content "backend\logs\watchdog.log" -Wait -Tail 10
```

---

## 📈 Uptime Calculations

### Quick Uptime Estimate (Today)

```powershell
$date = Get-Date -Format "yyyy-MM-dd"
$logs = Get-Content "backend\logs\watchdog.log" | Where-Object { $_ -match $date }
$healthy = ($logs | Select-String "Health check passed|Healthy").Count
$failed = ($logs | Select-String "failed|ALERT").Count
$total = $healthy + $failed
if ($total -gt 0) {
    $uptime = [math]::Round(($healthy / $total) * 100, 2)
    Write-Host "Today's Uptime: $uptime%"
} else {
    Write-Host "No data for today yet"
}
```

Output: `Today's Uptime: 98.36%`

### Checks vs Failures Ratio

```powershell
$healthy = (Select-String -Path "backend\logs\watchdog.log" -Pattern "Health check passed|Healthy").Count
$failed = (Select-String -Path "backend\logs\watchdog.log" -Pattern "failed|ALERT").Count
Write-Host "Healthy: $healthy | Failed: $failed | Ratio: $($healthy):$($failed)"
```

Output: `Healthy: 120 | Failed: 5 | Ratio: 120:5`

---

## 🎯 Specific Searches

### Find Port Issues

```powershell
Select-String -Path "backend\logs\watchdog.log" -Pattern "port" | Select-Object -Last 5
```

### Find Database Issues

```powershell
Select-String -Path "backend\logs\watchdog.log" -Pattern "database|connection" | Select-Object -Last 5
```

### Find PM2 Operations

```powershell
Select-String -Path "backend\logs\watchdog.log" -Pattern "pm2|PM2" | Select-Object -Last 10
```

### Find Timeout Errors

```powershell
Select-String -Path "backend\logs\watchdog.log" -Pattern "timeout|timed out" | Select-Object -Last 5
```

---

## 📊 Group by Date

### Restarts Per Day

```powershell
$logs = Get-Content "backend\logs\watchdog.log"
$logs | Where-Object { $_ -match "restart" } | ForEach-Object {
    if ($_ -match "^(\d{4}-\d{2}-\d{2})") { $matches[1] }
} | Group-Object | Select-Object Name, Count | Format-Table
```

Output:

```
Name       Count
----       -----
2025-11-14     2
2025-11-13     0
2025-11-12     1
```

### Failures Per Day

```powershell
$logs = Get-Content "backend\logs\watchdog.log"
$logs | Where-Object { $_ -match "failed|ALERT" } | ForEach-Object {
    if ($_ -match "^(\d{4}-\d{2}-\d{2})") { $matches[1] }
} | Group-Object | Select-Object Name, Count | Format-Table
```

---

## 🚀 Performance Shortcuts

### Set Log Path Variable (Run Once)

```powershell
$LOG = "backend\logs\watchdog.log"
```

Then use shorter commands:

```powershell
Select-String $LOG -Pattern "restart" | Measure-Object | Select -ExpandProperty Count
Select-String $LOG -Pattern "failed" | Select -Last 5
Get-Content $LOG -Tail 20
```

### Create Aliases

```powershell
# Add to PowerShell profile: notepad $PROFILE
function Get-RestartCount { Select-String -Path "backend\logs\watchdog.log" -Pattern "restart" | Measure-Object | Select-Object -ExpandProperty Count }
function Get-FailureCount { Select-String -Path "backend\logs\watchdog.log" -Pattern "failed|ALERT" | Measure-Object | Select-Object -ExpandProperty Count }
function Get-LogTail { Get-Content "backend\logs\watchdog.log" -Tail 20 }
function Watch-Log { Get-Content "backend\logs\watchdog.log" -Wait -Tail 10 }

Set-Alias restarts Get-RestartCount
Set-Alias failures Get-FailureCount
Set-Alias logtail Get-LogTail
Set-Alias watchlog Watch-Log
```

Then use:

```powershell
restarts    # Get restart count
failures    # Get failure count
logtail     # Show last 20 lines
watchlog    # Watch log in real-time
```

---

## 🔧 Advanced One-Liners

### Hourly Restart Pattern

```powershell
$logs = Get-Content "backend\logs\watchdog.log"
$logs | Where-Object { $_ -match "restart" } | ForEach-Object {
    if ($_ -match "^\d{4}-\d{2}-\d{2} (\d{2}):\d{2}:\d{2}") { $matches[1] }
} | Group-Object | Select-Object @{N="Hour";E={$_.Name + ":00"}}, Count | Sort-Object Hour | Format-Table
```

Output:

```
Hour  Count
----  -----
08:00     1
14:00     2
22:00     1
```

### Failure Type Distribution

```powershell
$logs = Get-Content "backend\logs\watchdog.log" | Where-Object { $_ -match "failed|ALERT" }
$types = @{
    Connection = ($logs | Select-String "connection").Count
    Timeout = ($logs | Select-String "timeout").Count
    Port = ($logs | Select-String "port").Count
    Database = ($logs | Select-String "database").Count
    Other = ($logs | Where-Object { $_ -notmatch "connection|timeout|port|database" }).Count
}
$types.GetEnumerator() | Sort-Object Value -Descending | Format-Table Name, Value
```

### Average Time Between Failures

```powershell
$failures = Select-String -Path "backend\logs\watchdog.log" -Pattern "failed|ALERT"
if ($failures.Count -gt 1) {
    $times = $failures | ForEach-Object {
        if ($_ -match "^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})") {
            [DateTime]::Parse($matches[1])
        }
    }
    $intervals = @()
    for ($i = 1; $i -lt $times.Count; $i++) {
        $intervals += ($times[$i] - $times[$i-1]).TotalMinutes
    }
    $avg = [math]::Round(($intervals | Measure-Object -Average).Average, 2)
    Write-Host "Average time between failures: $avg minutes"
}
```

### Daily Summary (Compact)

```powershell
$date = Get-Date -Format "yyyy-MM-dd"
$logs = Get-Content "backend\logs\watchdog.log" | Where-Object { $_ -match $date }
$restarts = ($logs | Select-String "restart").Count
$healthy = ($logs | Select-String "Health check passed|Healthy").Count
$failed = ($logs | Select-String "failed|ALERT").Count
$total = $healthy + $failed
$uptime = if ($total -gt 0) { [math]::Round(($healthy / $total) * 100, 2) } else { 0 }
Write-Host "$date | Restarts: $restarts | Checks: $healthy | Failures: $failed | Uptime: $uptime%"
```

Output: `2025-11-14 | Restarts: 2 | Checks: 120 | Failures: 3 | Uptime: 97.56%`

---

## 📋 Copy-Paste Cheat Sheet

```powershell
# Quick counts
Select-String "backend\logs\watchdog.log" -Pattern "restart" | Measure | Select -Expand Count
Select-String "backend\logs\watchdog.log" -Pattern "failed|ALERT" | Measure | Select -Expand Count
Select-String "backend\logs\watchdog.log" -Pattern "CRITICAL" | Measure | Select -Expand Count

# Recent events
Select-String "backend\logs\watchdog.log" -Pattern "restart" | Select -Last 10
Get-Content "backend\logs\watchdog.log" -Tail 20
Get-Content "backend\logs\watchdog.log" -Wait -Tail 10

# Today's stats
$d = Get-Date -Format "yyyy-MM-dd"
Select-String "backend\logs\watchdog.log" -Pattern "restart" | Where { $_ -match $d } | Measure | Select -Expand Count

# Search patterns
Select-String "backend\logs\watchdog.log" -Pattern "port|database|timeout" | Select -Last 5
```

---

## 💡 Pro Tips

### 1. Use Tab Completion

Start typing the path and press `Tab`:

```powershell
Select-String "bac[TAB]\logs\wa[TAB]" ...
```

### 2. Output to Clipboard

```powershell
Select-String "backend\logs\watchdog.log" -Pattern "restart" | Set-Clipboard
```

Then paste anywhere: `Ctrl+V`

### 3. Save Results to File

```powershell
Select-String "backend\logs\watchdog.log" -Pattern "failed" | Out-File "failures.txt"
```

### 4. Combine with Other Tools

```powershell
# Email the count
$count = Select-String "backend\logs\watchdog.log" -Pattern "restart" | Measure | Select -Expand Count
Send-MailMessage -To "admin@advancia.com" -Subject "Restarts: $count" -Body "Total restarts: $count"

# Post to Slack
$count = Select-String "backend\logs\watchdog.log" -Pattern "restart" | Measure | Select -Expand Count
$body = @{text="Restarts today: $count"} | ConvertTo-Json
Invoke-RestMethod -Uri $env:SLACK_WEBHOOK -Method Post -Body $body -ContentType 'application/json'
```

### 5. Create Dashboard Script

```powershell
# Save as dashboard.ps1
Clear-Host
Write-Host "=== Backend Health Dashboard ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Restarts:  " -NoNewline
Select-String "backend\logs\watchdog.log" -Pattern "restart" | Measure | Select -Expand Count
Write-Host "Total Failures:  " -NoNewline
Select-String "backend\logs\watchdog.log" -Pattern "failed" | Measure | Select -Expand Count
Write-Host "Critical Issues: " -NoNewline
Select-String "backend\logs\watchdog.log" -Pattern "CRITICAL" | Measure | Select -Expand Count
Write-Host ""
Write-Host "Recent Events:" -ForegroundColor Yellow
Get-Content "backend\logs\watchdog.log" -Tail 5
```

Run: `.\dashboard.ps1`

---

## 🎯 When to Use One-Liners vs parse-watchdog.ps1

### Use One-Liners When:

- ✅ Need instant answer (< 5 seconds)
- ✅ Checking single metric
- ✅ Quick troubleshooting
- ✅ Ad-hoc queries
- ✅ Command-line workflow

### Use parse-watchdog.ps1 When:

- ✅ Need comprehensive report
- ✅ Want daily/weekly summaries
- ✅ Exporting to CSV
- ✅ Automated reporting
- ✅ Detailed analysis with recommendations

---

## 📚 Related Tools

- **parse-watchdog.ps1** - Full analysis script
- **backend-tools.ps1** - Watchdog management
- **simple-watchdog.ps1** - Lightweight monitoring
- **health-check.ps1** - API health checks

---

## 🎉 Summary

With these one-liners, you can:

- ✅ Get instant restart/failure counts
- ✅ Check today's uptime in seconds
- ✅ Monitor logs in real-time
- ✅ Search for specific issues quickly
- ✅ Create custom shortcuts and aliases
- ✅ Build simple dashboards

**Most useful commands**:

```powershell
# Instant restart count
Select-String "backend\logs\watchdog.log" -Pattern "restart" | Measure | Select -Expand Count

# Watch log live
Get-Content "backend\logs\watchdog.log" -Wait -Tail 10

# Today's quick summary
$d = Get-Date -Format "yyyy-MM-dd"; $l = Get-Content "backend\logs\watchdog.log" | ? { $_ -match $d }; "Restarts: $(($l | sls 'restart').Count) | Checks: $(($l | sls 'Healthy').Count)"
```

Bookmark this page and keep it open for quick reference! 🚀
