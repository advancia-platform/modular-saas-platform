# ============================================================================
# Environment Switcher Script (PowerShell)
# ============================================================================
# Usage: .\switch-env.ps1 development|production|staging
# This script safely switches between environment configurations
# ============================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('development', 'production', 'staging')]
    [string]$EnvType
)

$BackendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TargetEnv = Join-Path $BackendDir ".env.$EnvType"
$CurrentEnv = Join-Path $BackendDir ".env"

# Check if target environment file exists
if (-not (Test-Path $TargetEnv)) {
    Write-Host "Error: Environment file not found: $TargetEnv" -ForegroundColor Red
    exit 1
}

# Backup current .env if it exists
if (Test-Path $CurrentEnv) {
    $BackupFile = "$CurrentEnv.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $CurrentEnv $BackupFile
    Write-Host "Backed up current .env to: $BackupFile" -ForegroundColor Yellow
}

# Copy new environment file
Copy-Item $TargetEnv $CurrentEnv -Force

Write-Host "✓ Switched to $EnvType environment" -ForegroundColor Green
Write-Host "✓ Active config: .env.$EnvType" -ForegroundColor Green

# Display current NODE_ENV
$NodeEnv = (Get-Content $CurrentEnv | Select-String "^NODE_ENV=").ToString().Split('=')[1]
Write-Host "✓ NODE_ENV set to: $NodeEnv" -ForegroundColor Green

# Warning for production
if ($EnvType -eq "production") {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host "⚠️  WARNING: PRODUCTION ENVIRONMENT ACTIVE" -ForegroundColor Red
    Write-Host "⚠️  Ensure all credentials are properly configured" -ForegroundColor Red
    Write-Host "⚠️  Never commit .env with real production secrets" -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red

    # Check for fake/placeholder credentials
    $Content = Get-Content $CurrentEnv -Raw
    if ($Content -match "fake|REPLACE_WITH|YOUR_PRODUCTION") {
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
        Write-Host "⚠️  CRITICAL: Placeholder/fake credentials detected!" -ForegroundColor Red
        Write-Host "⚠️  Update .env with real production credentials before deploying" -ForegroundColor Red
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Verify configuration: Get-Content .env | Select-Object -First 20"
Write-Host "  2. Start backend: npm run dev"
Write-Host "  3. Check logs for any configuration errors"
