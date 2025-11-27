# AI DevOps Agent - PowerShell Setup and Start Script
param(
    [switch]$SkipChecks,
    [switch]$ShowLogs,
    [switch]$Cleanup
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-DockerRunning {
    try {
        $null = docker --version
        return $true
    }
    catch {
        return $false
    }
}

function Test-PortAvailable {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $false  # Port is in use
    }
    catch {
        return $true   # Port is available
    }
}

Write-Host ""
Write-ColorOutput "🚀 AI DevOps Agent - PowerShell Setup and Start" -Color Cyan
Write-ColorOutput "===============================================" -Color Cyan

# Cleanup option
if ($Cleanup) {
    Write-ColorOutput "🧹 Cleaning up Docker resources..." -Color Yellow
    docker-compose down --remove-orphans --volumes
    docker system prune -f
    Write-ColorOutput "✅ Cleanup complete!" -Color Green
    exit
}

# Check Docker Desktop
if (-not $SkipChecks) {
    Write-ColorOutput "📋 Checking Docker Desktop..." -Color Blue
    if (-not (Test-DockerRunning)) {
        Write-ColorOutput "❌ Docker Desktop is not running or not installed" -Color Red
        Write-Host ""
        Write-ColorOutput "💡 Please:" -Color Yellow
        Write-Host "   1. Start Docker Desktop from the Windows Start Menu"
        Write-Host "   2. Wait for the Docker whale icon to appear in the system tray"
        Write-Host "   3. Run this script again: .\start-windows.ps1"
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-ColorOutput "✅ Docker Desktop is running" -Color Green

    # Check critical ports
    $criticalPorts = @(3000, 5000)
    foreach ($port in $criticalPorts) {
        if (-not (Test-PortAvailable $port)) {
            Write-ColorOutput "⚠️  Port $port is already in use" -Color Yellow
            $response = Read-Host "Continue anyway? (y/N)"
            if ($response -ne 'y' -and $response -ne 'Y') {
                Write-ColorOutput "❌ Aborted. Free port $port and try again." -Color Red
                exit 1
            }
        }
    }
}

# Check/create environment file
if (-not (Test-Path ".env")) {
    Write-ColorOutput "📝 Creating environment file from template..." -Color Blue
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-ColorOutput "✅ Environment file created" -Color Green
    } else {
        Write-ColorOutput "⚠️  .env.example not found, creating basic .env..." -Color Yellow
        @"
OPENAI_API_KEY=demo-mode-no-key-needed
POSTGRES_USER=agent
POSTGRES_PASSWORD=securepass
POSTGRES_DB=agentdb
ENVIRONMENT=development
DEMO_MODE=true
"@ | Out-File -FilePath ".env" -Encoding UTF8
        Write-ColorOutput "✅ Basic environment file created" -Color Green
    }
} else {
    Write-ColorOutput "✅ Environment file exists" -Color Green
}

Write-Host ""
Write-ColorOutput "🐳 Starting AI DevOps Agent services..." -Color Blue
Write-ColorOutput "=======================================" -Color Blue

# Stop any existing services
Write-ColorOutput "🛑 Stopping any existing services..." -Color Yellow
try {
    docker-compose down --remove-orphans 2>$null
}
catch {
    Write-ColorOutput "   (No existing services to stop)" -Color Gray
}

# Start services
Write-ColorOutput "🔨 Building and starting services..." -Color Blue
$startTime = Get-Date

try {
    if ($ShowLogs) {
        docker-compose up -d --build
    } else {
        $output = docker-compose up -d --build 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "❌ Failed to start services" -Color Red
            Write-Host $output
            throw "Docker compose failed"
        }
    }

    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds

    Write-Host ""
    Write-ColorOutput "🎉 Services started successfully in $($duration.ToString('F1'))s!" -Color Green

    Write-Host ""
    Write-ColorOutput "📊 Service Status:" -Color Blue
    docker-compose ps --format table

    Write-Host ""
    Write-ColorOutput "🌐 Service URLs:" -Color Blue
    Write-ColorOutput "   💭 Reasoning Engine: http://localhost:5000/health" -Color Cyan
    Write-ColorOutput "   ⚡ Execution Engine:  http://localhost:3000/health" -Color Cyan
    Write-ColorOutput "   📊 Grafana Dashboard: http://localhost:3001 (admin/admin)" -Color Cyan
    Write-ColorOutput "   🔍 Prometheus:        http://localhost:9090" -Color Cyan
    Write-ColorOutput "   📈 Kibana:           http://localhost:5601" -Color Cyan

    Write-Host ""
    Write-ColorOutput "🧪 Ready to test! Run these commands:" -Color Green
    Write-Host "   .\demo-load-test.ps1      - Full PowerShell demo with load testing"
    Write-Host "   .\demo-load-test.bat      - Simple Windows Batch demo"
    Write-Host "   docker-compose logs -f    - View live logs"
    Write-Host "   .\start-windows.ps1 -Cleanup - Clean up Docker resources"

    # Quick health check
    Write-Host ""
    Write-ColorOutput "🏥 Quick Health Check..." -Color Blue
    Start-Sleep -Seconds 5

    try {
        $reasoningHealth = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 5
        Write-ColorOutput "   ✅ Reasoning Engine: Healthy" -Color Green
    }
    catch {
        Write-ColorOutput "   ⚠️  Reasoning Engine: Starting up..." -Color Yellow
    }

    try {
        $executionHealth = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 5
        Write-ColorOutput "   ✅ Execution Engine: Healthy" -Color Green
    }
    catch {
        Write-ColorOutput "   ⚠️  Execution Engine: Starting up..." -Color Yellow
    }

}
catch {
    Write-ColorOutput "❌ Failed to start services" -Color Red
    Write-Host ""
    Write-ColorOutput "📋 Checking logs for errors..." -Color Blue
    docker-compose logs --tail=20

    Write-Host ""
    Write-ColorOutput "💡 Common solutions:" -Color Yellow
    Write-Host "   1. Ensure Docker Desktop has enough memory allocated (4GB+)"
    Write-Host "   2. Check if ports 3000, 5000, 3001, 9090, 5601 are available"
    Write-Host "   3. Try: docker system prune -f (clears Docker cache)"
    Write-Host "   4. Restart Docker Desktop and try again"
    Write-Host "   5. Run: .\start-windows.ps1 -ShowLogs (to see detailed output)"

    Write-Host ""
    Write-ColorOutput "🔧 Quick fixes to try:" -Color Cyan
    Write-Host "   .\start-windows.ps1 -Cleanup    # Clean Docker resources"
    Write-Host "   docker-compose down              # Stop all services"
    Write-Host "   docker system df                 # Check Docker disk usage"
}

Write-Host ""
Write-ColorOutput "✅ Setup complete! Your AI DevOps Agent is ready." -Color Green
