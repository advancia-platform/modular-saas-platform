param(
  [int]$Port = 3001
)

Write-Host "▶ Starting Next.js dev on http://localhost:$Port" -ForegroundColor Cyan

try {
  $conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
  if ($conns) {
    $procIds = $conns | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $procIds) {
      Write-Host "⚠ Killing process on port $Port (PID=$procId)" -ForegroundColor Yellow
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
  }
} catch {}

Push-Location "$PSScriptRoot/..\Frontend"
$env:NODE_ENV='development'

# Prefer binding to 127.0.0.1 to match CORS allowlist
npm run dev:3001

Pop-Location
