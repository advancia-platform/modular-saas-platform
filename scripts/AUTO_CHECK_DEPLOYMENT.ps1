# 🔄 AUTO-CHECK DEPLOYMENT STATUS
# Run this PowerShell script to automatically check when deployment is ready

Write-Host "`n🚀 Checking deployment status every 30 seconds..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Gray

$startTime = Get-Date
$attempt = 0

while ($true) {
    $attempt++
    $elapsed = [math]::Round(((Get-Date) - $startTime).TotalMinutes, 1)
    
    Write-Host "[$attempt] Checking... (${elapsed}m elapsed) - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Yellow
    
    try {
        # Try to hit the login endpoint (will return 400 if deployed, 404 if not)
        $response = Invoke-WebRequest -Uri 'https://advancia-backend.onrender.com/api/auth/login' `
            -Method Post `
            -Body '{}' `
            -ContentType 'application/json' `
            -ErrorAction Stop
            
        Write-Host "✅ DEPLOYED! Endpoint is live!" -ForegroundColor Green
        break
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        if ($statusCode -eq 400 -or $statusCode -eq 401) {
            Write-Host "✅ DEPLOYED! Login endpoint is live!" -ForegroundColor Green
            Write-Host "✅ Backend responded with expected auth error (endpoint exists!)" -ForegroundColor Green
            Write-Host "`n🎉 Total deployment time: ${elapsed} minutes`n" -ForegroundColor Cyan
            break
        }
        elseif ($statusCode -eq 404) {
            Write-Host "⏳ Still deploying... (404 - old code running)" -ForegroundColor Cyan
        }
        elseif ($statusCode -eq 503) {
            Write-Host "⏳ Service restarting..." -ForegroundColor Cyan
        }
        else {
            Write-Host "⏳ Status: $statusCode - deployment in progress..." -ForegroundColor Cyan
        }
    }
    
    Start-Sleep -Seconds 30
}

Write-Host "`n✅ DEPLOYMENT COMPLETE!`n" -ForegroundColor Green
Write-Host "Test registration now:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Example test command:" -ForegroundColor Gray
Write-Host '$body = @{' -ForegroundColor White
Write-Host '    email = "testuser@example.com"' -ForegroundColor White
Write-Host '    password = "Test123456"' -ForegroundColor White
Write-Host '    firstName = "Test"' -ForegroundColor White
Write-Host '    lastName = "User"' -ForegroundColor White
Write-Host '} | ConvertTo-Json' -ForegroundColor White
Write-Host ""
Write-Host 'Invoke-RestMethod -Uri "https://advancia-backend.onrender.com/api/auth/register" -Method Post -Body $body -ContentType "application/json"' -ForegroundColor White
Write-Host ""
