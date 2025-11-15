# Health Check Scripts - Quick Reference

Simple health check utilities for testing the Advancia Pay backend API.

---

## 📁 Available Scripts

### 1. **health-check.sh** (Linux/Mac/Git Bash)

Simple bash script for quick health checks.

### 2. **health-check.ps1** (Windows PowerShell)

PowerShell equivalent for Windows users.

### 3. **test-api.sh** (Comprehensive)

Full API testing suite with authentication, lockout policy, and protected endpoints.

---

## 🚀 Quick Start

### Linux/Mac/Git Bash

**Make executable**:

```bash
chmod +x health-check.sh
```

**Run**:

```bash
./health-check.sh              # Test localhost:4000
./health-check.sh 5000         # Test port 5000
```

### Windows PowerShell

**Run**:

```powershell
.\health-check.ps1              # Test localhost:4000
.\health-check.ps1 -Port 5000   # Test port 5000
.\health-check.ps1 -Url "https://api.advancia.com/api/health"  # Test remote
```

---

## 📊 Output Examples

### Success

```
Testing API endpoint: http://localhost:4000/api/health
✅ API is healthy (HTTP 200)
```

### Failure

```
Testing API endpoint: http://localhost:4000/api/health
❌ API check failed (HTTP 503)
```

---

## 🎯 Use Cases

### 1. Quick Health Check

```bash
# Linux/Mac
./health-check.sh

# Windows
.\health-check.ps1
```

### 2. CI/CD Pipeline

```bash
# In your CI script
./health-check.sh || exit 1
```

### 3. Monitoring Loop

```bash
# Check every 30 seconds (Linux/Mac)
while true; do
    ./health-check.sh
    sleep 30
done
```

```powershell
# Check every 30 seconds (Windows)
while ($true) {
    .\health-check.ps1
    Start-Sleep -Seconds 30
}
```

### 4. Pre-deployment Check

```bash
# Before deployment
./health-check.sh && echo "Ready to deploy" || echo "Backend not ready"
```

---

## 🔍 Comparison

| Feature        | health-check.sh | health-check.ps1   | test-api.sh           |
| -------------- | --------------- | ------------------ | --------------------- |
| **Platform**   | Linux/Mac/Bash  | Windows PowerShell | Linux/Mac/Bash        |
| **Lines**      | ~30             | ~60                | ~110                  |
| **Purpose**    | Quick check     | Quick check        | Comprehensive testing |
| **Tests**      | 1 endpoint      | 1 endpoint         | 9+ endpoints          |
| **Auth**       | ❌              | ❌                 | ✅                    |
| **Exit Codes** | ✅              | ✅                 | ✅                    |
| **Colors**     | ✅              | ✅                 | ✅                    |
| **Best For**   | Automation      | Windows users      | Manual testing        |

---

## 💡 Integration Examples

### Docker Health Check

```dockerfile
# In Dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1
```

### Kubernetes Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 4000
  initialDelaySeconds: 30
  periodSeconds: 10
```

### GitHub Actions

```yaml
- name: Health Check
  run: |
    chmod +x health-check.sh
    ./health-check.sh
```

### Scheduled Task (Windows)

```powershell
# Create scheduled task to run every 5 minutes
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\path\to\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "BackendHealthCheck"
```

### Cron Job (Linux)

```bash
# Add to crontab (check every 5 minutes)
*/5 * * * * /path/to/health-check.sh >> /var/log/backend-health.log 2>&1
```

---

## 🔧 Customization

### Test Different Endpoint

```bash
# Linux/Mac - Edit the script
URL="http://localhost:$PORT/api/custom-endpoint"

# Windows - Use Url parameter
.\health-check.ps1 -Url "http://localhost:4000/api/custom-endpoint"
```

### Add Timeout

```bash
# Linux/Mac
response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 $URL)

# Windows
$response = Invoke-WebRequest -Uri $Url -TimeoutSec 5
```

### Add Retry Logic

```bash
# Linux/Mac
for i in {1..3}; do
    ./health-check.sh && break
    echo "Retry $i of 3..."
    sleep 5
done
```

```powershell
# Windows
for ($i = 1; $i -le 3; $i++) {
    .\health-check.ps1
    if ($LASTEXITCODE -eq 0) { break }
    Write-Host "Retry $i of 3..."
    Start-Sleep -Seconds 5
}
```

---

## 📝 Exit Codes

Both scripts return standard exit codes:

| Code  | Meaning | Usage                           |
| ----- | ------- | ------------------------------- |
| **0** | Success | API is healthy                  |
| **1** | Failure | API is down or returned non-200 |

Use in scripts:

```bash
# Linux/Mac
if ./health-check.sh; then
    echo "API is up"
else
    echo "API is down"
fi
```

```powershell
# Windows
.\health-check.ps1
if ($LASTEXITCODE -eq 0) {
    Write-Host "API is up"
} else {
    Write-Host "API is down"
}
```

---

## 🎓 Advanced Usage

### With Notifications

```bash
# Linux/Mac with Slack webhook
if ! ./health-check.sh; then
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"Backend health check failed!"}' \
        $SLACK_WEBHOOK
fi
```

```powershell
# Windows with Slack webhook
.\health-check.ps1
if ($LASTEXITCODE -ne 0) {
    $body = @{text="Backend health check failed!"} | ConvertTo-Json
    Invoke-RestMethod -Uri $env:SLACK_WEBHOOK -Method Post -Body $body -ContentType 'application/json'
}
```

### Combined with Watchdog

```bash
# Linux/Mac - Check before starting watchdog
./health-check.sh && ./simple-watchdog.ps1 -Action watchdog
```

```powershell
# Windows - Check before starting watchdog
.\health-check.ps1
if ($LASTEXITCODE -eq 0) {
    .\simple-watchdog.ps1 -Action watchdog
}
```

### Load Testing Helper

```bash
# Linux/Mac - Quick load test
for i in {1..100}; do
    ./health-check.sh &
done
wait
```

---

## 🐛 Troubleshooting

### Script Won't Execute (Linux/Mac)

```bash
# Check permissions
ls -l health-check.sh

# Make executable
chmod +x health-check.sh

# Verify
./health-check.sh
```

### Script Blocked (Windows)

```powershell
# Check execution policy
Get-ExecutionPolicy

# Allow scripts (if needed)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run script
.\health-check.ps1
```

### curl Not Found (Windows)

Windows 10+ includes curl. For older versions:

```powershell
# Use PowerShell's Invoke-WebRequest instead
# health-check.ps1 already uses this
.\health-check.ps1
```

### Connection Refused

```
❌ API check failed: Connection refused
```

**Solutions**:

1. Verify backend is running: `pm2 status`
2. Check correct port: `netstat -ano | findstr :4000`
3. Check firewall settings
4. Verify backend started successfully: `cd backend && node src/index.js`

---

## 📚 Related Scripts

- **simple-watchdog.ps1** - Lightweight monitoring with auto-restart
- **backend-watchdog.ps1** - Production monitoring with notifications
- **backend-tools.ps1** - Complete backend automation suite
- **test-api.sh** - Comprehensive API testing
- **test-watchdog-notifications.ps1** - Notification system tests

---

## 🎉 Summary

**health-check.sh / health-check.ps1**:

- ✅ Simple and fast (< 1 second)
- ✅ Cross-platform (bash + PowerShell)
- ✅ Exit codes for automation
- ✅ Colored output
- ✅ Single endpoint focus
- ✅ Perfect for CI/CD and monitoring

**Best for**:

- Quick manual checks
- CI/CD pipelines
- Automated monitoring
- Pre-deployment validation
- Integration with other tools

**When to use test-api.sh instead**:

- Need comprehensive API testing
- Testing authentication flows
- Validating protected endpoints
- Manual QA testing
- Learning the API
