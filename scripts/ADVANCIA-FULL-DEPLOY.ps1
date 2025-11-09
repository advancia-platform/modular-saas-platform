# ==============================================================
# ADVANCIA PAY LEDGER — FULL BUILD & START WITH NOTIFY
# ==============================================================
# Builds backend + frontend, starts both apps, sends success/failure notification.
# Usage:
#   pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/ADVANCIA-FULL-DEPLOY.ps1

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# --- Logging setup -----------------------------------------------------------
$root = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { (Get-Location).Path }
$logsDir = Join-Path $root 'scripts/logs'
if (!(Test-Path $logsDir)) { New-Item -ItemType Directory -Force -Path $logsDir | Out-Null }
$timestamp = [DateTime]::Now.ToString('yyyyMMdd-HHmmss')
$logFile = Join-Path $logsDir ("deploy-$timestamp.txt")
try { Start-Transcript -Path $logFile -Append | Out-Null } catch { }

Write-Host "`n🚀 Starting full Advancia build & deploy... (logging to $logFile)" -ForegroundColor Cyan

function Invoke-Npm {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][string]$Label
  )
  Push-Location $Path
  try {
    if (Test-Path 'package-lock.json') { npm ci } else { npm install }
    Write-Host "🧱 Building $Label..." -ForegroundColor Yellow
    npm run -s build
    Write-Host "✅ $Label build succeeded." -ForegroundColor Green
  } finally {
    Pop-Location
  }
}

function Test-Health {
  param(
    [Parameter(Mandatory=$true)][string]$Url,
    [Parameter(Mandatory=$true)][string]$Label
  )
  try {
    Write-Host "🔍 Checking $Label at $Url ..." -ForegroundColor Cyan
    $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
    if ($resp.StatusCode -eq 200) {
      Write-Host "✅ $Label healthy" -ForegroundColor Green
      return $true
    } else {
      Write-Host "⚠ $Label responded with status $($resp.StatusCode)" -ForegroundColor Yellow
      return $false
    }
  } catch {
    Write-Host "❌ $Label health check failed: $($_.Exception.Message)" -ForegroundColor Red
    return $false
  }
}

try {
  $backend = Join-Path $root 'backend'
  $frontend = Join-Path $root 'frontend'
  $notifier = Join-Path $root 'notify-status.ps1'

  if (!(Test-Path $backend)) { throw "Backend folder not found at $backend" }
  if (!(Test-Path $frontend)) { throw "Frontend folder not found at $frontend" }
  if (!(Test-Path $notifier)) { Write-Host 'ℹ notify-status.ps1 not found; continuing without notifications.' -ForegroundColor DarkYellow }

  # Backend build (with retry)
  $backendOk = $false
  try { Invoke-Npm -Path $backend -Label 'Backend'; $backendOk = $true } catch { Write-Host "⚠ Backend build failed: $($_.Exception.Message)" -ForegroundColor Yellow }
  if (-not $backendOk) {
    Write-Host '🔁 Retrying backend build once...' -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    Invoke-Npm -Path $backend -Label 'Backend (Retry)'
  }

  # Frontend build
  Invoke-Npm -Path $frontend -Label 'Frontend'

  # Start both apps (production start)
  Write-Host "🚀 Starting backend and frontend servers..." -ForegroundColor Cyan
  Start-Job -ScriptBlock { Set-Location $using:backend; npm start } | Out-Null
  Start-Job -ScriptBlock { Set-Location $using:frontend; npm start } | Out-Null

  # Wait and health-check
  Write-Host "⏳ Waiting 15 seconds for servers to boot..." -ForegroundColor DarkCyan
  Start-Sleep -Seconds 15
  $backendOk = Test-Health -Url "http://localhost:4000/api/system/health" -Label "Backend API"
  $frontendOk = Test-Health -Url "http://localhost:3000" -Label "Frontend UI"

  if ($backendOk -and $frontendOk) {
    if (Test-Path $notifier) { & $notifier 'success' }
    Write-Host '🎉 All systems operational.' -ForegroundColor Green
  } else {
    throw "One or more services failed health check."
  }
}
catch {
  Write-Host "❌ Full deployment failed: $($_.Exception.Message)" -ForegroundColor Red
  $notifier = Join-Path $root 'notify-status.ps1'
  if (Test-Path $notifier) { & $notifier 'failed' }
  exit 1
}
finally {
  try { Stop-Transcript | Out-Null } catch { }
}
