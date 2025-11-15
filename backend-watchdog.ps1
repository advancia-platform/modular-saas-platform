#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Auto-Restart Watchdog for Advancia Pay Backend
    
.DESCRIPTION
    Monitors backend health endpoint and automatically restarts the service
    if it becomes unresponsive. Runs continuously with configurable intervals.
    
.PARAMETER Port
    Backend port to monitor (default: 4000)
    
.PARAMETER CheckInterval
    Seconds between health checks (default: 60)
    
.PARAMETER MaxRetries
    Number of failed checks before restart (default: 3)
    
.PARAMETER UsePM2
    Use PM2 for restart instead of direct node process (default: $true)
    
.PARAMETER LogFile
    Path to watchdog log file (default: ./logs/watchdog.log)
    
.EXAMPLE
    .\backend-watchdog.ps1
    Start watchdog with default settings
    
.EXAMPLE
    .\backend-watchdog.ps1 -Port 4000 -CheckInterval 30 -MaxRetries 2
    Custom monitoring with 30-second intervals and 2 retry threshold
    
.EXAMPLE
    .\backend-watchdog.ps1 -UsePM2 $false
    Monitor and restart without PM2
    
.NOTES
    Author: Advancia Pay Dev Team
    Date: November 14, 2025
    Version: 1.0
#>

param (
    [Parameter(Mandatory=$false)]
    [int]$Port = 4000,
    
    [Parameter(Mandatory=$false)]
    [int]$CheckInterval = 60,
    
    [Parameter(Mandatory=$false)]
    [int]$MaxRetries = 3,
    
    [Parameter(Mandatory=$false)]
    [bool]$UsePM2 = $true,
    
    [Parameter(Mandatory=$false)]
    [string]$LogFile = "logs\watchdog.log",
    
    [Parameter(Mandatory=$false)]
    [string]$SlackWebhook = "",
    
    [Parameter(Mandatory=$false)]
    [string]$EmailTo = "",
    
    [Parameter(Mandatory=$false)]
    [string]$SmtpServer = "",
    
    [Parameter(Mandatory=$false)]
    [string]$SmtpPort = "587",
    
    [Parameter(Mandatory=$false)]
    [string]$FromEmail = "",
    
    [Parameter(Mandatory=$false)]
    [string]$SmtpUsername = "",
    
    [Parameter(Mandatory=$false)]
    [string]$SmtpPassword = ""
)

# Color output functions
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green $args }
function Write-Info { Write-ColorOutput Cyan $args }
function Write-Warning { Write-ColorOutput Yellow $args }
function Write-Failure { Write-ColorOutput Red $args }

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    # Ensure log directory exists
    $logDir = Split-Path $LogFile -Parent
    if ($logDir -and !(Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    
    # Write to log file
    Add-Content -Path $LogFile -Value $logMessage
    
    # Also write to console with color
    switch ($Level) {
        "ERROR" { Write-Failure $logMessage }
        "WARN"  { Write-Warning $logMessage }
        "SUCCESS" { Write-Success $logMessage }
        default { Write-Info $logMessage }
    }
}

# Health check function
function Test-BackendHealth {
    param([int]$PortNumber)
    
    try {
        $url = "http://localhost:$PortNumber/api/health"
        $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 5 -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Restart function
function Restart-Backend {
    param([int]$PortNumber, [bool]$UseProcessManager)
    
    Write-Log "Attempting to restart backend..." "WARN"
    
    try {
        # Step 1: Free the port
        $connection = Get-NetTCPConnection -LocalPort $PortNumber -ErrorAction SilentlyContinue
        if ($connection) {
            $pid = $connection.OwningProcess | Select-Object -First 1
            Write-Log "Killing process $pid on port $PortNumber" "WARN"
            Stop-Process -Id $pid -Force -ErrorAction Stop
            Start-Sleep -Seconds 3
            Write-Log "Port $PortNumber freed" "INFO"
        }
        
        # Step 2: Restart backend
        $backendPath = Join-Path $PSScriptRoot "backend"
        Push-Location $backendPath
        
        if ($UseProcessManager) {
            # Use PM2
            Write-Log "Restarting with PM2..." "INFO"
            
            $pm2List = pm2 jlist | ConvertFrom-Json -ErrorAction SilentlyContinue
            $existingProcess = $pm2List | Where-Object { $_.name -eq "advancia-backend" }
            
            if ($existingProcess) {
                pm2 restart advancia-backend 2>&1 | Out-Null
                Write-Log "PM2 process restarted" "SUCCESS"
            } else {
                pm2 start src\index.js --name advancia-backend --watch --max-memory-restart 1G 2>&1 | Out-Null
                pm2 save 2>&1 | Out-Null
                Write-Log "PM2 process started" "SUCCESS"
            }
        } else {
            # Direct node restart in background
            Write-Log "Starting node process in background..." "INFO"
            Start-Process -FilePath "node" -ArgumentList "src\index.js" -WorkingDirectory $backendPath -WindowStyle Hidden
            Write-Log "Node process started" "SUCCESS"
        }
        
        Pop-Location
        
        # Wait for backend to initialize
        Write-Log "Waiting for backend to initialize (10 seconds)..." "INFO"
        Start-Sleep -Seconds 10
        
        return $true
    }
    catch {
        Write-Log "Restart failed: $_" "ERROR"
        Pop-Location
        return $false
    }
}

# ============================================
# NOTIFICATION FUNCTIONS
# ============================================

# Send Slack notification
function Send-SlackNotification {
    param (
        [string]$Message,
        [string]$Color = "warning"
    )
    
    if ($SlackWebhook -eq "") {
        return
    }
    
    try {
        $colorMap = @{
            "success" = "good"
            "warning" = "warning"
            "danger" = "danger"
            "info" = "#439FE0"
        }
        
        $payload = @{
            attachments = @(
                @{
                    fallback = $Message
                    color = $colorMap[$Color]
                    title = "🔔 Advancia Backend Watchdog Alert"
                    text = $Message
                    footer = "Watchdog Monitor"
                    ts = [int][double]::Parse((Get-Date -UFormat %s))
                }
            )
        } | ConvertTo-Json -Depth 4
        
        Invoke-RestMethod -Uri $SlackWebhook -Method Post -ContentType 'application/json' -Body $payload -ErrorAction Stop
        Write-Log "✓ Slack notification sent" "INFO"
    }
    catch {
        Write-Log "✗ Slack notification failed: $($_.Exception.Message)" "ERROR"
    }
}

# Send email notification
function Send-EmailNotification {
    param (
        [string]$Subject,
        [string]$Body
    )
    
    if ($EmailTo -eq "" -or $SmtpServer -eq "" -or $FromEmail -eq "") {
        return
    }
    
    try {
        $emailParams = @{
            To = $EmailTo
            From = $FromEmail
            Subject = $Subject
            Body = $Body
            SmtpServer = $SmtpServer
            Port = $SmtpPort
            UseSsl = $true
        }
        
        # Add credentials if provided
        if ($SmtpUsername -ne "" -and $SmtpPassword -ne "") {
            $securePassword = ConvertTo-SecureString $SmtpPassword -AsPlainText -Force
            $credential = New-Object System.Management.Automation.PSCredential ($SmtpUsername, $securePassword)
            $emailParams.Credential = $credential
        }
        
        Send-MailMessage @emailParams -ErrorAction Stop
        Write-Log "✓ Email notification sent to $EmailTo" "INFO"
    }
    catch {
        Write-Log "✗ Email notification failed: $($_.Exception.Message)" "ERROR"
    }
}

# Send alert with all configured notification methods
function Send-Alert {
    param(
        [string]$Message,
        [string]$Level = "warning",
        [hashtable]$Stats = @{}
    )
    
    Write-Log "ALERT [$Level]: $Message" "ERROR"
    
    # Map alert levels to Slack colors
    $colorMap = @{
        "success" = "success"
        "info" = "info"
        "warning" = "warning"
        "error" = "danger"
        "critical" = "danger"
    }
    
    # Send Slack notification
    $slackMessage = $Message
    if ($Stats.Count -gt 0) {
        $slackMessage += "`n`n*Statistics:*"
        foreach ($key in $Stats.Keys) {
            $slackMessage += "`n• $key`: $($Stats[$key])"
        }
    }
    Send-SlackNotification -Message $slackMessage -Color $colorMap[$Level]
    
    # Send email for critical alerts
    if ($Level -eq "error" -or $Level -eq "critical") {
        $emailSubject = "🚨 Advancia Backend Alert - $Level"
        $emailBody = @"
Advancia Backend Watchdog Alert
================================

Level: $Level
Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Port: $Port

Message:
$Message

Statistics:
"@
        if ($Stats.Count -gt 0) {
            foreach ($key in $Stats.Keys) {
                $emailBody += "`n- $key`: $($Stats[$key])"
            }
        }
        
        $emailBody += @"


This is an automated message from Advancia Backend Watchdog.
To stop receiving these alerts, please resolve the backend issue or stop the watchdog service.
"@
        
        Send-EmailNotification -Subject $emailSubject -Body $emailBody
    }
}

# Main watchdog loop
function Start-Watchdog {
    Write-Log "========================================" "INFO"
    Write-Log "Backend Watchdog Starting" "SUCCESS"
    Write-Log "Port: $Port" "INFO"
    Write-Log "Check Interval: $CheckInterval seconds" "INFO"
    Write-Log "Max Retries: $MaxRetries" "INFO"
    Write-Log "PM2 Mode: $UsePM2" "INFO"
    Write-Log "Log File: $LogFile" "INFO"
    Write-Log "========================================" "INFO"
    Write-Host ""
    Write-Info "Press Ctrl+C to stop the watchdog"
    Write-Host ""
    
    $failureCount = 0
    $consecutiveSuccesses = 0
    $totalChecks = 0
    $totalRestarts = 0
    $startTime = Get-Date
    
    while ($true) {
        $totalChecks++
        $checkTime = Get-Date -Format "HH:mm:ss"
        
        Write-Host -NoNewline "[$checkTime] Checking health... "
        
        if (Test-BackendHealth -PortNumber $Port) {
            # Health check passed
            Write-Success "✓ Healthy"
            Write-Log "Health check passed ($consecutiveSuccesses consecutive)" "INFO"
            
            $failureCount = 0
            $consecutiveSuccesses++
            
        } else {
            # Health check failed
            $failureCount++
            $consecutiveSuccesses = 0
            
            Write-Failure "✗ Failed ($failureCount/$MaxRetries)"
            Write-Log "Health check failed (attempt $failureCount of $MaxRetries)" "WARN"
            
            if ($failureCount -ge $MaxRetries) {
                Write-Failure "`n⚠ CRITICAL: Health check failed $MaxRetries times!"
                Write-Log "CRITICAL: Health check failed $MaxRetries times. Initiating restart..." "ERROR"
                
                # Calculate statistics
                $uptime = (Get-Date) - $startTime
                $uptimeStr = "{0:D2}h {1:D2}m {2:D2}s" -f $uptime.Hours, $uptime.Minutes, $uptime.Seconds
                $successRate = if ($totalChecks -gt 0) { [math]::Round((($totalChecks - $failureCount) / $totalChecks) * 100, 2) } else { 0 }
                
                $stats = @{
                    "Uptime" = $uptimeStr
                    "Total Checks" = $totalChecks
                    "Total Restarts" = $totalRestarts
                    "Success Rate" = "$successRate%"
                    "Port" = $Port
                }
                
                Send-Alert -Message "Backend health check failed $MaxRetries times. Auto-restart initiated." -Level "error" -Stats $stats
                
                $restartSuccess = Restart-Backend -PortNumber $Port -UseProcessManager $UsePM2
                
                if ($restartSuccess) {
                    $totalRestarts++
                    Write-Success "`n✓ Backend restarted successfully (Total restarts: $totalRestarts)"
                    Write-Log "Backend restarted successfully (Total restarts: $totalRestarts)" "SUCCESS"
                    
                    $stats["Total Restarts"] = $totalRestarts
                    Send-Alert -Message "Backend auto-restart completed successfully. Service is now healthy." -Level "success" -Stats $stats
                } else {
                    Write-Failure "`n✗ Backend restart FAILED!"
                    Write-Log "Backend restart FAILED!" "ERROR"
                    
                    Send-Alert -Message "CRITICAL: Backend auto-restart FAILED! Manual intervention required." -Level "critical" -Stats $stats
                }
                
                # Reset failure counter after restart attempt
                $failureCount = 0
            }
        }
        
        # Display statistics every 10 checks
        if ($totalChecks % 10 -eq 0) {
            $uptime = (Get-Date) - $startTime
            $uptimeStr = "{0:hh\:mm\:ss}" -f $uptime
            Write-Host ""
            Write-Info "=== Watchdog Statistics ==="
            Write-Info "  Uptime: $uptimeStr"
            Write-Info "  Total Checks: $totalChecks"
            Write-Info "  Total Restarts: $totalRestarts"
            Write-Info "  Success Rate: $([math]::Round(($totalChecks - $totalRestarts * $MaxRetries) / $totalChecks * 100, 2))%"
            Write-Host ""
        }
        
        # Wait before next check
        Start-Sleep -Seconds $CheckInterval
    }
}

# Handle Ctrl+C gracefully
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Write-Log "Watchdog stopping..." "INFO"
    Write-Log "========================================" "INFO"
}

# Start the watchdog
try {
    Start-Watchdog
}
catch {
    Write-Log "Watchdog crashed: $_" "ERROR"
    Send-Alert "Watchdog process crashed: $_"
    exit 1
}
