# Production Monitoring Script
# Run this to check production health and performance

Write-Host "🔍 Production Monitoring Check" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host ""

# Check 1: Backend Health
Write-Host "✓ Checking Backend API..." -ForegroundColor Yellow
try {
    $backendHealth = Invoke-RestMethod -Uri "https://api.advanciapayledger.com/api/health" -Method Get -TimeoutSec 10
    Write-Host "  ✅ Backend: $($backendHealth.status) ($($backendHealth.environment))" -ForegroundColor Green
    Write-Host "     Database: $($backendHealth.database)" -ForegroundColor Gray
    Write-Host "     Uptime: $([math]::Round($backendHealth.uptime / 3600, 2)) hours" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Backend: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Check 2: Frontend Response
Write-Host "`n✓ Checking Frontend..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "https://www.advanciapayledger.com" -Method Head -TimeoutSec 10
    Write-Host "  ✅ Frontend: $($frontendResponse.StatusCode) OK" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Frontend: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Check 3: Key API Endpoints
Write-Host "`n✓ Checking Critical Endpoints..." -ForegroundColor Yellow
$endpoints = @(
    @{Name="Auth Status"; Url="https://api.advanciapayledger.com/api/auth/status"},
    @{Name="System Info"; Url="https://api.advanciapayledger.com/api/system/status"},
    @{Name="User Routes"; Url="https://api.advanciapayledger.com/api/users/profile"}
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url -Method Head -TimeoutSec 5 -ErrorAction Stop
        Write-Host "  ✅ $($endpoint.Name): $($response.StatusCode)" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "  ✅ $($endpoint.Name): 401 (Expected - requires auth)" -ForegroundColor Green
        } elseif ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "  ⚠️  $($endpoint.Name): 404 (Endpoint not found)" -ForegroundColor Yellow
        } else {
            Write-Host "  ❌ $($endpoint.Name): $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
    }
}

# Check 4: Performance Metrics
Write-Host "`n✓ Performance Check..." -ForegroundColor Yellow
try {
    $startTime = Get-Date
    $response = Invoke-WebRequest -Uri "https://www.advanciapayledger.com" -TimeoutSec 10
    $loadTime = ((Get-Date) - $startTime).TotalMilliseconds

    Write-Host "  📊 Frontend Load Time: $([math]::Round($loadTime, 0))ms" -ForegroundColor $(if ($loadTime -lt 2000) { "Green" } elseif ($loadTime -lt 5000) { "Yellow" } else { "Red" })
    Write-Host "  📄 Page Size: $([math]::Round($response.Content.Length / 1024, 0))KB" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Performance check failed" -ForegroundColor Red
}

# Summary
Write-Host "`n" + "=" * 50 -ForegroundColor Gray
Write-Host "📋 Monitoring Summary" -ForegroundColor Cyan
Write-Host "🕒 Checked at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "🌐 Production URL: https://www.advanciapayledger.com" -ForegroundColor Gray
Write-Host "🔗 API URL: https://api.advanciapayledger.com" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Yellow
Write-Host "  • Set up automated monitoring alerts" -ForegroundColor Gray
Write-Host "  • Configure error tracking (Sentry)" -ForegroundColor Gray
Write-Host "  • Set up performance monitoring" -ForegroundColor Gray
Write-Host "  • Configure backup monitoring" -ForegroundColor Gray