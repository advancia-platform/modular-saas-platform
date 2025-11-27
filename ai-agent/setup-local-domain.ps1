# Quick Domain Setup Script for Development Testing
# Sets up local hosts entry for cybersec-ai.local

param(
    [string]$Domain = "cybersec-ai.local",
    [string]$IP = "127.0.0.1",
    [switch]$Remove = $false,
    [switch]$Help = $false
)

function Show-Help {
    Write-Host "Local Domain Setup Script for Cybersecurity AI Testing" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\setup-local-domain.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Domain <string>     Domain name to configure (default: cybersec-ai.local)" -ForegroundColor White
    Write-Host "  -IP <string>         IP address to map to (default: 127.0.0.1)" -ForegroundColor White
    Write-Host "  -Remove             Remove domain entry from hosts file" -ForegroundColor White
    Write-Host "  -Help               Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\setup-local-domain.ps1" -ForegroundColor White
    Write-Host "  .\setup-local-domain.ps1 -Domain 'my-ai.local' -IP '192.168.1.100'" -ForegroundColor White
    Write-Host "  .\setup-local-domain.ps1 -Remove" -ForegroundColor White
    Write-Host ""
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Add-HostsEntry {
    param([string]$Domain, [string]$IP)

    $hostsFile = "$env:SystemRoot\System32\drivers\etc\hosts"

    try {
        # Check if entry already exists
        $content = Get-Content $hostsFile
        $existingEntry = $content | Where-Object { $_ -match "\s+$Domain\s*$" }

        if ($existingEntry) {
            Write-Host "✓ Domain entry already exists: $existingEntry" -ForegroundColor Green
            return $true
        }

        # Add new entry
        $newEntry = "$IP`t$Domain"
        Add-Content -Path $hostsFile -Value $newEntry
        Write-Host "✓ Added hosts entry: $newEntry" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "✗ Failed to add hosts entry: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Remove-HostsEntry {
    param([string]$Domain)

    $hostsFile = "$env:SystemRoot\System32\drivers\etc\hosts"

    try {
        $content = Get-Content $hostsFile
        $filteredContent = $content | Where-Object { $_ -notmatch "\s+$Domain\s*$" }

        if ($content.Count -ne $filteredContent.Count) {
            Set-Content -Path $hostsFile -Value $filteredContent
            Write-Host "✓ Removed domain entry for: $Domain" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠ No existing entry found for: $Domain" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "✗ Failed to remove hosts entry: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-DomainResolution {
    param([string]$Domain)

    try {
        $result = Resolve-DnsName -Name $Domain -ErrorAction SilentlyContinue
        if ($result) {
            Write-Host "✓ Domain resolves to: $($result.IPAddress)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "✗ Domain does not resolve" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "✗ DNS resolution failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Main {
    if ($Help) {
        Show-Help
        return
    }

    # Check administrator privileges
    if (-not (Test-Administrator)) {
        Write-Host "❌ This script requires administrator privileges to modify the hosts file." -ForegroundColor Red
        Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
        exit 1
    }

    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "Local Domain Setup for Cybersecurity AI" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan

    if ($Remove) {
        Write-Host "Removing domain entry: $Domain" -ForegroundColor Yellow
        if (Remove-HostsEntry -Domain $Domain) {
            Write-Host "Domain entry removed successfully." -ForegroundColor Green
        }
    } else {
        Write-Host "Setting up domain: $Domain -> $IP" -ForegroundColor White
        if (Add-HostsEntry -Domain $Domain -IP $IP) {
            Write-Host "Testing domain resolution..." -ForegroundColor Cyan
            Test-DomainResolution -Domain $Domain

            Write-Host ""
            Write-Host "✅ Domain setup complete!" -ForegroundColor Green
            Write-Host "You can now access your AI system at: http://$Domain" -ForegroundColor White
            Write-Host ""
        }
    }
}

# Execute main function
Main
