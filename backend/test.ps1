# Advancia Platform API Test Runner for Windows
# PowerShell script for running backend API tests

param(
    [Parameter(Position=0)]
    [ValidateSet("all", "rbac", "notification", "fast", "slow", "integration", "coverage", "security", "clean", "help")]
    [string]$Command = "all"
)

Write-Host "🚀 Advancia Platform API Test Runner" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Change to backend directory
$BackendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $BackendDir

Write-Host "📂 Working in: $BackendDir" -ForegroundColor Yellow

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "📦 Creating Python virtual environment..." -ForegroundColor Blue
    python -m venv venv
}

# Activate virtual environment
if (Test-Path "venv\Scripts\Activate.ps1") {
    & "venv\Scripts\Activate.ps1"
} else {
    Write-Error "Failed to activate virtual environment"
    exit 1
}

# Install dependencies if requirements file is newer than last install
$RequirementsFile = "requirements-test.txt"
$MarkerFile = "venv\installed.marker"

if (-not (Test-Path $MarkerFile) -or (Get-Item $RequirementsFile).LastWriteTime -gt (Get-Item $MarkerFile).LastWriteTime) {
    Write-Host "📥 Installing/updating test dependencies..." -ForegroundColor Blue
    pip install --upgrade pip
    pip install -r $RequirementsFile
    New-Item -ItemType File -Path $MarkerFile -Force | Out-Null
}

# Set default environment variables for local testing
$env:BASE_URL = if ($env:BASE_URL) { $env:BASE_URL } else { "http://localhost:4000" }
$env:TEST_TIMEOUT = if ($env:TEST_TIMEOUT) { $env:TEST_TIMEOUT } else { "30" }
$env:NODE_ENV = "test"

Write-Host "🌍 Environment:" -ForegroundColor Cyan
Write-Host "  Base URL: $env:BASE_URL" -ForegroundColor White
Write-Host "  Timeout: $($env:TEST_TIMEOUT)s" -ForegroundColor White

# Check if server is running
Write-Host "🔍 Checking server health..." -ForegroundColor Blue

try {
    $response = Invoke-WebRequest -Uri "$env:BASE_URL/health" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Server is healthy" -ForegroundColor Green
    } else {
        throw "Server returned status code $($response.StatusCode)"
    }
} catch {
    Write-Host "❌ Server is not responding at $env:BASE_URL" -ForegroundColor Red
    Write-Host "💡 Make sure to start the backend server with: npm run dev" -ForegroundColor Yellow
    exit 1
}

# Execute based on command
switch ($Command) {
    "all" {
        Write-Host "🧪 Running all tests with coverage..." -ForegroundColor Blue
        python -m pytest --cov=src --cov-report=term-missing --cov-report=html:htmlcov tests/api/
    }
    "rbac" {
        Write-Host "🔐 Running RBAC tests only..." -ForegroundColor Blue
        python -m pytest -m rbac -v tests/api/
    }
    "notification" {
        Write-Host "📧 Running notification tests only..." -ForegroundColor Blue
        python -m pytest -m notification -v tests/api/
    }
    "fast" {
        Write-Host "⚡ Running fast tests (excluding slow tests)..." -ForegroundColor Blue
        python -m pytest -m "not slow" tests/api/
    }
    "slow" {
        Write-Host "🐌 Running slow/performance tests only..." -ForegroundColor Blue
        python -m pytest -m slow -v tests/api/
    }
    "integration" {
        Write-Host "🔗 Running integration tests only..." -ForegroundColor Blue
        python -m pytest -m integration -v tests/api/
    }
    "coverage" {
        Write-Host "📊 Running tests with detailed coverage analysis..." -ForegroundColor Blue
        python -m pytest --cov=src --cov-report=term-missing --cov-report=html:htmlcov --cov-report=xml:coverage.xml --cov-fail-under=75 tests/api/
        Write-Host "📁 Coverage report generated: htmlcov\index.html" -ForegroundColor Green
    }
    "security" {
        Write-Host "🔒 Running security analysis..." -ForegroundColor Blue
        try {
            bandit -r src/ -f json -o bandit-report.json
        } catch {
            Write-Warning "Bandit analysis failed or not available"
        }
        try {
            safety check --json --output safety-report.json
        } catch {
            Write-Warning "Safety check failed or not available"
        }
        Write-Host "📁 Security reports generated: bandit-report.json, safety-report.json" -ForegroundColor Green
    }
    "clean" {
        Write-Host "🧹 Cleaning test artifacts..." -ForegroundColor Blue
        $ItemsToRemove = @("htmlcov", ".coverage", "coverage.xml", ".pytest_cache", "bandit-report.json", "safety-report.json")
        foreach ($item in $ItemsToRemove) {
            if (Test-Path $item) {
                Remove-Item $item -Recurse -Force
                Write-Host "  Removed: $item" -ForegroundColor Gray
            }
        }

        # Remove Python cache files
        Get-ChildItem -Path . -Include "*.pyc" -Recurse | Remove-Item -Force
        Get-ChildItem -Path . -Include "__pycache__" -Recurse -Directory | Remove-Item -Recurse -Force

        Write-Host "✅ Cleanup completed" -ForegroundColor Green
    }
    "help" {
        Write-Host @"
Usage: .\test.ps1 [command]

Commands:
  all          Run all tests with coverage (default)
  rbac         Run RBAC tests only
  notification Run notification tests only
  fast         Run fast tests (exclude slow tests)
  slow         Run slow/performance tests only
  integration  Run integration tests only
  coverage     Run tests with detailed coverage reporting
  security     Run security analysis (bandit + safety)
  clean        Clean test artifacts and cache
  help         Show this help message

Environment Variables:
  BASE_URL     Server base URL (default: http://localhost:4000)
  TEST_TIMEOUT Request timeout in seconds (default: 30)
  ADMIN_TOKEN  Admin JWT token for testing
  AUDITOR_TOKEN Auditor JWT token for testing
  VIEWER_TOKEN Viewer JWT token for testing

Examples:
  .\test.ps1                    # Run all tests
  .\test.ps1 rbac              # Run RBAC tests only
  .\test.ps1 coverage          # Run with detailed coverage
  .\test.ps1 clean             # Clean test artifacts

"@ -ForegroundColor White
    }
}

Write-Host ""
Write-Host "🎉 Test run completed!" -ForegroundColor Green
