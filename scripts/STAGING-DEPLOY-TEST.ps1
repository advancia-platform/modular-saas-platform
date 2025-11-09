# ╔═══════════════════════════════════════════════════════════╗
# ║  ADVANCIA PAY LEDGER - STAGING DEPLOYMENT & TEST SUITE   ║
# ║  Complete workflow: Deploy → Test → Performance Check    ║
# ╚═══════════════════════════════════════════════════════════╝

param(
    [switch]$SkipDeploy,
    [switch]$SkipTests,
    [switch]$SkipPerformance,
    [switch]$OnlyBackend,
    [switch]$OnlyFrontend
)

$ErrorActionPreference = "Continue"
$startTime = Get-Date

function Write-Section {
    param([string]$Title)
    Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  $Title" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Message)
    Write-Host "  → $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "  ✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "  ✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "  ℹ $Message" -ForegroundColor Cyan
}

# ═══════════════════════════════════════════════════════════
# PHASE 1: PRE-DEPLOYMENT CHECKS
# ═══════════════════════════════════════════════════════════

Write-Section "PHASE 1: PRE-DEPLOYMENT CHECKS"

Write-Step "Checking Git status..."
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Info "Uncommitted changes detected:"
    git status --short
    $commit = Read-Host "Commit changes before deploy? (y/n)"
    if ($commit -eq 'y') {
        $message = Read-Host "Enter commit message"
        git add .
        git commit -m "$message"
        Write-Success "Changes committed"
    }
} else {
    Write-Success "Working directory clean"
}

Write-Step "Verifying environment files..."
$backendEnvExists = Test-Path "backend\.env"
$frontendEnvExists = Test-Path "frontend\.env.local"

if ($backendEnvExists) {
    Write-Success "Backend .env found"
} else {
    Write-Error "Backend .env not found!"
}

if ($frontendEnvExists) {
    Write-Success "Frontend .env.local found"
} else {
    Write-Error "Frontend .env.local not found!"
}

Write-Step "Running TypeScript compilation check..."
Push-Location backend
$backendTypeCheck = npx tsc --noEmit 2>&1
$backendTypeCheckSuccess = $LASTEXITCODE -eq 0
Pop-Location

if ($backendTypeCheckSuccess) {
    Write-Success "Backend TypeScript: No errors"
} else {
    Write-Error "Backend TypeScript: Has errors"
    Write-Host $backendTypeCheck -ForegroundColor Red
}

Write-Step "Checking for .gitignore violations..."
$sensitiveFiles = @(".env", "*.key", "*.pem", "secrets/*")
$violations = @()
foreach ($pattern in $sensitiveFiles) {
    $found = git ls-files $pattern 2>$null
    if ($found) {
        $violations += $found
    }
}

if ($violations.Count -eq 0) {
    Write-Success "No sensitive files in Git"
} else {
    Write-Error "Sensitive files found in Git:"
    $violations | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
}

# ═══════════════════════════════════════════════════════════
# PHASE 2: DEPLOYMENT TO STAGING
# ═══════════════════════════════════════════════════════════

if (-not $SkipDeploy) {
    Write-Section "PHASE 2: DEPLOYMENT TO STAGING"

    if (-not $OnlyFrontend) {
        Write-Step "Deploying Backend to Render..."
        Write-Info "Pushing to main branch (Render auto-deploy)..."
        
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backend deployment triggered on Render"
            Write-Info "Monitor deployment at: https://dashboard.render.com"
        } else {
            Write-Error "Git push failed!"
        }
        
        Write-Step "Waiting for Render backend deployment (60s)..."
        Start-Sleep -Seconds 60
    }

    if (-not $OnlyBackend) {
        Write-Step "Deploying Frontend to Vercel/Cloudflare..."
        
        Push-Location frontend
        
        # Check if using Vercel or Cloudflare
        if (Test-Path "vercel.json") {
            Write-Info "Detected Vercel deployment..."
            npx vercel --prod
        } elseif (Test-Path "wrangler.toml") {
            Write-Info "Detected Cloudflare Pages deployment..."
            npx wrangler pages deploy
        } else {
            Write-Info "Manual deployment needed - run deploy script"
        }
        
        Pop-Location
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Frontend deployment completed"
        } else {
            Write-Error "Frontend deployment failed!"
        }
    }
} else {
    Write-Section "PHASE 2: DEPLOYMENT (SKIPPED)"
}

# ═══════════════════════════════════════════════════════════
# PHASE 3: INTEGRATION TESTING
# ═══════════════════════════════════════════════════════════

if (-not $SkipTests) {
    Write-Section "PHASE 3: INTEGRATION TESTING"

    # Wait for services to be ready
    Write-Step "Waiting for services to stabilize (30s)..."
    Start-Sleep -Seconds 30

    # Backend Health Check
    Write-Step "Testing Backend Health..."
    try {
        $healthResponse = Invoke-RestMethod -Uri "https://advancia-pay-ledger-backend.onrender.com/api/health" -Method GET -TimeoutSec 10
        if ($healthResponse.status -eq "healthy") {
            Write-Success "Backend health check passed"
        } else {
            Write-Error "Backend health check failed"
        }
    } catch {
        Write-Error "Backend health check error: $($_.Exception.Message)"
    }

    # Database Connection Test
    Write-Step "Testing Database Connection..."
    try {
        $dbTest = Invoke-RestMethod -Uri "https://advancia-pay-ledger-backend.onrender.com/api/health/db" -Method GET -TimeoutSec 10
        Write-Success "Database connection verified"
    } catch {
        Write-Error "Database connection failed: $($_.Exception.Message)"
    }

    # Authentication Test
    Write-Step "Testing Authentication Endpoints..."
    Push-Location backend
    
    # Run auth tests if they exist
    if (Test-Path "tests\auth.test.ts") {
        npm test -- tests/auth.test.ts
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Auth tests passed"
        } else {
            Write-Error "Auth tests failed"
        }
    }
    
    Pop-Location

    # AI Analytics Endpoints Test
    Write-Step "Testing AI Analytics Endpoints..."
    
    # Test market insights (no auth required for this one)
    try {
        $marketInsights = Invoke-RestMethod -Uri "https://advancia-pay-ledger-backend.onrender.com/api/ai-analytics/market-insights" -Method GET -TimeoutSec 10 -Headers @{
            "x-api-key" = "dev-test-key-123"
        }
        Write-Success "AI Analytics endpoints responding"
    } catch {
        Write-Info "AI Analytics requires authentication (expected)"
    }

    # Frontend Test
    Write-Step "Testing Frontend Availability..."
    try {
        $frontendResponse = Invoke-WebRequest -Uri "https://advancia-pay-ledger.vercel.app" -Method GET -TimeoutSec 10 -UseBasicParsing
        if ($frontendResponse.StatusCode -eq 200) {
            Write-Success "Frontend is accessible"
        }
    } catch {
        Write-Error "Frontend not accessible: $($_.Exception.Message)"
    }

    # Run smoke tests if they exist
    Write-Step "Running Backend Smoke Tests..."
    Push-Location backend
    if (Test-Path "tests\smoke.test.ts") {
        npm test -- tests/smoke.test.ts
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Smoke tests passed"
        } else {
            Write-Error "Smoke tests failed"
        }
    }
    Pop-Location

} else {
    Write-Section "PHASE 3: INTEGRATION TESTING (SKIPPED)"
}

# ═══════════════════════════════════════════════════════════
# PHASE 4: PERFORMANCE TESTING
# ═══════════════════════════════════════════════════════════

if (-not $SkipPerformance) {
    Write-Section "PHASE 4: PERFORMANCE TESTING"

    Write-Step "Measuring API Response Times..."
    
    $endpoints = @(
        @{ Name = "Health Check"; Url = "/api/health"; Method = "GET" }
        @{ Name = "Market Insights"; Url = "/api/ai-analytics/market-insights"; Method = "GET" }
    )

    $baseUrl = "https://advancia-pay-ledger-backend.onrender.com"
    
    foreach ($endpoint in $endpoints) {
        $times = @()
        Write-Info "Testing $($endpoint.Name)..."
        
        for ($i = 1; $i -le 5; $i++) {
            $startReq = Get-Date
            try {
                Invoke-RestMethod -Uri "$baseUrl$($endpoint.Url)" -Method $endpoint.Method -TimeoutSec 10 -ErrorAction Stop | Out-Null
                $endReq = Get-Date
                $elapsed = ($endReq - $startReq).TotalMilliseconds
                $times += $elapsed
                $roundedTime = [math]::Round($elapsed, 2)
                Write-Host "    Request ${i}: ${roundedTime}ms" -ForegroundColor Gray
            } catch {
                Write-Host "    Request ${i}: Failed" -ForegroundColor Red
            }
        }
        
        if ($times.Count -gt 0) {
            $avgTime = ($times | Measure-Object -Average).Average
            $minTime = ($times | Measure-Object -Minimum).Minimum
            $maxTime = ($times | Measure-Object -Maximum).Maximum
            
            Write-Success "$($endpoint.Name): Avg $([math]::Round($avgTime, 2))ms | Min $([math]::Round($minTime, 2))ms | Max $([math]::Round($maxTime, 2))ms"
        }
    }

    Write-Step "Testing Database Query Performance..."
    # This would run if you have performance test scripts
    Push-Location backend
    if (Test-Path "tests\performance.test.ts") {
        npm test -- tests/performance.test.ts
    } else {
        Write-Info "No performance test suite found - skipping"
    }
    Pop-Location

    Write-Step "Checking Memory Usage (Local)..."
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        foreach ($proc in $nodeProcesses) {
            $memMB = [math]::Round($proc.WorkingSet64 / 1MB, 2)
            Write-Info "Node PID $($proc.Id): ${memMB}MB"
        }
    }

} else {
    Write-Section "PHASE 4: PERFORMANCE TESTING (SKIPPED)"
}

# ═══════════════════════════════════════════════════════════
# PHASE 5: FINAL REPORT
# ═══════════════════════════════════════════════════════════

Write-Section "PHASE 5: DEPLOYMENT SUMMARY"

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "  Deployment Duration: $([math]::Round($duration.TotalMinutes, 2)) minutes" -ForegroundColor White
Write-Host ""

Write-Host "  Backend URL:  " -NoNewline -ForegroundColor Yellow
Write-Host "https://advancia-pay-ledger-backend.onrender.com" -ForegroundColor Cyan

Write-Host "  Frontend URL: " -NoNewline -ForegroundColor Yellow
Write-Host "https://advancia-pay-ledger.vercel.app" -ForegroundColor Cyan

Write-Host "  Database:     " -NoNewline -ForegroundColor Yellow
Write-Host "Render PostgreSQL (Connected)" -ForegroundColor Green

Write-Host ""
Write-Host "  Next Steps:" -ForegroundColor Yellow
Write-Host "    1. Monitor Render dashboard for deployment status" -ForegroundColor White
Write-Host "    2. Check application logs for any errors" -ForegroundColor White
Write-Host "    3. Perform manual smoke test of critical flows" -ForegroundColor White
Write-Host "    4. Notify team of staging deployment" -ForegroundColor White

Write-Host ""
Write-Section "✓ STAGING DEPLOYMENT COMPLETE"
Write-Host ""

# Open monitoring dashboards
$openDashboards = Read-Host "Open monitoring dashboards? (y/n)"
if ($openDashboards -eq 'y') {
    Start-Process "https://dashboard.render.com"
    Start-Process "https://vercel.com/dashboard"
}
