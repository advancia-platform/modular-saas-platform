$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))
$line = '!.vscode/launch.json'
$giPath = '.gitignore'
if (!(Test-Path $giPath)) { throw ".gitignore not found" }
$content = Get-Content -Raw -LiteralPath $giPath
if ($content -notmatch [regex]::Escape($line)) {
  Add-Content -LiteralPath $giPath -Value "`r`n# Allow VS Code launch config for team debugging`r`n$line"  
  git add .gitignore | Out-Null
  git commit -m 'chore: whitelist .vscode/launch.json in .gitignore' | Out-Null
  git push origin main | Out-Null
  Write-Host 'Whitelisted launch.json in .gitignore and pushed.' -ForegroundColor Green
} else {
  Write-Host 'launch.json already whitelisted in .gitignore' -ForegroundColor Yellow
}
