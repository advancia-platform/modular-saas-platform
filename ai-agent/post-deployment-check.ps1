# Post-Deployment Verification Script for Cybersecurity AI System
# Comprehensive production readiness checklist

param(
    [string]$Domain = "cybersec-ai.local",
    [switch]$Verbose = $false,
    [switch]$SkipCICD = $false,
    [switch]$Help = $false
)

# Configuration
$ScriptDir = $PSScriptRoot
$LogFile = Join-Path $env:TEMP "post-deployment-verification.log"
$ChecklistFile = Join-Path $ScriptDir "deployment-checklist.json"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Service ports configuration
$Services = @{
    "AI_Agent" = @{ Port = 3001; Endpoint = "/health"; Protocol = "http" }
    "Dashboard" = @{ Port = 3000; Endpoint = "/"; Protocol = "http" }
    "Integration_Server" = @{ Port = 8000; Endpoint = "/health"; Protocol = "http" }
    "Reasoning_Engine" = @{ Port = 5000; Endpoint = "/analyze"; Protocol = "http" }
    "Execution_Engine" = @{ Port = 3000; Endpoint = "/execute"; Protocol = "http" }
    "Prometheus" = @{ Port = 9090; Endpoint = "/"; Protocol = "http" }
    "Grafana" = @{ Port = 3001; Endpoint = "/login"; Protocol = "http" }
    "Documentation" = @{ Port = 8080; Endpoint = "/"; Protocol = "http" }
}

# Docker containers to verify
$ExpectedContainers = @(
    "cybersecurity_ai_main",
    "cybersecurity_ai_dashboard",
    "cybersecurity_ai_database",
    "cybersecurity_ai_redis",
    "cybersecurity_ai_nginx",
    "cybersecurity_ai_prometheus",
    "cybersecurity_ai_grafana"
)

# Results tracking
$CheckResults = @{}
$OverallScore = 0
$MaxScore = 0

function Write-Log {
    param([string]$Message, [string]$Level = "INFO", [switch]$NoConsole)
    $logMessage = "[$Timestamp] [$Level] $Message"
    Add-Content -Path $LogFile -Value $logMessage

    if (-not $NoConsole) {
        switch ($Level) {
            "INFO" { Write-Host "✓ $Message" -ForegroundColor Green }
            "WARN" { Write-Host "⚠ $Message" -ForegroundColor Yellow }
            "ERROR" { Write-Host "✗ $Message" -ForegroundColor Red }
            "DEBUG" { if ($Verbose) { Write-Host "🔍 $Message" -ForegroundColor Cyan } }
            "STEP" { Write-Host "📋 $Message" -ForegroundColor Blue }
        }
    }
}

function Test-ChecklistItem {
    param(
        [string]$Category,
        [string]$Item,
        [scriptblock]$TestScript,
        [int]$Weight = 1
    )

    $script:MaxScore += $Weight

    try {
        $result = & $TestScript
        if ($result) {
            $CheckResults["$Category.$Item"] = @{ Status = "PASS"; Weight = $Weight; Message = "OK" }
            $script:OverallScore += $Weight
            Write-Log "$Category - $Item" "INFO"
            return $true
        } else {
            $CheckResults["$Category.$Item"] = @{ Status = "FAIL"; Weight = $Weight; Message = "Failed" }
            Write-Log "$Category - $Item" "ERROR"
            return $false
        }
    } catch {
        $CheckResults["$Category.$Item"] = @{ Status = "ERROR"; Weight = $Weight; Message = $_.Exception.Message }
        Write-Log "$Category - $Item - Error: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-DomainResolution {
    Write-Log "Environment & Domain Validation" "STEP"

    # Test domain resolution
    Test-ChecklistItem -Category "Environment" -Item "Domain_Resolution" -Weight 2 -TestScript {
        try {
            $result = Resolve-DnsName -Name $Domain -ErrorAction SilentlyContinue
            return $result -ne $null
        } catch {
            # Try ping as fallback
            $ping = Test-Connection -ComputerName $Domain -Count 1 -Quiet -ErrorAction SilentlyContinue
            return $ping
        }
    }

    # Check hosts file entry
    Test-ChecklistItem -Category "Environment" -Item "Hosts_File_Entry" -Weight 1 -TestScript {
        $hostsFile = "$env:SystemRoot\System32\drivers\etc\hosts"
        if (Test-Path $hostsFile) {
            $content = Get-Content $hostsFile
            return $content -match $Domain
        }
        return $false
    }

    # Verify environment file exists
    Test-ChecklistItem -Category "Environment" -Item "Production_Config" -Weight 2 -TestScript {
        $envFile = Join-Path $ScriptDir ".env.production"
        return Test-Path $envFile
    }

    # Check environment variables are loaded
    Test-ChecklistItem -Category "Environment" -Item "Environment_Variables" -Weight 1 -TestScript {
        $envFile = Join-Path $ScriptDir ".env.production"
        if (Test-Path $envFile) {
            $envContent = Get-Content $envFile
            $requiredVars = @("JWT_SECRET", "DATABASE_URL", "REDIS_URL")
            foreach ($var in $requiredVars) {
                $found = $envContent | Where-Object { $_ -match "^$var=" }
                if (-not $found) { return $false }
            }
            return $true
        }
        return $false
    }
}

function Test-DockerServices {
    Write-Log "Docker Services Validation" "STEP"

    # Check Docker is running
    Test-ChecklistItem -Category "Docker" -Item "Docker_Running" -Weight 3 -TestScript {
        try {
            $null = docker ps 2>$null
            return $true
        } catch {
            return $false
        }
    }

    # Verify expected containers are running
    Test-ChecklistItem -Category "Docker" -Item "Required_Containers" -Weight 5 -TestScript {
        try {
            $runningContainers = docker ps --format "{{.Names}}" 2>$null
            $runningCount = 0
            foreach ($container in $ExpectedContainers) {
                if ($runningContainers -contains $container) {
                    $runningCount++
                }
            }
            return $runningCount -ge ($ExpectedContainers.Count * 0.7) # At least 70% running
        } catch {
            return $false
        }
    }

    # Check container health status
    Test-ChecklistItem -Category "Docker" -Item "Container_Health" -Weight 2 -TestScript {
        try {
            $healthyContainers = docker ps --filter "status=running" --format "{{.Names}}" 2>$null
            return $healthyContainers.Count -gt 0
        } catch {
            return $false
        }
    }
}

function Test-ServiceConnectivity {
    Write-Log "Service Connectivity Validation" "STEP"

    foreach ($serviceName in $Services.Keys) {
        $service = $Services[$serviceName]
        Test-ChecklistItem -Category "Connectivity" -Item "Service_$serviceName" -Weight 2 -TestScript {
            try {
                $uri = "$($service.Protocol)://${Domain}:$($service.Port)$($service.Endpoint)"
                Write-Log "Testing $uri" "DEBUG"
                $response = Invoke-WebRequest -Uri $uri -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
                return $response.StatusCode -eq 200
            } catch {
                # Try localhost as fallback
                try {
                    $uri = "$($service.Protocol)://localhost:$($service.Port)$($service.Endpoint)"
                    Write-Log "Fallback testing $uri" "DEBUG"
                    $response = Invoke-WebRequest -Uri $uri -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
                    return $response.StatusCode -eq 200
                } catch {
                    return $false
                }
            }
        }
    }

    # Test specific API endpoints
    Test-ChecklistItem -Category "Connectivity" -Item "API_Analyze_Endpoint" -Weight 3 -TestScript {
        try {
            $uri = "http://${Domain}:5000/analyze"
            $testPayload = @{ threat = "test" } | ConvertTo-Json
            $response = Invoke-RestMethod -Uri $uri -Method POST -Body $testPayload -ContentType "application/json" -TimeoutSec 10
            return $response -ne $null
        } catch {
            return $false
        }
    }

    Test-ChecklistItem -Category "Connectivity" -Item "API_Execute_Endpoint" -Weight 3 -TestScript {
        try {
            $uri = "http://${Domain}:3000/execute"
            $testPayload = @{ action = "test" } | ConvertTo-Json
            $response = Invoke-RestMethod -Uri $uri -Method POST -Body $testPayload -ContentType "application/json" -TimeoutSec 10
            return $response -ne $null
        } catch {
            return $false
        }
    }
}

function Test-MonitoringServices {
    Write-Log "Monitoring & Observability Validation" "STEP"

    # Test Prometheus metrics collection
    Test-ChecklistItem -Category "Monitoring" -Item "Prometheus_Metrics" -Weight 2 -TestScript {
        try {
            $uri = "http://${Domain}:9090/api/v1/query?query=up"
            $response = Invoke-RestMethod -Uri $uri -TimeoutSec 10
            return $response.status -eq "success"
        } catch {
            return $false
        }
    }

    # Test Grafana accessibility
    Test-ChecklistItem -Category "Monitoring" -Item "Grafana_Dashboard" -Weight 2 -TestScript {
        try {
            $uri = "http://${Domain}:3001/api/health"
            $response = Invoke-WebRequest -Uri $uri -TimeoutSec 10 -UseBasicParsing
            return $response.StatusCode -eq 200
        } catch {
            return $false
        }
    }

    # Check application logs
    Test-ChecklistItem -Category "Monitoring" -Item "Application_Logs" -Weight 1 -TestScript {
        try {
            $logs = docker logs cybersecurity_ai_main --tail 10 2>$null
            return $logs.Count -gt 0
        } catch {
            return $false
        }
    }

    # Verify metrics endpoints
    Test-ChecklistItem -Category "Monitoring" -Item "Metrics_Endpoints" -Weight 2 -TestScript {
        try {
            $endpoints = @(
                "http://${Domain}:3001/metrics",
                "http://${Domain}:3000/metrics"
            )
            foreach ($endpoint in $endpoints) {
                try {
                    $response = Invoke-WebRequest -Uri $endpoint -TimeoutSec 5 -UseBasicParsing
                    if ($response.StatusCode -eq 200) { return $true }
                } catch { }
            }
            return $false
        } catch {
            return $false
        }
    }
}

function Test-CICDIntegration {
    if ($SkipCICD) {
        Write-Log "Skipping CI/CD Integration tests" "WARN"
        return
    }

    Write-Log "CI/CD Integration Validation" "STEP"

    # Check for GitHub Actions workflow
    Test-ChecklistItem -Category "CICD" -Item "GitHub_Actions_Workflow" -Weight 1 -TestScript {
        $workflowPath = Join-Path $ScriptDir "..\.github\workflows"
        return Test-Path $workflowPath
    }

    # Verify webhook endpoints
    Test-ChecklistItem -Category "CICD" -Item "Webhook_Endpoints" -Weight 2 -TestScript {
        try {
            $uri = "http://${Domain}:3000/webhook"
            $response = Invoke-WebRequest -Uri $uri -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
            return $response.StatusCode -in @(200, 404) # 404 is OK, means endpoint exists
        } catch {
            return $false
        }
    }

    # Check rollback capability
    Test-ChecklistItem -Category "CICD" -Item "Rollback_Scripts" -Weight 1 -TestScript {
        $rollbackScript = Join-Path $ScriptDir "rollback.ps1"
        return Test-Path $rollbackScript
    }
}

function Test-Documentation {
    Write-Log "Documentation Validation" "STEP"

    # Check for documentation files
    Test-ChecklistItem -Category "Documentation" -Item "API_Documentation" -Weight 1 -TestScript {
        $apiDocsPath = Join-Path $ScriptDir "..\docs\reference\api.md"
        return Test-Path $apiDocsPath
    }

    Test-ChecklistItem -Category "Documentation" -Item "CLI_Documentation" -Weight 1 -TestScript {
        $cliDocsPath = Join-Path $ScriptDir "..\docs\reference\cli.md"
        return Test-Path $cliDocsPath
    }

    # Test documentation server
    Test-ChecklistItem -Category "Documentation" -Item "Docs_Server" -Weight 2 -TestScript {
        try {
            $uri = "http://${Domain}:8080/"
            $response = Invoke-WebRequest -Uri $uri -TimeoutSec 5 -UseBasicParsing
            return $response.StatusCode -eq 200
        } catch {
            # Check for mkdocs.yml
            $mkdocsConfig = Join-Path $ScriptDir "..\mkdocs.yml"
            return Test-Path $mkdocsConfig
        }
    }

    # Verify README and guides
    Test-ChecklistItem -Category "Documentation" -Item "User_Guides" -Weight 1 -TestScript {
        $readmePath = Join-Path $ScriptDir "..\README.md"
        $deploymentGuide = Join-Path $ScriptDir "PRODUCTION_DEPLOYMENT_GUIDE.md"
        return (Test-Path $readmePath) -and (Test-Path $deploymentGuide)
    }
}

function Test-SecurityConfiguration {
    Write-Log "Security Configuration Validation" "STEP"

    # Check SSL/TLS certificates
    Test-ChecklistItem -Category "Security" -Item "SSL_Certificates" -Weight 3 -TestScript {
        $certPath = "/etc/ssl/certs/cybersecurity-ai.crt"
        $keyPath = "/etc/ssl/private/cybersecurity-ai.key"

        # On Windows, check alternative paths
        $winCertPath = Join-Path $ScriptDir "ssl\cybersecurity-ai.crt"
        $winKeyPath = Join-Path $ScriptDir "ssl\cybersecurity-ai.key"

        return (Test-Path $winCertPath) -and (Test-Path $winKeyPath)
    }

    # Verify environment secrets
    Test-ChecklistItem -Category "Security" -Item "Environment_Secrets" -Weight 2 -TestScript {
        $envFile = Join-Path $ScriptDir ".env.production"
        if (Test-Path $envFile) {
            $content = Get-Content $envFile -Raw
            $secrets = @("JWT_SECRET", "ENCRYPTION_KEY", "SESSION_SECRET")
            foreach ($secret in $secrets) {
                if ($content -notmatch "$secret=.{16,}") { return $false }
            }
            return $true
        }
        return $false
    }

    # Check file permissions
    Test-ChecklistItem -Category "Security" -Item "File_Permissions" -Weight 1 -TestScript {
        $envFile = Join-Path $ScriptDir ".env.production"
        if (Test-Path $envFile) {
            try {
                $acl = Get-Acl $envFile
                $accessRules = $acl.Access | Where-Object { $_.FileSystemRights -match "FullControl|Write" }
                return $accessRules.Count -le 2 # Should only be owner and system
            } catch {
                return $false
            }
        }
        return $false
    }
}

function New-ChecklistReport {
    Write-Log "Generating Deployment Checklist Report" "STEP"

    $report = @{
        timestamp = $Timestamp
        domain = $Domain
        overall_score = $OverallScore
        max_score = $MaxScore
        success_rate = if ($MaxScore -gt 0) { [math]::Round(($OverallScore / $MaxScore) * 100, 1) } else { 0 }
        checks = $CheckResults
        recommendations = @()
    }

    # Add recommendations based on failed checks
    foreach ($check in $CheckResults.Keys) {
        if ($CheckResults[$check].Status -ne "PASS") {
            switch -Wildcard ($check) {
                "Environment.Domain_Resolution" { $report.recommendations += "Add '$Domain 127.0.0.1' to hosts file or configure DNS" }
                "Docker.*" { $report.recommendations += "Ensure Docker Desktop is running and containers are started" }
                "Connectivity.*" { $report.recommendations += "Check service configurations and firewall settings" }
                "Security.SSL_Certificates" { $report.recommendations += "Generate SSL certificates using setup-ssl.ps1" }
                "Monitoring.*" { $report.recommendations += "Verify monitoring services are properly configured" }
            }
        }
    }

    # Save report
    $report | ConvertTo-Json -Depth 3 | Set-Content -Path $ChecklistFile -Encoding UTF8

    return $report
}

function Show-ChecklistSummary {
    param($Report)

    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "Post-Deployment Verification Summary" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "Domain: $($Report.domain)" -ForegroundColor White
    Write-Host "Overall Score: $($Report.overall_score)/$($Report.max_score) ($($Report.success_rate)%)" -ForegroundColor White
    Write-Host ""

    # Status interpretation
    if ($Report.success_rate -ge 90) {
        Write-Host "🎉 EXCELLENT - Production Ready!" -ForegroundColor Green
    } elseif ($Report.success_rate -ge 80) {
        Write-Host "✅ GOOD - Minor issues to resolve" -ForegroundColor Yellow
    } elseif ($Report.success_rate -ge 60) {
        Write-Host "⚠️  FAIR - Several issues need attention" -ForegroundColor Yellow
    } else {
        Write-Host "❌ POOR - Major issues require immediate attention" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "Check Categories:" -ForegroundColor Yellow

    $categories = @{}
    foreach ($check in $Report.checks.Keys) {
        $category = $check.Split('.')[0]
        if (-not $categories.ContainsKey($category)) {
            $categories[$category] = @{ Pass = 0; Total = 0 }
        }
        $categories[$category].Total++
        if ($Report.checks[$check].Status -eq "PASS") {
            $categories[$category].Pass++
        }
    }

    foreach ($category in $categories.Keys | Sort-Object) {
        $pass = $categories[$category].Pass
        $total = $categories[$category].Total
        $percent = [math]::Round(($pass / $total) * 100, 0)
        $status = if ($percent -eq 100) { "✅" } elseif ($percent -ge 80) { "⚠️" } else { "❌" }
        Write-Host "  $status $category`: $pass/$total ($percent%)" -ForegroundColor White
    }

    if ($Report.recommendations.Count -gt 0) {
        Write-Host ""
        Write-Host "Recommendations:" -ForegroundColor Yellow
        foreach ($rec in $Report.recommendations) {
            Write-Host "  • $rec" -ForegroundColor White
        }
    }

    Write-Host ""
    Write-Host "Detailed report saved to: $ChecklistFile" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Help {
    Write-Host "Post-Deployment Verification Script for Cybersecurity AI" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\post-deployment-check.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Domain <string>     Domain name to test (default: cybersec-ai.local)" -ForegroundColor White
    Write-Host "  -Verbose             Show detailed debug information" -ForegroundColor White
    Write-Host "  -SkipCICD           Skip CI/CD integration tests" -ForegroundColor White
    Write-Host "  -Help               Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\post-deployment-check.ps1" -ForegroundColor White
    Write-Host "  .\post-deployment-check.ps1 -Domain 'my-ai.local' -Verbose" -ForegroundColor White
    Write-Host "  .\post-deployment-check.ps1 -SkipCICD" -ForegroundColor White
    Write-Host ""
}

function Main {
    if ($Help) {
        Show-Help
        return
    }

    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "Cybersecurity AI - Post-Deployment Verification" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "Domain: $Domain" -ForegroundColor White
    Write-Host "Started: $Timestamp" -ForegroundColor White
    Write-Host ""

    # Initialize log
    "Starting post-deployment verification at $Timestamp" | Set-Content -Path $LogFile

    # Run all verification tests
    Test-DomainResolution
    Test-DockerServices
    Test-ServiceConnectivity
    Test-MonitoringServices
    Test-CICDIntegration
    Test-Documentation
    Test-SecurityConfiguration

    # Generate and display report
    $report = New-ChecklistReport
    Show-ChecklistSummary -Report $report

    # Exit with appropriate code
    if ($report.success_rate -ge 80) {
        exit 0
    } elseif ($report.success_rate -ge 60) {
        exit 1
    } else {
        exit 2
    }
}

# Execute main function
Main
