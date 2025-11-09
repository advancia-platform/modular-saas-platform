$ErrorActionPreference = 'Stop'

# Kill existing processes on ports 3000 and 4000
@(3000, 4000) | ForEach-Object {
    $processes = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($processes) {
        $processes | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
        Write-Host "Cleaned up port $_"
    }
}

# Get workspace root
$root = Split-Path -Parent $PSScriptRoot

# Start backend
$backendWindow = Start-Process pwsh -ArgumentList @(
    "-NoProfile",
    "-Command",
    "Set-Location '$root\backend'; npm run dev"
) -PassThru -WindowStyle Normal

# Start frontend
$frontendWindow = Start-Process pwsh -ArgumentList @(
    "-NoProfile",
    "-Command",
    "Set-Location '$root\frontend'; npm run dev"
) -PassThru -WindowStyle Normal

Write-Host @"
🚀 Development servers starting:
   Frontend: http://localhost:3000
   Backend:  http://localhost:4000
   
   Waiting for servers to be ready...
"@

# Wait for ports to be listening
$maxWait = 60
$elapsed = 0
while ($elapsed -lt $maxWait) {
    $frontend = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    $backend = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
    
    if ($frontend -and $backend) {
        Write-Host "✅ Both servers are ready!"
        exit 0
    }
    
    Start-Sleep -Seconds 1
    $elapsed++
}

Write-Host "⚠ Timeout waiting for servers. Check the terminal windows for errors."
exit 1