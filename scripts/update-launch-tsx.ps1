$ErrorActionPreference = 'Stop'
$repo = Resolve-Path (Join-Path $PSScriptRoot '..')
$path = Join-Path $repo '.vscode/launch.json'
if (!(Test-Path $path)) { throw "launch.json not found: $path" }

# Read and parse JSON
$json = Get-Content -Raw -LiteralPath $path
$obj = $json | ConvertFrom-Json

$updated = $false

function Set-NoteProperty($objRef, $name, $value) {
  if ($objRef.PSObject.Properties.Name -contains $name) {
    $objRef.$name = $value
  } else {
    $objRef | Add-Member -NotePropertyName $name -NotePropertyValue $value
  }
}

foreach ($cfg in $obj.configurations) {
  if ($null -ne $cfg.runtimeArgs) {
    $args = @($cfg.runtimeArgs)
    for ($i = 0; $i -lt $args.Count; $i++) {
      if ($args[$i] -eq '-r' -and $i -lt ($args.Count - 1) -and $args[$i+1] -eq 'tsx/register') {
        $args[$i] = '--loader'
        $args[$i+1] = 'tsx'
        $updated = $true
      }
    }
    if ($args -contains 'backend/src/index.ts') {
      Set-NoteProperty -objRef $cfg -name 'program' -value '${workspaceFolder}/backend/src/index.ts'
      Set-NoteProperty -objRef $cfg -name 'runtimeArgs' -value @('--inspect=9229','--loader','tsx')
      Set-NoteProperty -objRef $cfg -name 'runtimeExecutable' -value 'node'
      $updated = $true
    } else {
      Set-NoteProperty -objRef $cfg -name 'runtimeArgs' -value $args
    }
  }
}

if ($updated) {
  $out = $obj | ConvertTo-Json -Depth 50
  Set-Content -LiteralPath $path -Value $out -Encoding utf8
  Set-Location $repo
  git add .vscode/launch.json | Out-Null
  git commit -m 'chore(vscode): replace tsx/register with --loader tsx and fix backend launch program' | Out-Null
  git push origin main | Out-Null
  Write-Host 'launch.json updated and pushed.' -ForegroundColor Green
} else {
  Write-Host 'No changes needed in launch.json.' -ForegroundColor Yellow
}
