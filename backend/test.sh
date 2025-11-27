#!/usr/bin/env bash
# Quick test runner script for local development

set -e

echo "🚀 Advancia Platform API Test Runner"
echo "======================================"

# Change to backend directory
cd "$(dirname "$0")"
BACKEND_DIR=$(pwd)

echo "📂 Working in: $BACKEND_DIR"

# Check if virtual environment exists
if [[ ! -d "venv" ]]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate

# Install dependencies if requirements file is newer than last install
if [[ "requirements-test.txt" -nt "venv/installed.marker" ]] || [[ ! -f "venv/installed.marker" ]]; then
    echo "📥 Installing/updating test dependencies..."
    pip install --upgrade pip
    pip install -r requirements-test.txt
    touch venv/installed.marker
fi

# Set default environment variables for local testing
export BASE_URL="${BASE_URL:-http://localhost:4000}"
export TEST_TIMEOUT="${TEST_TIMEOUT:-30}"
export NODE_ENV="test"

echo "🌍 Environment:"
echo "  Base URL: $BASE_URL"
echo "  Timeout: ${TEST_TIMEOUT}s"

# Check if server is running
echo "🔍 Checking server health..."
if curl -f "${BASE_URL}/health" >/dev/null 2>&1; then
    echo "✅ Server is healthy"
else
    echo "❌ Server is not responding at $BASE_URL"
    echo "💡 Make sure to start the backend server with: npm run dev"
    exit 1
fi

# Parse command line arguments
case "${1:-all}" in
    "all")
        echo "🧪 Running all tests with coverage..."
        pytest --cov=src --cov-report=term-missing --cov-report=html:htmlcov tests/api/
        ;;
    "rbac")
        echo "🔐 Running RBAC tests only..."
        pytest -m rbac -v tests/api/
        ;;
    "notification")
        echo "📧 Running notification tests only..."
        pytest -m notification -v tests/api/
        ;;
    "fast")
        echo "⚡ Running fast tests (excluding slow tests)..."
        pytest -m "not slow" tests/api/
        ;;
    "slow")
        echo "🐌 Running slow/performance tests only..."
        pytest -m slow -v tests/api/
        ;;
    "integration")
        echo "🔗 Running integration tests only..."
        pytest -m integration -v tests/api/
        ;;
    "coverage")
        echo "📊 Running tests with detailed coverage analysis..."
        pytest --cov=src --cov-report=term-missing --cov-report=html:htmlcov --cov-report=xml:coverage.xml --cov-fail-under=75 tests/api/
        echo "📁 Coverage report generated: htmlcov/index.html"
        ;;
    "security")
        echo "🔒 Running security analysis..."
        bandit -r src/ -f json -o bandit-report.json || true
        safety check --json --output safety-report.json || true
        echo "📁 Security reports generated: bandit-report.json, safety-report.json"
        ;;
    "clean")
        echo "🧹 Cleaning test artifacts..."
        rm -rf htmlcov/ .coverage coverage.xml .pytest_cache/ bandit-report.json safety-report.json
        find . -name "*.pyc" -delete
        find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
        echo "✅ Cleanup completed"
        ;;
    "help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  all          Run all tests with coverage (default)"
        echo "  rbac         Run RBAC tests only"
        echo "  notification Run notification tests only"
        echo "  fast         Run fast tests (exclude slow tests)"
        echo "  slow         Run slow/performance tests only"
        echo "  integration  Run integration tests only"
        echo "  coverage     Run tests with detailed coverage reporting"
        echo "  security     Run security analysis (bandit + safety)"
        echo "  clean        Clean test artifacts and cache"
        echo "  help         Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  BASE_URL     Server base URL (default: http://localhost:4000)"
        echo "  TEST_TIMEOUT Request timeout in seconds (default: 30)"
        echo "  ADMIN_TOKEN  Admin JWT token for testing"
        echo "  AUDITOR_TOKEN Auditor JWT token for testing"
        echo "  VIEWER_TOKEN Viewer JWT token for testing"
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "💡 Run '$0 help' for usage information"
        exit 1
        ;;
esac

echo ""
echo "🎉 Test run completed!"
