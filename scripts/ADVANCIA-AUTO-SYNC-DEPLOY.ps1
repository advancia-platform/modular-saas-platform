# ==============================================================
# ADVANCIA PAY LEDGER — AUTO SYNC DEPLOY WRAPPER
# ==============================================================
# Thin wrapper that invokes ADVANCIA-DEPLOY-COMPLETE.ps1 with optional params.
# Usage:
#   Set-ExecutionPolicy Bypass -Scope Process -Force
#   ./ADVANCIA-AUTO-SYNC-DEPLOY.ps1 -Domain "advancia.app" -BackendOrigin "https://your-backend.onrender.com"

param(
  [Parameter(Mandatory=$false)][string]$Domain,
  [Parameter(Mandatory=$false)][string]$BackendOrigin
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$root = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$script = Join-Path $root 'ADVANCIA-DEPLOY-COMPLETE.ps1'
if (!(Test-Path $script)) { throw "Missing $script" }

& $script -Domain:$Domain -BackendOrigin:$BackendOrigin
