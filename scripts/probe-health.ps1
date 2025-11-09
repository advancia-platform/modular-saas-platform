param(
  [string]$Url = 'http://localhost:4000/api/health'
)
$ErrorActionPreference = 'Stop'
try {
  $r = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 10
  Write-Host "STATUS $($r.StatusCode)"
  Write-Output $r.Content
  exit 0
}
catch {
  Write-Host "REQUEST FAILED: $($_.Exception.Message)"
  exit 1
}
