# Production API Validation Script
# Tests deployed endpoints on Render

$prodUrl = "https://api.advanciapayledger.com"
$testUserId = "validation-test-" + (Get-Random -Maximum 9999)

Write-Host "`n=== 🚀 Production API Validation ===" -ForegroundColor Cyan
Write-Host "Testing deployed endpoints on Render...`n" -ForegroundColor Gray

# Test 1: Health Check
Write-Host "1️⃣  Testing Production Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$prodUrl/api/health" -Method GET -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        $health = $response.Content | ConvertFrom-Json
        Write-Host "   ✅ Production backend is healthy" -ForegroundColor Green
        Write-Host "      Status: $($health.status)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Production backend not responding" -ForegroundColor Red
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Gray
    exit 1
}

# Test 2: Token Wallet Endpoints
Write-Host "`n2️⃣  Testing Token Wallet API routes (production)..." -ForegroundColor Yellow
$tokenRoutes = @(
    @{Path="/api/tokens/balance/$testUserId"; Expected=401},
    @{Path="/api/tokens/history/$testUserId"; Expected=401}
)

$tokenSuccess = 0
foreach ($route in $tokenRoutes) {
    try {
        $response = Invoke-WebRequest -Uri "$prodUrl$($route.Path)" -Method GET -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        Write-Host "   ⚠️  $($route.Path) - Unexpected success (should require auth)" -ForegroundColor Yellow
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401) {
            Write-Host "   ✅ $($route.Path) - Route exists, requires auth (401)" -ForegroundColor Green
            $tokenSuccess++
        } elseif ($_.Exception.Response.StatusCode.value__ -eq 404) {
            Write-Host "   ❌ $($route.Path) - Route not found (404)" -ForegroundColor Red
        } else {
            Write-Host "   ⚠️  $($route.Path) - Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
        }
    }
}

# Test 3: Rewards System Endpoints
Write-Host "`n3️⃣  Testing Rewards System API routes (production)..." -ForegroundColor Yellow
$rewardRoutes = @(
    @{Path="/api/rewards/$testUserId"; Expected=401},
    @{Path="/api/rewards/tier/$testUserId"; Expected=401}
)

$rewardSuccess = 0
foreach ($route in $rewardRoutes) {
    try {
        $response = Invoke-WebRequest -Uri "$prodUrl$($route.Path)" -Method GET -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        Write-Host "   ⚠️  $($route.Path) - Unexpected success (should require auth)" -ForegroundColor Yellow
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401) {
            Write-Host "   ✅ $($route.Path) - Route exists, requires auth (401)" -ForegroundColor Green
            $rewardSuccess++
        } elseif ($_.Exception.Response.StatusCode.value__ -eq 404) {
            Write-Host "   ❌ $($route.Path) - Route not found (404)" -ForegroundColor Red
        } else {
            Write-Host "   ⚠️  $($route.Path) - Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
        }
    }
}

# Test 4: Health Metrics Endpoints
Write-Host "`n4️⃣  Testing Health Metrics API routes (production)..." -ForegroundColor Yellow
$healthRoutes = @(
    @{Path="/api/health-readings/latest/$testUserId"; Expected=401},
    @{Path="/api/health-readings/history/$testUserId"; Expected=401},
    @{Path="/api/health-readings/stats/$testUserId"; Expected=401}
)

$healthSuccess = 0
foreach ($route in $healthRoutes) {
    try {
        $response = Invoke-WebRequest -Uri "$prodUrl$($route.Path)" -Method GET -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        Write-Host "   ⚠️  $($route.Path) - Unexpected success (should require auth)" -ForegroundColor Yellow
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401) {
            Write-Host "   ✅ $($route.Path) - Route exists, requires auth (401)" -ForegroundColor Green
            $healthSuccess++
        } elseif ($_.Exception.Response.StatusCode.value__ -eq 404) {
            Write-Host "   ❌ $($route.Path) - Route not found (404)" -ForegroundColor Red
        } else {
            Write-Host "   ⚠️  $($route.Path) - Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
        }
    }
}

# Summary
Write-Host "`n=== 📊 Validation Results ===" -ForegroundColor Cyan
Write-Host "Token Wallet API:  $tokenSuccess/2 routes validated" -ForegroundColor $(if($tokenSuccess -eq 2){"Green"}else{"Yellow"})
Write-Host "Rewards System:    $rewardSuccess/2 routes validated" -ForegroundColor $(if($rewardSuccess -eq 2){"Green"}else{"Yellow"})
Write-Host "Health Metrics:    $healthSuccess/3 routes validated" -ForegroundColor $(if($healthSuccess -eq 3){"Green"}else{"Yellow"})

$total = $tokenSuccess + $rewardSuccess + $healthSuccess
$expected = 7

if ($total -eq $expected) {
    Write-Host "`n🎉 ALL ENDPOINTS VALIDATED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "   All $expected new API routes are live in production" -ForegroundColor Gray
} else {
    Write-Host "`n⚠️  Validation incomplete: $total/$expected endpoints validated" -ForegroundColor Yellow
    Write-Host "   Wait for Render deployment to complete, then re-run this script" -ForegroundColor Gray
}

Write-Host "`nProduction URL: $prodUrl" -ForegroundColor Gray
Write-Host "Deployment: https://dashboard.render.com`n" -ForegroundColor Gray
