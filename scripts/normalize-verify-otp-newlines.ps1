$ErrorActionPreference = 'Stop'
$path = Resolve-Path (Join-Path $PSScriptRoot '..\frontend\src\app\auth\verify-otp\page.tsx')
$text = Get-Content -Raw -Path $path
$updated = $text -replace "`r`n", "`r`n" # no-op to ensure encoding
$updated = $updated -replace "\x60r\x60n", "`r`n"  # replace literal `r`n with CRLF
$updated = $updated -replace "\\r\\n", "`r`n"    # replace escaped \r\n with CRLF
Set-Content -Path $path -Value $updated -NoNewline
Write-Host "Normalized newlines in verify-otp page" -ForegroundColor Green