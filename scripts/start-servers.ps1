$ErrorActionPreference = 'Stop'

Write-Host "🔨 Starting Advancia development servers..."

# Kill any processes using port 3000 or 4000
Write-Host "🧹 Cleaning up ports..."
$ports = @(3000, 4000)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($process) {
        Stop-Process -Id $process -Force
        Write-Host "  Killed process using port $port"
    }
}

# Create background jobs for each server
$root = Split-Path -Parent $PSScriptRoot

# Install dependencies if needed
if (!(Test-Path "$root\frontend\node_modules")) {
    Write-Host "📦 Installing frontend dependencies..."
    Push-Location "$root\frontend"
    npm install
    Pop-Location
}

if (!(Test-Path "$root\backend\node_modules")) {
    Write-Host "📦 Installing backend dependencies..."
    Push-Location "$root\backend"
    npm install
    Pop-Location
}

# Start backend
Write-Host "🚀 Starting backend server..."
Start-Process pwsh -ArgumentList "-NoProfile -Command `"Set-Location '$root\backend'; npm run dev`"" -WindowStyle Normal

# Start frontend
Write-Host "🚀 Starting frontend server..."
Start-Process pwsh -ArgumentList "-NoProfile -Command `"Set-Location '$root\frontend'; npm run dev`"" -WindowStyle Normal

Write-Host @"

✨ Development servers started!
   Backend: http://localhost:4000
   Frontend: http://localhost:3000

Press Ctrl+C in the server windows to stop them.
"@