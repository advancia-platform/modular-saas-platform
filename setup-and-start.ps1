# Advancia Platform - Build and Start with PM2
# Run this script in PowerShell as Administrator

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Advancia Platform Setup & Start" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Set error action
$ErrorActionPreference = "Stop"

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "📍 Current directory: $scriptDir" -ForegroundColor Yellow
Write-Host ""

# Step 1: Install Frontend Dependencies
Write-Host "📦 Step 1: Installing frontend dependencies..." -ForegroundColor Green
Set-Location "frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Build Frontend
Write-Host "🏗️  Step 2: Building frontend..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend built successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Go back to root
Set-Location ".."
Write-Host "📍 Back to root directory" -ForegroundColor Yellow
Write-Host ""

# Step 4: Check if PM2 is installed
Write-Host "🔍 Step 4: Checking PM2 installation..." -ForegroundColor Green
$pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2Installed) {
    Write-Host "📦 PM2 not found. Installing globally..." -ForegroundColor Yellow
    npm install -g pm2
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ PM2 installation failed!" -ForegroundColor Red
        Write-Host "💡 Try running PowerShell as Administrator" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ PM2 installed globally" -ForegroundColor Green
} else {
    Write-Host "✅ PM2 already installed" -ForegroundColor Green
}
Write-Host ""

# Step 5: Start services with PM2
Write-Host "🚀 Step 5: Starting services with PM2 (production mode)..." -ForegroundColor Green
npm run pm2:start:prod
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ PM2 start failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Services started" -ForegroundColor Green
Write-Host ""

# Step 6: Show PM2 status
Write-Host "📊 Step 6: PM2 Status" -ForegroundColor Green
pm2 status
Write-Host ""

# Step 7: Save PM2 configuration
Write-Host "💾 Step 7: Saving PM2 configuration..." -ForegroundColor Green
pm2 save
Write-Host "✅ PM2 configuration saved" -ForegroundColor Green
Write-Host ""

# Step 8: Setup PM2 startup
Write-Host "🔧 Step 8: Setting up PM2 auto-startup..." -ForegroundColor Green
Write-Host "⚠️  Run the command that pm2 startup displays!" -ForegroundColor Yellow
pm2 startup
Write-Host ""

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  - View logs: pm2 logs" -ForegroundColor White
Write-Host "  - Monitor: pm2 monit" -ForegroundColor White
Write-Host "  - Restart: pm2 restart all" -ForegroundColor White
Write-Host "  - Stop: pm2 stop all" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Services:" -ForegroundColor Yellow
Write-Host "  - Backend API: http://localhost:4000" -ForegroundColor White
Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
