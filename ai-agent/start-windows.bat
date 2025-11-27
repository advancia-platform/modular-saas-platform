@echo off
REM AI DevOps Agent - Windows Setup and Start Script
echo.
echo 🚀 AI DevOps Agent - Windows Setup and Start
echo ===========================================

REM Check if Docker Desktop is running
echo 📋 Checking Docker Desktop...
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker Desktop is not running or not installed
    echo.
    echo 💡 Please:
    echo    1. Start Docker Desktop from the Windows Start Menu
    echo    2. Wait for the Docker whale icon to appear in the system tray
    echo    3. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ Docker Desktop is running

REM Check if .env file exists
if not exist ".env" (
    echo 📝 Creating environment file from template...
    copy ".env.example" ".env" >nul
    echo ✅ Environment file created
) else (
    echo ✅ Environment file exists
)

echo.
echo 🐳 Starting AI DevOps Agent services...
echo =====================================

REM Stop any existing services
echo 🛑 Stopping any existing services...
docker-compose down --remove-orphans >nul 2>&1

REM Build and start services
echo 🔨 Building and starting services...
docker-compose up -d --build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo 🎉 Services started successfully!
    echo.
    echo 📊 Service Status:
    docker-compose ps

    echo.
    echo 🌐 Service URLs:
    echo    💭 Reasoning Engine: http://localhost:5000
    echo    ⚡ Execution Engine:  http://localhost:3000
    echo    📊 Grafana Dashboard: http://localhost:3001 (admin/admin)
    echo    🔍 Prometheus:        http://localhost:9090
    echo    📈 Kibana:           http://localhost:5601

    echo.
    echo 🧪 Ready to test! Run these commands:
    echo    demo-load-test.bat       - Windows Batch demo
    echo    demo-load-test.ps1       - PowerShell demo
    echo    validate-docker-compose.sh - Validation (in WSL/Git Bash)

) else (
    echo ❌ Failed to start services
    echo.
    echo 📋 Checking logs for errors...
    docker-compose logs --tail=20

    echo.
    echo 💡 Common solutions:
    echo    1. Ensure Docker Desktop has enough memory allocated (4GB+)
    echo    2. Check if ports 3000, 5000, 3001, 9090, 5601 are available
    echo    3. Try: docker system prune -f (clears Docker cache)
    echo    4. Restart Docker Desktop and try again
)

echo.
pause
