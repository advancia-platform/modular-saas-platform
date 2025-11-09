#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Advancia Pay Ledger - Automated Frontend Deployment to Render
.DESCRIPTION
    Fully automated deployment script that:
    - Loads credentials from .env
    - Builds Next.js frontend
    - Triggers Render deployment
    - Verifies and fixes Cloudflare DNS
.NOTES
    Usage: pwsh scripts/render-frontend-auto.ps1
    Requires: .env file with RENDER_API_KEY, RENDER_SERVICE_ID, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID
    Prerequisites: Run setup-api-tokens.ps1 first to configure credentials
#>

Write-Host "🤖 Advancia Frontend Auto-Deploy (Render + Cloudflare)" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Gray
$ErrorActionPreference = "Stop"

# === LOAD .ENV ===
$scriptDir = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $scriptDir ".env"

Write-Host "`n📦 Loading environment configuration..." -ForegroundColor Yellow

if (-not (Test-Path $envFile)) {
  Write-Host "❌ .env file not found at: $envFile" -ForegroundColor Red
  Write-Host "📝 Please run setup-api-tokens.ps1 first to configure credentials." -ForegroundColor Yellow
  exit 1
}

# Load .env file
Get-Content $envFile | Where-Object { $_ -match '^[^#].*=' } | ForEach-Object {
  $parts = $_ -split '=', 2
  if ($parts.Count -eq 2) {
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    Set-Item -Path "env:$key" -Value $value
  }
}

Write-Host "✅ Environment variables loaded" -ForegroundColor Green

# === CONFIG VARIABLES ===
$domain = $env:CLOUDFLARE_DOMAIN ?? "advanciapayledger.com"
$frontendPath = Join-Path $scriptDir "frontend"
$renderServiceId = $env:RENDER_SERVICE_ID
$renderApiKey = $env:RENDER_API_KEY
$cloudflareZoneId = $env:CLOUDFLARE_ZONE_ID
$cloudflareApiToken = $env:CLOUDFLARE_API_TOKEN

Write-Host "`n📋 Configuration:" -ForegroundColor Cyan
Write-Host "  Domain: $domain" -ForegroundColor Gray
Write-Host "  Render Service: $($renderServiceId ?? '[not set]')" -ForegroundColor Gray
Write-Host "  Cloudflare Zone: $($cloudflareZoneId ?? '[not set]')" -ForegroundColor Gray

# Validate credentials
$missingCreds = @()
if (-not $renderApiKey) { $missingCreds += "RENDER_API_KEY" }
if (-not $renderServiceId) { $missingCreds += "RENDER_SERVICE_ID" }
if (-not $cloudflareApiToken) { $missingCreds += "CLOUDFLARE_API_TOKEN" }
if (-not $cloudflareZoneId) { $missingCreds += "CLOUDFLARE_ZONE_ID" }

if ($missingCreds.Count -gt 0) {
  Write-Host "`n❌ Missing required credentials:" -ForegroundColor Red
  $missingCreds | ForEach-Object { Write-Host "  • $_" -ForegroundColor Yellow }
  Write-Host "`n📝 Run setup-api-tokens.ps1 to configure these." -ForegroundColor Yellow
  exit 1
}

Write-Host "✅ All credentials present" -ForegroundColor Green

# === VERIFY FRONTEND DIRECTORY ===
if (-not (Test-Path $frontendPath)) {
  Write-Host "`n❌ Frontend directory not found at: $frontendPath" -ForegroundColor Red
  exit 1
}

Set-Location $frontendPath
Write-Host "`n📁 Working directory: $frontendPath" -ForegroundColor Yellow

# === DETECT BUILD MODE ===
$nextConfigPath = Join-Path $frontendPath "next.config.js"
if (-not (Test-Path $nextConfigPath)) {
  Write-Host "❌ next.config.js not found!" -ForegroundColor Red
  exit 1
}

$nextConfig = Get-Content $nextConfigPath -Raw

if ($nextConfig -match "output:\s*[`"']export[`"']") {
  $buildMode = "static"
  $buildCmd = "npm run build"
  $publishDir = "out"
  $startCmd = ""
  Write-Host "🧱 Build mode: Static Export (SSG)" -ForegroundColor Yellow
} elseif ($nextConfig -match "output:\s*[`"']standalone[`"']" -or $nextConfig -match 'process\.env\.CF_PAGES.*"export".*"standalone"') {
  $buildMode = "standalone"
  $buildCmd = "npm run build"
  $publishDir = ""
  $startCmd = "npm run start"
  Write-Host "🌐 Build mode: Standalone SSR" -ForegroundColor Yellow
} else {
  $buildMode = "ssr"
  $buildCmd = "npm run build"
  $publishDir = ""
  $startCmd = "npm run start"
  Write-Host "⚙ Build mode: Standard SSR" -ForegroundColor Yellow
}

# === UPDATE render.yaml ===
$renderYaml = Join-Path $scriptDir "render.yaml"
if (Test-Path $renderYaml) {
  Write-Host "`n🛠 Updating render.yaml..." -ForegroundColor Yellow
  
  $yamlContent = Get-Content $renderYaml -Raw
  $yamlContent = $yamlContent -replace "(?m)buildCommand:\s*[`"`'].*[`"`']", "buildCommand: `"$buildCmd`""
  $yamlContent = $yamlContent -replace "(?m)startCommand:\s*[`"`'].*[`"`']", "startCommand: `"$startCmd`""
  
  Set-Content $renderYaml $yamlContent
  Write-Host "✅ render.yaml synced with build mode" -ForegroundColor Green
} else {
  Write-Host "⚠ render.yaml not found, skipping update" -ForegroundColor Yellow
}

# === LOCAL BUILD ===
Write-Host "`n🧱 Building frontend locally..." -ForegroundColor Yellow

Write-Host "  📦 Installing dependencies..." -ForegroundColor Gray
npm install --quiet
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ npm install failed!" -ForegroundColor Red
  exit 1
}

Write-Host "  🔨 Running build..." -ForegroundColor Gray
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Build failed! Check logs above." -ForegroundColor Red
  exit 1
}

Write-Host "✅ Local build completed successfully!" -ForegroundColor Green

# Verify build output
if ($buildMode -eq "static" -and (Test-Path (Join-Path $frontendPath "out"))) {
  $outFiles = Get-ChildItem (Join-Path $frontendPath "out") -Recurse | Measure-Object
  Write-Host "  📊 Static files: $($outFiles.Count) files" -ForegroundColor Gray
} elseif (Test-Path (Join-Path $frontendPath ".next")) {
  Write-Host "  📊 Build output: .next directory" -ForegroundColor Gray
}

# === DEPLOY TO RENDER ===
Write-Host "`n🚀 Triggering Render deployment..." -ForegroundColor Yellow

try {
  $deployUrl = "https://api.render.com/v1/services/$renderServiceId/deploys"
  $headers = @{
    "Authorization" = "Bearer $renderApiKey"
    "Content-Type" = "application/json"
  }
  
  $response = Invoke-RestMethod -Uri $deployUrl -Method Post -Headers $headers -Body "{}"
  
  Write-Host "✅ Render deployment triggered!" -ForegroundColor Green
  Write-Host "  🔗 Deploy ID: $($response.id ?? 'pending')" -ForegroundColor Gray
  Write-Host "  📍 Status: $($response.status ?? 'queued')" -ForegroundColor Gray
  
  if ($response.service) {
    Write-Host "  🌐 Service: $($response.service.name)" -ForegroundColor Gray
  }
  
} catch {
  Write-Host "❌ Render deployment failed!" -ForegroundColor Red
  Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
  Write-Host "  Please check:" -ForegroundColor Yellow
  Write-Host "    • API key is valid" -ForegroundColor Gray
  Write-Host "    • Service ID is correct" -ForegroundColor Gray
  Write-Host "    • Service exists in your Render account" -ForegroundColor Gray
  exit 1
}

# === DNS VERIFICATION & FIX ===
Write-Host "`n🌐 Verifying Cloudflare DNS for $domain..." -ForegroundColor Yellow

try {
  $dnsRecords = Resolve-DnsName -Name $domain -ErrorAction Stop
  
  # Check for Render IPs (typically 216.24.x.x range)
  $renderRecord = $dnsRecords | Where-Object { 
    $_.Type -eq "CNAME" -or 
    ($_.Type -eq "A" -and $_.IPAddress -match "^216\.24\.") 
  }
  
  if ($renderRecord) {
    Write-Host "✅ DNS correctly points to Render!" -ForegroundColor Green
    $dnsRecords | Select-Object -First 3 | ForEach-Object {
      Write-Host "  📍 $($_.Type): $($_.Name) → $($_.IPAddress ?? $_.NameHost)" -ForegroundColor Gray
    }
  } else {
    Write-Host "⚠ DNS may need updating..." -ForegroundColor Yellow
    
    # Get Render service details to find the correct URL
    try {
      $serviceUrl = "https://api.render.com/v1/services/$renderServiceId"
      $serviceInfo = Invoke-RestMethod -Uri $serviceUrl -Headers @{
        "Authorization" = "Bearer $renderApiKey"
      }
      
      $renderHostname = $serviceInfo.service.serviceDetails.url -replace 'https?://', ''
      Write-Host "  🎯 Target: $renderHostname" -ForegroundColor Gray
      
      # Cloudflare DNS update (optional automatic fix)
      $updateDns = Read-Host "`nAttempt to update Cloudflare DNS automatically? (y/n)"
      
      if ($updateDns -eq 'y') {
        Write-Host "`n🔧 Updating Cloudflare DNS records..." -ForegroundColor Yellow
        
        $cfHeaders = @{
          "Authorization" = "Bearer $cloudflareApiToken"
          "Content-Type" = "application/json"
        }
        $cfBase = "https://api.cloudflare.com/client/v4/zones/$cloudflareZoneId/dns_records"
        
        # Get existing records
        $existing = Invoke-RestMethod -Uri $cfBase -Headers $cfHeaders
        
        # Check for www CNAME
        $wwwRecord = $existing.result | Where-Object { $_.name -eq "www.$domain" -and $_.type -eq "CNAME" }
        
        if ($wwwRecord) {
          Write-Host "  ✓ Found existing www CNAME record" -ForegroundColor Gray
          
          # Update if needed
          if ($wwwRecord.content -ne $renderHostname) {
            $updateBody = @{
              type = "CNAME"
              name = "www"
              content = $renderHostname
              ttl = 3600
              proxied = $true
            } | ConvertTo-Json
            
            Invoke-RestMethod -Uri "$cfBase/$($wwwRecord.id)" -Method Put -Headers $cfHeaders -Body $updateBody
            Write-Host "  ✅ Updated www CNAME → $renderHostname" -ForegroundColor Green
          }
        } else {
          # Create new www CNAME
          $createBody = @{
            type = "CNAME"
            name = "www"
            content = $renderHostname
            ttl = 3600
            proxied = $true
          } | ConvertTo-Json
          
          Invoke-RestMethod -Uri $cfBase -Method Post -Headers $cfHeaders -Body $createBody
          Write-Host "  ✅ Created www CNAME → $renderHostname" -ForegroundColor Green
        }
        
        Write-Host "`n✅ DNS update complete! Changes may take a few minutes to propagate." -ForegroundColor Green
      } else {
        Write-Host "`n📝 Manual DNS setup:" -ForegroundColor Cyan
        Write-Host "  Add to Cloudflare:" -ForegroundColor White
        Write-Host "    CNAME  www  → $renderHostname" -ForegroundColor Gray
        Write-Host "    Enable proxy (orange cloud) for DDoS protection" -ForegroundColor Gray
      }
      
    } catch {
      Write-Host "⚠ Could not fetch Render service details" -ForegroundColor Yellow
    }
  }
  
} catch {
  Write-Host "⚠ DNS resolution failed (may be propagating)" -ForegroundColor Yellow
  Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# === SUMMARY ===
Write-Host "`n" -NoNewline
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "🎯 AUTO-DEPLOY COMPLETE!" -ForegroundColor Green
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Gray

Write-Host "`n✅ Completed Tasks:" -ForegroundColor Cyan
Write-Host "  ✓ Built Next.js frontend ($buildMode mode)" -ForegroundColor Green
Write-Host "  ✓ Triggered Render deployment" -ForegroundColor Green
Write-Host "  ✓ Verified DNS configuration" -ForegroundColor Green

Write-Host "`n🔗 Deployment Status:" -ForegroundColor Cyan
Write-Host "  • Render Dashboard: https://dashboard.render.com/web/$renderServiceId" -ForegroundColor White
Write-Host "  • Your Site: https://$domain" -ForegroundColor White
Write-Host "  • Cloudflare: https://dash.cloudflare.com/$cloudflareZoneId" -ForegroundColor White

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Monitor deployment in Render dashboard (typically 3-5 minutes)" -ForegroundColor White
Write-Host "  2. Test site once deployment completes: https://$domain" -ForegroundColor White
Write-Host "  3. Check Render logs if any issues occur" -ForegroundColor White

Write-Host "`n💡 Tip: Schedule automatic deployments with GitHub Actions!" -ForegroundColor Gray
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Gray

Set-Location $scriptDir
