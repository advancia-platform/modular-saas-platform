#!/bin/bash
# API Test Runner Script for Notification Services
# Usage: ./run_api_tests.sh [options]

set -e

# Default configuration
BASE_URL="http://localhost:4000"
VERBOSE=false
PERFORMANCE=false
INTEGRATION=false
REPORTS_DIR="reports"
TIMEOUT=300

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --url)
      BASE_URL="$2"
      shift 2
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --performance|-p)
      PERFORMANCE=true
      shift
      ;;
    --integration|-i)
      INTEGRATION=true
      shift
      ;;
    --all|-a)
      PERFORMANCE=true
      INTEGRATION=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo "  --url URL          Set API base URL (default: http://localhost:4000)"
      echo "  --verbose, -v      Enable verbose output"
      echo "  --performance, -p  Run performance tests"
      echo "  --integration, -i  Run integration tests"
      echo "  --all, -a          Run all tests including performance and integration"
      echo "  --help, -h         Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

echo -e "${BLUE}🧪 Notification Services API Test Runner${NC}"
echo -e "${BLUE}==========================================${NC}"
echo "Base URL: $BASE_URL"
echo "Reports Directory: $REPORTS_DIR"
echo ""

# Check if server is running
echo -e "${YELLOW}🔍 Checking server health...${NC}"
if curl -f -s "$BASE_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Server is running at $BASE_URL${NC}"
else
    echo -e "${RED}❌ Server is not reachable at $BASE_URL${NC}"
    echo "Please ensure the server is running and try again."
    exit 1
fi

# Create reports directory
mkdir -p "$REPORTS_DIR"

# Install test dependencies
echo -e "${YELLOW}📦 Installing test dependencies...${NC}"
if [ -f "tests/requirements-test.txt" ]; then
    pip install -r tests/requirements-test.txt
else
    pip install pytest requests pytest-html pytest-json-report pytest-timeout
fi

# Build pytest command
PYTEST_CMD="pytest tests/api/test_notification_services.py"

if [ "$VERBOSE" = true ]; then
    PYTEST_CMD="$PYTEST_CMD -v -s"
fi

# Add performance tests if requested
if [ "$PERFORMANCE" = true ]; then
    PYTEST_CMD="$PYTEST_CMD -m 'not slow or performance'"
    echo -e "${YELLOW}🚀 Including performance tests${NC}"
fi

# Add integration tests if requested
if [ "$INTEGRATION" = true ]; then
    PYTEST_CMD="$PYTEST_CMD -m 'not slow or integration'"
    echo -e "${YELLOW}🔗 Including integration tests${NC}"
fi

# Set environment variables
export API_BASE_URL="$BASE_URL"
export TEST_REPORTS_DIR="$REPORTS_DIR"

echo -e "${YELLOW}🏃 Running API tests...${NC}"
echo "Command: $PYTEST_CMD"
echo ""

# Run tests
if $PYTEST_CMD; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"

    # Display reports info
    if [ -f "$REPORTS_DIR/test-report.html" ]; then
        echo -e "${BLUE}📊 HTML Report: $REPORTS_DIR/test-report.html${NC}"
    fi

    if [ -f "$REPORTS_DIR/test-report.json" ]; then
        echo -e "${BLUE}📄 JSON Report: $REPORTS_DIR/test-report.json${NC}"
    fi

    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed${NC}"

    if [ -f "$REPORTS_DIR/test-report.html" ]; then
        echo -e "${YELLOW}📊 Check the HTML report for details: $REPORTS_DIR/test-report.html${NC}"
    fi

    exit 1
fi
