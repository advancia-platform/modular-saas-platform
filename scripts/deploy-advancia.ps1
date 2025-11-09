# Advancia Deploy Automation
# Triggers Render deployment using webhook

$renderHook = $env:RENDER_DEPLOY_HOOK_BACKEND
if (-not $renderHook) {
    Write-Host "❌ RENDER_DEPLOY_HOOK_BACKEND not set"
    Write-Host "Set it with: `$env:RENDER_DEPLOY_HOOK_BACKEND='your_webhook_url'"
    exit 1
}

Write-Host "🚀 Triggering Advancia deployment to Render..."
$response = Invoke-WebRequest -Uri $renderHook -Method POST -UseBasicParsing
Write-Host "✅ Deploy triggered successfully"
Write-Host "Status: $($response.StatusCode)"
Write-Host ""
Write-Host "⏳ Waiting 90 seconds for deployment..."
Start-Sleep -Seconds 90

Write-Host "🔍 Checking health..."
try {
    $health = Invoke-WebRequest -Uri "https://advanciapayledger.com/api/health" -UseBasicParsing
    Write-Host "✅ Backend healthy! Status: $($health.StatusCode)"
} catch {
    Write-Host "⚠️ Health check failed: $_"
}
