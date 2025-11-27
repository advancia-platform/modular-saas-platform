# Diagnostic script for evaluation framework issues (PowerShell version)

Write-Host "🔍 Diagnosing Evaluation Framework..." -ForegroundColor Cyan
Write-Host ""

# Check backend
Write-Host "1. Checking backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backend returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Backend is NOT running" -ForegroundColor Red
    Write-Host "   Start with: cd backend && npm run dev" -ForegroundColor Gray
}

# Check database
Write-Host ""
Write-Host "2. Checking database..." -ForegroundColor Yellow
Push-Location ..\
try {
    $dbCheck = npx prisma db execute --stdin --schema=prisma/schema.prisma 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Database connection failed" -ForegroundColor Red
        Write-Host "   Check DATABASE_URL in backend/.env" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Database check failed: $_" -ForegroundColor Red
}
Pop-Location

# Check Python dependencies
Write-Host ""
Write-Host "3. Checking Python environment..." -ForegroundColor Yellow
try {
    python -c "import requests, jsonlines" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Python dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing Python dependencies" -ForegroundColor Red
        Write-Host "   Run: npm run eval:install" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Python check failed" -ForegroundColor Red
    Write-Host "   Ensure Python 3.8+ is installed" -ForegroundColor Gray
}

# Check test data
Write-Host ""
Write-Host "4. Checking test data files..." -ForegroundColor Yellow
$testFiles = @(
    "data/password_test_cases.jsonl",
    "data/auth_test_cases.jsonl",
    "data/rate_limit_test_cases.jsonl"
)

foreach ($file in $testFiles) {
    if (Test-Path $file) {
        Write-Host "✅ Found: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing: $file" -ForegroundColor Red
    }
}

# Check environment configuration
Write-Host ""
Write-Host "5. Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green

    $envContent = Get-Content .env -Raw
    if ($envContent -match "BACKEND_URL=") {
        Write-Host "✅ BACKEND_URL configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  BACKEND_URL not configured" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env file missing" -ForegroundColor Red
    Write-Host "   Run: npm run eval:setup" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Diagnosis complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Quick fixes:" -ForegroundColor Yellow
Write-Host "  1. Start backend: cd ..\backend && npm run dev" -ForegroundColor Gray
Write-Host "  2. Install deps: npm run eval:install" -ForegroundColor Gray
Write-Host "  3. Setup env: npm run eval:setup" -ForegroundColor Gray
Write-Host "  4. Run tests: npm run security:test" -ForegroundColor Gray
