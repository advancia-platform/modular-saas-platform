# AI DevOps Agent Quick Setup Script (PowerShell)
# This script will prepare your Windows system to run the AI DevOps Agent

Write-Host "🤖 AI DevOps Agent - Quick Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check Python version
try {
    $pythonVersion = python --version 2>$null
    if (-not $pythonVersion) {
        $pythonVersion = python3 --version
    }
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python 3.9+ not found. Please install Python first." -ForegroundColor Red
    exit 1
}

# Install Node.js dependencies
Write-Host ""
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install Node.js dependencies" -ForegroundColor Red
    exit 1
}

# Install Python dependencies
Write-Host ""
Write-Host "🐍 Installing Python dependencies..." -ForegroundColor Yellow

# Try pip first, then pip3
try {
    pip install -r requirements.txt 2>$null
    if ($LASTEXITCODE -ne 0) {
        pip3 install -r requirements.txt
    }
} catch {
    Write-Host "❌ Failed to install Python dependencies" -ForegroundColor Red
    exit 1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Python dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install Python dependencies" -ForegroundColor Red
    exit 1
}

# Check for environment variables
Write-Host ""
Write-Host "🔧 Checking environment configuration..." -ForegroundColor Yellow

if (Test-Path .env) {
    Write-Host "✅ Found .env file" -ForegroundColor Green
} else {
    Write-Host "⚠️  No .env file found. Creating template..." -ForegroundColor Yellow

    $envTemplate = @"
# AI DevOps Agent Configuration
# Copy this file and update with your actual values

# OpenAI Configuration (Required)
OPENAI_API_KEY=your_openai_api_key_here

# GitHub Integration (Optional)
GITHUB_TOKEN=your_github_token_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here

# Sentry Integration (Optional)
SENTRY_DSN=your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here

# Prometheus Integration (Optional)
PROMETHEUS_URL=http://localhost:9090
PROMETHEUS_QUERY_ENDPOINT=/api/v1/query

# Security Scanning (Optional)
SECURITY_SCAN_API_KEY=your_security_api_key_here

# Agent Configuration
NODE_ENV=development
LOG_LEVEL=debug
RISK_THRESHOLD_AUTO_FIX=0.8
RISK_THRESHOLD_HUMAN_REVIEW=0.6
RISK_THRESHOLD_CRITICAL_ALERT=0.9

# Server Configuration
PORT=3000
PYTHON_SERVICE_PORT=5000
"@

    $envTemplate | Out-File -FilePath .env -Encoding UTF8
    Write-Host "📝 Created .env template. Please update it with your actual values." -ForegroundColor Blue
}

Write-Host ""
Write-Host "🎯 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update .env file with your API keys" -ForegroundColor White
Write-Host "2. Run 'npm run demo' to see the AI DevOps Agent in action" -ForegroundColor White
Write-Host "3. Run 'npm start' to start monitoring your systems" -ForegroundColor White
Write-Host ""
Write-Host "Quick commands:" -ForegroundColor Cyan
Write-Host "  npm run demo     - Full demonstration with simulated errors" -ForegroundColor White
Write-Host "  npm start        - Start production monitoring" -ForegroundColor White
Write-Host "  npm run dev      - Start in development mode" -ForegroundColor White
Write-Host "  npm test         - Run test suite" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ready to transform your DevOps with AI!" -ForegroundColor Magenta
