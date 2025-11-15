#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Backend Tools Automation Script for Advancia Pay Ledger
    
.DESCRIPTION
    Common operations for Advancia backend including migrations, seeding,
    server management, port cleanup, logs, and database operations.
    
.PARAMETER Action
    The operation to perform: migrate, seed, start, dev, free-port, logs, 
    restart, status, backup, restore, test, lint, build, prisma-studio, health
    
.PARAMETER Port
    Port number for port-related operations (default: 4000)
    
.PARAMETER BackupName
    Name for database backup file (used with backup action)
    
.EXAMPLE
    .\backend-tools.ps1 -Action migrate
    Run database migrations
    
.EXAMPLE
    .\backend-tools.ps1 -Action start
    Start backend server
    
.EXAMPLE
    .\backend-tools.ps1 -Action free-port -Port 4000
    Free port 4000 by killing the process
    
.EXAMPLE
    .\backend-tools.ps1 -Action restart
    Restart backend (free port + start server)
    
.NOTES
    Author: Advancia Pay Dev Team
    Date: November 14, 2025
    Version: 1.0
#>

param (
    [Parameter(Mandatory=$false)]
    [ValidateSet('migrate', 'seed', 'start', 'dev', 'free-port', 'logs', 
                 'restart', 'restart-pm2', 'status', 'backup', 'restore', 
                 'test', 'lint', 'build', 'prisma-studio', 'health', 'pm2-start', 
                 'pm2-stop', 'pm2-status', 'pm2-logs', 'watchdog-start', 
                 'watchdog-stop', 'watchdog-status', 'help')]
    [string]$Action = 'help',
    
    [Parameter(Mandatory=$false)]
    [int]$Port = 4000,
    
    [Parameter(Mandatory=$false)]
    [string]$BackupName = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
)

# Color output functions
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green $args }
function Write-Info { Write-ColorOutput Cyan $args }
function Write-Warning { Write-ColorOutput Yellow $args }
function Write-Failure { Write-ColorOutput Red $args }
function Write-Title { 
    Write-Host ""
    Write-ColorOutput Magenta "═══════════════════════════════════════════════════════"
    Write-ColorOutput Magenta $args
    Write-ColorOutput Magenta "═══════════════════════════════════════════════════════"
    Write-Host ""
}

# Get backend path
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "backend"

# Verify backend directory exists
if (-not (Test-Path $backendPath)) {
    Write-Failure "Backend directory not found at: $backendPath"
    Write-Failure "Please run this script from the project root directory."
    exit 1
}

# Help message
function Show-Help {
    Write-Title "Advancia Pay Backend Tools - Help"
    
    Write-Info "USAGE:"
    Write-Host "  .\backend-tools.ps1 -Action <action> [-Port <port>] [-BackupName <name>]"
    Write-Host ""
    
    Write-Info "AVAILABLE ACTIONS:"
    Write-Host ""
    
    Write-Success "  Database Operations:"
    Write-Host "    migrate          Run Prisma database migrations"
    Write-Host "    seed             Seed admin user into database"
    Write-Host "    backup           Create database backup"
    Write-Host "    restore          Restore database from backup"
    Write-Host "    prisma-studio    Open Prisma Studio (database GUI)"
    Write-Host ""
    
    Write-Success "  Server Operations:"
    Write-Host "    start            Start backend server (production mode)"
    Write-Host "    dev              Start backend in development mode (nodemon)"
    Write-Host "    restart          Restart backend (free port + start)"
    Write-Host "    free-port        Free specified port (default: 4000)"
    Write-Host "    status           Check backend server status"
    Write-Host "    health           Check backend health endpoint"
    Write-Host "    logs             Show PM2 logs (if using PM2)"
    Write-Host ""
    
    Write-Success "  PM2 Process Management:"
    Write-Host "    pm2-start        Start backend as PM2 daemon"
    Write-Host "    pm2-stop         Stop PM2 managed backend"
    Write-Host "    pm2-restart      Restart PM2 managed backend"
    Write-Host "    restart-pm2      Free port + restart with PM2"
    Write-Host "    pm2-status       Show PM2 process status"
    Write-Host "    pm2-logs         Show PM2 logs (real-time)"
    Write-Host ""
    
    Write-Success "  Auto-Restart Watchdog:"
    Write-Host "    watchdog-start   Start health monitoring watchdog"
    Write-Host "    watchdog-stop    Stop running watchdog"
    Write-Host "    watchdog-status  Check watchdog status"
    Write-Host ""
    
    Write-Success "  Development Tools:"
    Write-Host "    test             Run test suite"
    Write-Host "    lint             Run ESLint code linting"
    Write-Host "    build            Build TypeScript (if configured)"
    Write-Host ""
    
    Write-Host ""
    Write-Info "EXAMPLES:"
    Write-Host "  .\backend-tools.ps1 -Action migrate"
    Write-Host "  .\backend-tools.ps1 -Action seed"
    Write-Host "  .\backend-tools.ps1 -Action restart"
    Write-Host "  .\backend-tools.ps1 -Action restart-pm2"
    Write-Host "  .\backend-tools.ps1 -Action pm2-start"
    Write-Host "  .\backend-tools.ps1 -Action pm2-logs"
    Write-Host "  .\backend-tools.ps1 -Action free-port -Port 5000"
    Write-Host "  .\backend-tools.ps1 -Action backup -BackupName 'pre-deploy.sql'"
    Write-Host "  .\backend-tools.ps1 -Action health"
    Write-Host ""
}

# Free port function
function Free-Port {
    param([int]$PortNumber)
    
    Write-Info "Checking port $PortNumber..."
    try {
        $connection = Get-NetTCPConnection -LocalPort $PortNumber -ErrorAction Stop
        $pid = $connection.OwningProcess | Select-Object -First 1
        
        $processInfo = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($processInfo) {
            Write-Warning "Port $PortNumber is in use by:"
            Write-Warning "  PID: $pid"
            Write-Warning "  Name: $($processInfo.ProcessName)"
            Write-Warning "  Path: $($processInfo.Path)"
        }
        
        Write-Warning "Terminating process $pid..."
        Stop-Process -Id $pid -Force -ErrorAction Stop
        Start-Sleep -Seconds 2
        Write-Success "✓ Port $PortNumber has been freed."
        return $true
    }
    catch {
        Write-Success "✓ Port $PortNumber is not in use."
        return $false
    }
}

# Main action handler
Write-Title "Advancia Pay Backend Tools"

switch ($Action) {
    "migrate" {
        Write-Info "Running database migrations..."
        Push-Location $backendPath
        try {
            npx prisma migrate dev
            Write-Success "✓ Migrations completed successfully"
        }
        catch {
            Write-Failure "✗ Migration failed: $_"
            Pop-Location
            exit 1
        }
        Pop-Location
    }

    "seed" {
        Write-Info "Seeding admin user..."
        Push-Location $backendPath
        try {
            node src\seed.js
            Write-Success "✓ Admin user seeded successfully"
        }
        catch {
            Write-Failure "✗ Seeding failed: $_"
            Pop-Location
            exit 1
        }
        Pop-Location
    }

    "start" {
        Write-Info "Starting backend server (production mode)..."
        Push-Location $backendPath
        try {
            # Run migrations first
            Write-Info "Running migrations..."
            node src\migrations\runMigrations.js
            
            Write-Success "✓ Starting server on port $Port..."
            node src\index.js
        }
        catch {
            Write-Failure "✗ Failed to start backend: $_"
            Pop-Location
            exit 1
        }
        Pop-Location
    }

    "dev" {
        Write-Info "Starting backend in DEVELOPMENT mode (nodemon)..."
        Push-Location $backendPath
        try {
            # Check if nodemon is available
            $nodemonExists = Get-Command nodemon -ErrorAction SilentlyContinue
            if (-not $nodemonExists) {
                Write-Warning "nodemon not found. Installing globally..."
                npm install -g nodemon
            }
            
            Write-Success "✓ Starting development server with auto-reload..."
            npx nodemon src\index.js
        }
        catch {
            Write-Failure "✗ Failed to start dev server: $_"
            Pop-Location
            exit 1
        }
        Pop-Location
    }

    "free-port" {
        Free-Port -PortNumber $Port
    }

    "logs" {
        Write-Info "Fetching PM2 logs..."
        try {
            $pm2Exists = Get-Command pm2 -ErrorAction SilentlyContinue
            if (-not $pm2Exists) {
                Write-Warning "PM2 not installed. Showing local logs instead..."
                Push-Location $backendPath
                if (Test-Path "logs") {
                    Get-Content "logs\combined.log" -Tail 50
                } else {
                    Write-Warning "No logs directory found"
                }
                Pop-Location
            } else {
                pm2 logs advancia-backend --lines 50
            }
        }
        catch {
            Write-Failure "✗ Failed to fetch logs: $_"
        }
    }

    "restart" {
        Write-Info "Restarting backend server..."
        
        # Step 1: Free the port
        Free-Port -PortNumber $Port
        
        # Step 2: Start the server
        Write-Info "Starting backend server..."
        Push-Location $backendPath
        try {
            node src\migrations\runMigrations.js
            Write-Success "✓ Migrations complete. Starting server..."
            node src\index.js
        }
        catch {
            Write-Failure "✗ Failed to restart backend: $_"
            Pop-Location
            exit 1
        }
        Pop-Location
    }

    "status" {
        Write-Info "Checking backend server status..."
        
        # Check if port is listening
        $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($connection) {
            $pid = $connection.OwningProcess
            $processInfo = Get-Process -Id $pid -ErrorAction SilentlyContinue
            Write-Success "✓ Backend server is RUNNING"
            Write-Info "  Port: $Port"
            Write-Info "  PID: $pid"
            Write-Info "  Process: $($processInfo.ProcessName)"
            Write-Info "  Memory: $([math]::Round($processInfo.WorkingSet64 / 1MB, 2)) MB"
        } else {
            Write-Warning "✗ Backend server is NOT running on port $Port"
        }
    }

    "backup" {
        Write-Info "Creating database backup: $BackupName"
        Push-Location $backendPath
        try {
            # Load DATABASE_URL from .env
            if (Test-Path ".env") {
                $envContent = Get-Content ".env"
                $dbUrl = ($envContent | Select-String "DATABASE_URL=").ToString() -replace "DATABASE_URL=", ""
                
                Write-Info "Backing up database..."
                pg_dump $dbUrl > "..\backups\$BackupName"
                Write-Success "✓ Backup created: backups\$BackupName"
            } else {
                Write-Failure "✗ .env file not found"
            }
        }
        catch {
            Write-Failure "✗ Backup failed: $_"
            Pop-Location
            exit 1
        }
        Pop-Location
    }

    "restore" {
        Write-Warning "Database restore operation"
        Write-Warning "This will OVERWRITE the current database!"
        Write-Host ""
        $confirm = Read-Host "Type 'YES' to confirm"
        
        if ($confirm -eq "YES") {
            Push-Location $backendPath
            try {
                if (Test-Path ".env") {
                    $envContent = Get-Content ".env"
                    $dbUrl = ($envContent | Select-String "DATABASE_URL=").ToString() -replace "DATABASE_URL=", ""
                    
                    Write-Info "Restoring database from: $BackupName"
                    psql $dbUrl < "..\backups\$BackupName"
                    Write-Success "✓ Database restored successfully"
                } else {
                    Write-Failure "✗ .env file not found"
                }
            }
            catch {
                Write-Failure "✗ Restore failed: $_"
                Pop-Location
                exit 1
            }
            Pop-Location
        } else {
            Write-Info "Restore cancelled"
        }
    }

    "test" {
        Write-Info "Running test suite..."
        Push-Location $backendPath
        try {
            npm test
            Write-Success "✓ Tests completed"
        }
        catch {
            Write-Failure "✗ Tests failed"
            Pop-Location
            exit 1
        }
        Pop-Location
    }

    "lint" {
        Write-Info "Running ESLint..."
        Push-Location $backendPath
        try {
            npm run lint
            Write-Success "✓ Linting completed"
        }
        catch {
            Write-Warning "✗ Linting found issues"
            Pop-Location
            exit 1
        }
        Pop-Location
    }

    "build" {
        Write-Info "Building TypeScript..."
        Push-Location $backendPath
        try {
            npm run build
            Write-Success "✓ Build completed"
        }
        catch {
            Write-Failure "✗ Build failed"
            Pop-Location
            exit 1
        }
        Pop-Location
    }

    "prisma-studio" {
        Write-Info "Opening Prisma Studio..."
        Push-Location $backendPath
        try {
            npx prisma studio
        }
        catch {
            Write-Failure "✗ Failed to open Prisma Studio: $_"
            Pop-Location
            exit 1
        }
        Pop-Location
    }

    "health" {
        Write-Info "Checking backend health endpoint..."
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:$Port/api/health" -Method Get -ErrorAction Stop
            Write-Success "✓ Backend is healthy"
            Write-Info "Response: $($response | ConvertTo-Json)"
        }
        catch {
            Write-Failure "✗ Health check failed: $_"
            Write-Warning "Backend may not be running on port $Port"
        }
    }

    "pm2-start" {
        Write-Info "Starting backend with PM2..."
        Push-Location $backendPath
        try {
            # Check if PM2 is installed
            $pm2Exists = Get-Command pm2 -ErrorAction SilentlyContinue
            if (-not $pm2Exists) {
                Write-Warning "PM2 not found. Installing globally..."
                npm install -g pm2
            }
            
            # Check if process already exists
            $pm2List = pm2 jlist | ConvertFrom-Json
            $existingProcess = $pm2List | Where-Object { $_.name -eq "advancia-backend" }
            
            if ($existingProcess) {
                Write-Warning "Backend already running in PM2. Use 'pm2-restart' to restart."
                pm2 status advancia-backend
            } else {
                Write-Info "Starting backend with PM2..."
                pm2 start src\index.js --name advancia-backend --watch --max-memory-restart 1G
                pm2 save
                Write-Success "✓ Backend started with PM2"
                Write-Info "Use 'pm2-logs' to view logs or 'pm2-status' to check status"
            }
        }
        catch {
            Write-Failure "✗ Failed to start with PM2: $_"
            Pop-Location
            exit 1
        }
        Pop-Location
    }

    "pm2-stop" {
        Write-Info "Stopping PM2 managed backend..."
        try {
            pm2 stop advancia-backend
            Write-Success "✓ Backend stopped"
        }
        catch {
            Write-Failure "✗ Failed to stop PM2 process: $_"
        }
    }

    "pm2-restart" {
        Write-Info "Restarting PM2 managed backend..."
        try {
            pm2 restart advancia-backend
            Write-Success "✓ Backend restarted with PM2"
        }
        catch {
            Write-Failure "✗ Failed to restart PM2 process: $_"
        }
    }

    "restart-pm2" {
        Write-Info "Restarting backend with PM2 (port cleanup + PM2 restart)..."
        
        # Step 1: Free the port
        Free-Port -PortNumber $Port
        
        # Step 2: Check if PM2 is installed
        $pm2Exists = Get-Command pm2 -ErrorAction SilentlyContinue
        if (-not $pm2Exists) {
            Write-Warning "PM2 not installed. Installing globally..."
            npm install -g pm2
        }
        
        # Step 3: Restart or start with PM2
        Push-Location $backendPath
        try {
            $pm2List = pm2 jlist | ConvertFrom-Json
            $existingProcess = $pm2List | Where-Object { $_.name -eq "advancia-backend" }
            
            if ($existingProcess) {
                Write-Info "Restarting existing PM2 process..."
                pm2 restart advancia-backend
            } else {
                Write-Info "Starting new PM2 process..."
                pm2 start src\index.js --name advancia-backend --watch --max-memory-restart 1G
                pm2 save
            }
            
            Write-Success "✓ Backend running with PM2"
            Write-Info "Checking status..."
            pm2 status advancia-backend
        }
        catch {
            Write-Failure "✗ Failed to restart with PM2: $_"
            Pop-Location
            exit 1
        }
        Pop-Location
    }

    "pm2-status" {
        Write-Info "Checking PM2 process status..."
        try {
            pm2 status advancia-backend
        }
        catch {
            Write-Failure "✗ Failed to get PM2 status: $_"
        }
    }

    "pm2-logs" {
        Write-Info "Showing PM2 logs (Ctrl+C to exit)..."
        try {
            pm2 logs advancia-backend --lines 50
        }
        catch {
            Write-Failure "✗ Failed to show PM2 logs: $_"
        }
    }

    "watchdog-start" {
        Write-Info "Starting backend watchdog..."
        $watchdogScript = Join-Path $PSScriptRoot "backend-watchdog.ps1"
        
        if (-not (Test-Path $watchdogScript)) {
            Write-Failure "✗ Watchdog script not found at: $watchdogScript"
            exit 1
        }
        
        # Check if watchdog is already running
        $existingWatchdog = Get-Process -Name "pwsh" -ErrorAction SilentlyContinue | 
            Where-Object { $_.CommandLine -like "*backend-watchdog.ps1*" }
        
        if ($existingWatchdog) {
            Write-Warning "Watchdog is already running (PID: $($existingWatchdog.Id))"
            Write-Info "Use 'watchdog-stop' to stop it first"
            exit 0
        }
        
        Write-Info "Launching watchdog in background..."
        $watchdogProcess = Start-Process -FilePath "pwsh" `
            -ArgumentList "-NoExit", "-File", $watchdogScript, "-Port", $Port `
            -PassThru -WindowStyle Minimized
        
        Start-Sleep -Seconds 2
        
        if ($watchdogProcess -and !$watchdogProcess.HasExited) {
            Write-Success "✓ Watchdog started successfully (PID: $($watchdogProcess.Id))"
            Write-Info "Monitoring backend health on port $Port"
            Write-Info "Use 'watchdog-status' to check status"
            Write-Info "Use 'watchdog-stop' to stop monitoring"
        } else {
            Write-Failure "✗ Failed to start watchdog"
        }
    }

    "watchdog-stop" {
        Write-Info "Stopping backend watchdog..."
        
        $watchdogProcesses = Get-Process -Name "pwsh" -ErrorAction SilentlyContinue | 
            Where-Object { $_.CommandLine -like "*backend-watchdog.ps1*" }
        
        if ($watchdogProcesses) {
            foreach ($proc in $watchdogProcesses) {
                Write-Warning "Stopping watchdog (PID: $($proc.Id))..."
                Stop-Process -Id $proc.Id -Force
            }
            Write-Success "✓ Watchdog stopped"
        } else {
            Write-Info "No running watchdog found"
        }
    }

    "watchdog-status" {
        Write-Info "Checking watchdog status..."
        
        $watchdogProcesses = Get-Process -Name "pwsh" -ErrorAction SilentlyContinue | 
            Where-Object { $_.CommandLine -like "*backend-watchdog.ps1*" }
        
        if ($watchdogProcesses) {
            Write-Success "✓ Watchdog is RUNNING"
            foreach ($proc in $watchdogProcesses) {
                $uptime = (Get-Date) - $proc.StartTime
                Write-Info "  PID: $($proc.Id)"
                Write-Info "  Start Time: $($proc.StartTime)"
                Write-Info "  Uptime: $($uptime.ToString('hh\:mm\:ss'))"
                Write-Info "  Memory: $([math]::Round($proc.WorkingSet64 / 1MB, 2)) MB"
            }
            
            # Show recent watchdog logs if available
            $logFile = Join-Path $PSScriptRoot "logs\watchdog.log"
            if (Test-Path $logFile) {
                Write-Host ""
                Write-Info "Recent watchdog activity (last 10 lines):"
                Get-Content $logFile -Tail 10 | ForEach-Object { Write-Host "  $_" }
            }
        } else {
            Write-Warning "✗ Watchdog is NOT running"
            Write-Info "Use 'watchdog-start' to start monitoring"
        }
    }

    "help" {
        Show-Help
    }

    default {
        Write-Failure "Unknown action: $Action"
        Show-Help
        exit 1
    }
}

Write-Host ""
Write-Success "=== Operation completed ==="
Write-Host ""
