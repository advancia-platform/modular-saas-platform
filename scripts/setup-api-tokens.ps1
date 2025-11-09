#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Advancia Pay Ledger - API Token Setup for Render & Cloudflare
.DESCRIPTION
    Interactive script to configure Render and Cloudflare API credentials.
    Stores tokens securely in .env file at project root.
.NOTES
    Usage: pwsh scripts/setup-api-tokens.ps1
    Requires: Render account, Cloudflare account with zone access
#>

Write-Host "🔐 Advancia API Token Setup (Render & Cloudflare)" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Gray
$ErrorActionPreference = "Stop"

# --- Detect project root ---
$scriptDir = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $scriptDir ".env"

Write-Host "`n📁 Project root: $scriptDir" -ForegroundColor Yellow
Write-Host "📝 Environment file: $envFile" -ForegroundColor Yellow

# --- Backup existing .env ---
if (Test-Path $envFile) {
  $backupFile = "$envFile.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
  Copy-Item $envFile $backupFile
  Write-Host "💾 Backed up existing .env to: $backupFile" -ForegroundColor Gray
}

# --- Initialize .env if needed ---
if (-not (Test-Path $envFile)) {
  New-Item -Path $envFile -ItemType File -Force | Out-Null
  Write-Host "✅ Created new .env file" -ForegroundColor Green
}

# === RENDER CONFIGURATION ===
Write-Host "`n" -NoNewline
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "🟣 RENDER API CONFIGURATION" -ForegroundColor Magenta
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Gray

Write-Host "`n📖 To get your Render API credentials:" -ForegroundColor Cyan
Write-Host "  1. Login to: https://dashboard.render.com" -ForegroundColor White
Write-Host "  2. Go to: Account Settings → API Keys" -ForegroundColor White
Write-Host "  3. Click 'Create API Key'" -ForegroundColor White
Write-Host "  4. Copy the generated key (starts with 'rnd_')" -ForegroundColor White
Write-Host "  5. Find your service ID in the service URL (starts with 'srv-')" -ForegroundColor White

$setupRender = Read-Host "`nDo you want to configure Render now? (y/n)"

if ($setupRender -eq 'y') {
  $renderApiKey = Read-Host "Enter your Render API Key (rnd_xxxxx)"
  $renderServiceId = Read-Host "Enter your Render Frontend Service ID (srv-xxxxx)"
  
  if ($renderApiKey -and $renderServiceId) {
    # Remove existing Render entries
    $envContent = Get-Content $envFile -ErrorAction SilentlyContinue | Where-Object { 
      $_ -notmatch "^RENDER_API_KEY=" -and $_ -notmatch "^RENDER_SERVICE_ID=" 
    }
    Set-Content $envFile $envContent
    
    # Add new Render entries
    Add-Content $envFile "`n# Render API Configuration ($(Get-Date -Format 'yyyy-MM-dd'))"
    Add-Content $envFile "RENDER_API_KEY=$renderApiKey"
    Add-Content $envFile "RENDER_SERVICE_ID=$renderServiceId"
    
    Write-Host "✅ Render API credentials saved!" -ForegroundColor Green
    
    # Verify Render API
    Write-Host "`n🔍 Verifying Render API key..." -ForegroundColor Yellow
    try {
      $headers = @{
        "Authorization" = "Bearer $renderApiKey"
        "Accept" = "application/json"
      }
      $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$renderServiceId" -Headers $headers
      Write-Host "✅ Render API verified! Service: $($response.service.name)" -ForegroundColor Green
    } catch {
      Write-Host "⚠ Could not verify Render API (key may still be valid)" -ForegroundColor Yellow
      Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
  } else {
    Write-Host "⚠ Skipped Render configuration (missing values)" -ForegroundColor Yellow
  }
} else {
  Write-Host "⏭ Skipped Render configuration" -ForegroundColor Gray
}

# === CLOUDFLARE CONFIGURATION ===
Write-Host "`n" -NoNewline
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "☁️  CLOUDFLARE API CONFIGURATION" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Gray

Write-Host "`n📖 To get your Cloudflare API credentials:" -ForegroundColor Cyan
Write-Host "  1. Login to: https://dash.cloudflare.com" -ForegroundColor White
Write-Host "  2. Go to: My Profile → API Tokens" -ForegroundColor White
Write-Host "  3. Click 'Create Token' → Use 'Edit zone DNS' template" -ForegroundColor White
Write-Host "  4. Select your zone (advanciapayledger.com)" -ForegroundColor White
Write-Host "  5. Copy the generated token" -ForegroundColor White
Write-Host "  6. Find Zone ID in domain dashboard (Overview → API section)" -ForegroundColor White

$setupCloudflare = Read-Host "`nDo you want to configure Cloudflare now? (y/n)"

if ($setupCloudflare -eq 'y') {
  $cfApiToken = Read-Host "Enter your Cloudflare API Token"
  $cfZoneId = Read-Host "Enter your Cloudflare Zone ID (32-char hex)"
  $cfDomain = Read-Host "Enter your domain (e.g., advanciapayledger.com)" -Default "advanciapayledger.com"
  
  if ($cfApiToken -and $cfZoneId) {
    # Remove existing Cloudflare entries
    $envContent = Get-Content $envFile -ErrorAction SilentlyContinue | Where-Object { 
      $_ -notmatch "^CLOUDFLARE_API_TOKEN=" -and 
      $_ -notmatch "^CLOUDFLARE_ZONE_ID=" -and 
      $_ -notmatch "^CLOUDFLARE_DOMAIN=" 
    }
    Set-Content $envFile $envContent
    
    # Add new Cloudflare entries
    Add-Content $envFile "`n# Cloudflare API Configuration ($(Get-Date -Format 'yyyy-MM-dd'))"
    Add-Content $envFile "CLOUDFLARE_API_TOKEN=$cfApiToken"
    Add-Content $envFile "CLOUDFLARE_ZONE_ID=$cfZoneId"
    Add-Content $envFile "CLOUDFLARE_DOMAIN=$cfDomain"
    
    Write-Host "✅ Cloudflare API credentials saved!" -ForegroundColor Green
    
    # Verify Cloudflare API
    Write-Host "`n🔍 Verifying Cloudflare API token..." -ForegroundColor Yellow
    try {
      $headers = @{
        "Authorization" = "Bearer $cfApiToken"
        "Content-Type" = "application/json"
      }
      $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$cfZoneId" -Headers $headers
      Write-Host "✅ Cloudflare API verified! Zone: $($response.result.name)" -ForegroundColor Green
    } catch {
      Write-Host "⚠ Could not verify Cloudflare API (token may still be valid)" -ForegroundColor Yellow
      Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
  } else {
    Write-Host "⚠ Skipped Cloudflare configuration (missing values)" -ForegroundColor Yellow
  }
} else {
  Write-Host "⏭ Skipped Cloudflare configuration" -ForegroundColor Gray
}

# === SUMMARY ===
Write-Host "`n" -NoNewline
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "✅ API TOKEN SETUP COMPLETE!" -ForegroundColor Green
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Gray

Write-Host "`n📋 Configuration Summary:" -ForegroundColor Cyan
$envContent = Get-Content $envFile | Where-Object { $_ -match "^(RENDER|CLOUDFLARE)" }
if ($envContent) {
  $envContent | ForEach-Object {
    $key = ($_ -split '=')[0]
    if ($key) {
      $valuePreview = if ($_ -match '=(.{8})') { "$($matches[1])..." } else { "[set]" }
      Write-Host "  ✓ $key = $valuePreview" -ForegroundColor Gray
    }
  }
} else {
  Write-Host "  ⚠ No credentials configured" -ForegroundColor Yellow
}

Write-Host "`n📝 Environment file location:" -ForegroundColor Cyan
Write-Host "  $envFile" -ForegroundColor White

Write-Host "`n🔒 Security Notes:" -ForegroundColor Yellow
Write-Host "  • .env file should already be in .gitignore" -ForegroundColor White
Write-Host "  • Never commit API keys to version control" -ForegroundColor White
Write-Host "  • Use GitHub Secrets for CI/CD workflows" -ForegroundColor White

Write-Host "`n🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Run automated deployment: pwsh scripts/render-frontend-auto.ps1" -ForegroundColor White
Write-Host "  2. Or deploy manually via Render dashboard" -ForegroundColor White
Write-Host "  3. Configure GitHub Actions secrets for CI/CD" -ForegroundColor White

Write-Host "`n══════════════════════════════════════════════════════════════" -ForegroundColor Gray
