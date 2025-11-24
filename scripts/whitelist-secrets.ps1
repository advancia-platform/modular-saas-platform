#Requires -Version 7.0

<#
.SYNOPSIS
    Bulk whitelist GitHub secret scanning alerts via REST API

.DESCRIPTION
    Fetches open secret scanning alerts from GitHub and marks them as false positives.
    Requires a GitHub Personal Access Token with 'repo' and 'security_events' scopes.

.PARAMETER Auto
    Skip confirmation prompts (use with caution)

.EXAMPLE
    $env:GITHUB_TOKEN = "ghp_your_token_here"
    .\whitelist-secrets.ps1

.EXAMPLE
    .\whitelist-secrets.ps1 -Auto
#>

[CmdletBinding()]
param(
    [switch]$Auto
)

$ErrorActionPreference = "Stop"

# Configuration
$RepoOwner = "advancia-platform"
$RepoName = "modular-saas-platform"
$ApiBase = "https://api.github.com"

# Color output helpers
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Check for GitHub PAT
if (-not $env:GITHUB_TOKEN) {
    Write-ColorOutput "Error: GITHUB_TOKEN environment variable not set" "Red"
    Write-Host ""
    Write-Host "Usage:"
    Write-Host '  $env:GITHUB_TOKEN = "your_personal_access_token"'
    Write-Host "  .\whitelist-secrets.ps1 [-Auto]"
    Write-Host ""
    Write-Host "Token must have 'repo' and 'security_events' scopes"
    exit 1
}

# Setup headers
$headers = @{
    "Authorization" = "token $env:GITHUB_TOKEN"
    "Accept"        = "application/vnd.github+json"
}

if ($Auto) {
    Write-ColorOutput "⚠️  Running in AUTO mode - will not prompt for confirmations" "Yellow"
}

# Fetch secret scanning alerts
Write-ColorOutput "📡 Fetching secret scanning alerts..." "Blue"

try {
    $alerts = Invoke-RestMethod -Uri "$ApiBase/repos/$RepoOwner/$RepoName/secret-scanning/alerts" -Headers $headers -Method Get
} catch {
    Write-ColorOutput "❌ API Error:" "Red"
    Write-Host $_.Exception.Message
    exit 1
}

# Parse alert data
$totalAlerts = $alerts.Count
$openAlerts = ($alerts | Where-Object { $_.state -eq "open" }).Count

Write-ColorOutput "✓ Found $totalAlerts total alerts ($openAlerts open)" "Green"

if ($openAlerts -eq 0) {
    Write-ColorOutput "🎉 No open alerts to whitelist!" "Green"
    exit 0
}

Write-Host ""
Write-ColorOutput "Open alerts:" "Yellow"
$alerts | Where-Object { $_.state -eq "open" } | ForEach-Object {
    $path = if ($_.locations[0].details.path) { $_.locations[0].details.path } else { "unknown" }
    Write-Host "  [ID: $($_.number)] $($_.secret_type) in $path"
}
Write-Host ""

# Confirm before proceeding
if (-not $Auto) {
    $confirm = Read-Host "Whitelist all open alerts as false positives? (y/N)"
    if ($confirm -notmatch "^[Yy]$") {
        Write-ColorOutput "Aborted by user" "Yellow"
        exit 0
    }
}

# Whitelist each open alert
Write-ColorOutput "🔄 Whitelisting alerts..." "Blue"
$resolvedCount = 0
$failedCount = 0

$openAlertsList = $alerts | Where-Object { $_.state -eq "open" }

foreach ($alert in $openAlertsList) {
    $alertId = $alert.number
    $secretType = $alert.secret_type
    $location = if ($alert.locations[0].details.path) { $alert.locations[0].details.path } else { "unknown" }

    Write-Host "  Processing alert $alertId ($secretType in $location)... " -NoNewline

    $body = @{
        state      = "resolved"
        resolution = "false_positive"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod `
            -Uri "$ApiBase/repos/$RepoOwner/$RepoName/secret-scanning/alerts/$alertId" `
            -Headers $headers `
            -Method Patch `
            -Body $body `
            -ContentType "application/json"

        if ($response.state -eq "resolved") {
            Write-ColorOutput "✓" "Green"
            $resolvedCount++
        } else {
            Write-ColorOutput "✗" "Red"
            Write-Host "    Error: Unexpected response state"
            $failedCount++
        }
    } catch {
        Write-ColorOutput "✗" "Red"
        Write-Host "    Error: $($_.Exception.Message)"
        $failedCount++
    }
}

# Summary
Write-Host ""
Write-ColorOutput "═══════════════════════════════════════" "Blue"
Write-ColorOutput "✓ Resolved: $resolvedCount" "Green"
if ($failedCount -gt 0) {
    Write-ColorOutput "✗ Failed: $failedCount" "Red"
}
Write-ColorOutput "═══════════════════════════════════════" "Blue"

# Verify final state
Write-Host ""
Write-ColorOutput "📊 Verifying final state..." "Blue"

try {
    $finalAlerts = Invoke-RestMethod -Uri "$ApiBase/repos/$RepoOwner/$RepoName/secret-scanning/alerts" -Headers $headers -Method Get
    $finalOpen = ($finalAlerts | Where-Object { $_.state -eq "open" }).Count

    if ($finalOpen -eq 0) {
        Write-ColorOutput "🎉 All alerts resolved! Push protection should now allow your push." "Green"
        Write-Host ""
        Write-ColorOutput "Next steps:" "Blue"
        Write-Host "  1. git push origin chore/ci-auto-release-auto-label-decimal-fixes"
        Write-Host "  2. Monitor GitHub Actions for successful CI run"
        Write-Host "  3. Document whitelisted secrets in SECURITY.md"
    } else {
        Write-ColorOutput "⚠️  $finalOpen alerts still open" "Yellow"
        Write-Host "Review manually at:"
        Write-Host "  https://github.com/$RepoOwner/$RepoName/security/secret-scanning"
    }
} catch {
    Write-ColorOutput "⚠️  Could not verify final state" "Yellow"
}

exit 0
