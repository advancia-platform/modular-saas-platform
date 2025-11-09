# ======================================================
# ADVANCIA PAY LEDGER — DAILY AUTO CHECK (Local + Remote)
# ======================================================
# What this does:
#  - Checks key URLs (local dev + production if provided)
#  - Logs results to advancia_daily_log.txt at repo root
#  - Optionally triggers Render frontend deploy via RENDER_DEPLOY_HOOK_FRONTEND (if -TriggerRender)
#
# Usage:
#   Set-ExecutionPolicy Bypass -Scope Process -Force
#   ./ADVANCIA-DAILY-MAINTENANCE.ps1 -ProdFrontend "https://your-frontend.example" -ProdBackendHealth "https://api.example.com/api/system/health" -TriggerRender

param(
  [Parameter(Mandatory=$false)][string]$ProdFrontend,
  [Parameter(Mandatory=$false)][string]$ProdBackendHealth,
  [switch]$TriggerRender
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$root = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$logFile = Join-Path $root 'advancia_daily_log.txt'
$date = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

Write-Host "`n🕛 ADVANCIA PAY LEDGER — NIGHTLY CHECK START" -ForegroundColor Cyan
Add-Content $logFile "`n[$date] - Maintenance started."

function Test-AdvanciaEndpoint {
  param([string]$Url)
  try {
    $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
    if ($resp.StatusCode -eq 200) {
      Write-Host "✅ $Url is healthy" -ForegroundColor Green
      Add-Content $logFile "$Url OK"
    } else {
      Write-Host "⚠ $Url status $($resp.StatusCode)" -ForegroundColor Yellow
      Add-Content $logFile "$Url returned $($resp.StatusCode)"
    }
  } catch {
    Write-Host "❌ $Url unreachable" -ForegroundColor Red
    Add-Content $logFile "$Url unreachable: $($_.Exception.Message)"
  }
}

# Local checks (non-fatal)
Test-AdvanciaEndpoint 'http://localhost:3000'
Test-AdvanciaEndpoint 'http://localhost:4000/api/system/health'

# Production checks if provided
if ($ProdFrontend) { Test-AdvanciaEndpoint $ProdFrontend }
if ($ProdBackendHealth) { Test-AdvanciaEndpoint $ProdBackendHealth }

# Optional: trigger Render deploy hook (helps auto-refresh static assets)
if ($TriggerRender) {
  $hook = $env:RENDER_DEPLOY_HOOK_FRONTEND
  if ([string]::IsNullOrWhiteSpace($hook)) {
    Write-Host 'ℹ RENDER_DEPLOY_HOOK_FRONTEND not set; skipping Render trigger.' -ForegroundColor DarkYellow
    Add-Content $logFile 'Render hook not set.'
  } else {
    try {
      Write-Host '🚀 Triggering Render Frontend Deploy via hook...' -ForegroundColor Cyan
      Invoke-WebRequest -Method Post -Uri $hook -TimeoutSec 20 | Out-Null
      Write-Host '✅ Render deploy hook triggered' -ForegroundColor Green
      Add-Content $logFile 'Render hook triggered.'
    } catch {
      Write-Host "⚠ Failed to trigger Render hook: $($_.Exception.Message)" -ForegroundColor Yellow
      Add-Content $logFile 'Render hook trigger failed.'
    }
  }
}

$dateEnd = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
Add-Content $logFile "✅ Maintenance finished at $dateEnd"
Write-Host "`n🌙 Maintenance complete. Log saved to $logFile" -ForegroundColor Cyan
