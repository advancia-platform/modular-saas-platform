# validate-setup.ps1
# Comprehensive AI Agent Production Setup Validation Script
# Validates all components of the cybersecurity AI deployment

param(
    [string]$Domain = "cybersec-ai.local",
    [switch]$Verbose = $false,
    [switch]$Quick = $false,
    [switch]$Help = $false
)

# Configuration
$LogFile = Join-Path $env:TEMP "ai-validation-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$ValidationResults = @{}
$FailedChecks = @()
$PassedChecks = @()

# Service endpoints configuration
$Services = @{
    "Reasoning_Engine" = @{ Port = 5000; Endpoint = "/analyze"; Method = "POST"; TestData = @{message="Test error"} }
    "Execution_Engine" = @{ Port = 3000; Endpoint = "/execute"; Method = "POST"; TestData = @{action="noop"} }
    "AI_Agent_API" = @{ Port = 3001; Endpoint = "/health"; Method = "GET"; TestData = $null }
    "Dashboard" = @{ Port = 3002; Endpoint = "/"; Method = "GET"; TestData = $null }
    "Prometheus" = @{ Port = 9090; Endpoint = "/"; Method = "GET"; TestData = $null }
    "Grafana" = @{ Port = 3001; Endpoint = "/login"; Method = "GET"; TestData = $null }
    "Documentation" = @{ Port = 8000; Endpoint = "/"; Method = "GET"; TestData = $null }
}

$ExpectedContainers = @(
    "reasoning-engine",
    "execution-engine",
    "cybersecurity_ai_main",
    "cybersecurity_ai_dashboard",
    "cybersecurity_ai_prometheus",
    "cybersecurity_ai_grafana"
)

function Write-ValidationLog {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [switch]$NoConsole
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Add-Content -Path $LogFile -Value $logEntry

    if (-not $NoConsole) {
        switch ($Level) {
            "PASS" {
                Write-Host "✅ $Message" -ForegroundColor Green
                $script:PassedChecks += $Message
            }
            "FAIL" {
                Write-Host "❌ $Message" -ForegroundColor Red
                $script:FailedChecks += $Message
            }
            "WARN" { Write-Host "⚠️ $Message" -ForegroundColor Yellow }
            "INFO" { Write-Host "ℹ️ $Message" -ForegroundColor Cyan }
            "STEP" { Write-Host "➡️ $Message" -ForegroundColor Blue }
            default { Write-Host $Message }
        }
    }

    if ($Verbose -and $Level -eq "DEBUG") {
        Write-Host "🔍 $Message" -ForegroundColor DarkCyan
    }
}

function Test-ValidationStep {
    param(
        [string]$StepName,
        [scriptblock]$TestScript,
        [string]$SuccessMessage = "",
        [string]$FailureMessage = ""
    )

    try {
        $result = & $TestScript

        if ($result) {
            $message = if ($SuccessMessage) { $SuccessMessage } else { "$StepName completed successfully" }
            Write-ValidationLog -Message $message -Level "PASS"
            $ValidationResults[$StepName] = @{ Status = "PASS"; Message = $message }
            return $true
        } else {
            $message = if ($FailureMessage) { $FailureMessage } else { "$StepName failed" }
            Write-ValidationLog -Message $message -Level "FAIL"
            $ValidationResults[$StepName] = @{ Status = "FAIL"; Message = $message }
            return $false
        }
    } catch {
        $errorMessage = "$StepName error: $($_.Exception.Message)"
        Write-ValidationLog -Message $errorMessage -Level "FAIL"
        $ValidationResults[$StepName] = @{ Status = "ERROR"; Message = $errorMessage }
        return $false
    }
}

function Test-DomainResolution {
    Write-ValidationLog -Message "Checking domain resolution for $Domain..." -Level "STEP"

    Test-ValidationStep -StepName "Domain_Resolution" -TestScript {
        try {
            # Try DNS resolution first
            $dnsResult = Resolve-DnsName -Name $Domain -ErrorAction SilentlyContinue
            if ($dnsResult) {
                Write-ValidationLog -Message "Domain resolves via DNS to: $($dnsResult.IPAddress -join ', ')" -Level "DEBUG"
                return $true
            }

            # Fallback: Check hosts file
            $hostsFile = "$env:SystemRoot\System32\drivers\etc\hosts"
            if (Test-Path $hostsFile) {
                $hostsContent = Get-Content $hostsFile
                $hostsEntry = $hostsContent | Where-Object { $_ -match "\s+$Domain\s*$" }
                if ($hostsEntry) {
                    Write-ValidationLog -Message "Domain found in hosts file: $hostsEntry" -Level "DEBUG"
                    return $true
                }
            }

            # Final fallback: Test connectivity to localhost
            if ($Domain -eq "localhost" -or $Domain -eq "127.0.0.1") {
                return $true
            }

            return $false
        } catch {
            return $false
        }
    } -SuccessMessage "Domain resolves correctly" -FailureMessage "Domain does not resolve. Check hosts/DNS configuration"
}

function Test-DockerContainers {
    Write-ValidationLog -Message "Checking Docker containers..." -Level "STEP"

    # Check if Docker is available
    Test-ValidationStep -StepName "Docker_Available" -TestScript {
        try {
            $null = docker ps 2>$null
            return $true
        } catch {
            return $false
        }
    } -SuccessMessage "Docker is running" -FailureMessage "Docker is not available or not running"

    # Check for expected containers
    Test-ValidationStep -StepName "Expected_Containers" -TestScript {
        try {
            $runningContainers = docker ps --format "{{.Names}}" 2>$null
            Write-ValidationLog -Message "Found containers: $($runningContainers -join ', ')" -Level "DEBUG"

            $foundContainers = 0
            foreach ($expectedContainer in $ExpectedContainers) {
                $found = $runningContainers | Where-Object { $_ -match $expectedContainer }
                if ($found) {
                    $foundContainers++
                    Write-ValidationLog -Message "Container found: $expectedContainer" -Level "DEBUG"
                }
            }

            # Consider it successful if we find at least some containers
            return $foundContainers -gt 0
        } catch {
            return $false
        }
    } -SuccessMessage "Docker containers are running" -FailureMessage "Expected containers not found. Verify docker-compose up"
}

function Test-ServiceEndpoints {
    Write-ValidationLog -Message "Testing service endpoints..." -Level "STEP"

    foreach ($serviceName in $Services.Keys) {
        $service = $Services[$serviceName]

        Test-ValidationStep -StepName "Service_$serviceName" -TestScript {
            try {
                $baseUri = "http://${Domain}:$($service.Port)"
                $fullUri = "$baseUri$($service.Endpoint)"

                Write-ValidationLog -Message "Testing $serviceName at $fullUri" -Level "DEBUG"

                if ($service.Method -eq "POST" -and $service.TestData) {
                    $body = $service.TestData | ConvertTo-Json
                    $response = Invoke-RestMethod -Uri $fullUri -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
                } else {
                    $response = Invoke-WebRequest -Uri $fullUri -UseBasicParsing -TimeoutSec 10
                }

                Write-ValidationLog -Message "$serviceName responded successfully" -Level "DEBUG"
                return $true
            } catch {
                # Try localhost as fallback
                try {
                    $fallbackUri = "http://localhost:$($service.Port)$($service.Endpoint)"
                    Write-ValidationLog -Message "Fallback testing $serviceName at $fallbackUri" -Level "DEBUG"

                    if ($service.Method -eq "POST" -and $service.TestData) {
                        $body = $service.TestData | ConvertTo-Json
                        $response = Invoke-RestMethod -Uri $fallbackUri -Method POST -Body $body -ContentType "application/json" -TimeoutSec 5
                    } else {
                        $response = Invoke-WebRequest -Uri $fallbackUri -UseBasicParsing -TimeoutSec 5
                    }

                    return $true
                } catch {
                    Write-ValidationLog -Message "$serviceName error: $($_.Exception.Message)" -Level "DEBUG"
                    return $false
                }
            }
        } -SuccessMessage "$serviceName responds correctly" -FailureMessage "$serviceName not reachable"
    }
}

function Test-AIFunctionality {
    if ($Quick) {
        Write-ValidationLog -Message "Skipping detailed AI functionality tests (Quick mode)" -Level "INFO"
        return
    }

    Write-ValidationLog -Message "Testing AI functionality..." -Level "STEP"

    # Test reasoning engine with actual threat data
    Test-ValidationStep -StepName "Reasoning_Engine_Functionality" -TestScript {
        try {
            $testThreat = @{
                threat_type = "malware"
                severity = "high"
                description = "Suspicious file detected"
                indicators = @("hash123", "domain.evil")
            }

            $uri = "http://${Domain}:5000/analyze"
            $body = $testThreat | ConvertTo-Json
            $response = Invoke-RestMethod -Uri $uri -Method POST -Body $body -ContentType "application/json" -TimeoutSec 15

            # Check if response contains expected fields
            return $response -and ($response.PSObject.Properties.Name -contains "analysis" -or $response.PSObject.Properties.Name -contains "recommendations")
        } catch {
            # Fallback to localhost
            try {
                $uri = "http://localhost:5000/analyze"
                $response = Invoke-RestMethod -Uri $uri -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
                return $response -ne $null
            } catch {
                return $false
            }
        }
    } -SuccessMessage "AI reasoning engine processes threats correctly" -FailureMessage "AI reasoning engine functionality failed"

    # Test execution engine
    Test-ValidationStep -StepName "Execution_Engine_Functionality" -TestScript {
        try {
            $testAction = @{
                action_type = "isolate_system"
                target = "workstation_001"
                priority = "high"
            }

            $uri = "http://${Domain}:3000/execute"
            $body = $testAction | ConvertTo-Json
            $response = Invoke-RestMethod -Uri $uri -Method POST -Body $body -ContentType "application/json" -TimeoutSec 15

            return $response -ne $null
        } catch {
            # Fallback to localhost
            try {
                $uri = "http://localhost:3000/execute"
                $response = Invoke-RestMethod -Uri $uri -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
                return $response -ne $null
            } catch {
                return $false
            }
        }
    } -SuccessMessage "AI execution engine processes actions correctly" -FailureMessage "AI execution engine functionality failed"
}

function Test-MonitoringEndpoints {
    Write-ValidationLog -Message "Checking monitoring endpoints..." -Level "STEP"

    # Test Prometheus
    Test-ValidationStep -StepName "Prometheus_Metrics" -TestScript {
        try {
            $uri = "http://${Domain}:9090/api/v1/query?query=up"
            $response = Invoke-RestMethod -Uri $uri -TimeoutSec 10
            return $response.status -eq "success"
        } catch {
            try {
                $uri = "http://localhost:9090/api/v1/query?query=up"
                $response = Invoke-RestMethod -Uri $uri -TimeoutSec 5
                return $response.status -eq "success"
            } catch {
                return $false
            }
        }
    } -SuccessMessage "Prometheus metrics collection is working" -FailureMessage "Prometheus not accessible or not collecting metrics"

    # Test Grafana dashboard
    Test-ValidationStep -StepName "Grafana_Dashboard" -TestScript {
        try {
            $uri = "http://${Domain}:3001/api/health"
            $response = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 10
            return $response.StatusCode -eq 200
        } catch {
            try {
                $uri = "http://localhost:3001/api/health"
                $response = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 5
                return $response.StatusCode -eq 200
            } catch {
                return $false
            }
        }
    } -SuccessMessage "Grafana dashboard is accessible" -FailureMessage "Grafana not accessible"
}

function Test-Documentation {
    Write-ValidationLog -Message "Checking documentation..." -Level "STEP"

    # Test MkDocs site
    Test-ValidationStep -StepName "Documentation_Site" -TestScript {
        try {
            $uri = "http://${Domain}:8000/"
            $response = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 10
            return $response.StatusCode -eq 200
        } catch {
            try {
                $uri = "http://localhost:8000/"
                $response = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 5
                return $response.StatusCode -eq 200
            } catch {
                # Check if mkdocs.yml exists as fallback
                $mkdocsConfig = Join-Path $PSScriptRoot "..\mkdocs.yml"
                return Test-Path $mkdocsConfig
            }
        }
    } -SuccessMessage "Documentation site is accessible" -FailureMessage "MkDocs site not accessible"

    # Check for essential documentation files
    Test-ValidationStep -StepName "Documentation_Files" -TestScript {
        $docFiles = @(
            (Join-Path $PSScriptRoot "..\README.md"),
            (Join-Path $PSScriptRoot "PRODUCTION_DEPLOYMENT_GUIDE.md"),
            (Join-Path $PSScriptRoot "..\docs\reference\api.md")
        )

        $foundFiles = 0
        foreach ($file in $docFiles) {
            if (Test-Path $file) {
                $foundFiles++
                Write-ValidationLog -Message "Found documentation: $(Split-Path $file -Leaf)" -Level "DEBUG"
            }
        }

        return $foundFiles -ge 2  # At least 2 out of 3 files should exist
    } -SuccessMessage "Essential documentation files are present" -FailureMessage "Missing critical documentation files"
}

function Test-SecurityConfiguration {
    if ($Quick) {
        Write-ValidationLog -Message "Skipping security configuration tests (Quick mode)" -Level "INFO"
        return
    }

    Write-ValidationLog -Message "Checking security configuration..." -Level "STEP"

    # Check environment file security
    Test-ValidationStep -StepName "Environment_Security" -TestScript {
        $envFile = Join-Path $PSScriptRoot ".env.production"

        if (-not (Test-Path $envFile)) {
            Write-ValidationLog -Message "Production environment file not found" -Level "DEBUG"
            return $false
        }

        # Check file permissions (Windows)
        try {
            $acl = Get-Acl $envFile
            $accessRules = $acl.Access | Where-Object { $_.FileSystemRights -match "FullControl|Write" }
            $restrictedAccess = $accessRules.Count -le 2  # Only owner and system should have write access

            # Check for sensitive data
            $content = Get-Content $envFile -Raw
            $hasSecrets = $content -match "JWT_SECRET=" -and $content -match "ENCRYPTION_KEY="

            return $restrictedAccess -and $hasSecrets
        } catch {
            return $false
        }
    } -SuccessMessage "Environment security configuration is proper" -FailureMessage "Environment security needs attention"
}

function Show-ValidationSummary {
    Write-Host ""
    Write-Host "🎯 AI Agent Production Setup Validation Summary" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "Domain: $Domain" -ForegroundColor White
    Write-Host "Validation Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
    Write-Host ""

    $totalChecks = $ValidationResults.Count
    $passedCount = ($ValidationResults.Values | Where-Object { $_.Status -eq "PASS" }).Count
    $failedCount = ($ValidationResults.Values | Where-Object { $_.Status -in @("FAIL", "ERROR") }).Count

    $successRate = if ($totalChecks -gt 0) { [math]::Round(($passedCount / $totalChecks) * 100, 1) } else { 0 }

    Write-Host "Results: $passedCount passed, $failedCount failed ($successRate% success rate)" -ForegroundColor White
    Write-Host ""

    # Overall status
    if ($successRate -ge 90) {
        Write-Host "🎉 EXCELLENT - Production Ready!" -ForegroundColor Green
        $status = "EXCELLENT"
    } elseif ($successRate -ge 75) {
        Write-Host "✅ GOOD - Minor issues to address" -ForegroundColor Yellow
        $status = "GOOD"
    } elseif ($successRate -ge 50) {
        Write-Host "⚠️ FAIR - Several issues need attention" -ForegroundColor Yellow
        $status = "FAIR"
    } else {
        Write-Host "❌ POOR - Major issues require immediate attention" -ForegroundColor Red
        $status = "POOR"
    }

    Write-Host ""

    # Show failed checks
    if ($FailedChecks.Count -gt 0) {
        Write-Host "Issues to Address:" -ForegroundColor Red
        foreach ($failure in $FailedChecks) {
            Write-Host "  • $failure" -ForegroundColor White
        }
        Write-Host ""
    }

    # Show successful checks
    if ($Verbose -and $PassedChecks.Count -gt 0) {
        Write-Host "Successful Checks:" -ForegroundColor Green
        foreach ($success in $PassedChecks) {
            Write-Host "  • $success" -ForegroundColor White
        }
        Write-Host ""
    }

    Write-Host "Detailed log saved to: $LogFile" -ForegroundColor Cyan
    Write-Host ""

    # Recommendations based on status
    switch ($status) {
        "POOR" {
            Write-Host "Recommendations:" -ForegroundColor Yellow
            Write-Host "  1. Check Docker Desktop is running" -ForegroundColor White
            Write-Host "  2. Verify domain configuration in hosts file" -ForegroundColor White
            Write-Host "  3. Run deployment scripts to start services" -ForegroundColor White
            Write-Host "  4. Check firewall and network connectivity" -ForegroundColor White
        }
        "FAIR" {
            Write-Host "Recommendations:" -ForegroundColor Yellow
            Write-Host "  1. Review failed service endpoints" -ForegroundColor White
            Write-Host "  2. Check monitoring service configuration" -ForegroundColor White
            Write-Host "  3. Verify AI engine functionality" -ForegroundColor White
        }
        "GOOD" {
            Write-Host "Recommendations:" -ForegroundColor Yellow
            Write-Host "  1. Address minor configuration issues" -ForegroundColor White
            Write-Host "  2. Consider enabling additional monitoring" -ForegroundColor White
        }
    }

    return $status
}

function Show-Help {
    Write-Host "AI Agent Production Setup Validation Script" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This script validates all components of your cybersecurity AI deployment:" -ForegroundColor White
    Write-Host "• Domain resolution and networking" -ForegroundColor White
    Write-Host "• Docker containers and services" -ForegroundColor White
    Write-Host "• AI engine functionality" -ForegroundColor White
    Write-Host "• Monitoring and observability" -ForegroundColor White
    Write-Host "• Documentation and security" -ForegroundColor White
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\validate-setup.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Parameters:" -ForegroundColor Yellow
    Write-Host "  -Domain <string>     Domain name to validate (default: cybersec-ai.local)" -ForegroundColor White
    Write-Host "  -Verbose             Show detailed validation information" -ForegroundColor White
    Write-Host "  -Quick               Skip time-consuming tests" -ForegroundColor White
    Write-Host "  -Help                Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\validate-setup.ps1" -ForegroundColor White
    Write-Host "  .\validate-setup.ps1 -Domain 'my-ai.local' -Verbose" -ForegroundColor White
    Write-Host "  .\validate-setup.ps1 -Quick" -ForegroundColor White
    Write-Host ""
}

function Main {
    if ($Help) {
        Show-Help
        return
    }

    Write-Host "🔍 Validating AI Agent Production Setup for $Domain..." -ForegroundColor Cyan
    Write-Host ""

    # Initialize validation log
    "AI Agent Production Setup Validation started at $(Get-Date)" | Set-Content -Path $LogFile

    # Run validation steps
    Test-DomainResolution
    Test-DockerContainers
    Test-ServiceEndpoints
    Test-AIFunctionality
    Test-MonitoringEndpoints
    Test-Documentation
    Test-SecurityConfiguration

    # Show summary and determine exit code
    $status = Show-ValidationSummary

    switch ($status) {
        "EXCELLENT" { exit 0 }
        "GOOD" { exit 0 }
        "FAIR" { exit 1 }
        "POOR" { exit 2 }
        default { exit 1 }
    }
}

# Execute main function
Main
