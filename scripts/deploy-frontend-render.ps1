# Deploy Frontend to Render and Configure Cloudflare
# PowerShell script for Windows

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("setup", "deploy", "verify", "all")]
    [string]$Action = "all",
    
    [Parameter(Mandatory=$false)]
    [string]$Domain = "advancia.app",
    
    [Parameter(Mandatory=$false)]
    [string]$RenderApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$CloudflareApiToken,
    
    [Parameter(Mandatory=$false)]
    [string]$CloudflareZoneId
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "⚠️  $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "❌ $args" -ForegroundColor Red }

# Banner
function Show-Banner {
    Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║         Advancia Pay - Frontend Deployment Tool              ║
║         Deploy Next.js to Render + Cloudflare                ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan
}

# Check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js installed: $nodeVersion"
    } catch {
        Write-Error "Node.js not found. Please install from https://nodejs.org"
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Success "npm installed: $npmVersion"
    } catch {
        Write-Error "npm not found. Please install Node.js"
        exit 1
    }
    
    # Check if frontend directory exists
    if (-not (Test-Path "frontend")) {
        Write-Error "Frontend directory not found. Please run from project root."
        exit 1
    }
    
    Write-Success "All prerequisites met!"
}

# Build frontend locally
function Build-Frontend {
    Write-Info "Building frontend locally..."
    
    Push-Location frontend
    
    try {
        # Install dependencies
        Write-Info "Installing dependencies..."
        npm ci
        
        # Build
        Write-Info "Building Next.js app..."
        $env:NEXT_PUBLIC_API_URL = "https://api.$Domain"
        $env:NODE_ENV = "production"
        
        npm run build
        
        Write-Success "Frontend built successfully!"
        
    } catch {
        Write-Error "Build failed: $_"
        Pop-Location
        exit 1
    }
    
    Pop-Location
}

# Create Render service
function New-RenderService {
    param([string]$ApiKey)
    
    Write-Info "Creating Render web service..."
    
    $headers = @{
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        "type" = "web_service"
        "name" = "advancia-frontend"
        "repo" = "https://github.com/pdtribe181-prog/-modular-saas-platform"
        "branch" = "main"
        "rootDir" = "frontend"
        "env" = "node"
        "buildCommand" = "npm install && npm run build"
        "startCommand" = "npm start"
        "region" = "oregon"
        "plan" = "free"
        "envVars" = @(
            @{
                "key" = "NODE_ENV"
                "value" = "production"
            },
            @{
                "key" = "NEXT_PUBLIC_API_URL"
                "value" = "https://api.$Domain"
            }
        )
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services" `
            -Method Post `
            -Headers $headers `
            -Body $body
        
        Write-Success "Render service created!"
        Write-Info "Service ID: $($response.service.id)"
        Write-Info "Service URL: $($response.service.serviceDetails.url)"
        
        return $response.service
        
    } catch {
        Write-Error "Failed to create Render service: $_"
        return $null
    }
}

# Trigger Render deployment
function Start-RenderDeployment {
    param(
        [string]$ApiKey,
        [string]$ServiceId
    )
    
    Write-Info "Triggering Render deployment..."
    
    $headers = @{
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        "clearCache" = "do_not_clear"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$ServiceId/deploys" `
            -Method Post `
            -Headers $headers `
            -Body $body
        
        Write-Success "Deployment triggered!"
        Write-Info "Deploy ID: $($response.id)"
        
        return $response.id
        
    } catch {
        Write-Error "Failed to trigger deployment: $_"
        return $null
    }
}

# Wait for deployment
function Wait-RenderDeployment {
    param(
        [string]$ApiKey,
        [string]$ServiceId,
        [string]$DeployId
    )
    
    Write-Info "Waiting for deployment to complete..."
    
    $headers = @{
        "Authorization" = "Bearer $ApiKey"
    }
    
    $maxWait = 600  # 10 minutes
    $elapsed = 0
    $interval = 15
    
    while ($elapsed -lt $maxWait) {
        try {
            $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$ServiceId/deploys/$DeployId" `
                -Method Get `
                -Headers $headers
            
            $status = $response.status
            
            Write-Host "Status: $status (${elapsed}s elapsed)" -NoNewline
            Write-Host "`r" -NoNewline
            
            switch ($status) {
                "live" {
                    Write-Host ""  # New line
                    Write-Success "Deployment completed successfully!"
                    return $true
                }
                { $_ -in @("build_failed", "failed", "canceled") } {
                    Write-Host ""  # New line
                    Write-Error "Deployment failed with status: $status"
                    return $false
                }
                default {
                    Start-Sleep -Seconds $interval
                    $elapsed += $interval
                }
            }
            
        } catch {
            Write-Warning "Error checking status: $_"
            Start-Sleep -Seconds $interval
            $elapsed += $interval
        }
    }
    
    Write-Host ""  # New line
    Write-Warning "Deployment timed out after ${maxWait}s"
    return $false
}

# Configure Cloudflare DNS
function Set-CloudflareDNS {
    param(
        [string]$ApiToken,
        [string]$ZoneId,
        [string]$Domain,
        [string]$BackendUrl
    )
    
    Write-Info "Configuring Cloudflare DNS..."
    
    $headers = @{
        "Authorization" = "Bearer $ApiToken"
        "Content-Type" = "application/json"
    }
    
    # Get backend IP
    Write-Info "Resolving backend IP..."
    try {
        $backendHost = $BackendUrl -replace '^https?://', ''
        $backendIp = [System.Net.Dns]::GetHostAddresses($backendHost)[0].IPAddressToString
        Write-Success "Backend IP: $backendIp"
    } catch {
        Write-Warning "Could not resolve backend IP, using CNAME instead"
        $backendIp = $null
    }
    
    # DNS records to create
    $records = @(
        @{
            type = "A"
            name = "@"
            content = $backendIp
            proxied = $true
            comment = "Root domain - Frontend"
        },
        @{
            type = "CNAME"
            name = "www"
            content = $Domain
            proxied = $true
            comment = "WWW subdomain"
        },
        @{
            type = "CNAME"
            name = "admin"
            content = $Domain
            proxied = $true
            comment = "Admin panel"
        },
        @{
            type = "CNAME"
            name = "api"
            content = $BackendUrl -replace '^https?://', ''
            proxied = $true
            comment = "Backend API"
        }
    )
    
    foreach ($record in $records) {
        Write-Info "Creating DNS record: $($record.name)"
        
        $body = $record | ConvertTo-Json
        
        try {
            $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records" `
                -Method Post `
                -Headers $headers `
                -Body $body
            
            if ($response.success) {
                Write-Success "Created: $($record.name)"
            } else {
                Write-Warning "Failed to create $($record.name): $($response.errors)"
            }
            
        } catch {
            if ($_.Exception.Response.StatusCode -eq 409) {
                Write-Info "Record $($record.name) already exists, skipping..."
            } else {
                Write-Warning "Error creating $($record.name): $_"
            }
        }
    }
}

# Configure Cloudflare SSL
function Set-CloudflareSSL {
    param(
        [string]$ApiToken,
        [string]$ZoneId
    )
    
    Write-Info "Configuring Cloudflare SSL..."
    
    $headers = @{
        "Authorization" = "Bearer $ApiToken"
        "Content-Type" = "application/json"
    }
    
    # Set SSL mode to Full (strict)
    $body = @{
        "value" = "full"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/settings/ssl" `
            -Method Patch `
            -Headers $headers `
            -Body $body | Out-Null
        
        Write-Success "SSL mode set to Full (strict)"
    } catch {
        Write-Warning "Failed to set SSL mode: $_"
    }
    
    # Enable Always Use HTTPS
    $body = @{
        "value" = "on"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/settings/always_use_https" `
            -Method Patch `
            -Headers $headers `
            -Body $body | Out-Null
        
        Write-Success "Always Use HTTPS enabled"
    } catch {
        Write-Warning "Failed to enable Always Use HTTPS: $_"
    }
}

# Verify deployment
function Test-Deployment {
    param([string]$Domain)
    
    Write-Info "Verifying deployment..."
    
    $urls = @(
        "https://$Domain",
        "https://www.$Domain",
        "https://admin.$Domain",
        "https://api.$Domain/api/health"
    )
    
    $allPassed = $true
    
    foreach ($url in $urls) {
        Write-Host "Testing $url... " -NoNewline
        
        try {
            $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 10
            
            if ($response.StatusCode -eq 200) {
                Write-Host "✅" -ForegroundColor Green
            } else {
                Write-Host "⚠️ HTTP $($response.StatusCode)" -ForegroundColor Yellow
                $allPassed = $false
            }
            
        } catch {
            Write-Host "❌ Failed" -ForegroundColor Red
            $allPassed = $false
        }
    }
    
    if ($allPassed) {
        Write-Success "All endpoints verified successfully!"
    } else {
        Write-Warning "Some endpoints failed verification"
    }
    
    return $allPassed
}

# Show summary
function Show-Summary {
    param([string]$Domain)
    
    Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                    DEPLOYMENT SUMMARY                        ║
╠══════════════════════════════════════════════════════════════╣
║ Frontend deployed successfully!                              ║
║                                                              ║
║ URLs:                                                        ║
║ • Frontend: https://$Domain
║ • Admin:    https://admin.$Domain
║ • API:      https://api.$Domain
║                                                              ║
║ Next Steps:                                                  ║
║ 1. Visit https://$Domain
║ 2. Test login/registration flows                             ║
║ 3. Check Render dashboard for logs                           ║
║ 4. Monitor Cloudflare Analytics                              ║
║                                                              ║
║ Documentation:                                               ║
║ • RENDER_FRONTEND_DEPLOY.md                                  ║
║ • CLOUDFLARE_SETUP_GUIDE.md                                  ║
║ • CLOUDFLARE_QUICK_START.md                                  ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green
}

# Main execution
function Main {
    Show-Banner
    
    # Check prerequisites
    Test-Prerequisites
    
    switch ($Action) {
        "setup" {
            Build-Frontend
            Write-Success "Setup complete! Ready to deploy."
        }
        
        "deploy" {
            if (-not $RenderApiKey) {
                Write-Error "Render API key required for deployment. Use -RenderApiKey parameter."
                exit 1
            }
            
            # Build first
            Build-Frontend
            
            # Get or create service
            Write-Info "Enter your Render service ID (or leave empty to create new):"
            $serviceId = Read-Host
            
            if ([string]::IsNullOrWhiteSpace($serviceId)) {
                $service = New-RenderService -ApiKey $RenderApiKey
                $serviceId = $service.id
            }
            
            if ($serviceId) {
                $deployId = Start-RenderDeployment -ApiKey $RenderApiKey -ServiceId $serviceId
                
                if ($deployId) {
                    $success = Wait-RenderDeployment -ApiKey $RenderApiKey -ServiceId $serviceId -DeployId $deployId
                    
                    if ($success) {
                        Write-Success "Deployment completed!"
                    }
                }
            }
        }
        
        "verify" {
            Test-Deployment -Domain $Domain
        }
        
        "all" {
            # Interactive mode
            Write-Info "This will deploy your frontend to Render and configure Cloudflare."
            Write-Host ""
            
            # Get Render API key
            if (-not $RenderApiKey) {
                Write-Info "Enter your Render API key:"
                $RenderApiKey = Read-Host -AsSecureString
                $RenderApiKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($RenderApiKey))
            }
            
            # Build
            Build-Frontend
            
            # Deploy to Render
            Write-Info "Enter your Render service ID (or leave empty to create new):"
            $serviceId = Read-Host
            
            if ([string]::IsNullOrWhiteSpace($serviceId)) {
                $service = New-RenderService -ApiKey $RenderApiKey
                $serviceId = $service.id
            }
            
            if ($serviceId) {
                $deployId = Start-RenderDeployment -ApiKey $RenderApiKey -ServiceId $serviceId
                
                if ($deployId) {
                    $success = Wait-RenderDeployment -ApiKey $RenderApiKey -ServiceId $serviceId -DeployId $deployId
                    
                    if (-not $success) {
                        Write-Error "Deployment failed"
                        exit 1
                    }
                }
            }
            
            # Configure Cloudflare (optional)
            Write-Info "Do you want to configure Cloudflare now? (y/n)"
            $configure = Read-Host
            
            if ($configure -eq "y") {
                if (-not $CloudflareApiToken) {
                    Write-Info "Enter your Cloudflare API token:"
                    $CloudflareApiToken = Read-Host -AsSecureString
                    $CloudflareApiToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($CloudflareApiToken))
                }
                
                if (-not $CloudflareZoneId) {
                    Write-Info "Enter your Cloudflare Zone ID:"
                    $CloudflareZoneId = Read-Host
                }
                
                Set-CloudflareDNS -ApiToken $CloudflareApiToken -ZoneId $CloudflareZoneId -Domain $Domain -BackendUrl "https://advancia-backend.onrender.com"
                Set-CloudflareSSL -ApiToken $CloudflareApiToken -ZoneId $CloudflareZoneId
                
                Write-Info "Waiting 30 seconds for DNS propagation..."
                Start-Sleep -Seconds 30
            }
            
            # Verify
            Test-Deployment -Domain $Domain
            
            # Show summary
            Show-Summary -Domain $Domain
        }
    }
}

# Run main
Main
