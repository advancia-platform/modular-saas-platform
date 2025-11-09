$ErrorActionPreference = 'Stop'
$path = Join-Path $PSScriptRoot '..' 'README.md' | Resolve-Path
$text = Get-Content -LiteralPath $path -Raw

$devPattern = '(?ms)^## Develop in Dev Containers or Codespaces\s*.*?(?=^##\s|\Z)'
$devMatch = [regex]::Match($text, $devPattern)
if (-not $devMatch.Success) {
  Write-Host 'Dev Containers section not found; no change.'
  exit 0
}

$devSection = $devMatch.Value -replace '^## Develop', '### Develop'
$textWithoutDev = [regex]::Replace($text, $devPattern, '')

$dockerPattern = '(?ms)^### Docker Development\s*.*?(?=^###\s|^##\s|\Z)'
$dockerMatch = [regex]::Match($textWithoutDev, $dockerPattern)
if (-not $dockerMatch.Success) {
  Write-Host 'Docker Development section not found; no change.'
  exit 0
}

$insertIndex = $dockerMatch.Index + $dockerMatch.Length
$before = $textWithoutDev.Substring(0, $insertIndex)
$after = $textWithoutDev.Substring($insertIndex)

$newText = $before + "`r`n`r`n" + ($devSection.Trim()) + "`r`n`r`n" + $after

Set-Content -LiteralPath $path -Value $newText -Encoding utf8
Write-Host 'README.md updated: moved Dev Containers section under Development.'