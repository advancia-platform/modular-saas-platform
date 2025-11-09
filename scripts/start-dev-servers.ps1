<#
  Starts backend dev (port 4000), frontend standalone (port 3000),
  and frontend dev with HMR (port 3001).
  Uses existing helper scripts and exits quickly with code 0 so the VS Code task succeeds.
#>

$ErrorActionPreference = 'Continue'

Write-Host "🚀 Advancia: Start Development Servers" -ForegroundColor Cyan

# Resolve script directory
$ScriptsDir = $PSScriptRoot

# 1) Start backend dev + frontend standalone (3000) in background
try {
  Write-Host "▶ Launching backend dev + frontend standalone (3000)" -ForegroundColor Cyan
  $p1 = Start-Process pwsh -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',"$ScriptsDir/start-local.ps1" -PassThru -WindowStyle Minimized
  if ($p1 -and $p1.Id) {
    Write-Host "  • start-local.ps1 started (PID=$($p1.Id))" -ForegroundColor DarkGray
  }
} catch {
  Write-Host "⚠ start-local.ps1 encountered an error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 2) Start frontend dev (3001) for hot reload in background
try {
  Write-Host "▶ Launching frontend dev (3001) with HMR" -ForegroundColor Cyan
  $p2 = Start-Process pwsh -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',"$ScriptsDir/start-frontend-dev.ps1" -PassThru -WindowStyle Minimized
  if ($p2 -and $p2.Id) {
    Write-Host "  • start-frontend-dev.ps1 started (PID=$($p2.Id))" -ForegroundColor DarkGray
  }
} catch {
  Write-Host "⚠ start-frontend-dev.ps1 encountered an error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host @"

✅ Launch commands issued. Servers should be ready in ~10–20s.
   Frontend (standalone): http://localhost:3000
   Frontend (dev / HMR):  http://localhost:3001
   Backend (dev):         http://localhost:4000

Admin Login: http://localhost:3000/admin/login
Dev Login:   http://localhost:3001/admin/login
"@
