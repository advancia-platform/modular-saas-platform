# Package Manager Cleanup Script
# Removes duplicate installations and standardizes on Winget

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Package Manager Cleanup Utility" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Uninstall Chocolatey duplicates
Write-Host "Step 1: Removing Chocolatey duplicate packages..." -ForegroundColor Yellow
Write-Host ""

$chocoPackages = @(
    "nodejs-lts",
    "git.install",
    "docker-desktop",
    "vscode.install",
    "python3",
    "python314",
    "gh"
)

foreach ($package in $chocoPackages) {
    Write-Host "Uninstalling $package..." -ForegroundColor Gray
    choco uninstall $package -y --remove-dependencies 2>$null
}

Write-Host ""
Write-Host "Step 2: Verify Winget installations..." -ForegroundColor Yellow
Write-Host ""

# Verify critical packages are installed via Winget
$wingetPackages = @(
    @{Id="OpenJS.NodeJS.LTS"; Name="Node.js LTS"},
    @{Id="Git.Git"; Name="Git"},
    @{Id="Docker.DockerDesktop"; Name="Docker Desktop"},
    @{Id="Microsoft.VisualStudioCode"; Name="VS Code"},
    @{Id="GitHub.cli"; Name="GitHub CLI"},
    @{Id="Microsoft.PowerShell"; Name="PowerShell 7"}
)

foreach ($pkg in $wingetPackages) {
    $installed = winget list --id $pkg.Id 2>$null
    if ($installed -match $pkg.Id) {
        Write-Host "✓ $($pkg.Name) installed via Winget" -ForegroundColor Green
    } else {
        Write-Host "✗ $($pkg.Name) NOT found - installing..." -ForegroundColor Red
        winget install --id $pkg.Id --silent --accept-source-agreements --accept-package-agreements
    }
}

Write-Host ""
Write-Host "Step 3: Clean npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host ""
Write-Host "Step 4: Verify global npm packages..." -ForegroundColor Yellow
npm list -g --depth=0

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Recommended: Restart your terminal/VS Code" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
