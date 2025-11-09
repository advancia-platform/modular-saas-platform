$ErrorActionPreference = 'Stop'$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')$root = Resolve-Path (Join-Path $PSScriptRoot '..')

$readmePath = Join-Path $root 'README.md'$readmePath = Join-Path $root 'README.md'

$snippetPath = Join-Path $root 'docs/README_DEVCONTAINER_SNIPPET.md'$snippetPath = Join-Path $root 'docs/README_DEVCONTAINER_SNIPPET.md'



if (!(Test-Path $readmePath)) { throw "README not found: $readmePath" }if (!(Test-Path $readmePath)) { throw "README not found: $readmePath" }

if (!(Test-Path $snippetPath)) { throw "Snippet not found: $snippetPath" }if (!(Test-Path $snippetPath)) { throw "Snippet not found: $snippetPath" }



# Load files# Load files

$readme = Get-Content -Raw -LiteralPath $readmePath$readme = Get-Content -Raw -LiteralPath $readmePath

$snippet = Get-Content -Raw -LiteralPath $snippetPath$snippet = Get-Content -Raw -LiteralPath $snippetPath



# Remove any existing snippet occurrences (from heading to EOF)# Remove any existing snippet occurrences (from heading to EOF)

$patternRemoveToEOF = "(?s)\r?\n##\s+Develop in Dev Containers or Codespaces.*$"$patternRemoveToEOF = "(?s)\r?\n##\s+Develop in Dev Containers or Codespaces.*$"

$readme = [regex]::Replace($readme, $patternRemoveToEOF, '')$readme = [regex]::Replace($readme, $patternRemoveToEOF, '')



# Find the Docker Development section code block end to insert after# Find the Docker Development section code block end to insert after

$patternDockerBlock = "(?s)###\s+Docker Development.*?```.*?```"$patternDockerBlock = "(?s)###\s+Docker Development.*?```.*?```"

$match = [regex]::Match($readme, $patternDockerBlock)$match = [regex]::Match($readme, $patternDockerBlock)



if ($match.Success) {if ($match.Success) {

  $insertPos = $match.Index + $match.Length  $insertPos = $match.Index + $match.Length

} else {} else {

  # As last resort, append to end  # As last resort, append to end

  $insertPos = $readme.Length  $insertPos = $readme.Length

}}



$nl = [System.Environment]::NewLine$newReadme = $readme.Insert($insertPos, "`r`n`r`n" + $snippet + "`r`n")

$insertText = ($nl + $nl + $snippet + $nl)

# Write back with UTF-8 (no BOM)

$newReadme = $readme.Insert($insertPos, $insertText)$enc = New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText($readmePath, $newReadme, $enc)

# Write back with UTF-8 (no BOM)

$enc = New-Object System.Text.UTF8Encoding($false)# Git commit/push if changed

[System.IO.File]::WriteAllText($readmePath, $newReadme, $enc)Set-Location $root

& git add README.md | Out-Null

# Git commit/push if changed$changes = git diff --cached --name-only

Set-Location $rootif ($changes) {

& git add README.md | Out-Null  & git commit -m 'docs: relocate Dev Containers/Codespaces section under Development' | Out-Null

$changes = git diff --cached --name-only  & git push origin main | Out-Null

if ($changes) {  Write-Host 'README updated and pushed.' -ForegroundColor Green

  & git commit -m 'docs: relocate Dev Containers/Codespaces section under Development' | Out-Null} else {

  & git push origin main | Out-Null  Write-Host 'No README changes to commit.' -ForegroundColor Yellow

  Write-Host 'README updated and pushed.' -ForegroundColor Green}

} else {
  Write-Host 'No README changes to commit.' -ForegroundColor Yellow
}
