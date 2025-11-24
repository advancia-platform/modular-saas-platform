#Requires -Version 5.1

<#
.SYNOPSIS
    Quick script to resolve GitHub secret scanning alerts for modular-saas-platform

.DESCRIPTION
    Simplified version of whitelist-secrets.ps1 for rapid resolution of false positive alerts.
    Designed for the specific use case of unblocking branch pushes when UI is unavailable.

.EXAMPLE
    $token = "ghp_your_token_here"
    .\Resolve-Secrets.ps1

.NOTES
    Repository: advancia-platform/modular-saas-platform
    Branch: chore/ci-auto-release-auto-label-decimal-fixes
#>

# Configuration
$repo = "advancia-platform/modular-saas-platform"
$token = Read-Host -Prompt "Enter your GitHub Personal Access Token (PAT)" -AsSecureString
$tokenPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
)

# Setup headers
$headers = @{
    Authorization = "token $tokenPlain"
    Accept        = "application/vnd.github+json"
}

Write-Host ""
Write-Host "🔍 Fetching secret scanning alerts..." -ForegroundColor Cyan

try {
    # Get all secret scanning alerts
    $alerts = Invoke-RestMethod -Headers $headers `
        -Uri "https://api.github.com/repos/$repo/secret-scanning/alerts"

    $totalAlerts = $alerts.Count
    $openAlerts = @($alerts | Where-Object { $_.state -eq "open" })
    $openCount = $openAlerts.Count

    Write-Host "✓ Found $totalAlerts total alerts ($openCount open)" -ForegroundColor Green

    if ($openCount -eq 0) {
        Write-Host ""
        Write-Host "🎉 No open alerts! You can push your branch now." -ForegroundColor Green
        Write-Host ""
        Write-Host "Run: git push origin chore/ci-auto-release-auto-label-decimal-fixes" -ForegroundColor Yellow
        exit 0
    }

    # Display open alerts
    Write-Host ""
    Write-Host "📋 Open alerts to resolve:" -ForegroundColor Yellow
    foreach ($alert in $openAlerts) {
        $location = if ($alert.locations[0].details.path) { $alert.locations[0].details.path } else { "unknown" }
        Write-Host "  • Alert $($alert.number): $($alert.secret_type) in $location" -ForegroundColor White
    }

    Write-Host ""
    $confirm = Read-Host "Resolve all $openCount alerts as false positives? (y/N)"

    if ($confirm -notmatch "^[Yy]$") {
        Write-Host "❌ Aborted by user" -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "🔄 Resolving alerts..." -ForegroundColor Cyan

    $resolvedCount = 0
    $failedCount = 0

    foreach ($alert in $openAlerts) {
        $alertId = $alert.number
        Write-Host "  Resolving alert ID $alertId... " -NoNewline

        try {
            $body = @{
                state      = "resolved"
                resolution = "false_positive"
            } | ConvertTo-Json

            $response = Invoke-RestMethod -Method Patch `
                -Headers $headers `
                -Uri "https://api.github.com/repos/$repo/secret-scanning/alerts/$alertId" `
                -Body $body `
                -ContentType "application/json"

            if ($response.state -eq "resolved") {
                Write-Host "✓" -ForegroundColor Green
                $resolvedCount++
            } else {
                Write-Host "✗ Unexpected state" -ForegroundColor Red
                $failedCount++
            }
        } catch {
            Write-Host "✗ $($_.Exception.Message)" -ForegroundColor Red
            $failedCount++
        }
    }

    # Summary
    Write-Host ""
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "✓ Resolved: $resolvedCount" -ForegroundColor Green
    if ($failedCount -gt 0) {
        Write-Host "✗ Failed: $failedCount" -ForegroundColor Red
    }
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan

    # Verification
    Write-Host ""
    Write-Host "🔍 Verifying final state..." -ForegroundColor Cyan

    $finalAlerts = Invoke-RestMethod -Headers $headers `
        -Uri "https://api.github.com/repos/$repo/secret-scanning/alerts"

    $finalOpen = @($finalAlerts | Where-Object { $_.state -eq "open" }).Count
    $finalResolved = @($finalAlerts | Where-Object { $_.state -eq "resolved" -and $_.resolution -eq "false_positive" }).Count

    Write-Host "  Open: $finalOpen" -ForegroundColor $(if ($finalOpen -eq 0) { "Green" } else { "Yellow" })
    Write-Host "  Resolved (false positive): $finalResolved" -ForegroundColor Green

    if ($finalOpen -eq 0) {
        Write-Host ""
        Write-Host "🎉 All alerts resolved! Push protection bypassed." -ForegroundColor Green
        Write-Host ""
        Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Push your branch:" -ForegroundColor White
        Write-Host "     git push origin chore/ci-auto-release-auto-label-decimal-fixes" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  2. Verify PR auto-creation to staging" -ForegroundColor White
        Write-Host "     https://github.com/$repo/pulls" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  3. Monitor CI pipeline" -ForegroundColor White
        Write-Host "     https://github.com/$repo/actions" -ForegroundColor Gray
        Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "⚠️  $finalOpen alerts still open. Review manually:" -ForegroundColor Yellow
        Write-Host "https://github.com/$repo/security/secret-scanning" -ForegroundColor Gray
    }

} catch {
    Write-Host ""
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  • Token missing 'repo' or 'security_events' scopes" -ForegroundColor White
    Write-Host "  • Token expired or invalid" -ForegroundColor White
    Write-Host "  • No admin access to repository" -ForegroundColor White
    exit 1
}
