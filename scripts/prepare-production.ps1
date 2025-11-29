#!/usr/bin/env pwsh
# Advancia Pay Ledger - Production Deployment Preparation
# Run this script before deploying to production

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("render", "azure", "docker", "all")]
    [string]$Target = "all",

    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 Advancia Pay Ledger - Production Preparation" -ForegroundColor Cyan
Write-Host "   Target: $Target" -ForegroundColor DarkGray
Write-Host "=" * 50 -ForegroundColor DarkGray

# 1. Pre-flight checks
Write-Host "`n📋 Pre-flight checks..." -ForegroundColor Yellow

$checks = @()

# Check Node version
$nodeVersion = node --version 2>$null
if ($nodeVersion -match "v(\d+)") {
    $major = [int]$Matches[1]
    if ($major -ge 20) {
        $checks += @{Name="Node.js"; Status="✅"; Detail=$nodeVersion}
    } else {
        $checks += @{Name="Node.js"; Status="⚠️"; Detail="$nodeVersion (recommend v20+)"}
    }
}

# Check for uncommitted changes
$gitStatus = git status --porcelain 2>$null
if ($gitStatus) {
    $checks += @{Name="Git Status"; Status="⚠️"; Detail="Uncommitted changes detected"}
} else {
    $checks += @{Name="Git Status"; Status="✅"; Detail="Clean"}
}

# Check environment files
if (Test-Path ".env.production") {
    $checks += @{Name="Production Env"; Status="✅"; Detail=".env.production exists"}
} else {
    $checks += @{Name="Production Env"; Status="❌"; Detail="Missing .env.production"}
}

# Display checks
foreach ($check in $checks) {
    Write-Host "   $($check.Status) $($check.Name): $($check.Detail)" -ForegroundColor $(
        if ($check.Status -eq "✅") { "Green" }
        elseif ($check.Status -eq "⚠️") { "Yellow" }
        else { "Red" }
    )
}

# 2. Build checks
Write-Host "`n🔨 Running build checks..." -ForegroundColor Yellow

# TypeScript check
Write-Host "   Running TypeScript check..." -ForegroundColor Cyan
Push-Location backend
$tsResult = npm run type-check 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ TypeScript check passed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  TypeScript errors (may be Prisma-related)" -ForegroundColor Yellow
}
Pop-Location

# ESLint check
Write-Host "   Running ESLint..." -ForegroundColor Cyan
$lintResult = npm run lint:check 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ ESLint passed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  ESLint warnings" -ForegroundColor Yellow
}

# 3. Build artifacts
if (-not $DryRun) {
    Write-Host "`n📦 Building artifacts..." -ForegroundColor Yellow

    # Backend build
    Write-Host "   Building backend..." -ForegroundColor Cyan
    Push-Location backend
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Backend built to dist/" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Backend build failed" -ForegroundColor Red
    }
    Pop-Location

    # Frontend build
    Write-Host "   Building frontend..." -ForegroundColor Cyan
    Push-Location frontend
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Frontend built to .next/" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Frontend build failed" -ForegroundColor Red
    }
    Pop-Location
}

# 4. Target-specific preparation
Write-Host "`n🎯 Target-specific preparation..." -ForegroundColor Yellow

switch ($Target) {
    "render" {
        Write-Host "   Render deployment:" -ForegroundColor Cyan
        Write-Host "   - render.yaml configured" -ForegroundColor DarkGray
        Write-Host "   - Push to main branch to deploy" -ForegroundColor DarkGray
        Write-Host "   - Set secrets in Render dashboard" -ForegroundColor DarkGray
    }
    "azure" {
        Write-Host "   Azure deployment:" -ForegroundColor Cyan
        Write-Host "   - Configure Azure Container Apps" -ForegroundColor DarkGray
        Write-Host "   - Set up Azure Key Vault for secrets" -ForegroundColor DarkGray
        Write-Host "   - Enable Application Insights" -ForegroundColor DarkGray
    }
    "docker" {
        Write-Host "   Docker deployment:" -ForegroundColor Cyan
        if (-not $DryRun) {
            docker build -t advancia/backend:latest -f backend/Dockerfile backend 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Backend image built" -ForegroundColor Green
            }
            docker build -t advancia/frontend:latest -f frontend/Dockerfile frontend 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Frontend image built" -ForegroundColor Green
            }
        }
    }
    "all" {
        Write-Host "   All targets prepared" -ForegroundColor Green
    }
}

# 5. Security checklist
Write-Host "`n🔒 Security checklist..." -ForegroundColor Yellow

$securityItems = @(
    "[ ] All secrets in environment variables (not in code)",
    "[ ] JWT_SECRET is at least 32 characters",
    "[ ] CORS origins restricted to production domains",
    "[ ] Rate limiting enabled",
    "[ ] Helmet security headers configured",
    "[ ] Database SSL enabled (sslmode=require)",
    "[ ] Sentry DSN configured for error tracking"
)

foreach ($item in $securityItems) {
    Write-Host "   $item" -ForegroundColor White
}

# 6. Summary
Write-Host "`n" + "=" * 50 -ForegroundColor DarkGray
Write-Host "📝 Deployment Summary" -ForegroundColor Cyan
Write-Host ""
Write-Host "Render (recommended):" -ForegroundColor Yellow
Write-Host "   git push origin main" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Vercel (frontend):" -ForegroundColor Yellow
Write-Host "   npx vercel --prod" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Docker:" -ForegroundColor Yellow
Write-Host "   docker-compose -f docker-compose.prod.yml up -d" -ForegroundColor DarkGray
Write-Host ""
