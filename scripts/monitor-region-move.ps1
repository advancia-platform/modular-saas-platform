# Monitor Render Backend Deployment
# Checks health endpoint every 10 seconds until backend is up

$apiUrl = "https://advanciapayledger.com/api/health"
$maxAttempts = 30  # 5 minutes
$interval = 10     # seconds

Write-Host "🔄 Monitoring Backend Deployment (Region Move to Virginia)" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host ""
Write-Host "⏳ Waiting for backend to come online..." -ForegroundColor Yellow
Write-Host "   This typically takes 2-5 minutes" -ForegroundColor Gray
Write-Host ""

$attempt = 0
$lastStatus = $null

while ($attempt -lt $maxAttempts) {
    $attempt++
    $elapsed = $attempt * $interval
    
    Write-Host "[$attempt/$maxAttempts] " -NoNewline -ForegroundColor Yellow
    Write-Host "Checking... " -NoNewline -ForegroundColor White
    
    try {
        $response = Invoke-RestMethod -Uri $apiUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
        
        # Success!
        Write-Host "✅ BACKEND IS UP!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Response:" -ForegroundColor Cyan
        Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
        Write-Host ""
        Write-Host "🎉 Deployment successful!" -ForegroundColor Green
        Write-Host "   Backend is now in Virginia region" -ForegroundColor White
        Write-Host "   Total time: $elapsed seconds" -ForegroundColor Gray
        Write-Host ""
        Write-Host "✅ Next: Test your site at https://advanciapayledger.com" -ForegroundColor Cyan
        exit 0
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        if ($statusCode -eq 502) {
            Write-Host "❌ 502 (Still deploying...)" -ForegroundColor Yellow
        } elseif ($statusCode) {
            Write-Host "⚠️  HTTP $statusCode" -ForegroundColor Yellow
        } else {
            Write-Host "⚠️  No response" -ForegroundColor Yellow
        }
        
        if ($attempt -lt $maxAttempts) {
            Write-Host "   Retry in ${interval}s..." -ForegroundColor Gray
            Start-Sleep -Seconds $interval
        }
    }
}

Write-Host ""
Write-Host "⚠️  Backend did not come up after $($maxAttempts * $interval) seconds" -ForegroundColor Red
Write-Host ""
Write-Host "📋 Troubleshooting:" -ForegroundColor Yellow
Write-Host "   1. Go to Render Dashboard → Backend Service" -ForegroundColor White
Write-Host "   2. Check 'Logs' tab for errors" -ForegroundColor White
Write-Host "   3. Check 'Events' tab - should show 'Deploy live'" -ForegroundColor White
Write-Host ""
Write-Host "Common issues:" -ForegroundColor Yellow
Write-Host "   • P3009 migration error - run fix-p3009-migration.ps1" -ForegroundColor Gray
Write-Host "   • Build failed - check Logs for errors" -ForegroundColor Gray
Write-Host "   • Env vars missing - check Environment tab" -ForegroundColor Gray
