$ErrorActionPreference = 'Stop'
$path = Resolve-Path (Join-Path $PSScriptRoot '..\frontend\src\app\auth\register\page.tsx')
$text = Get-Content -Raw -Path $path

# Try to replace the router.push to point to verify-otp with email param
$pattern = 'router\.push\(`?/auth/login\?registered=true[^`]*?`\);'
$replacement = 'router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);'
$updated = [regex]::Replace($text, $pattern, $replacement, 1)

if ($updated -ne $text) {
  Set-Content -Path $path -Value $updated -NoNewline
  Write-Host 'Updated register redirect to /auth/verify-otp' -ForegroundColor Green
} else {
  # Fallback: simple substring replace if regex failed to match
  $updated2 = $text -replace '/auth/login\?registered=true', '/auth/verify-otp?email=${encodeURIComponent(email)}'
  if ($updated2 -ne $text) {
    Set-Content -Path $path -Value $updated2 -NoNewline
    Write-Host 'Updated register redirect (fallback) to /auth/verify-otp' -ForegroundColor Green
  } else {
    Write-Host 'No matching redirect found in register page; leaving as-is' -ForegroundColor Yellow
  }
}