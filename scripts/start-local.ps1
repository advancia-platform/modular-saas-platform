param(
  [switch]$RebuildFrontend
)

function Kill-Port {
  param([int]$Port)
  try {
    $conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($conns) {
      $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
      foreach ($pid in $pids) {
        Write-Host "⚠ Killing process on port $Port (PID=$pid)" -ForegroundColor Yellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
      }
    }
  } catch {}
}

function Wait-Http {
  param([string]$Url, [int]$TimeoutSec = 60)
  $start = Get-Date
  while ((Get-Date) -lt $start.AddSeconds($TimeoutSec)) {
    try {
      $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) {
        return $true
      }
    } catch {}
    Start-Sleep -Seconds 2
  }
  return $false
}

Write-Host "🚀 Starting Advancia local stack (backend dev + frontend standalone)" -ForegroundColor Cyan

# Resolve repo root relative to this script
$Root = Split-Path -Path $PSScriptRoot -Parent
Set-Location $Root

# 1) Free ports
Kill-Port 3000
Kill-Port 4000

# 2) Start backend (dev)
Write-Host "▶ Starting backend (dev) on http://localhost:4000" -ForegroundColor Cyan
# Ensure NODE_ENV=development so dev-only helpers (like OTP code echo) are enabled
$backend = Start-Process pwsh -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-Command',"cd `"$Root\backend`"; $env:NODE_ENV='development'; npm run dev" -PassThru -WindowStyle Minimized
Start-Sleep -Seconds 4

$backendOk = Wait-Http -Url "http://localhost:4000/api/health" -TimeoutSec 45
if (-not $backendOk) {
  Write-Host "ℹ Backend health endpoint not responding yet; continuing..." -ForegroundColor DarkYellow
}

# 3) Build frontend if needed
Set-Location "$Root\frontend"
$standalonePath = Join-Path (Get-Location) ".next/standalone/server.js"
if ($RebuildFrontend -or -not (Test-Path $standalonePath)) {
  Write-Host "🛠 Building frontend (standalone)" -ForegroundColor Cyan
  npm run build --silent | Write-Host
}

# 4) Start frontend standalone
Write-Host "▶ Starting frontend (standalone) on http://localhost:3000" -ForegroundColor Cyan
# Also run frontend under NODE_ENV=development to aid local debugging
$frontend = Start-Process pwsh -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-Command',"$env:NODE_ENV='development'; node .next/standalone/server.js" -PassThru -WindowStyle Minimized
Start-Sleep -Seconds 3

$feOk = Wait-Http -Url "http://localhost:3000" -TimeoutSec 30
if (-not $feOk) {
  Write-Host "❌ Frontend did not start on port 3000 within timeout" -ForegroundColor Red
} else {
  Write-Host "✅ Frontend: http://localhost:3000" -ForegroundColor Green
}

Write-Host "✅ Backend:  http://localhost:4000" -ForegroundColor Green
Write-Host "🔐 Admin:    http://localhost:3000/admin/login" -ForegroundColor Magenta
