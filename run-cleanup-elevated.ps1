# Self-Elevating Chocolatey Cleanup Script
# This script will automatically request admin privileges

param([switch]$elevated)

function Test-Admin {
    $currentUser = New-Object Security.Principal.WindowsPrincipal $([Security.Principal.WindowsIdentity]::GetCurrent())
    $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if ((Test-Admin) -eq $false) {
    if ($elevated) {
        Write-Host "ERROR: Failed to elevate privileges" -ForegroundColor Red
        Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
        pause
        exit 1
    } else {
        Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
        Start-Process powershell.exe -Verb RunAs -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "{0}" -elevated' -f ($myinvocation.MyCommand.Definition))
    }
    exit
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Chocolatey Admin Cleanup Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Running as Administrator ✓" -ForegroundColor Green
Write-Host ""

# Packages to remove
$packages = @(
    "docker-desktop",
    "git",
    "git.install",
    "nodejs-lts",
    "vscode",
    "vscode.install",
    "python",
    "python3",
    "python314",
    "gh"
)

Write-Host "Removing Chocolatey packages with force flag..." -ForegroundColor Yellow
Write-Host ""

foreach ($package in $packages) {
    Write-Host "Attempting to remove: $package" -ForegroundColor Cyan
    $result = choco uninstall -y $package --force --remove-dependencies 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Successfully removed $package" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ $package may not be installed or already removed" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Cleanup attempt complete!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verifying remaining Chocolatey packages..." -ForegroundColor Yellow
Write-Host ""

choco list

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
