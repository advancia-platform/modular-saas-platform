#!/usr/bin/env pwsh
# Start dashboard development server
Set-Location $PSScriptRoot
Write-Host "Starting dashboard from: $(Get-Location)"
npx next dev -p 3002
