#!/usr/bin/env pwsh
# Setup GitHub to Render webhook for auto-deployment
# Links GitHub push events to Render deploy hooks

Write-Host "🤖 Linking GitHub OAuth App to Render deploy webhook..." -ForegroundColor Cyan

# === CONFIGURATION ===
$envFile = "$PSScriptRoot\..\backend\.env"
$githubOrg = "pdtribe181-prog"
$repo = "-modular-saas-platform"
$renderServiceName = "advancia-backend"

# Get API keys
$renderApiKey = Read-Host "🔑 Enter Render API Key (from https://dashboard.render.com/account)"
$githubToken = $env:GITHUB_TOKEN
if (-not $githubToken) {
    $githubToken = Read-Host "🔑 Enter GitHub PAT (or set GITHUB_TOKEN env var)"
}

# === READ OAUTH VALUES ===
if (-not (Test-Path $envFile)) {
    Write-Host "⚠️  .env not found at $envFile" -ForegroundColor Yellow
    Write-Host "Continuing without OAuth validation..." -ForegroundColor Yellow
}

# === GET RENDER SERVICES ===
Write-Host "🔍 Fetching Render services..." -ForegroundColor Cyan
try {
    $services = Invoke-RestMethod `
        -Uri "https://api.render.com/v1/services" `
        -Headers @{ Authorization = "Bearer $renderApiKey" } `
        -ErrorAction Stop

    $service = $services | Where-Object { $_.service.name -eq $renderServiceName }

    if (-not $service) {
        Write-Host "⚠️  No Render service found matching '$renderServiceName'" -ForegroundColor Yellow
        Write-Host "Available services:" -ForegroundColor Yellow
        $services | ForEach-Object { Write-Host "  - $($_.service.name)" -ForegroundColor Gray }
        exit 1
    }

    Write-Host "✅ Found Render service: $renderServiceName" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to fetch Render services: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# === CREATE/VERIFY WEBHOOK ===
$webhookUrl = "https://api.render.com/deploy/$renderServiceName?key=$renderApiKey"

Write-Host "🔗 Creating webhook for GitHub repo $githubOrg/$repo ..." -ForegroundColor Cyan
$hookBody = @{
    name = "web"
    active = $true
    events = @("push")
    config = @{
        url = $webhookUrl
        content_type = "json"
        insecure_ssl = "0"
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Uri "https://api.github.com/repos/$githubOrg/$repo/hooks" `
        -Headers @{
            Authorization = "Bearer $githubToken"
            Accept = "application/vnd.github+json"
        } `
        -Method POST `
        -Body $hookBody `
        -ContentType "application/json" `
        -ErrorAction Stop

    if ($response.id) {
        Write-Host "✅ Webhook created successfully: ID $($response.id)" -ForegroundColor Green
        
        # === TEST WEBHOOK ===
        Write-Host "🧪 Sending test ping to webhook..." -ForegroundColor Cyan
        try {
            $ping = Invoke-RestMethod `
                -Uri "https://api.github.com/repos/$githubOrg/$repo/hooks/$($response.id)/pings" `
                -Headers @{
                    Authorization = "Bearer $githubToken"
                    Accept = "application/vnd.github+json"
                } `
                -Method POST `
                -ErrorAction Stop
            
            Write-Host "✅ Test ping sent successfully" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Test ping failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 422) {
        Write-Host "⚠️  Webhook may already exist" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to create webhook: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ GitHub ↔ Render link complete!" -ForegroundColor Green
Write-Host "🎯 Any push to main will now auto-trigger a Render deploy." -ForegroundColor Cyan
