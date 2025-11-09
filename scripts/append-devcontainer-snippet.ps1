$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$readme = Join-Path $root 'README.md'
$snippetPath = Join-Path $root 'docs/README_DEVCONTAINER_SNIPPET.md'

if (!(Test-Path $snippetPath)) { throw "Snippet file not found: $snippetPath" }
if (!(Test-Path $readme)) { throw "README not found: $readme" }

$snippet = Get-Content -Raw -LiteralPath $snippetPath
$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::AppendAllText($readme, "`r`n`r`n" + $snippet, $enc)

Set-Location $root
& git add README.md | Out-Null
$commitMsg = 'docs: append Dev Containers/Codespaces quick-start to README'
# Commit only if there are staged changes
$changes = git diff --cached --name-only
if ($changes) {
  & git commit -m $commitMsg | Out-Null
  & git push origin main | Out-Null
  Write-Host 'Snippet appended and changes pushed.' -ForegroundColor Green
} else {
  Write-Host 'No changes to commit (README already contains snippet?).' -ForegroundColor Yellow
}
