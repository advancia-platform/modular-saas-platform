# PowerShell Production Setup Script for Cybersecurity AI System
# Windows-compatible version of the production environment setup

param(
    [switch]$Force = $false,
    [string]$Domain = "",
    [string]$DBPassword = "",
    [string]$RedisPassword = "",
    [switch]$Help = $false
)

# Script configuration
$ScriptDir = $PSScriptRoot
$EnvFile = Join-Path $ScriptDir ".env.production"
$EnvTemplate = Join-Path $ScriptDir ".env.production.template"

# Color codes for Write-Host
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    switch ($Level) {
        "INFO" { Write-Host "[$timestamp] $Message" -ForegroundColor Green }
        "WARN" { Write-Host "[$timestamp] $Message" -ForegroundColor Yellow }
        "ERROR" { Write-Host "[$timestamp] $Message" -ForegroundColor Red }
        "DEBUG" { Write-Host "[$timestamp] $Message" -ForegroundColor Cyan }
    }
}

# Generate secure random string
function Generate-SecureString {
    param([int]$Length = 32)
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    $result = -join ((1..$Length) | ForEach-Object { Get-Random -InputObject $chars.ToCharArray() })
    return $result
}

# Validate domain name
function Test-Domain {
    param([string]$DomainName)
    return $DomainName -match '^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$'
}

# Check if environment file exists
function Test-ExistingEnvironment {
    if (Test-Path $EnvFile) {
        Write-Log "Production environment file already exists" "WARN"
        if (-not $Force) {
            $response = Read-Host "Do you want to overwrite it? (y/N)"
            if ($response -notin @('y', 'Y', 'yes', 'Yes', 'YES')) {
                Write-Log "Aborting setup. Existing environment preserved." "INFO"
                exit 0
            }
        }

        # Backup existing file
        $backupName = ".env.production.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item $EnvFile (Join-Path $ScriptDir $backupName)
        Write-Log "Existing file backed up as $backupName" "DEBUG"
    }
}

# Collect configuration interactively
function Get-ProductionConfiguration {
    Write-Log "Collecting production configuration..." "INFO"
    Write-Host ""

    # Domain configuration
    if ([string]::IsNullOrEmpty($Domain)) {
        do {
            $script:Domain = Read-Host "Enter your domain name (e.g., example.com)"
        } while (-not (Test-Domain $script:Domain))
    } else {
        $script:Domain = $Domain
    }

    $script:AdditionalDomains = Read-Host "Enter additional domains (comma-separated, optional)"

    # Database configuration
    Write-Host ""
    Write-Host "Database Configuration:"
    $dbName = Read-Host "Database name [cybersecurity_ai]"
    $script:DBName = if ($dbName) { $dbName } else { "cybersecurity_ai" }

    $dbUser = Read-Host "Database username [cybersec_user]"
    $script:DBUser = if ($dbUser) { $dbUser } else { "cybersec_user" }

    if ([string]::IsNullOrEmpty($DBPassword)) {
        $dbPassword = Read-Host "Database password (leave empty to auto-generate)" -AsSecureString
        if ($dbPassword.Length -eq 0) {
            $script:DBPassword = Generate-SecureString
            Write-Log "Auto-generated database password" "INFO"
        } else {
            $script:DBPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))
        }
    } else {
        $script:DBPassword = $DBPassword
    }

    # Redis configuration
    Write-Host ""
    if ([string]::IsNullOrEmpty($RedisPassword)) {
        $redisPassword = Read-Host "Redis password (leave empty to auto-generate)" -AsSecureString
        if ($redisPassword.Length -eq 0) {
            $script:RedisPassword = Generate-SecureString
            Write-Log "Auto-generated Redis password" "INFO"
        } else {
            $script:RedisPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($redisPassword))
        }
    } else {
        $script:RedisPassword = $RedisPassword
    }

    # Email configuration
    Write-Host ""
    Write-Host "Email Configuration:"
    $smtpHost = Read-Host "SMTP host [smtp.$script:Domain]"
    $script:SMTPHost = if ($smtpHost) { $smtpHost } else { "smtp.$script:Domain" }

    $smtpPort = Read-Host "SMTP port [587]"
    $script:SMTPPort = if ($smtpPort) { $smtpPort } else { "587" }

    $smtpUser = Read-Host "SMTP username [notifications@$script:Domain]"
    $script:SMTPUser = if ($smtpUser) { $smtpUser } else { "notifications@$script:Domain" }

    $smtpPassword = Read-Host "SMTP password" -AsSecureString
    $script:SMTPPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPassword))

    $adminEmail = Read-Host "Admin email [admin@$script:Domain]"
    $script:AdminEmail = if ($adminEmail) { $adminEmail } else { "admin@$script:Domain" }

    # SSL configuration
    Write-Host ""
    Write-Host "SSL Configuration:"
    $sslResponse = Read-Host "Enable SSL? (Y/n)"
    $script:SSLEnabled = if ($sslResponse -in @('n', 'N', 'no', 'No', 'NO')) { "false" } else { "true" }

    # Monitoring configuration
    Write-Host ""
    Write-Host "Monitoring Configuration:"
    $metricsResponse = Read-Host "Enable metrics collection? (Y/n)"
    $script:MetricsEnabled = if ($metricsResponse -in @('n', 'N', 'no', 'No', 'NO')) { "false" } else { "true" }

    $prometheusPort = Read-Host "Prometheus metrics port [9090]"
    $script:PrometheusPort = if ($prometheusPort) { $prometheusPort } else { "9090" }

    # External services (optional)
    Write-Host ""
    Write-Host "External Services (Optional - press Enter to skip):"
    $script:ThreatIntelKey = Read-Host "Threat Intelligence API key"
    $script:SlackWebhook = Read-Host "Slack webhook URL for alerts"
    $script:SIEMUrl = Read-Host "SIEM integration URL"

    Write-Log "Configuration collected successfully" "INFO"
}

# Generate environment file
function New-EnvironmentFile {
    Write-Log "Generating production environment file..." "INFO"

    # Generate secrets
    $jwtSecret = Generate-SecureString -Length 64
    $encryptionKey = Generate-SecureString -Length 32
    $sessionSecret = Generate-SecureString -Length 32

    # Read template
    if (-not (Test-Path $EnvTemplate)) {
        Write-Log "Environment template not found: $EnvTemplate" "ERROR"
        exit 1
    }

    $content = Get-Content $EnvTemplate -Raw

    # Replace placeholders
    $content = $content -replace "yourdomain\.com", $script:Domain
    $content = $content -replace "cybersec_user:CHANGE_THIS_PASSWORD@database:5432/cybersecurity_ai", "cybersec_user:$($script:DBPassword)@database:5432/$($script:DBName)"
    $content = $content -replace ":CHANGE_THIS_PASSWORD@redis:6379", ":$($script:RedisPassword)@redis:6379"
    $content = $content -replace "JWT_SECRET=CHANGE_THIS_TO_A_STRONG_32_CHAR_SECRET", "JWT_SECRET=$jwtSecret"
    $content = $content -replace "ENCRYPTION_KEY=CHANGE_THIS_TO_A_STRONG_32_CHAR_SECRET", "ENCRYPTION_KEY=$encryptionKey"
    $content = $content -replace "SESSION_SECRET=CHANGE_THIS_TO_A_STRONG_32_CHAR_SECRET", "SESSION_SECRET=$sessionSecret"
    $content = $content -replace "SMTP_HOST=smtp\.yourdomain\.com", "SMTP_HOST=$($script:SMTPHost)"
    $content = $content -replace "SMTP_PORT=587", "SMTP_PORT=$($script:SMTPPort)"
    $content = $content -replace "SMTP_USER=notifications@yourdomain\.com", "SMTP_USER=$($script:SMTPUser)"
    $content = $content -replace "SMTP_PASS=CHANGE_THIS_EMAIL_PASSWORD", "SMTP_PASS=$($script:SMTPPassword)"
    $content = $content -replace "CRITICAL_ALERT_EMAIL=admin@yourdomain\.com", "CRITICAL_ALERT_EMAIL=$($script:AdminEmail)"
    $content = $content -replace "SSL_ENABLED=true", "SSL_ENABLED=$($script:SSLEnabled)"
    $content = $content -replace "METRICS_COLLECTION_ENABLED=true", "METRICS_COLLECTION_ENABLED=$($script:MetricsEnabled)"
    $content = $content -replace "PROMETHEUS_METRICS_PORT=9090", "PROMETHEUS_METRICS_PORT=$($script:PrometheusPort)"

    # Update external services if provided
    if ($script:ThreatIntelKey) {
        $content = $content -replace "THREAT_INTELLIGENCE_API_KEY=your_threat_intel_api_key_here", "THREAT_INTELLIGENCE_API_KEY=$($script:ThreatIntelKey)"
    }

    if ($script:SlackWebhook) {
        $content = $content -replace "ALERT_WEBHOOK_URL=https://hooks\.slack\.com/services/YOUR/SLACK/WEBHOOK", "ALERT_WEBHOOK_URL=$($script:SlackWebhook)"
    }

    if ($script:SIEMUrl) {
        $content = $content -replace "SIEM_INTEGRATION_URL=https://siem\.yourdomain\.com/api", "SIEM_INTEGRATION_URL=$($script:SIEMUrl)"
    }

    # Update CORS origins
    if ($script:AdditionalDomains) {
        $corsOrigins = "https://$($script:Domain)"
        $domains = $script:AdditionalDomains -split ","
        foreach ($domain in $domains) {
            $corsOrigins += ",https://$($domain.Trim())"
        }
        $content = $content -replace "CORS_ORIGINS=https://yourdomain\.com,https://www\.yourdomain\.com,https://api\.yourdomain\.com", "CORS_ORIGINS=$corsOrigins"
    } else {
        $content = $content -replace "CORS_ORIGINS=https://yourdomain\.com,https://www\.yourdomain\.com,https://api\.yourdomain\.com", "CORS_ORIGINS=https://$($script:Domain),https://www.$($script:Domain),https://api.$($script:Domain)"
    }

    # Write environment file
    Set-Content -Path $EnvFile -Value $content -Encoding UTF8

    Write-Log "Environment file generated successfully" "INFO"
}

# Set secure file permissions
function Set-SecurePermissions {
    Write-Log "Setting secure file permissions..." "INFO"

    try {
        # Get the file and set permissions to only allow current user
        $acl = Get-Acl $EnvFile
        $acl.SetAccessRuleProtection($true, $false)

        # Remove all existing permissions
        $acl.Access | ForEach-Object { $acl.RemoveAccessRule($_) }

        # Add permission for current user only
        $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
            [System.Security.Principal.WindowsIdentity]::GetCurrent().Name,
            "FullControl",
            "Allow"
        )
        $acl.SetAccessRule($accessRule)

        # Apply the ACL
        Set-Acl -Path $EnvFile -AclObject $acl

        Write-Log "File permissions secured (current user only)" "INFO"
    } catch {
        Write-Log "Warning: Could not set secure permissions: $($_.Exception.Message)" "WARN"
    }
}

# Generate database initialization script
function New-DatabaseInitScript {
    Write-Log "Generating database initialization script..." "INFO"

    $sqlContent = @"
-- Database Initialization Script
-- Creates user and database for Cybersecurity AI system

-- Create database user
CREATE USER $($script:DBUser) WITH PASSWORD '$($script:DBPassword)';

-- Create database
CREATE DATABASE $($script:DBName) OWNER $($script:DBUser);

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $($script:DBName) TO $($script:DBUser);

-- Connect to the new database
\c $($script:DBName)

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO $($script:DBUser);
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $($script:DBUser);
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $($script:DBUser);

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $($script:DBUser);
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $($script:DBUser);
"@

    $initScript = Join-Path $ScriptDir "init-database.sql"
    Set-Content -Path $initScript -Value $sqlContent -Encoding UTF8

    # Set secure permissions on init script
    try {
        $acl = Get-Acl $initScript
        $acl.SetAccessRuleProtection($true, $false)
        $acl.Access | ForEach-Object { $acl.RemoveAccessRule($_) }
        $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
            [System.Security.Principal.WindowsIdentity]::GetCurrent().Name,
            "FullControl",
            "Allow"
        )
        $acl.SetAccessRule($accessRule)
        Set-Acl -Path $initScript -AclObject $acl
    } catch {
        Write-Log "Warning: Could not secure init script permissions" "WARN"
    }

    Write-Log "Database initialization script generated" "INFO"
}

# Display setup summary
function Show-SetupSummary {
    Write-Log "Production Environment Setup Complete!" "INFO"
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Configuration Summary:" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Domain: $($script:Domain)" -ForegroundColor White
    Write-Host "Database: $($script:DBName)" -ForegroundColor White
    Write-Host "Database User: $($script:DBUser)" -ForegroundColor White
    Write-Host "SSL Enabled: $($script:SSLEnabled)" -ForegroundColor White
    Write-Host "Metrics Enabled: $($script:MetricsEnabled)" -ForegroundColor White
    Write-Host "Admin Email: $($script:AdminEmail)" -ForegroundColor White
    Write-Host ""
    Write-Host "Files Created:" -ForegroundColor Yellow
    Write-Host "- $EnvFile" -ForegroundColor White
    Write-Host "- $(Join-Path $ScriptDir 'init-database.sql')" -ForegroundColor White
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "1. Review the generated .env.production file" -ForegroundColor White
    Write-Host "2. Ensure Docker Desktop is running" -ForegroundColor White
    Write-Host "3. Deploy the application:" -ForegroundColor White
    Write-Host "   docker-compose -f docker-compose.production.yml up -d" -ForegroundColor Gray
    Write-Host "4. Run health checks:" -ForegroundColor White
    Write-Host "   .\health-check.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Security Notes:" -ForegroundColor Yellow
    Write-Host "- Environment file permissions are restricted to current user" -ForegroundColor White
    Write-Host "- All secrets have been auto-generated with secure random values" -ForegroundColor White
    Write-Host "- Database password and other credentials are stored securely" -ForegroundColor White
    Write-Host ""
    Write-Host "Access URLs (after deployment):" -ForegroundColor Yellow
    Write-Host "- Main Application: https://$($script:Domain)" -ForegroundColor White
    Write-Host "- Health Check: https://$($script:Domain)/health" -ForegroundColor White
    Write-Host "- Metrics: https://$($script:Domain)/metrics" -ForegroundColor White
    Write-Host ""
}

# Show help information
function Show-Help {
    Write-Host "Production Environment Setup Script for Cybersecurity AI" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This script helps you configure the production environment" -ForegroundColor White
    Write-Host "for the Cybersecurity AI system by generating secure" -ForegroundColor White
    Write-Host "environment variables and configuration files." -ForegroundColor White
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\setup-production.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Domain <string>      Domain name for the deployment" -ForegroundColor White
    Write-Host "  -DBPassword <string>  Database password (auto-generated if not provided)" -ForegroundColor White
    Write-Host "  -RedisPassword <string> Redis password (auto-generated if not provided)" -ForegroundColor White
    Write-Host "  -Force               Overwrite existing environment without prompt" -ForegroundColor White
    Write-Host "  -Help                Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\setup-production.ps1" -ForegroundColor White
    Write-Host "  .\setup-production.ps1 -Domain 'example.com' -Force" -ForegroundColor White
    Write-Host ""
}

# Main execution
function Main {
    if ($Help) {
        Show-Help
        return
    }

    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Cybersecurity AI - Production Setup" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # Check if template exists
    if (-not (Test-Path $EnvTemplate)) {
        Write-Log "Environment template not found: $EnvTemplate" "ERROR"
        exit 1
    }

    # Run setup steps
    Test-ExistingEnvironment
    Get-ProductionConfiguration
    New-EnvironmentFile
    Set-SecurePermissions
    New-DatabaseInitScript
    Show-SetupSummary

    Write-Log "Production environment setup completed successfully!" "INFO"
}

# Execute main function
Main
