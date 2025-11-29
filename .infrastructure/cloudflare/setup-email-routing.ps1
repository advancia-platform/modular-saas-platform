#!/usr/bin/env pwsh
# Cloudflare Email Routing Setup Script
# Sets up DNS records and email routing for advanciapayledger.com

$ErrorActionPreference = "Stop"

# Configuration
$ZONE_ID = "0bff66558872c58ed5b8b7942acc34d9"
$API_TOKEN = "_c0eQLPqAqS5J2RnlX-N2nTtomDGkKpnvYH2oHeu"
$DOMAIN = "advanciapayledger.com"

$headers = @{
    "Authorization" = "Bearer $API_TOKEN"
    "Content-Type" = "application/json"
}

$baseUrl = "https://api.cloudflare.com/client/v4/zones/$ZONE_ID"

Write-Host "🚀 Cloudflare Email Routing Setup for $DOMAIN" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Function to add DNS record
function Add-DNSRecord {
    param(
        [string]$Type,
        [string]$Name,
        [string]$Content,
        [int]$Priority = 0,
        [string]$Comment = ""
    )

    $body = @{
        type = $Type
        name = $Name
        content = $Content
        ttl = 1
        proxied = $false
        comment = $Comment
    }

    if ($Type -eq "MX") {
        $body.priority = $Priority
    }

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/dns_records" -Method Post -Headers $headers -Body ($body | ConvertTo-Json)
        Write-Host "✅ Added $Type record: $Name -> $Content" -ForegroundColor Green
        return $response.result.id
    }
    catch {
        $error = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($error.errors[0].code -eq 81057) {
            Write-Host "⏭️ $Type record already exists: $Name" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Failed to add $Type record: $($error.errors[0].message)" -ForegroundColor Red
        }
    }
}

# Step 1: Add MX Records for Cloudflare Email Routing
Write-Host "`n📧 Step 1: Adding MX Records..." -ForegroundColor Cyan

Add-DNSRecord -Type "MX" -Name "@" -Content "route1.mx.cloudflare.net" -Priority 69 -Comment "Cloudflare Email Routing"
Add-DNSRecord -Type "MX" -Name "@" -Content "route2.mx.cloudflare.net" -Priority 12 -Comment "Cloudflare Email Routing"
Add-DNSRecord -Type "MX" -Name "@" -Content "route3.mx.cloudflare.net" -Priority 84 -Comment "Cloudflare Email Routing"

# Step 2: Add SPF Record
Write-Host "`n🔐 Step 2: Adding SPF Record..." -ForegroundColor Cyan

Add-DNSRecord -Type "TXT" -Name "@" -Content "v=spf1 include:_spf.mx.cloudflare.net include:amazonses.com include:_spf.resend.com ~all" -Comment "SPF - Email authorization"

# Step 3: Add DMARC Record
Write-Host "`n🛡️ Step 3: Adding DMARC Record..." -ForegroundColor Cyan

Add-DNSRecord -Type "TXT" -Name "_dmarc" -Content "v=DMARC1; p=quarantine; rua=mailto:admin@advanciapayledger.com; pct=100" -Comment "DMARC policy"

# Step 4: Enable Email Routing
Write-Host "`n📬 Step 4: Enabling Email Routing..." -ForegroundColor Cyan

try {
    $emailRoutingStatus = Invoke-RestMethod -Uri "$baseUrl/email/routing" -Method Get -Headers $headers
    if ($emailRoutingStatus.result.enabled) {
        Write-Host "✅ Email Routing is already enabled" -ForegroundColor Green
    } else {
        $enableBody = @{ enabled = $true } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/email/routing/enable" -Method Post -Headers $headers -Body $enableBody
        Write-Host "✅ Email Routing enabled" -ForegroundColor Green
    }
}
catch {
    Write-Host "⚠️ Could not check/enable Email Routing. Please enable manually in dashboard." -ForegroundColor Yellow
}

# Step 5: Instructions for manual steps
Write-Host "`n📋 Manual Steps Required:" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host @"

1. Go to Cloudflare Dashboard -> Email -> Email Routing

2. Add destination addresses:
   - Verify: admin@advanciapayledger.com (check inbox for verification email)

3. Add email addresses with Worker routing:
   - privacy@advanciapayledger.com -> Send to Worker -> advancia-email-worker
   - legal@advanciapayledger.com -> Send to Worker -> advancia-email-worker
   - support@advanciapayledger.com -> Send to Worker -> advancia-email-worker

4. Set catch-all rule:
   - All other addresses -> Forward to admin@advanciapayledger.com

5. Deploy the Email Worker:
   cd .infrastructure/cloudflare/email-worker
   npm install
   wrangler login
   wrangler secret put RESEND_API_KEY  # Enter: re_RYUDTKZ4_CQupy9JujxfQ3AupakQwtyqh
   npm run deploy

6. Verify Resend domain:
   - Go to https://resend.com/domains
   - Add advanciapayledger.com
   - Copy DKIM record and add to Cloudflare DNS

"@ -ForegroundColor White

Write-Host "✅ DNS setup complete!" -ForegroundColor Green
Write-Host "`nTest your setup:" -ForegroundColor Cyan
Write-Host "  dig MX advanciapayledger.com" -ForegroundColor White
Write-Host "  dig TXT advanciapayledger.com" -ForegroundColor White
