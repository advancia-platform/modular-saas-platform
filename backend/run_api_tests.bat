@echo off
REM API Test Runner Script for Windows PowerShell
REM Usage: run_api_tests.bat [options]

setlocal enabledelayedexpansion

set "BASE_URL=http://localhost:4000"
set "VERBOSE=false"
set "PERFORMANCE=false"
set "INTEGRATION=false"
set "REPORTS_DIR=reports"

echo 🧪 Notification Services API Test Runner
echo ==========================================
echo Base URL: %BASE_URL%
echo Reports Directory: %REPORTS_DIR%
echo.

REM Check if server is running
echo 🔍 Checking server health...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%BASE_URL%/health' -UseBasicParsing -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '✅ Server is running' -ForegroundColor Green; exit 0 } else { exit 1 } } catch { exit 1 }"

if !errorlevel! neq 0 (
    echo ❌ Server is not reachable at %BASE_URL%
    echo Please ensure the server is running and try again.
    exit /b 1
)

REM Create reports directory
if not exist "%REPORTS_DIR%" mkdir "%REPORTS_DIR%"

REM Install test dependencies
echo 📦 Installing test dependencies...
if exist "tests\\requirements-test.txt" (
    pip install -r tests\\requirements-test.txt
) else (
    pip install pytest requests pytest-html pytest-json-report pytest-timeout
)

REM Set environment variables
set "API_BASE_URL=%BASE_URL%"
set "TEST_REPORTS_DIR=%REPORTS_DIR%"

echo 🏃 Running API tests...
echo.

REM Run tests
pytest tests\\api\\test_notification_services.py -v --html=%REPORTS_DIR%\\test-report.html --self-contained-html --json-report --json-report-file=%REPORTS_DIR%\\test-report.json

if !errorlevel! equ 0 (
    echo.
    echo ✅ All tests passed!
    echo 📊 HTML Report: %REPORTS_DIR%\\test-report.html
    echo 📄 JSON Report: %REPORTS_DIR%\\test-report.json
) else (
    echo.
    echo ❌ Some tests failed
    echo 📊 Check the HTML report for details: %REPORTS_DIR%\\test-report.html
    exit /b 1
)
