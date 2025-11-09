# PowerShell script for Windows - Auto-restart both services
Write-Host "🚀 Starting Advancia Pay Ledger (Resilient Mode)" -ForegroundColor Green

# Create logs directory
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [string]$Url,
        [int]$MaxAttempts = 30
    )
    
    Write-Host "⏳ Waiting for $ServiceName to be ready..." -ForegroundColor Yellow
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 2 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $ServiceName is healthy" -ForegroundColor Green
                return $true
            }
        } catch {
            Write-Host "   Attempt $i/$MaxAttempts..."
            Start-Sleep -Seconds 2
        }
    }
    
    Write-Host "❌ $ServiceName health check failed" -ForegroundColor Red
    return $false
}

# Backend auto-restart loop
$backendJob = Start-Job -ScriptBlock {
    param($rootPath)
    Set-Location "$rootPath\backend"
    
    while ($true) {
        try {
            Write-Host "📦 Starting Backend..." -ForegroundColor Green
            $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
            npm start 2>&1 | Tee-Object -FilePath "$rootPath\logs\backend-$timestamp.log"
        } catch {
            Write-Host "❌ Backend crashed: $_" -ForegroundColor Red
        }
        
        Write-Host "🔄 Restarting Backend in 5 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
} -ArgumentList $PSScriptRoot\..

# Wait for backend
Start-Sleep -Seconds 8
Test-ServiceHealth -ServiceName "Backend" -Url "http://localhost:4000/api/health"

# Frontend auto-restart loop
$frontendJob = Start-Job -ScriptBlock {
    param($rootPath)
    Set-Location "$rootPath\frontend"
    
    while ($true) {
        try {
            Write-Host "🎨 Starting Frontend..." -ForegroundColor Green
            $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
            npm start 2>&1 | Tee-Object -FilePath "$rootPath\logs\frontend-$timestamp.log"
        } catch {
            Write-Host "❌ Frontend crashed: $_" -ForegroundColor Red
        }
        
        Write-Host "🔄 Restarting Frontend in 5 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
} -ArgumentList $PSScriptRoot\..

# Wait for frontend
Start-Sleep -Seconds 8
Test-ServiceHealth -ServiceName "Frontend" -Url "http://localhost:3000"

Write-Host ""
Write-Host "✨ All services running with auto-restart enabled" -ForegroundColor Green
Write-Host "📊 Backend:  http://localhost:4000" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow

# Keep script running and monitor jobs
try {
    while ($true) {
        Start-Sleep -Seconds 10
        
        # Check if jobs are still running
        if ($backendJob.State -ne 'Running') {
            Write-Host "⚠️  Backend job stopped unexpectedly, restarting..." -ForegroundColor Yellow
            Remove-Job $backendJob -Force
            $backendJob = Start-Job -ScriptBlock $backendJob.Command
        }
        
        if ($frontendJob.State -ne 'Running') {
            Write-Host "⚠️  Frontend job stopped unexpectedly, restarting..." -ForegroundColor Yellow
            Remove-Job $frontendJob -Force
            $frontendJob = Start-Job -ScriptBlock $frontendJob.Command
        }
    }
} finally {
    Write-Host "`n🛑 Shutting down services..." -ForegroundColor Yellow
    Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob, $frontendJob -Force -ErrorAction SilentlyContinue
    Write-Host "✅ All services stopped" -ForegroundColor Green
}
