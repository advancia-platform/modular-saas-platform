@echo off
REM Advancia Platform - Build and Start with PM2
REM Run this script in Command Prompt as Administrator

echo ====================================
echo Advancia Platform Setup and Start
echo ====================================
echo.

cd /d "%~dp0"
echo Current directory: %CD%
echo.

REM Step 1: Install Frontend Dependencies
echo [1/8] Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Frontend npm install failed!
    exit /b 1
)
echo SUCCESS: Frontend dependencies installed
echo.

REM Step 2: Build Frontend
echo [2/8] Building frontend...
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed!
    exit /b 1
)
echo SUCCESS: Frontend built successfully
echo.

REM Step 3: Go back to root
cd ..
echo [3/8] Back to root directory
echo.

REM Step 4: Check PM2
echo [4/8] Checking PM2 installation...
where pm2 >nul 2>&1
if errorlevel 1 (
    echo PM2 not found. Installing globally...
    call npm install -g pm2
    if errorlevel 1 (
        echo ERROR: PM2 installation failed!
        echo Try running as Administrator
        exit /b 1
    )
    echo SUCCESS: PM2 installed globally
) else (
    echo SUCCESS: PM2 already installed
)
echo.

REM Step 5: Start services
echo [5/8] Starting services with PM2 (production mode)...
call npm run pm2:start:prod
if errorlevel 1 (
    echo ERROR: PM2 start failed!
    exit /b 1
)
echo SUCCESS: Services started
echo.

REM Step 6: Show status
echo [6/8] PM2 Status
call pm2 status
echo.

REM Step 7: Save PM2 config
echo [7/8] Saving PM2 configuration...
call pm2 save
echo SUCCESS: PM2 configuration saved
echo.

REM Step 8: Setup startup
echo [8/8] Setting up PM2 auto-startup...
echo WARNING: Run the command that 'pm2 startup' displays!
call pm2 startup
echo.

echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo Next Steps:
echo   - View logs: pm2 logs
echo   - Monitor: pm2 monit
echo   - Restart: pm2 restart all
echo   - Stop: pm2 stop all
echo.
echo Services:
echo   - Backend API: http://localhost:4000
echo   - Frontend: http://localhost:3000
echo.
pause
