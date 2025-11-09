$ErrorActionPreference = 'Stop'

Write-Host '▶ Running full Advancia deploy...'

$root = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { (Get-Location).Path }
$deployScript = Join-Path $root 'scripts/ADVANCIA-FULL-DEPLOY.ps1'
$logsDir = Join-Path $root 'scripts/logs'

# Clean up logs older than 7 days
if (Test-Path $logsDir) {
  Get-ChildItem $logsDir -Filter 'deploy-*.txt' -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } |
    Remove-Item -Force -ErrorAction SilentlyContinue
}

# Run deploy script
& $deployScript
$exitCode = $LASTEXITCODE

# Show latest log (last 200 lines)
if (Test-Path $logsDir) {
  $latest = Get-ChildItem $logsDir -Filter 'deploy-*.txt' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($latest) {
    Write-Host ("📄 Latest log: " + $latest.FullName)
    try {
      Get-Content -Path $latest.FullName -Tail 200
    } catch {}
  } else {
    Write-Host '⚠ No log found to display.'
  }
} else {
  Write-Host '⚠ Logs directory not found.'
}

# Optional VS Code notification if code-notify is installed
try {
  $result = if ($exitCode -eq 0) { '✅ Deploy successful' } else { '❌ Deploy failed' }
  if (Get-Command code-notify -ErrorAction SilentlyContinue) {
    code-notify $result | Out-Null
  } else {
    Write-Host 'ℹ VS Code notify not installed (ext install fabiospampinato.vscode-notify)'
  }
} catch {}

# Launch frontend preview
try { Start-Process 'http://localhost:3000' } catch {}

exit $exitCode
