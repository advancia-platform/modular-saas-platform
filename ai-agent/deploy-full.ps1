# Production Deployment Execution Script
# Orchestrates the complete deployment process with validation

param(
    [string]$Domain = "cybersec-ai.local",
    [switch]$SkipSetup = $false,
    [switch]$SkipChecks = $false,
    [switch]$Force = $false,
    [switch]$Help = $false
)

$ScriptDir = $PSScriptRoot
$LogFile = Join-Path $env:TEMP "production-deployment.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Add-Content -Path $LogFile -Value $logMessage

    switch ($Level) {
        "INFO" { Write-Host "✓ $Message" -ForegroundColor Green }
        "WARN" { Write-Host "⚠ $Message" -ForegroundColor Yellow }
        "ERROR" { Write-Host "✗ $Message" -ForegroundColor Red }
        "STEP" { Write-Host "🚀 $Message" -ForegroundColor Blue }
    }
}

function Wait-ForDocker {
    Write-Log "Waiting for Docker to be ready..." "STEP"
    $attempts = 0
    $maxAttempts = 30

    while ($attempts -lt $maxAttempts) {
        try {
            $null = docker ps 2>$null
            Write-Log "Docker is ready" "INFO"
            return $true
        } catch {
            $attempts++
            Write-Host "⏳ Waiting for Docker... ($attempts/$maxAttempts)" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }

    Write-Log "Docker failed to start within timeout" "ERROR"
    return $false
}

function Invoke-ProductionSetup {
    Write-Log "Running production environment setup..." "STEP"

    $setupScript = Join-Path $ScriptDir "setup-production.ps1"
    if (-not (Test-Path $setupScript)) {
        Write-Log "Setup script not found: $setupScript" "ERROR"
        return $false
    }

    try {
        $params = @("-Domain", $Domain)
        if ($Force) { $params += "-Force" }

        & $setupScript @params

        if ($LASTEXITCODE -eq 0) {
            Write-Log "Production setup completed successfully" "INFO"
            return $true
        } else {
            Write-Log "Production setup failed with exit code: $LASTEXITCODE" "ERROR"
            return $false
        }
    } catch {
        Write-Log "Error during production setup: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Invoke-LocalDomainSetup {
    Write-Log "Setting up local domain resolution..." "STEP"

    $domainScript = Join-Path $ScriptDir "setup-local-domain.ps1"
    if (-not (Test-Path $domainScript)) {
        Write-Log "Domain setup script not found: $domainScript" "ERROR"
        return $false
    }

    try {
        & $domainScript -Domain $Domain
        return $true
    } catch {
        Write-Log "Error during domain setup: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-DockerServices {
    Write-Log "Starting Docker services..." "STEP"

    $composeFile = Join-Path $ScriptDir "docker-compose.production.yml"
    if (-not (Test-Path $composeFile)) {
        Write-Log "Docker compose file not found: $composeFile" "ERROR"
        return $false
    }

    try {
        Write-Host "Building and starting containers..." -ForegroundColor Cyan
        docker-compose -f $composeFile up -d --build

        if ($LASTEXITCODE -eq 0) {
            Write-Log "Docker services started successfully" "INFO"

            # Wait for services to be ready
            Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
            Start-Sleep -Seconds 30

            return $true
        } else {
            Write-Log "Failed to start Docker services" "ERROR"
            return $false
        }
    } catch {
        Write-Log "Error starting Docker services: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Invoke-HealthChecks {
    Write-Log "Running health checks..." "STEP"

    $healthScript = Join-Path $ScriptDir "health-check.ps1"
    if (-not (Test-Path $healthScript)) {
        Write-Log "Health check script not found: $healthScript" "ERROR"
        return $false
    }

    try {
        & $healthScript -Action "check"

        if ($LASTEXITCODE -le 1) { # 0 = healthy, 1 = degraded but acceptable
            Write-Log "Health checks passed" "INFO"
            return $true
        } else {
            Write-Log "Health checks failed" "ERROR"
            return $false
        }
    } catch {
        Write-Log "Error during health checks: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Invoke-PostDeploymentChecks {
    Write-Log "Running post-deployment verification..." "STEP"

    $checkScript = Join-Path $ScriptDir "post-deployment-check.ps1"
    if (-not (Test-Path $checkScript)) {
        Write-Log "Post-deployment check script not found: $checkScript" "ERROR"
        return $false
    }

    try {
        & $checkScript -Domain $Domain

        if ($LASTEXITCODE -le 1) { # 0 = excellent, 1 = good
            Write-Log "Post-deployment checks passed" "INFO"

            # Run comprehensive validation if available
            $validationScript = Join-Path $ScriptDir "validate-setup.ps1"
            if (Test-Path $validationScript) {
                Write-Log "Running comprehensive setup validation..." "STEP"
                try {
                    & $validationScript -Domain $Domain -Quick
                    if ($LASTEXITCODE -eq 0) {
                        Write-Log "Setup validation passed" "INFO"
                    } else {
                        Write-Log "Setup validation completed with warnings (exit code: $LASTEXITCODE)" "WARN"
                    }
                } catch {
                    Write-Log "Setup validation error: $($_.Exception.Message)" "ERROR"
                }
            } else {
                Write-Log "Setup validation script not found, skipping detailed validation" "WARN"
            }

            return $true
        } else {
            Write-Log "Post-deployment checks indicate issues that need attention" "WARN"
            return $false
        }
    } catch {
        Write-Log "Error during post-deployment checks: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Show-DeploymentSummary {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "🎉 Production Deployment Complete!" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Access URLs:" -ForegroundColor Yellow
    Write-Host "  🌐 Main Application: http://$Domain" -ForegroundColor White
    Write-Host "  🏥 Health Check: http://$Domain:3001/health" -ForegroundColor White
    Write-Host "  📊 Dashboard: http://$Domain:3000" -ForegroundColor White
    Write-Host "  📈 Metrics: http://$Domain:9090" -ForegroundColor White
    Write-Host "  📊 Grafana: http://$Domain:3001 (admin/admin)" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Open browser and navigate to http://$Domain" -ForegroundColor White
    Write-Host "  2. Test the AI threat analysis functionality" -ForegroundColor White
    Write-Host "  3. Monitor logs and metrics in Grafana" -ForegroundColor White
    Write-Host "  4. Configure alerts and notifications" -ForegroundColor White
    Write-Host ""
    Write-Host "Log Files:" -ForegroundColor Yellow
    Write-Host "  📄 Deployment: $LogFile" -ForegroundColor White
    Write-Host "  📄 Health Check: $(Join-Path $env:TEMP 'cybersecurity-ai-health.log')" -ForegroundColor White
    Write-Host "  📄 Verification: $(Join-Path $env:TEMP 'post-deployment-verification.log')" -ForegroundColor White
    Write-Host ""
    Write-Host "🛡️ Your Cybersecurity AI system is now LIVE!" -ForegroundColor Green
    Write-Host ""
}

function Show-Help {
    Write-Host "Production Deployment Script for Cybersecurity AI" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This script orchestrates the complete production deployment process:" -ForegroundColor White
    Write-Host "1. Environment setup and configuration" -ForegroundColor White
    Write-Host "2. Local domain resolution setup" -ForegroundColor White
    Write-Host "3. Docker services deployment" -ForegroundColor White
    Write-Host "4. Health checks and verification" -ForegroundColor White
    Write-Host "5. Post-deployment validation" -ForegroundColor White
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\deploy-full.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Domain <string>     Domain name for deployment (default: cybersec-ai.local)" -ForegroundColor White
    Write-Host "  -SkipSetup          Skip environment setup (use existing configuration)" -ForegroundColor White
    Write-Host "  -SkipChecks         Skip post-deployment verification" -ForegroundColor White
    Write-Host "  -Force              Force overwrite existing configuration" -ForegroundColor White
    Write-Host "  -Help               Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\deploy-full.ps1" -ForegroundColor White
    Write-Host "  .\deploy-full.ps1 -Domain 'my-ai.local'" -ForegroundColor White
    Write-Host "  .\deploy-full.ps1 -SkipSetup -Force" -ForegroundColor White
    Write-Host ""
}

function Main {
    if ($Help) {
        Show-Help
        return
    }

    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "🚀 Cybersecurity AI - Full Production Deployment" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "Domain: $Domain" -ForegroundColor White
    Write-Host "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
    Write-Host ""

    # Initialize log
    "Starting full production deployment at $(Get-Date)" | Set-Content -Path $LogFile

    $success = $true

    # Step 1: Production Environment Setup
    if (-not $SkipSetup) {
        if (-not (Invoke-ProductionSetup)) {
            $success = $false
            Write-Log "Failed at production setup step" "ERROR"
        }
    } else {
        Write-Log "Skipping production setup as requested" "INFO"
    }

    # Step 2: Local Domain Setup
    if ($success) {
        if (-not (Invoke-LocalDomainSetup)) {
            Write-Log "Domain setup failed, but continuing..." "WARN"
        }
    }

    # Step 3: Wait for Docker
    if ($success) {
        if (-not (Wait-ForDocker)) {
            $success = $false
            Write-Log "Docker is not available" "ERROR"
        }
    }

    # Step 4: Start Services
    if ($success) {
        if (-not (Start-DockerServices)) {
            $success = $false
            Write-Log "Failed to start Docker services" "ERROR"
        }
    }

    # Step 5: Health Checks
    if ($success) {
        if (-not (Invoke-HealthChecks)) {
            Write-Log "Health checks failed, but deployment may still be usable" "WARN"
        }
    }

    # Step 6: Post-Deployment Verification
    if ($success -and -not $SkipChecks) {
        if (-not (Invoke-PostDeploymentChecks)) {
            Write-Log "Post-deployment checks indicate issues to review" "WARN"
        }
    }

    # Summary
    if ($success) {
        Show-DeploymentSummary
        Write-Log "Full deployment completed successfully" "INFO"
        exit 0
    } else {
        Write-Host ""
        Write-Host "❌ Deployment failed. Check logs for details:" -ForegroundColor Red
        Write-Host "   $LogFile" -ForegroundColor White
        Write-Host ""
        Write-Log "Deployment failed" "ERROR"
        exit 1
    }
}

# Execute main function
Main
