# DigitalOcean PostgreSQL Setup - Windows Helper Script
# This script helps you set up PostgreSQL on your DigitalOcean droplet from Windows

param(
    [string]$DropletIP = "",
    [string]$Action = "setup"
)

function Show-Menu {
    Write-Host "`n=========================================="
    Write-Host "DigitalOcean PostgreSQL Setup Helper"
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "1. Display setup commands (copy to droplet)"
    Write-Host "2. Test connection to droplet"
    Write-Host "3. Generate .env.test content"
    Write-Host "4. Run Prisma migrations"
    Write-Host "5. Run tests"
    Write-Host "6. Exit"
    Write-Host ""
}

function Show-Setup-Commands {
    Write-Host "`n=========================================="
    Write-Host "STEP 1: SSH into your droplet and run this:"
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/setup-postgres.sh | bash" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "OR copy-paste these commands individually:"
    Write-Host ""
    Write-Host "apt update && apt upgrade -y" -ForegroundColor Green
    Write-Host "apt install -y postgresql postgresql-contrib" -ForegroundColor Green
    Write-Host "systemctl start postgresql && systemctl enable postgresql" -ForegroundColor Green
    Write-Host ""
    Write-Host "sudo -u postgres psql << 'EOF'" -ForegroundColor Green
    Write-Host "CREATE DATABASE advancia_payledger_test;" -ForegroundColor Green
    Write-Host "CREATE USER test_user WITH ENCRYPTED PASSWORD 'test_password_123';" -ForegroundColor Green
    Write-Host "GRANT ALL PRIVILEGES ON DATABASE advancia_payledger_test TO test_user;" -ForegroundColor Green
    Write-Host "\c advancia_payledger_test" -ForegroundColor Green
    Write-Host "GRANT ALL PRIVILEGES ON SCHEMA public TO test_user;" -ForegroundColor Green
    Write-Host "EOF" -ForegroundColor Green
    Write-Host ""
}

function Test-Connection {
    if ([string]::IsNullOrEmpty($DropletIP)) {
        Write-Host "Enter your DigitalOcean droplet IP: " -NoNewline
        $DropletIP = Read-Host
    }

    Write-Host "`nTesting connection to $DropletIP..." -ForegroundColor Yellow
    
    try {
        $result = Test-NetConnection -ComputerName $DropletIP -Port 5432 -WarningAction SilentlyContinue
        if ($result.TcpTestSucceeded) {
            Write-Host "✅ Connection successful! PostgreSQL is accessible." -ForegroundColor Green
        } else {
            Write-Host "❌ Connection failed. Check:" -ForegroundColor Red
            Write-Host "   1. Droplet IP is correct: $DropletIP"
            Write-Host "   2. PostgreSQL is running on droplet"
            Write-Host "   3. Firewall allows port 5432"
        }
    }
    catch {
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }
}

function Generate-Env-Content {
    if ([string]::IsNullOrEmpty($DropletIP)) {
        Write-Host "Enter your DigitalOcean droplet IP: " -NoNewline
        $DropletIP = Read-Host
    }

    Write-Host "`n=========================================="
    Write-Host "STEP 2: Copy this to .env.test"
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "TEST_DATABASE_URL=`"postgresql://test_user:test_password_123@$DropletIP`:5432/advancia_payledger_test`"" -ForegroundColor Yellow
    Write-Host "DATABASE_URL=`"postgresql://test_user:test_password_123@$DropletIP`:5432/advancia_payledger_test`"" -ForegroundColor Yellow
    Write-Host ""
    
    # Copy to clipboard
    $content = "TEST_DATABASE_URL=`"postgresql://test_user:test_password_123@$DropletIP`:5432/advancia_payledger_test`"`nDATABASE_URL=`"postgresql://test_user:test_password_123@$DropletIP`:5432/advancia_payledger_test`""
    $content | Set-Clipboard
    Write-Host "✅ Copied to clipboard!" -ForegroundColor Green
}

function Run-Migrations {
    Write-Host "`n=========================================="
    Write-Host "STEP 3: Run Prisma migrations"
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not (Test-Path "backend")) {
        Write-Host "❌ Error: backend folder not found. Run this from the project root." -ForegroundColor Red
        return
    }

    Write-Host "Running: npx prisma migrate deploy..." -ForegroundColor Yellow
    cd backend
    npx prisma migrate deploy
    cd ..
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Migrations failed. Check error above." -ForegroundColor Red
    }
}

function Run-Tests {
    Write-Host "`n=========================================="
    Write-Host "STEP 4: Run tests"
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not (Test-Path "backend")) {
        Write-Host "❌ Error: backend folder not found. Run this from the project root." -ForegroundColor Red
        return
    }

    Write-Host "Running: npm test..." -ForegroundColor Yellow
    cd backend
    $env:NODE_ENV = 'test'
    npm test
    cd ..
}

# Main loop
do {
    Show-Menu
    Write-Host "Choose an option: " -NoNewline -ForegroundColor Cyan
    $choice = Read-Host

    switch ($choice) {
        "1" { Show-Setup-Commands }
        "2" { Test-Connection }
        "3" { Generate-Env-Content }
        "4" { Run-Migrations }
        "5" { Run-Tests }
        "6" { 
            Write-Host "`nGoodbye!" -ForegroundColor Green
            exit
        }
        default { Write-Host "Invalid option. Try again." -ForegroundColor Red }
    }
} while ($true)
