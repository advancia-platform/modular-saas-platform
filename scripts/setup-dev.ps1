#!/usr/bin/env pwsh
# Advancia Pay Ledger - Development Environment Setup
# Run this script to set up your development environment

param(
    [switch]$SkipPrisma,
    [switch]$SkipDocker,
    [switch]$SkipDeps
)

$ErrorActionPreference = "Continue"
$Host.UI.RawUI.WindowTitle = "Advancia Dev Setup"

Write-Host "`n🚀 Advancia Pay Ledger - Development Setup" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor DarkGray

# 1. Check prerequisites
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

$prereqs = @{
    "Node.js" = { node --version 2>$null }
    "npm" = { npm --version 2>$null }
    "Git" = { git --version 2>$null }
    "Docker" = { docker --version 2>$null }
}

$allGood = $true
foreach ($tool in $prereqs.Keys) {
    $result = & $prereqs[$tool]
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $tool`: $result" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $tool`: Not found" -ForegroundColor Red
        $allGood = $false
    }
}

if (-not $allGood) {
    Write-Host "`n⚠️  Some prerequisites are missing. Install them before continuing." -ForegroundColor Yellow
}

# 2. Install dependencies
if (-not $SkipDeps) {
    Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow

    # Root dependencies
    Write-Host "   Installing root dependencies..." -ForegroundColor Cyan
    npm install --legacy-peer-deps 2>$null

    # Backend dependencies
    Write-Host "   Installing backend dependencies..." -ForegroundColor Cyan
    Push-Location backend
    npm install --legacy-peer-deps 2>$null
    Pop-Location

    # Frontend dependencies
    Write-Host "   Installing frontend dependencies..." -ForegroundColor Cyan
    Push-Location frontend
    npm install --legacy-peer-deps 2>$null
    Pop-Location

    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
}

# 3. Set up environment files
Write-Host "`n🔐 Setting up environment files..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "   ✅ Created .env from .env.example" -ForegroundColor Green
        Write-Host "   ⚠️  Edit .env with your actual values!" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✅ .env already exists" -ForegroundColor Green
}

if (-not (Test-Path "backend\.env")) {
    if (Test-Path "backend\.env.example") {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "   ✅ Created backend/.env" -ForegroundColor Green
    }
}

if (-not (Test-Path "frontend\.env.local")) {
    @"
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
"@ | Out-File -FilePath "frontend\.env.local" -Encoding utf8
    Write-Host "   ✅ Created frontend/.env.local" -ForegroundColor Green
}

# 4. Start Docker services
if (-not $SkipDocker) {
    Write-Host "`n🐳 Starting Docker services..." -ForegroundColor Yellow

    $dockerRunning = docker info 2>$null
    if ($LASTEXITCODE -eq 0) {
        docker-compose -f docker-compose.dev.yml up -d 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ PostgreSQL and Redis started" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Docker compose failed - check docker-compose.dev.yml" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️  Docker not running - start Docker Desktop first" -ForegroundColor Yellow
    }
}

# 5. Generate Prisma client
if (-not $SkipPrisma) {
    Write-Host "`n🗄️ Generating Prisma client..." -ForegroundColor Yellow

    Push-Location backend

    # Try to generate
    $prismaResult = npx prisma generate 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Prisma client generated" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Prisma generate failed (network issue?)" -ForegroundColor Yellow
        Write-Host "   💡 Try again later or use VPN" -ForegroundColor Cyan

        # Check if binaries exist from previous successful run
        if (Test-Path "node_modules\.prisma\client\index.js") {
            Write-Host "   ✅ Using cached Prisma client" -ForegroundColor Green
        }
    }

    Pop-Location
}

# 6. Run migrations (if database is available)
Write-Host "`n📊 Checking database..." -ForegroundColor Yellow

$dbReady = $false
for ($i = 1; $i -le 5; $i++) {
    $pgCheck = docker exec advancia-postgres pg_isready -U postgres 2>$null
    if ($LASTEXITCODE -eq 0) {
        $dbReady = $true
        break
    }
    Start-Sleep -Seconds 2
}

if ($dbReady) {
    Write-Host "   ✅ Database is ready" -ForegroundColor Green

    Push-Location backend
    Write-Host "   Running Prisma migrations..." -ForegroundColor Cyan
    npx prisma migrate dev --name init 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Migrations applied" -ForegroundColor Green
    }
    Pop-Location
} else {
    Write-Host "   ⚠️  Database not ready - run migrations manually later" -ForegroundColor Yellow
    Write-Host "   💡 cd backend && npx prisma migrate dev" -ForegroundColor Cyan
}

# 7. Summary
Write-Host "`n" + "=" * 50 -ForegroundColor DarkGray
Write-Host "✨ Setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "   1. Edit .env files with your actual values" -ForegroundColor White
Write-Host "   2. Run: npm run dev (starts both backend and frontend)" -ForegroundColor White
Write-Host "   3. Backend: http://localhost:4000" -ForegroundColor White
Write-Host "   4. Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   5. pgAdmin: http://localhost:5050 (admin@advancia.com / admin123)" -ForegroundColor White
Write-Host "`nUseful commands:" -ForegroundColor Cyan
Write-Host "   npm run dev          - Start both backend and frontend" -ForegroundColor DarkGray
Write-Host "   npm run dev:backend  - Start backend only" -ForegroundColor DarkGray
Write-Host "   npm run dev:frontend - Start frontend only" -ForegroundColor DarkGray
Write-Host "   npm run check        - Run type-check + lint + tests" -ForegroundColor DarkGray
Write-Host "   cd backend && npx prisma studio - Open Prisma Studio" -ForegroundColor DarkGray
Write-Host ""
