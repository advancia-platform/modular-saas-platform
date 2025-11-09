param(
  [string]$DatabaseUrl = "postgresql://postgres:password@localhost:5432/saas_platform?schema=public",
  [int]$Port = 4000
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root 'backend'
Write-Host "Starting backend with tsx (watch) on port $Port..." -ForegroundColor Cyan
$env:DATABASE_URL = $DatabaseUrl
$env:PORT = "$Port"
Set-Location $backend
# install deps without running postinstall (prisma generate)
npm install --ignore-scripts | Out-Host
# ensure tsx is available even if devDeps were skipped
npx -y tsx --version | Out-Host
# start
npx -y tsx watch src/index.ts
