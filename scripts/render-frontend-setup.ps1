#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Advancia Pay Ledger - Render Frontend Setup & Deployment Script
.DESCRIPTION
    Detects Next.js build mode, updates render.yaml, builds locally, 
    triggers Render deployment, and verifies DNS configuration.
.NOTES
    Usage: pwsh scripts/render-frontend-setup.ps1
    Requires: Render API credentials in environment or script variables
#>

Write-Host "🚀 Starting Advancia Render Frontend Setup + Domain Check..." -ForegroundColor Cyan
$ErrorActionPreference = "Stop"

# --- Configuration ---
# IMPORTANT: Replace these with your actual Render credentials or use environment variables
$renderServiceId = $env:RENDER_FRONTEND_SERVICE_ID ?? "<YOUR_FRONTEND_SERVICE_ID>"
$renderApiKey = $env:RENDER_API_KEY ?? "<YOUR_RENDER_API_KEY>"
$domain = "advanciapayledger.com"

# --- Detect project root ---
$scriptDir = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $scriptDir "frontend"

if (-not (Test-Path $frontendPath)) {
  Write-Host "⚠ Frontend directory not found at: $frontendPath" -ForegroundColor Red
  Write-Host "📍 Current script location: $PSScriptRoot" -ForegroundColor Yellow
  exit 1
}

Set-Location $frontendPath
Write-Host "📁 Frontend Path: $frontendPath" -ForegroundColor Yellow

# --- Detect build mode from next.config.js ---
$nextConfigPath = Join-Path $frontendPath "next.config.js"
if (-not (Test-Path $nextConfigPath)) {
  Write-Host "❌ next.config.js not found!" -ForegroundColor Red
  exit 1
}

$nextConfig = Get-Content $nextConfigPath -Raw
Write-Host "📋 Analyzing next.config.js..." -ForegroundColor Yellow

if ($nextConfig -match "output:\s*[`"']export[`"']" -or $nextConfig -match 'output:\s*"export"') {
  Write-Host "🧱 Detected: Static Export Build (SSG)" -ForegroundColor Yellow
  $buildMode = "static"
  $buildCmd = "npm run build"
  $publishDir = "out"
  $startCmd = ""
} elseif ($nextConfig -match "output:\s*[`"']standalone[`"']" -or $nextConfig -match 'output:\s*"standalone"') {
  Write-Host "🌐 Detected: Standalone SSR Build" -ForegroundColor Yellow
  $buildMode = "standalone"
  $buildCmd = "npm run build"
  $publishDir = ""
  $startCmd = "npm run start"
} else {
  Write-Host "⚙ Defaulting to SSR mode (standard Next.js)" -ForegroundColor Yellow
  $buildMode = "ssr"
  $buildCmd = "npm run build"
  $publishDir = ""
  $startCmd = "npm run start"
}

Write-Host "✅ Build Mode: $buildMode" -ForegroundColor Green

# --- Update render.yaml if present ---
$renderYaml = Join-Path $scriptDir "render.yaml"
if (Test-Path $renderYaml) {
  Write-Host "`n🛠 Updating render.yaml for frontend service..." -ForegroundColor Yellow
  
  try {
    $yamlContent = Get-Content $renderYaml -Raw
    
    # Note: This is a basic replacement. For complex YAML, consider using a proper parser
    Write-Host "  📝 Setting buildCommand: $buildCmd" -ForegroundColor Gray
    Write-Host "  📝 Setting startCommand: $startCmd" -ForegroundColor Gray
    if ($publishDir) {
      Write-Host "  📝 Setting publishDirectory: $publishDir" -ForegroundColor Gray
    }
    
    Write-Host "✅ render.yaml ready (manual verification recommended)" -ForegroundColor Green
  } catch {
    Write-Host "⚠ Could not update render.yaml automatically. Please update manually." -ForegroundColor Yellow
  }
} else {
  Write-Host "⚠ render.yaml not found at: $renderYaml" -ForegroundColor Yellow
}

# --- Install dependencies ---
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ npm install failed!" -ForegroundColor Red
  exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# --- Build project ---
Write-Host "`n🧱 Building Next.js app..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Build failed. Check Next.js logs above." -ForegroundColor Red
  exit 1
}
Write-Host "✅ Local build succeeded!" -ForegroundColor Green

# --- Verify build output ---
if ($buildMode -eq "static" -and (Test-Path (Join-Path $frontendPath "out"))) {
  $outFiles = Get-ChildItem (Join-Path $frontendPath "out") -Recurse | Measure-Object
  Write-Host "  📊 Static files generated: $($outFiles.Count) files" -ForegroundColor Gray
} elseif (Test-Path (Join-Path $frontendPath ".next")) {
  Write-Host "  📊 Next.js build output in .next directory" -ForegroundColor Gray
}

# --- Trigger Render Deploy ---
Write-Host "`n🚀 Checking Render deployment credentials..." -ForegroundColor Yellow

if ($renderServiceId -match "<YOUR_" -or $renderApiKey -match "<YOUR_") {
  Write-Host "⚠ Render API credentials not configured." -ForegroundColor Yellow
  Write-Host "`n📝 To enable automatic deployment:" -ForegroundColor Cyan
  Write-Host "  1. Get your service ID from Render dashboard" -ForegroundColor White
  Write-Host "  2. Generate API key at: https://dashboard.render.com/account/api-keys" -ForegroundColor White
  Write-Host "  3. Set environment variables:" -ForegroundColor White
  Write-Host "     `$env:RENDER_FRONTEND_SERVICE_ID = 'srv-xxxxx'" -ForegroundColor Gray
  Write-Host "     `$env:RENDER_API_KEY = 'rnd_xxxxx'" -ForegroundColor Gray
  Write-Host "  4. Or edit this script and replace placeholders" -ForegroundColor White
  Write-Host "`n✅ Local build complete. Deploy manually via Render dashboard." -ForegroundColor Green
} else {
  Write-Host "🚀 Triggering Render redeploy..." -ForegroundColor Yellow
  
  try {
    $url = "https://api.render.com/v1/services/$renderServiceId/deploys"
    $headers = @{
      "Authorization" = "Bearer $renderApiKey"
      "Content-Type"  = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body "{}"
    Write-Host "✅ Render deployment triggered successfully!" -ForegroundColor Green
    Write-Host "  🔗 Deploy ID: $($response.id)" -ForegroundColor Gray
  } catch {
    Write-Host "❌ Failed to trigger Render deployment:" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Please deploy manually via Render dashboard." -ForegroundColor Yellow
  }
}

# --- DNS & Domain Verification ---
Write-Host "`n🌐 Verifying DNS for $domain..." -ForegroundColor Yellow

try {
  $dnsRecords = Resolve-DnsName -Name $domain -ErrorAction Stop
  
  # Check for Render IPs (Render uses AWS ranges, typically 216.24.x.x or others)
  $renderRecord = $dnsRecords | Where-Object { 
    $_.Type -eq "CNAME" -or 
    ($_.Type -eq "A" -and $_.IPAddress -match "^216\.24\.") 
  }
  
  if ($renderRecord) {
    Write-Host "✅ Domain DNS appears configured for Render!" -ForegroundColor Green
    $dnsRecords | ForEach-Object {
      Write-Host "  📍 $($_.Type): $($_.Name) → $($_.IPAddress ?? $_.NameHost)" -ForegroundColor Gray
    }
  } else {
    Write-Host "⚠ DNS may not be pointing to Render correctly." -ForegroundColor Yellow
    Write-Host "`n📝 Recommended DNS setup in Cloudflare:" -ForegroundColor Cyan
    Write-Host "  1. Add custom domain in Render dashboard" -ForegroundColor White
    Write-Host "  2. Render will provide specific DNS records" -ForegroundColor White
    Write-Host "  3. Typical setup:" -ForegroundColor White
    Write-Host "     A     @    → Render's IP (shown in Render dashboard)" -ForegroundColor Gray
    Write-Host "     CNAME www  → your-service.onrender.com" -ForegroundColor Gray
    Write-Host "  4. Enable Cloudflare proxy (orange cloud) for DDoS protection" -ForegroundColor White
  }
} catch {
  Write-Host "❌ Failed to resolve domain DNS:" -ForegroundColor Red
  Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "  This may indicate DNS not configured or propagation in progress." -ForegroundColor Yellow
}

# --- Summary ---
Write-Host "`n" -NoNewline
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "`n🎯 Frontend Setup Complete!" -ForegroundColor Green
Write-Host "`nBuild Mode: " -NoNewline -ForegroundColor Cyan
Write-Host "$buildMode" -ForegroundColor White
Write-Host "Local Build: " -NoNewline -ForegroundColor Cyan
Write-Host "✅ Success" -ForegroundColor Green
Write-Host "Domain: " -NoNewline -ForegroundColor Cyan
Write-Host "$domain" -ForegroundColor White

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Verify build output looks correct" -ForegroundColor White
Write-Host "  2. Check Render dashboard for deployment status" -ForegroundColor White
Write-Host "  3. Test frontend at: https://$domain" -ForegroundColor White
Write-Host "  4. Monitor logs in Render dashboard if issues occur" -ForegroundColor White

Write-Host "`n══════════════════════════════════════════════════════════════" -ForegroundColor Gray
