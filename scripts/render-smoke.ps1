param(
  [Parameter(Mandatory=$true)][string]$BaseUrl
)
$ErrorActionPreference = 'Stop'

function Test-Endpoint {
  param([string]$Url)
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 15
    Write-Host "[OK] $Url : $($r.StatusCode)" -ForegroundColor Green
    if ($r.Content) { $r.Content | Write-Output }
  } catch {
    Write-Host "[FAIL] $Url : $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host "Running Render smoke tests against $BaseUrl" -ForegroundColor Cyan

# 1) Health
Test-Endpoint "$BaseUrl/api/health"

# Expandable: add more GETs here as routes go public
# Test-Endpoint "$BaseUrl/api/system/info"
