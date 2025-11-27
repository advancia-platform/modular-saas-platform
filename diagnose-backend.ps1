# Quick Diagnostic Script for Backend Server
# This will help identify why the server isn't starting fully

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Backend Server Diagnostic" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if port 4000 is in use
Write-Host "1. Checking if port 4000 is in use..." -ForegroundColor Yellow
$port4000 = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
if ($port4000) {
    Write-Host "   ⚠️  Port 4000 is already in use!" -ForegroundColor Red
    Write-Host "   Process ID: $($port4000.OwningProcess)" -ForegroundColor Yellow

    # Try to identify the process
    $process = Get-Process -Id $port4000.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "   Process Name: $($process.ProcessName)" -ForegroundColor Yellow
        Write-Host "   Command: Kill it with: Stop-Process -Id $($port4000.OwningProcess) -Force" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ✅ Port 4000 is available" -ForegroundColor Green
}

# Check Node processes
Write-Host "`n2. Checking Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   Found $($nodeProcesses.Count) Node.js process(es):" -ForegroundColor Yellow
    $nodeProcesses | Format-Table Id, @{Name="CPU(s)";Expression={[math]::Round($_.CPU,2)}}, @{Name="Memory(MB)";Expression={[math]::Round($_.WorkingSet64/1MB,2)}}, StartTime -AutoSize

    Write-Host "   To kill all Node processes:" -ForegroundColor Cyan
    Write-Host "   Get-Process -Name node | Stop-Process -Force" -ForegroundColor White
} else {
    Write-Host "   ℹ️  No Node.js processes running" -ForegroundColor Yellow
}

# Check if database URL is set
Write-Host "`n3. Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".\backend\.env") {
    Write-Host "   ✅ .env file exists" -ForegroundColor Green

    # Check for key variables
    $envContent = Get-Content ".\backend\.env" -Raw

    $checks = @{
        "DATABASE_URL" = $envContent -match "DATABASE_URL="
        "TWILIO_ACCOUNT_SID" = $envContent -match "TWILIO_ACCOUNT_SID=\w+"
        "TELEGRAM_BOT_TOKEN" = $envContent -match "TELEGRAM_BOT_TOKEN=\d+:"
        "JWT_SECRET" = $envContent -match "JWT_SECRET=\w+"
    }

    foreach ($key in $checks.Keys) {
        if ($checks[$key]) {
            Write-Host "   ✅ $key is set" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $key is missing or empty" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ❌ .env file not found!" -ForegroundColor Red
}

# Test database connection
Write-Host "`n4. Testing database connection..." -ForegroundColor Yellow
try {
    cd backend
    $dbTest = npx prisma db push --skip-generate 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Database connection issue detected" -ForegroundColor Yellow
    }
    cd ..
} catch {
    Write-Host "   ❌ Failed to test database: $_" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Recommended Actions:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n1. If port 4000 is in use:" -ForegroundColor White
Write-Host "   Get-Process -Name node | Stop-Process -Force`n" -ForegroundColor Cyan

Write-Host "2. Start backend with error logging:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   npm run dev 2>&1 | Tee-Object -FilePath ../server-startup.log`n" -ForegroundColor Cyan

Write-Host "3. Check the log file:" -ForegroundColor White
Write-Host "   Get-Content server-startup.log -Tail 50`n" -ForegroundColor Cyan

Write-Host "4. Or try starting directly with ts-node:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   npx ts-node src/index.ts`n" -ForegroundColor Cyan

Write-Host "`n========================================`n" -ForegroundColor Cyan
