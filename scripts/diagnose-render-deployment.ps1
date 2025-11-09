# Render Deployment Diagnostic Script
# Run this to check all deployment requirements

Write-Host "🔍 Advancia Backend Deployment Diagnostic" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host ""

# Check 1: Local build
Write-Host "✓ Checking local build..." -ForegroundColor Yellow
Push-Location backend
try {
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Local build: PASS" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Local build: FAIL" -ForegroundColor Red
        Write-Host "  Run 'cd backend && npm run build' to see errors" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Build error: $_" -ForegroundColor Red
}
Pop-Location

# Check 2: Required files
Write-Host "`n✓ Checking required files..." -ForegroundColor Yellow
$requiredFiles = @(
    "backend/dist/index.js",
    "backend/prisma/schema.prisma",
    "backend/package.json",
    "backend/Procfile"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file MISSING" -ForegroundColor Red
    }
}

# Check 3: GitHub Secrets
Write-Host "`n✓ Checking GitHub secrets..." -ForegroundColor Yellow
$secrets = gh secret list --json name | ConvertFrom-Json
$requiredSecrets = @(
    "DATABASE_URL",
    "JWT_SECRET_ENCRYPTED",
    "RENDER_DEPLOY_HOOK_BACKEND",
    "RENDER_SERVICE_ID"
)

foreach ($secret in $requiredSecrets) {
    if ($secrets.name -contains $secret) {
        Write-Host "  ✅ $secret configured" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $secret missing" -ForegroundColor Yellow
    }
}

# Check 4: Live site status
Write-Host "`n✓ Checking live endpoints..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://advanciapayledger.com" -Method Head -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ❌ Frontend: $($response.StatusCode) (expected 200, got $($response.StatusCode))" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 502) {
        Write-Host "  ❌ Frontend: 502 Bad Gateway - Backend is down" -ForegroundColor Red
    } else {
        Write-Host "  ❌ Frontend: $_" -ForegroundColor Red
    }
}

try {
    $response = Invoke-RestMethod -Uri "https://advanciapayledger.com/api/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✅ Backend API: 200 OK" -ForegroundColor Green
    Write-Host "     Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Backend API: Failed (502)" -ForegroundColor Red
}

# Summary
Write-Host "`n" -NoNewline
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Go to https://dashboard.render.com" -ForegroundColor White
Write-Host "   2. Click your backend service" -ForegroundColor White
Write-Host "   3. Click 'Logs' tab" -ForegroundColor White
Write-Host "   4. Look for errors (usually at the bottom)" -ForegroundColor White
Write-Host "   5. Copy the error message and paste it in chat" -ForegroundColor White
Write-Host ""
Write-Host "Common errors:" -ForegroundColor Yellow
Write-Host "   • 'Cannot find module' → Missing build step" -ForegroundColor Gray
Write-Host "   • 'P1001: Can't reach database' → DATABASE_URL wrong" -ForegroundColor Gray
Write-Host "   • 'Port 4000 already in use' → Port conflict" -ForegroundColor Gray
Write-Host "   • 'EADDRINUSE' → Service didn't stop properly" -ForegroundColor Gray
Write-Host ""
postgresql://advancia_user:AxYyJPvCeXo0vA6uiQvjG2kEUgJKo20t@dpg-d3p5n1p5pdvs73ad8o1g-a.virginia-postgres.render.com/advancia_prod