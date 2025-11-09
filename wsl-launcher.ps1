# Advancia Pay Ledger - WSL Quick Launcher
# Run this from Windows PowerShell to set up and launch the app in WSL

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("setup", "start", "stop", "status", "logs", "shell")]
    [string]$Action = "shell"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Advancia Pay Ledger - WSL Launcher" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

function Test-WSL {
    try {
        $wslStatus = wsl --status 2>&1
        return $true
    } catch {
        Write-Host "❌ WSL is not installed or not running" -ForegroundColor Red
        Write-Host ""
        Write-Host "To install WSL, run:" -ForegroundColor Yellow
        Write-Host "  wsl --install" -ForegroundColor White
        Write-Host ""
        return $false
    }
}

function Start-WSLSetup {
    Write-Host "📦 Starting WSL setup..." -ForegroundColor Green
    Write-Host ""
    
    # Copy setup script to WSL if needed
    Write-Host "Copying setup script to WSL..." -ForegroundColor Yellow
    wsl cp /mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform/wsl-setup.sh ~/wsl-setup.sh
    wsl chmod +x ~/wsl-setup.sh
    
    Write-Host ""
    Write-Host "Running setup script (this may take 10-15 minutes)..." -ForegroundColor Yellow
    wsl bash ~/wsl-setup.sh
    
    Write-Host ""
    Write-Host "✅ Setup complete!" -ForegroundColor Green
}

function Start-WSLServices {
    Write-Host "▶️  Starting Advancia services in WSL..." -ForegroundColor Green
    Write-Host ""
    
    wsl bash -c "cd ~/advancia-pay-ledger && pm2 start ecosystem.config.js"
    
    Write-Host ""
    Write-Host "✅ Services started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access the application at:" -ForegroundColor Cyan
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "  Backend:  http://localhost:4000" -ForegroundColor White
    Write-Host "  Admin:    http://localhost:3000/admin/login" -ForegroundColor White
}

function Stop-WSLServices {
    Write-Host "⏹️  Stopping Advancia services..." -ForegroundColor Yellow
    wsl bash -c "pm2 stop all"
    Write-Host "✅ Services stopped!" -ForegroundColor Green
}

function Get-WSLStatus {
    Write-Host "📊 Checking service status..." -ForegroundColor Cyan
    Write-Host ""
    wsl bash -c "pm2 status"
}

function Get-WSLLogs {
    Write-Host "📋 Viewing logs (Ctrl+C to exit)..." -ForegroundColor Cyan
    Write-Host ""
    wsl bash -c "pm2 logs"
}

function Enter-WSLShell {
    Write-Host "🐧 Entering WSL shell..." -ForegroundColor Cyan
    Write-Host "Type 'exit' to return to PowerShell" -ForegroundColor Yellow
    Write-Host ""
    wsl bash -c "cd ~/advancia-pay-ledger && exec bash"
}

# Main execution
if (-not (Test-WSL)) {
    exit 1
}

switch ($Action) {
    "setup" {
        Start-WSLSetup
    }
    "start" {
        Start-WSLServices
    }
    "stop" {
        Stop-WSLServices
    }
    "status" {
        Get-WSLStatus
    }
    "logs" {
        Get-WSLLogs
    }
    "shell" {
        Enter-WSLShell
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Available commands:" -ForegroundColor Cyan
Write-Host "  .\wsl-launcher.ps1 setup   - Run initial setup" -ForegroundColor White
Write-Host "  .\wsl-launcher.ps1 start   - Start services" -ForegroundColor White
Write-Host "  .\wsl-launcher.ps1 stop    - Stop services" -ForegroundColor White
Write-Host "  .\wsl-launcher.ps1 status  - Check status" -ForegroundColor White
Write-Host "  .\wsl-launcher.ps1 logs    - View logs" -ForegroundColor White
Write-Host "  .\wsl-launcher.ps1 shell   - Open WSL shell" -ForegroundColor White
Write-Host ""
