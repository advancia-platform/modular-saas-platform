# Cleanup Remaining Chocolatey Packages (Run as Administrator)
# This script removes Chocolatey packages that require elevated permissions

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Chocolatey Admin Cleanup Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    exit 1
}

Write-Host "Running as Administrator ✓" -ForegroundColor Green
Write-Host ""

# Packages to remove
$packages = @(
    "docker-desktop",
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
    choco uninstall -y $package --force --remove-dependencies 2>&1 | Out-Null

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
