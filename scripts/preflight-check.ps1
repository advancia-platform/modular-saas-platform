#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Advancia Pay Ledger - Pre-Flight Deployment Checklist
.DESCRIPTION
    Comprehensive verification script that checks all critical requirements
    before production deployment. Validates configuration, credentials,
    builds, and system readiness.
.NOTES
    Usage: pwsh scripts/preflight-check.ps1
    Run this before: Manual deployment, Production release, PR merge
#>

Write-Host "`n🚀 ADVANCIA PAY LEDGER - PRE-FLIGHT CHECKLIST" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "Comprehensive deployment readiness verification`n" -ForegroundColor Gray

$ErrorActionPreference = "Continue"
$script:errorCount = 0
$script:warningCount = 0
$script:successCount = 0

# Helper functions
function Test-Item-Check {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$SuccessMsg,
        [string]$FailMsg,
        [string]$Level = "ERROR"  # ERROR, WARNING, INFO
    )
    
    try {
        $result = & $Test
        if ($result) {
            Write-Host "  ✅ $Name" -ForegroundColor Green
            if ($SuccessMsg) { Write-Host "     $SuccessMsg" -ForegroundColor Gray }
            $script:successCount++
            return $true
        } else {
            if ($Level -eq "ERROR") {
                Write-Host "  ❌ $Name" -ForegroundColor Red
                Write-Host "     $FailMsg" -ForegroundColor Yellow
                $script:errorCount++
            } else {
                Write-Host "  ⚠️  $Name" -ForegroundColor Yellow
                Write-Host "     $FailMsg" -ForegroundColor Gray
                $script:warningCount++
            }
            return $false
        }
    } catch {
        Write-Host "  ❌ $Name - Exception" -ForegroundColor Red
        Write-Host "     $($_.Exception.Message)" -ForegroundColor Yellow
        $script:errorCount++
        return $false
    }
}

$scriptDir = Split-Path -Parent $PSScriptRoot
Set-Location $scriptDir

# === 1. FILE STRUCTURE CHECK ===
Write-Host "`n📁 1. CRITICAL FILES & DIRECTORIES" -ForegroundColor Magenta
Write-Host "──────────────────────────────────" -ForegroundColor Gray

Test-Item-Check -Name "Backend directory exists" `
    -Test { Test-Path "backend" } `
    -SuccessMsg "Found: backend/" `
    -FailMsg "Missing backend/ directory"

Test-Item-Check -Name "Frontend directory exists" `
    -Test { Test-Path "frontend" } `
    -SuccessMsg "Found: frontend/" `
    -FailMsg "Missing frontend/ directory"

Test-Item-Check -Name "Prisma schema exists" `
    -Test { Test-Path "backend/prisma/schema.prisma" } `
    -SuccessMsg "Found: backend/prisma/schema.prisma" `
    -FailMsg "Missing Prisma schema file"

Test-Item-Check -Name "Backend package.json exists" `
    -Test { Test-Path "backend/package.json" } `
    -SuccessMsg "Found: backend/package.json" `
    -FailMsg "Missing backend/package.json"

Test-Item-Check -Name "Frontend package.json exists" `
    -Test { Test-Path "frontend/package.json" } `
    -SuccessMsg "Found: frontend/package.json" `
    -FailMsg "Missing frontend/package.json"

# === 2. DEPLOYMENT SCRIPTS CHECK ===
Write-Host "`n🔧 2. DEPLOYMENT AUTOMATION SCRIPTS" -ForegroundColor Magenta
Write-Host "──────────────────────────────────" -ForegroundColor Gray

Test-Item-Check -Name "setup-api-tokens.ps1" `
    -Test { Test-Path "scripts/setup-api-tokens.ps1" } `
    -SuccessMsg "Credential setup script ready" `
    -FailMsg "Missing scripts/setup-api-tokens.ps1"

Test-Item-Check -Name "render-frontend-auto.ps1" `
    -Test { Test-Path "scripts/render-frontend-auto.ps1" } `
    -SuccessMsg "Frontend deployment script ready" `
    -FailMsg "Missing scripts/render-frontend-auto.ps1"

Test-Item-Check -Name "render-frontend-setup.ps1" `
    -Test { Test-Path "scripts/render-frontend-setup.ps1" } `
    -SuccessMsg "Frontend setup script ready" `
    -FailMsg "Missing scripts/render-frontend-setup.ps1" `
    -Level "WARNING"

Test-Item-Check -Name "GitHub Actions workflow" `
    -Test { Test-Path ".github/workflows/nightly-redeploy.yml" } `
    -SuccessMsg "CI/CD workflow configured" `
    -FailMsg "Missing .github/workflows/nightly-redeploy.yml"

# === 3. ENVIRONMENT CONFIGURATION ===
Write-Host "`n🔐 3. ENVIRONMENT VARIABLES & SECRETS" -ForegroundColor Magenta
Write-Host "──────────────────────────────────" -ForegroundColor Gray

$envFile = ".env"
Test-Item-Check -Name ".env file exists" `
    -Test { Test-Path $envFile } `
    -SuccessMsg "Found .env file" `
    -FailMsg "Run: pwsh scripts/setup-api-tokens.ps1" `
    -Level "WARNING"

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    
    Test-Item-Check -Name "RENDER_API_KEY configured" `
        -Test { $envContent -match "RENDER_API_KEY=.+" } `
        -SuccessMsg "Render API key present" `
        -FailMsg "Missing RENDER_API_KEY in .env"
    
    Test-Item-Check -Name "CLOUDFLARE_API_TOKEN configured" `
        -Test { $envContent -match "CLOUDFLARE_API_TOKEN=.+" } `
        -SuccessMsg "Cloudflare token present" `
        -FailMsg "Missing CLOUDFLARE_API_TOKEN in .env"
    
    Test-Item-Check -Name "CLOUDFLARE_ZONE_ID configured" `
        -Test { $envContent -match "CLOUDFLARE_ZONE_ID=.+" } `
        -SuccessMsg "Cloudflare zone ID present" `
        -FailMsg "Missing CLOUDFLARE_ZONE_ID in .env"
}

$backendEnv = "backend/.env"
Test-Item-Check -Name "Backend .env exists" `
    -Test { Test-Path $backendEnv } `
    -SuccessMsg "Backend environment configured" `
    -FailMsg "Create backend/.env with DATABASE_URL, JWT_SECRET, etc." `
    -Level "WARNING"

if (Test-Path $backendEnv) {
    $backendEnvContent = Get-Content $backendEnv -Raw
    
    Test-Item-Check -Name "DATABASE_URL configured" `
        -Test { $backendEnvContent -match "DATABASE_URL=.+" } `
        -SuccessMsg "Database connection configured" `
        -FailMsg "Missing DATABASE_URL in backend/.env"
    
    Test-Item-Check -Name "JWT_SECRET configured" `
        -Test { $backendEnvContent -match "JWT_SECRET=.+" } `
        -SuccessMsg "JWT secret present" `
        -FailMsg "Missing JWT_SECRET in backend/.env" `
        -Level "WARNING"
}

# === 4. DEPENDENCIES CHECK ===
Write-Host "`n📦 4. NODE MODULES & DEPENDENCIES" -ForegroundColor Magenta
Write-Host "──────────────────────────────────" -ForegroundColor Gray

Test-Item-Check -Name "Backend node_modules" `
    -Test { Test-Path "backend/node_modules" } `
    -SuccessMsg "Backend dependencies installed" `
    -FailMsg "Run: cd backend && npm install"

Test-Item-Check -Name "Frontend node_modules" `
    -Test { Test-Path "frontend/node_modules" } `
    -SuccessMsg "Frontend dependencies installed" `
    -FailMsg "Run: cd frontend && npm install"

Test-Item-Check -Name "Prisma Client generated" `
    -Test { Test-Path "backend/node_modules/.prisma/client" } `
    -SuccessMsg "Prisma Client ready" `
    -FailMsg "Run: cd backend && npx prisma generate"

# === 5. BUILD VERIFICATION ===
Write-Host "`n🧱 5. BUILD READINESS" -ForegroundColor Magenta
Write-Host "──────────────────────────────────" -ForegroundColor Gray

Write-Host "  🔨 Testing backend build..." -ForegroundColor Yellow
Set-Location "backend"
$backendBuild = npm run build 2>&1
$backendBuildSuccess = $LASTEXITCODE -eq 0
Set-Location $scriptDir

Test-Item-Check -Name "Backend builds successfully" `
    -Test { $backendBuildSuccess } `
    -SuccessMsg "Backend TypeScript compiles cleanly" `
    -FailMsg "Backend build failed - check TypeScript errors"

Write-Host "  🔨 Testing frontend build..." -ForegroundColor Yellow
Set-Location "frontend"
$frontendBuild = npm run build 2>&1
$frontendBuildSuccess = $LASTEXITCODE -eq 0
Set-Location $scriptDir

Test-Item-Check -Name "Frontend builds successfully" `
    -Test { $frontendBuildSuccess } `
    -SuccessMsg "Frontend Next.js compiles cleanly" `
    -FailMsg "Frontend build failed - check above errors"

# === 6. DATABASE STATUS ===
Write-Host "`n🗄️  6. DATABASE & MIGRATIONS" -ForegroundColor Magenta
Write-Host "──────────────────────────────────" -ForegroundColor Gray

if (Test-Path $backendEnv) {
    Write-Host "  🔍 Checking Prisma migration status..." -ForegroundColor Yellow
    Set-Location "backend"
    $migrateStatus = npx prisma migrate status 2>&1
    $migrateStatusSuccess = $LASTEXITCODE -eq 0
    Set-Location $scriptDir
    
    Test-Item-Check -Name "Database migrations current" `
        -Test { $migrateStatus -match "No pending migrations" -or $migrateStatus -match "Database schema is up to date" } `
        -SuccessMsg "All migrations applied" `
        -FailMsg "Pending migrations exist - run: npx prisma migrate deploy" `
        -Level "WARNING"
} else {
    Write-Host "  ⏭️  Skipped - No backend/.env" -ForegroundColor Gray
}

# === 7. GIT STATUS ===
Write-Host "`n📝 7. VERSION CONTROL STATUS" -ForegroundColor Magenta
Write-Host "──────────────────────────────────" -ForegroundColor Gray

$gitStatus = git status --porcelain 2>&1
Test-Item-Check -Name "Git working tree clean" `
    -Test { -not $gitStatus } `
    -SuccessMsg "No uncommitted changes" `
    -FailMsg "Uncommitted changes exist - consider committing" `
    -Level "WARNING"

$currentBranch = git branch --show-current 2>&1
Write-Host "  📍 Current branch: $currentBranch" -ForegroundColor Gray

# === 8. GITHUB SECRETS (GUIDANCE) ===
Write-Host "`n🔑 8. GITHUB SECRETS CONFIGURATION" -ForegroundColor Magenta
Write-Host "──────────────────────────────────" -ForegroundColor Gray

Write-Host "  ℹ️  Cannot verify GitHub Secrets from local environment" -ForegroundColor Yellow
Write-Host "     Please manually verify in: Repository → Settings → Secrets → Actions`n" -ForegroundColor Gray

Write-Host "  Required Secrets:" -ForegroundColor Cyan
Write-Host "    • RENDER_API_KEY" -ForegroundColor White
Write-Host "    • RENDER_SERVICE_ID (or RENDER_FRONTEND_SERVICE_ID)" -ForegroundColor White
Write-Host "    • CLOUDFLARE_API_TOKEN" -ForegroundColor White
Write-Host "    • CLOUDFLARE_ZONE_ID" -ForegroundColor White

Write-Host "`n  Optional Secrets:" -ForegroundColor Cyan
Write-Host "    • RENDER_BACKEND_SERVICE_ID" -ForegroundColor Gray
Write-Host "    • SLACK_WEBHOOK" -ForegroundColor Gray
Write-Host "    • EMAIL_USERNAME / EMAIL_PASSWORD / EMAIL_RECIPIENT" -ForegroundColor Gray

# === FINAL SUMMARY ===
Write-Host "`n" -NoNewline
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "📊 PRE-FLIGHT CHECK SUMMARY" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Gray

$total = $script:successCount + $script:errorCount + $script:warningCount

Write-Host "`nResults:" -ForegroundColor White
Write-Host "  ✅ Passed:   $script:successCount / $total" -ForegroundColor Green
Write-Host "  ⚠️  Warnings: $script:warningCount / $total" -ForegroundColor Yellow
Write-Host "  ❌ Failed:   $script:errorCount / $total" -ForegroundColor Red

Write-Host "`nStatus: " -NoNewline
if ($script:errorCount -eq 0) {
    Write-Host "🟢 READY FOR DEPLOYMENT" -ForegroundColor Green
    Write-Host "`n✨ All critical checks passed!" -ForegroundColor Green
    Write-Host "   You can proceed with deployment.`n" -ForegroundColor Gray
    exit 0
} elseif ($script:errorCount -le 2) {
    Write-Host "🟡 DEPLOYMENT POSSIBLE WITH CAUTION" -ForegroundColor Yellow
    Write-Host "`n⚠️  Some checks failed, but deployment may work." -ForegroundColor Yellow
    Write-Host "   Review errors above and proceed carefully.`n" -ForegroundColor Gray
    exit 1
} else {
    Write-Host "🔴 NOT READY FOR DEPLOYMENT" -ForegroundColor Red
    Write-Host "`n❌ Critical issues found!" -ForegroundColor Red
    Write-Host "   Fix errors above before deploying.`n" -ForegroundColor Gray
    exit 2
}
