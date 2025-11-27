# PowerShell Health Check Script for Production Deployment
# Windows-compatible comprehensive system health monitoring

param(
    [string]$Action = "check",
    [switch]$Detailed = $false,
    [switch]$Help = $false
)

# Configuration
$ScriptDir = $PSScriptRoot
$LogFile = Join-Path $env:TEMP "cybersecurity-ai-health.log"
$HealthStatusFile = Join-Path $env:TEMP "health-status.json"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Default ports (can be overridden by environment)
$AIAgentPort = if ($env:AI_AGENT_PORT) { $env:AI_AGENT_PORT } else { 3001 }
$DashboardPort = if ($env:DASHBOARD_PORT) { $env:DASHBOARD_PORT } else { 3000 }
$IntegrationPort = if ($env:INTEGRATION_SERVER_PORT) { $env:INTEGRATION_SERVER_PORT } else { 8000 }
$DatabasePort = if ($env:DATABASE_PORT) { $env:DATABASE_PORT } else { 5432 }
$RedisPort = if ($env:REDIS_PORT) { $env:REDIS_PORT } else { 6379 }
$NginxPort = if ($env:NGINX_PORT) { $env:NGINX_PORT } else { 80 }
$NginxSSLPort = if ($env:NGINX_SSL_PORT) { $env:NGINX_SSL_PORT } else { 443 }

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $logMessage = "[$Timestamp] [$Level] $Message"
    Add-Content -Path $LogFile -Value $logMessage

    switch ($Level) {
        "INFO" { Write-Host $Message -ForegroundColor Green }
        "WARN" { Write-Host $Message -ForegroundColor Yellow }
        "ERROR" { Write-Host $Message -ForegroundColor Red }
        "DEBUG" { Write-Host $Message -ForegroundColor Cyan }
    }
}

# Health check function for HTTP services
function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [string]$Host = "localhost",
        [int]$Port,
        [string]$Endpoint = "/health",
        [int]$TimeoutSeconds = 10
    )

    Write-Host "Checking $ServiceName... " -NoNewline

    try {
        $uri = "http://${Host}:${Port}${Endpoint}"
        $response = Invoke-WebRequest -Uri $uri -TimeoutSec $TimeoutSeconds -UseBasicParsing -ErrorAction Stop

        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Healthy" -ForegroundColor Green
            return $true
        } else {
            Write-Host "✗ Unhealthy (Status: $($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "✗ Unhealthy (Error: $($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

# Docker container health check
function Test-DockerContainers {
    Write-Host "Checking Docker containers..."

    $containers = @(
        "cybersecurity_ai_main",
        "cybersecurity_ai_dashboard",
        "cybersecurity_ai_database",
        "cybersecurity_ai_redis",
        "cybersecurity_ai_nginx",
        "cybersecurity_ai_prometheus",
        "cybersecurity_ai_grafana",
        "cybersecurity_ai_elasticsearch"
    )

    $healthy = 0
    $total = $containers.Count

    try {
        foreach ($container in $containers) {
            $result = docker ps --filter "name=$container" --filter "status=running" --format "{{.Names}}" 2>$null
            if ($result -eq $container) {
                Write-Host "  ✓ $container" -ForegroundColor Green
                $healthy++
            } else {
                Write-Host "  ✗ $container" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "  ✗ Docker not available or containers not running" -ForegroundColor Red
        return $false
    }

    Write-Host "Container health: $healthy/$total containers running"

    return ($healthy -eq $total)
}

# Memory usage check
function Test-MemoryUsage {
    Write-Host "Checking memory usage... " -NoNewline

    try {
        $memory = Get-CimInstance -ClassName Win32_OperatingSystem
        $totalMemory = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 2)
        $freeMemory = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
        $usedMemory = $totalMemory - $freeMemory
        $memoryUsage = [math]::Round(($usedMemory / $totalMemory) * 100, 1)
        $memoryThreshold = 85.0

        if ($memoryUsage -lt $memoryThreshold) {
            Write-Host "✓ Memory usage: $memoryUsage%" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠ High memory usage: $memoryUsage%" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "✗ Could not check memory usage" -ForegroundColor Red
        return $false
    }
}

# Disk usage check
function Test-DiskUsage {
    Write-Host "Checking disk usage... " -NoNewline

    try {
        $disk = Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 -and $_.DeviceID -eq "C:" }
        if ($disk) {
            $diskUsage = [math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 1)
            $diskThreshold = 85

            if ($diskUsage -lt $diskThreshold) {
                Write-Host "✓ Disk usage: $diskUsage%" -ForegroundColor Green
                return $true
            } else {
                Write-Host "⚠ High disk usage: $diskUsage%" -ForegroundColor Yellow
                return $false
            }
        } else {
            Write-Host "✗ Could not find C: drive" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "✗ Could not check disk usage" -ForegroundColor Red
        return $false
    }
}

# CPU usage check
function Test-CPUUsage {
    Write-Host "Checking CPU usage... " -NoNewline

    try {
        $cpu = Get-CimInstance -ClassName Win32_Processor | Measure-Object -Property LoadPercentage -Average
        $cpuUsage = [math]::Round($cpu.Average, 1)
        $cpuThreshold = 80

        if ($cpuUsage -lt $cpuThreshold) {
            Write-Host "✓ CPU usage: $cpuUsage%" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠ High CPU usage: $cpuUsage%" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "✗ Could not check CPU usage" -ForegroundColor Red
        return $false
    }
}

# Network connectivity check
function Test-NetworkConnectivity {
    Write-Host "Checking network connectivity..."

    $endpoints = @(
        @{ Host = "google.com"; Port = 80 },
        @{ Host = "github.com"; Port = 443 }
    )

    $connected = 0
    $total = $endpoints.Count

    foreach ($endpoint in $endpoints) {
        try {
            $result = Test-NetConnection -ComputerName $endpoint.Host -Port $endpoint.Port -InformationLevel Quiet -WarningAction SilentlyContinue
            if ($result) {
                Write-Host "  ✓ $($endpoint.Host):$($endpoint.Port)" -ForegroundColor Green
                $connected++
            } else {
                Write-Host "  ✗ $($endpoint.Host):$($endpoint.Port)" -ForegroundColor Red
            }
        } catch {
            Write-Host "  ✗ $($endpoint.Host):$($endpoint.Port)" -ForegroundColor Red
        }
    }

    Write-Host "Network connectivity: $connected/$total endpoints reachable"

    return ($connected -eq $total)
}

# Check recent Docker logs for errors
function Test-RecentErrors {
    Write-Host "Checking for recent errors... " -NoNewline

    try {
        $errorCount = 0
        $containers = @("cybersecurity_ai_main", "cybersecurity_ai_dashboard")

        foreach ($container in $containers) {
            $logs = docker logs $container --since="5m" 2>&1
            if ($logs) {
                $errors = $logs | Select-String -Pattern "error" -CaseSensitive:$false
                $errorCount += $errors.Count
            }
        }

        if ($errorCount -eq 0) {
            Write-Host "✓ No errors in last 5 minutes" -ForegroundColor Green
            return $true
        } elseif ($errorCount -lt 5) {
            Write-Host "⚠ $errorCount errors in last 5 minutes" -ForegroundColor Yellow
            return $false
        } else {
            Write-Host "✗ $errorCount errors in last 5 minutes" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "⚠ Could not check container logs" -ForegroundColor Yellow
        return $false
    }
}

# Generate health status JSON
function New-HealthStatusReport {
    param(
        [string]$OverallStatus,
        [string]$Timestamp,
        [hashtable]$CheckResults
    )

    $systemInfo = @{
        uptime = (Get-CimInstance -ClassName Win32_OperatingSystem).LastBootUpTime.ToString("yyyy-MM-dd HH:mm:ss")
        memory_usage = (Get-CimInstance -ClassName Win32_OperatingSystem | ForEach-Object {
            [math]::Round(((($_.TotalVisibleMemorySize - $_.FreePhysicalMemory) / $_.TotalVisibleMemorySize) * 100), 1).ToString() + "%"
        })
        disk_usage = (Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object { $_.DeviceID -eq "C:" } | ForEach-Object {
            [math]::Round(((($_.Size - $_.FreeSpace) / $_.Size) * 100), 1).ToString() + "%"
        })
        cpu_usage = (Get-CimInstance -ClassName Win32_Processor | Measure-Object -Property LoadPercentage -Average | ForEach-Object {
            $_.Average.ToString() + "%"
        })
    }

    $healthStatus = @{
        timestamp = $Timestamp
        overall_status = $OverallStatus
        checks = $CheckResults
        system_info = $systemInfo
    } | ConvertTo-Json -Depth 3

    Set-Content -Path $HealthStatusFile -Value $healthStatus -Encoding UTF8
}

# Main health check function
function Invoke-HealthCheck {
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "Cybersecurity AI - Production Health Check" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "Started at: $Timestamp" -ForegroundColor White
    Write-Host ""

    # Create log directory if it doesn't exist
    $logDir = Split-Path $LogFile -Parent
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }

    $failedChecks = 0
    $checkResults = @{}

    # Core service checks
    $checkResults.ai_agent = Test-ServiceHealth -ServiceName "AI Agent" -Host "localhost" -Port $AIAgentPort -Endpoint "/health" -TimeoutSeconds 10
    if (-not $checkResults.ai_agent) { $failedChecks++ }

    $checkResults.dashboard = Test-ServiceHealth -ServiceName "Dashboard" -Host "localhost" -Port $DashboardPort -Endpoint "/" -TimeoutSeconds 10
    if (-not $checkResults.dashboard) { $failedChecks++ }

    $checkResults.integration = Test-ServiceHealth -ServiceName "Integration Server" -Host "localhost" -Port $IntegrationPort -Endpoint "/health" -TimeoutSeconds 10
    if (-not $checkResults.integration) { $failedChecks++ }

    # Infrastructure checks
    $checkResults.containers = Test-DockerContainers
    if (-not $checkResults.containers) { $failedChecks++ }

    # System resource checks
    $checkResults.memory = Test-MemoryUsage
    if (-not $checkResults.memory) { $failedChecks++ }

    $checkResults.disk = Test-DiskUsage
    if (-not $checkResults.disk) { $failedChecks++ }

    $checkResults.cpu = Test-CPUUsage
    if (-not $checkResults.cpu) { $failedChecks++ }

    # Network and error checks
    $checkResults.network = Test-NetworkConnectivity
    if (-not $checkResults.network) { $failedChecks++ }

    $checkResults.errors = Test-RecentErrors
    if (-not $checkResults.errors) { $failedChecks++ }

    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan

    $overallStatus = ""
    if ($failedChecks -eq 0) {
        $overallStatus = "healthy"
        Write-Host "✓ Overall Status: HEALTHY" -ForegroundColor Green
        Write-Log "Health check passed - all systems operational" "INFO"
    } elseif ($failedChecks -lt 3) {
        $overallStatus = "degraded"
        Write-Host "⚠ Overall Status: DEGRADED ($failedChecks issues detected)" -ForegroundColor Yellow
        Write-Log "Health check detected $failedChecks issues" "WARN"
    } else {
        $overallStatus = "unhealthy"
        Write-Host "✗ Overall Status: UNHEALTHY ($failedChecks issues detected)" -ForegroundColor Red
        Write-Log "Health check failed - $failedChecks critical issues" "ERROR"
    }

    Write-Host "================================================" -ForegroundColor Cyan

    # Generate health status JSON
    New-HealthStatusReport -OverallStatus $overallStatus -Timestamp $Timestamp -CheckResults $checkResults

    # Return exit code based on health status
    if ($failedChecks -eq 0) {
        return 0
    } elseif ($failedChecks -lt 3) {
        return 1
    } else {
        return 2
    }
}

# Show status from last health check
function Show-HealthStatus {
    if (Test-Path $HealthStatusFile) {
        $status = Get-Content $HealthStatusFile | ConvertFrom-Json
        $status | ConvertTo-Json -Depth 3 | Write-Host
    } else {
        Write-Host "No health status file found. Run health check first." -ForegroundColor Yellow
        return 1
    }
}

# Show log file
function Show-HealthLog {
    if (Test-Path $LogFile) {
        Get-Content $LogFile -Tail 50 | Write-Host
    } else {
        Write-Host "No log file found." -ForegroundColor Yellow
        return 1
    }
}

# Show help information
function Show-Help {
    Write-Host "Production Health Check Script for Cybersecurity AI" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\health-check.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Yellow
    Write-Host "  -Action check        Run comprehensive health check (default)" -ForegroundColor White
    Write-Host "  -Action status       Show last health check status" -ForegroundColor White
    Write-Host "  -Action log          Show health check log file" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Detailed            Show detailed information" -ForegroundColor White
    Write-Host "  -Help                Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\health-check.ps1" -ForegroundColor White
    Write-Host "  .\health-check.ps1 -Action status" -ForegroundColor White
    Write-Host "  .\health-check.ps1 -Action log" -ForegroundColor White
    Write-Host ""
}

# Main execution
function Main {
    if ($Help) {
        Show-Help
        return
    }

    switch ($Action.ToLower()) {
        "check" {
            $exitCode = Invoke-HealthCheck
            exit $exitCode
        }
        "status" {
            Show-HealthStatus
        }
        "log" {
            Show-HealthLog
        }
        default {
            Write-Host "Unknown action: $Action" -ForegroundColor Red
            Write-Host "Use '.\health-check.ps1 -Help' for usage information" -ForegroundColor Yellow
            exit 1
        }
    }
}

# Execute main function
Main
