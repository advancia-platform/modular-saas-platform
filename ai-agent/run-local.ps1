# AI DevOps Agent - Local Development (No Docker Required)
# This script runs the AI DevOps Agent locally without Docker

param(
    [switch]$InstallDependencies,
    [switch]$SkipPython,
    [switch]$SkipNode,
    [string]$PythonPath = "python",
    [string]$NodePath = "node"
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

Write-Host ""
Write-ColorOutput "🚀 AI DevOps Agent - Local Development Mode" -Color Cyan
Write-ColorOutput "==========================================" -Color Cyan
Write-ColorOutput "Running without Docker - Perfect for development and testing!" -Color Green

# Check prerequisites
Write-ColorOutput "📋 Checking prerequisites..." -Color Blue

$pythonOk = Test-Command $PythonPath
$nodeOk = Test-Command "node"
$npmOk = Test-Command "npm"

if (-not $pythonOk) {
    Write-ColorOutput "❌ Python not found. Please install Python 3.8+ from python.org" -Color Red
    exit 1
}

if (-not $nodeOk -or -not $npmOk) {
    Write-ColorOutput "❌ Node.js/npm not found. Please install Node.js from nodejs.org" -Color Red
    exit 1
}

Write-ColorOutput "✅ Python found: $((& $PythonPath --version))" -Color Green
Write-ColorOutput "✅ Node.js found: $(& node --version)" -Color Green

# Install dependencies if requested
if ($InstallDependencies) {
    Write-ColorOutput "📦 Installing dependencies..." -Color Blue

    if (-not $SkipPython) {
        Write-ColorOutput "   Installing Python dependencies..." -Color Blue
        Set-Location "src/reasoning-engine"
        & pip install -r requirements.txt
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "   ✅ Python dependencies installed" -Color Green
        } else {
            Write-ColorOutput "   ❌ Failed to install Python dependencies" -Color Red
        }
        Set-Location "../.."
    }

    if (-not $SkipNode) {
        Write-ColorOutput "   Installing Node.js dependencies..." -Color Blue
        Set-Location "src/execution-engine"
        & npm install
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "   ✅ Node.js dependencies installed" -Color Green
        } else {
            Write-ColorOutput "   ❌ Failed to install Node.js dependencies" -Color Red
        }
        Set-Location "../.."
    }
}

# Create local environment file
Write-ColorOutput "📝 Setting up local environment..." -Color Blue
$localEnv = @"
# AI DevOps Agent - Local Development Configuration
export FLASK_ENV=development
export FLASK_DEBUG=true
export NODE_ENV=development
export PORT_REASONING=5000
export PORT_EXECUTION=3000
export LOCAL_MODE=true
export DEMO_MODE=true
export MOCK_EXTERNAL_APIS=true
export DATABASE_URL=sqlite:///local_agent.db
export REDIS_URL=redis://localhost:6379
"@

$localEnv | Out-File -FilePath "local.env" -Encoding UTF8
Write-ColorOutput "✅ Local environment configured" -Color Green

# Create startup scripts for each service
Write-ColorOutput "🔧 Creating service startup scripts..." -Color Blue

# Reasoning Engine startup script
$reasoningScript = @"
#!/bin/bash
echo "🧠 Starting AI Reasoning Engine (Local Mode)..."
cd src/reasoning-engine

# Set environment
export FLASK_ENV=development
export FLASK_DEBUG=true
export LOCAL_MODE=true
export DEMO_MODE=true

# Start Flask app
python app.py
"@

$reasoningScript | Out-File -FilePath "start-reasoning-engine.sh" -Encoding UTF8

# Execution Engine startup script
$executionScript = @"
#!/bin/bash
echo "⚡ Starting AI Execution Engine (Local Mode)..."
cd src/execution-engine

# Set environment
export NODE_ENV=development
export LOCAL_MODE=true
export REASONING_ENGINE_URL=http://localhost:5000

# Start Node.js app
npm start
"@

$executionScript | Out-File -FilePath "start-execution-engine.sh" -Encoding UTF8

# PowerShell versions
$reasoningScriptPS = @"
# AI Reasoning Engine - PowerShell Startup
Write-Host "🧠 Starting AI Reasoning Engine (Local Mode)..." -ForegroundColor Cyan
Set-Location "src/reasoning-engine"

# Set environment variables
`$env:FLASK_ENV = "development"
`$env:FLASK_DEBUG = "true"
`$env:LOCAL_MODE = "true"
`$env:DEMO_MODE = "true"

# Start Flask app
& python app.py
"@

$reasoningScriptPS | Out-File -FilePath "start-reasoning-engine.ps1" -Encoding UTF8

$executionScriptPS = @"
# AI Execution Engine - PowerShell Startup
Write-Host "⚡ Starting AI Execution Engine (Local Mode)..." -ForegroundColor Cyan
Set-Location "src/execution-engine"

# Set environment variables
`$env:NODE_ENV = "development"
`$env:LOCAL_MODE = "true"
`$env:REASONING_ENGINE_URL = "http://localhost:5000"

# Start Node.js app
& npm start
"@

$executionScriptPS | Out-File -FilePath "start-execution-engine.ps1" -Encoding UTF8

Write-ColorOutput "✅ Startup scripts created" -Color Green

Write-Host ""
Write-ColorOutput "🎯 Ready to start! Choose your option:" -Color Green
Write-Host ""
Write-ColorOutput "Option 1: Start both services automatically (Recommended)" -Color Cyan
Write-Host "   .\run-local.ps1 -StartBoth"
Write-Host ""
Write-ColorOutput "Option 2: Start services manually in separate terminals" -Color Cyan
Write-Host "   Terminal 1: .\start-reasoning-engine.ps1"
Write-Host "   Terminal 2: .\start-execution-engine.ps1"
Write-Host ""
Write-ColorOutput "Option 3: Install dependencies first" -Color Yellow
Write-Host "   .\run-local.ps1 -InstallDependencies"

# Offer to start both services
$response = Read-Host "`nStart both services now? (y/N)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-ColorOutput "🚀 Starting both services..." -Color Green

    # Start reasoning engine in background
    Write-ColorOutput "🧠 Starting Reasoning Engine..." -Color Blue
    Start-Process powershell -ArgumentList "-File", "start-reasoning-engine.ps1" -WindowStyle Normal

    Start-Sleep -Seconds 3

    # Start execution engine
    Write-ColorOutput "⚡ Starting Execution Engine..." -Color Blue
    Start-Process powershell -ArgumentList "-File", "start-execution-engine.ps1" -WindowStyle Normal

    Write-Host ""
    Write-ColorOutput "🎉 Both services started!" -Color Green
    Write-ColorOutput "🌐 Services will be available at:" -Color Blue
    Write-Host "   💭 Reasoning Engine: http://localhost:5000"
    Write-Host "   ⚡ Execution Engine:  http://localhost:3000"

    Write-Host ""
    Write-ColorOutput "🧪 Test your local setup:" -Color Green
    Write-Host "   Wait 30 seconds for startup, then run:"
    Write-Host "   .\demo-load-test.ps1"

    Write-Host ""
    Write-ColorOutput "📋 To stop services:" -Color Yellow
    Write-Host "   Close the PowerShell windows or press Ctrl+C in each"
}

Write-Host ""
Write-ColorOutput "✅ Local development setup complete!" -Color Green
