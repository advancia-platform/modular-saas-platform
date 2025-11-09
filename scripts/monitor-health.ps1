param(
  [string]$Url = "https://api.advanciapayledger.com/api/health",
  [int]$MaxAttempts = 40,
  [int]$IntervalSeconds = 15
)
$ErrorActionPreference = 'SilentlyContinue'
for ($i = 1; $i -le $MaxAttempts; $i++) {
  $ts = Get-Date -Format o
  try {
    $res = Invoke-WebRequest -Uri $Url -TimeoutSec 12
    Write-Host "[$ts] ✅ OK $($res.StatusCode)" -ForegroundColor Green
    try {
      $json = Invoke-RestMethod -Uri $Url -TimeoutSec 12
      Write-Host "[$ts] Details: status=$($json.status) env=$($json.environment)" -ForegroundColor DarkGray
    } catch {}
    exit 0
  } catch {
    Write-Host "[$ts] ⏳ waiting: $($_.Exception.Message)" -ForegroundColor Yellow
    Start-Sleep -Seconds $IntervalSeconds
  }
}
Write-Host "[$(Get-Date -Format o)] ❌ Timed out waiting for healthy status" -ForegroundColor Red
exit 1
