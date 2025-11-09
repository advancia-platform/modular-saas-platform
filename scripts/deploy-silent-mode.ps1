#Requires -Version 5.1
<#
.SYNOPSIS
    Advancia Pay Ledger - Silent Mode Deployment with Auto-Rollback
.DESCRIPTION
    Installs Silent Mode feature, deploys to Render, performs health checks,
    and automatically rolls back on failure.
.NOTES
    Author: Advancia DevOps
    Date: October 25, 2025
#>

param(
    [switch]$SkipHealthCheck,
    [switch]$ForceRollback,
    [int]$HealthCheckTimeout = 60
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Color output helpers
function Write-Step($message) { Write-Host "`n$message" -ForegroundColor Cyan }
function Write-Success($message) { Write-Host "✅ $message" -ForegroundColor Green }
function Write-Warning($message) { Write-Host "⚠️  $message" -ForegroundColor Yellow }
function Write-Error($message) { Write-Host "❌ $message" -ForegroundColor Red }

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║  🚀 ADVANCIA SILENT MODE DEPLOY + AUTO-ROLLBACK          ║
║  Intelligent deployment with automatic failure recovery   ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# =============================================================================
# STEP 1: Capture Last Known Good State
# =============================================================================
Write-Step "📸 Capturing current state..."

$lastGoodCommit = git rev-parse HEAD
$currentBranch = git rev-parse --abbrev-ref HEAD

Write-Success "Last known good commit: $lastGoodCommit"
Write-Success "Current branch: $currentBranch"

# =============================================================================
# STEP 2: Configure Environment Variables
# =============================================================================
Write-Step "⚙️  Configuring environment variables..."

$backendDir = "backend"
$backendEnv = Join-Path $backendDir ".env"
$localEnv = Join-Path $backendDir ".env.local"

# Ensure backend directory exists
if (!(Test-Path $backendDir)) {
    Write-Error "Backend directory not found!"
    exit 1
}

# Create .env for production (Render)
if (!(Test-Path $backendEnv)) {
    New-Item $backendEnv -ItemType File -Force | Out-Null
}

$envContent = Get-Content $backendEnv -Raw -ErrorAction SilentlyContinue
if ($envContent -notmatch "NODE_ENV=production") {
    Add-Content $backendEnv "`n# --- Silent Mode / Render Environment ---"
    Add-Content $backendEnv "NODE_ENV=production"
    Add-Content $backendEnv "RENDER=true"
    Write-Success "Added production environment variables to backend/.env"
} else {
    Write-Warning "Production environment variables already configured"
}

# Create .env.local for development
if (!(Test-Path $localEnv)) {
    New-Item $localEnv -ItemType File -Force | Out-Null
}

$localContent = Get-Content $localEnv -Raw -ErrorAction SilentlyContinue
if ($localContent -notmatch "NODE_ENV=development") {
    Add-Content $localEnv "`n# --- Local Development Environment ---"
    Add-Content $localEnv "NODE_ENV=development"
    Add-Content $localEnv "RENDER=false"
    Write-Success "Added development environment variables to backend/.env.local"
} else {
    Write-Warning "Development environment variables already configured"
}

# =============================================================================
# STEP 3: Update Prisma Schema
# =============================================================================
Write-Step "🗄️  Updating Prisma schema..."

$schemaPath = Join-Path $backendDir "prisma/schema.prisma"

if (!(Test-Path $schemaPath)) {
    Write-Error "Prisma schema not found at $schemaPath"
    exit 1
}

$schema = Get-Content $schemaPath -Raw

if ($schema -notmatch "model SystemConfig") {
    $systemConfigModel = @"

// System configuration for runtime settings
model SystemConfig {
  id        Int      @id @default(autoincrement())
  key       String   @unique
  value     String
  updatedAt DateTime @updatedAt
}
"@
    
    Add-Content $schemaPath $systemConfigModel
    Write-Success "Added SystemConfig model to schema.prisma"
} else {
    Write-Warning "SystemConfig model already exists in schema"
}

# =============================================================================
# STEP 4: Generate Prisma Client & Migrate Database
# =============================================================================
Write-Step "📦 Running Prisma migration..."

Push-Location $backendDir

try {
    # Generate Prisma client
    Write-Host "  → Generating Prisma client..." -ForegroundColor Gray
    npx prisma generate 2>&1 | Out-Null
    Write-Success "Prisma client generated"

    # Create and apply migration
    Write-Host "  → Creating migration..." -ForegroundColor Gray
    $migrationOutput = npx prisma migrate dev --name add_system_config 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database migration completed"
    } else {
        Write-Warning "Migration may have already been applied"
    }
} catch {
    Write-Error "Prisma migration failed: $_"
    Pop-Location
    exit 1
} finally {
    Pop-Location
}

# =============================================================================
# STEP 5: Create Silent Mode API Routes
# =============================================================================
Write-Step "🛠️  Creating Silent Mode API routes..."

$apiDir = "frontend/src/app/api/admin/config/silent-mode"
$silentModeApiPath = Join-Path $apiDir "route.ts"

if (!(Test-Path $apiDir)) {
    New-Item $apiDir -ItemType Directory -Force | Out-Null
}

$silentModeApi = @'
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const isRender = process.env.RENDER === "true";
    let silentMode = false;

    if (isRender) {
      // Auto-enable Silent Mode on Render
      silentMode = true;
    } else {
      // Check database configuration for local/dev
      const config = await prisma.systemConfig.findUnique({
        where: { key: "silent_mode" },
      });
      silentMode = config?.value === "true";
    }

    return NextResponse.json({ silentMode });
  } catch (error) {
    console.error("Error fetching silent mode config:", error);
    return NextResponse.json({ silentMode: false }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { enabled } = await req.json();

    await prisma.systemConfig.upsert({
      where: { key: "silent_mode" },
      update: { value: String(enabled) },
      create: { key: "silent_mode", value: String(enabled) },
    });

    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    console.error("Error updating silent mode config:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update silent mode" },
      { status: 500 }
    );
  }
}
'@

Set-Content $silentModeApiPath $silentModeApi -Force
Write-Success "Created Silent Mode API at $silentModeApiPath"

# =============================================================================
# STEP 6: Commit Changes
# =============================================================================
Write-Step "📝 Committing changes..."

git add .
$commitMsg = "feat: Add Silent Mode system with Render auto-detect and health rollback

- Add SystemConfig Prisma model for runtime configuration
- Configure environment variables (NODE_ENV, RENDER flag)
- Create Silent Mode API routes (GET/POST)
- Auto-enable silent mode on Render platform
- Support manual toggle for local development
- Add database migration for SystemConfig table"

git commit -m $commitMsg 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Success "Changes committed successfully"
} else {
    Write-Warning "No changes to commit (may already be committed)"
}

# =============================================================================
# STEP 7: Sync with Remote
# =============================================================================
Write-Step "🔄 Syncing with remote repository..."

Write-Host "  → Pulling latest changes..." -ForegroundColor Gray
git pull origin $currentBranch --no-rebase 2>&1 | Out-Null

Write-Host "  → Pushing changes..." -ForegroundColor Gray
git push origin $currentBranch 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Success "Changes pushed to remote successfully"
} else {
    Write-Error "Failed to push changes to remote"
    exit 1
}

# =============================================================================
# STEP 8: Trigger Render Deployment
# =============================================================================
Write-Step "🌍 Triggering Render deployment..."

if (Test-Path "render.yaml") {
    git commit --allow-empty -m "chore: trigger Render redeploy for Silent Mode" 2>&1 | Out-Null
    git push origin $currentBranch 2>&1 | Out-Null
    Write-Success "Render deployment triggered"
} else {
    Write-Warning "No render.yaml found - manual Render dashboard check required"
}

# =============================================================================
# STEP 9: Health Check
# =============================================================================
if (!$SkipHealthCheck) {
    Write-Step "🏥 Performing health checks..."
    
    Write-Host "  ⏳ Waiting $HealthCheckTimeout seconds for deployment..." -ForegroundColor Yellow
    Start-Sleep -Seconds $HealthCheckTimeout

    $backendUrl = "https://advancia-backend-upnrf.onrender.com/api/health"
    $frontendUrl = "https://advanciapayledger.com"

    function Test-ServiceHealth {
        param(
            [string]$Url,
            [string]$Label
        )
        
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
            
            if ($response.StatusCode -eq 200) {
                Write-Success "$Label is healthy ($Url)"
                return $true
            } else {
                Write-Warning "$Label returned status $($response.StatusCode)"
                return $false
            }
        } catch {
            Write-Error "$Label is unreachable: $($_.Exception.Message)"
            return $false
        }
    }

    Write-Host "`n  Checking services..." -ForegroundColor Gray
    $backendHealthy = Test-ServiceHealth $backendUrl "Backend API"
    $frontendHealthy = Test-ServiceHealth $frontendUrl "Frontend UI"

    # =============================================================================
    # STEP 10: Auto-Rollback on Failure
    # =============================================================================
    if (!$backendHealthy -or !$frontendHealthy -or $ForceRollback) {
        Write-Step "🔥 DEPLOYMENT FAILED - Initiating rollback..."
        
        Write-Host "  → Resetting to last good commit: $lastGoodCommit" -ForegroundColor Gray
        git reset --hard $lastGoodCommit 2>&1 | Out-Null
        
        Write-Host "  → Force pushing rollback..." -ForegroundColor Gray
        git push origin $currentBranch --force 2>&1 | Out-Null
        
        Write-Success "Rolled back to commit: $lastGoodCommit"
        
        Write-Host "`n  → Triggering Render re-deploy for stable version..." -ForegroundColor Gray
        git commit --allow-empty -m "chore: ROLLBACK - revert to stable version $lastGoodCommit" 2>&1 | Out-Null
        git push origin $currentBranch 2>&1 | Out-Null
        
        Write-Success "Rollback deployment triggered"
        Write-Warning "Please verify services in Render dashboard: https://dashboard.render.com"
        
        exit 1
    } else {
        Write-Step "🎉 DEPLOYMENT SUCCESSFUL!"
        Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║  ✅ All systems operational                               ║
║  📊 Backend:  Healthy                                     ║
║  🌐 Frontend: Healthy                                     ║
║  🔒 Silent Mode: Deployed                                 ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green
    }
} else {
    Write-Warning "Health checks skipped (use -SkipHealthCheck to skip)"
}

Write-Host "`n🏁 Silent Mode deployment process complete!" -ForegroundColor Cyan
Write-Host "   Commit: $lastGoodCommit" -ForegroundColor Gray
Write-Host "   Branch: $currentBranch" -ForegroundColor Gray
Write-Host ""
